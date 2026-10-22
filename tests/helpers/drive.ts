import { lateAfternoon, type EnvironmentConfig } from '../../src/data/environment';
import { vehicleTuning, type VehicleTuning } from '../../src/data/vehicle';
import { Autopilot } from '../../src/sim/input/autopilot';
import { emptyInput, type VehicleInput } from '../../src/sim/input/vehicleInput';
import { loadRapier } from '../../src/sim/physics';
import { Simulation } from '../../src/sim/sim';
import type { Vehicle } from '../../src/sim/vehicle/vehicle';
import { trailPoint, trailProgress } from '../../src/sim/world/crawlTrail';
import type { TrackInfo } from '../../src/sim/world/features';
import type { World } from '../../src/sim/world/world';
import type { CrebFork } from '../../src/data/episodes/crebForks';

/** Scripted test drives along a world's tracks, shared by the obstacle tests (and free of Vitest, so dev scripts can use them). */
export const DT = 1 / 60;
const deg = 180 / Math.PI;
export type Lockers = 'open' | 'rear' | 'both' | 'high';

export function pathFor(track: TrackInfo, back = false) {
  const path = Array.from({ length: Math.ceil(track.poly.length / 0.5) + 1 }, (_, i) => {
    const p = trailPoint(track, Math.min(track.poly.length, i * 0.5));
    return [p.x, p.z] as [number, number];
  });
  return back ? path.reverse() : path;
}

/**
 * Both lines of a fork as paths: from `lead` metres before the fork on the main track to
 * `tail` metres past where the lines meet again, along the main track ('main') or the
 * other line ('alt').
 */
export function forkPaths(world: World, fork: CrebFork, lead = 40, tail = fork.tail ?? 30) {
  const track = (id: string) => world.features.tracks.find((t) => t.def.id === id)!;
  const main = track(fork.main);
  const alt = track(fork.alt);
  const from = trailProgress(main, alt.poly.xs[0], alt.poly.zs[0]).along;
  const to = trailProgress(main, alt.poly.xs[alt.poly.count - 1], alt.poly.zs[alt.poly.count - 1]).along;
  const along = (a: number, b: number) =>
    Array.from({ length: Math.ceil((b - a) / 0.5) + 1 }, (_, i) => {
      const p = trailPoint(main, Math.min(b, a + i * 0.5));
      return [p.x, p.z] as [number, number];
    });
  const start = Math.max(0, from - lead);
  const end = Math.min(main.poly.length, to + tail);
  return {
    main: along(start, end),
    alt: [...along(start, from).slice(0, -1), ...pathFor(alt), ...along(to, end).slice(1)],
    from,
    to,
  };
}

/** Nose-up pitch and right-side-down roll, in degrees. */
export function attitude(v: Vehicle) {
  const q = v.body.rotation();
  return {
    pitch: Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z)))) * deg,
    roll: Math.asin(Math.max(-1, Math.min(1, 2 * (q.x * q.y + q.w * q.z)))) * deg,
  };
}

export interface Scene {
  sim: Simulation;
  v: Vehicle;
  inputs: Map<string, VehicleInput>;
  /** Locker settings the driver keeps asking for; they engage below walking pace. */
  lockers: { front: boolean; rear: boolean };
}

/**
 * Self-recovery as a player does it: bogged for `after` seconds, hook the winch to the tree
 * or boulder furthest along the path ahead within reach (and near it), then winch in while
 * driving until the vehicle is nearly there or running free. `update` returns whether to
 * hold the winch in this step.
 */
export class WinchRecovery {
  /** How many times the winch was used. */
  uses = 0;
  private stuck = 0;
  private free = 0;
  private target = -1;

  constructor(
    private readonly sim: Simulation,
    private readonly v: Vehicle,
    private readonly path: ReadonlyArray<readonly [number, number]>,
    private readonly after = 6,
  ) {}

  private indexOf(x: number, z: number): { i: number; d: number } {
    let best = { i: 0, d: Infinity };
    this.path.forEach(([px, pz], i) => {
      const d = Math.hypot(px - x, pz - z);
      if (d < best.d) best = { i, d };
    });
    return best;
  }

  update(dt: number): boolean {
    const { sim, v } = this;
    const winch = sim.toolsOf(v.id).winch;
    const here = this.indexOf(v.position.x, v.position.z).i;
    if (winch.attached) {
      this.free = Math.abs(v.speed) > 1.6 ? this.free + dt : 0;
      if (here >= this.target - 6 || winch.length < 3 || this.free > 1.5) {
        sim.detachWinch(v.id);
        this.stuck = 0;
        return false;
      }
      return true;
    }
    this.stuck = Math.abs(v.speed) < 0.3 ? this.stuck + dt : 0;
    if (this.stuck < this.after) return false;
    let best: { anchor: ReturnType<Simulation['findAnchors']>[number]; i: number } | null = null;
    for (const anchor of sim.findAnchors(v.id)) {
      const { i, d } = this.indexOf(anchor.point.x, anchor.point.z);
      if (i > here + 8 && d < 12 && (!best || i > best.i)) best = { anchor, i };
    }
    this.stuck = 0;
    if (!best) return false;
    sim.attachTo(v.id, best.anchor);
    this.target = best.i;
    this.uses++;
    return true;
  }
}

/** Hands the event loop back to Vitest so its worker messages don't time out on long drives. */
const yieldToRunner = () => new Promise((resolve) => setImmediate(resolve));

/** Drive a leg with the autopilot; with `winch`, it winches out of a bog to a tree ahead as a player would. */
export async function runLeg(s: Scene, track: TrackInfo, back = false, limit = 110, winch = false) {
  const { sim, v, inputs } = s;
  const high = v.drivetrain.range === 'high';
  const path = pathFor(track, back);
  const pilot = new Autopilot(path, high ? 1.5 : 0.7);
  const recovery = winch ? new WinchRecovery(sim, v, path) : null;
  pilot.lowRange = !high;
  let tilt = 0,
    pitch = 0,
    roll = 0,
    speed = 0,
    sustained = 0,
    deviation = 0,
    water = 0,
    time = 0;
  for (let step = 0; time < limit; time += DT, step++) {
    if (step % 600 === 599) await yieldToRunner();
    const command = pilot.input(v, DT);
    if (pilot.done) break;
    if (!high) {
      command.throttle = 1;
      command.brake = 0;
    }
    if (recovery) command.winchIn = recovery.update(DT);
    for (const axle of ['front', 'rear'] as const)
      if (v.differentials[axle] !== s.lockers[axle]) v.toggleDiff(axle);
    inputs.set('p', command);
    sim.step(inputs, DT);
    tilt = Math.max(tilt, v.tiltDeg());
    const a = attitude(v);
    pitch = Math.max(pitch, Math.abs(a.pitch));
    roll = Math.max(roll, Math.abs(a.roll));
    // Dropping off a ledge spikes the speed for a moment; crawl control holds the average.
    sustained += (Math.abs(v.speed) - sustained) * (DT / 0.5);
    speed = Math.max(speed, sustained);
    for (const w of v.wheels) water = Math.max(water, w.water);
    const near = trailProgress(track, v.position.x, v.position.z);
    // At a junction the vehicle begins behind this leg's finite centreline.
    if (near.along > 1 && near.along < track.poly.length - 1) deviation = Math.max(deviation, near.distance);
  }
  return {
    done: pilot.done,
    remaining: pilot.remaining(v),
    time,
    tilt,
    pitch,
    roll,
    speed,
    deviation,
    /** Deepest water any wheel stood in (m). */
    water,
    /** Times the winch pulled it out of a bog. */
    winched: recovery?.uses ?? 0,
  };
}

export async function driveLeg(s: Scene, track: TrackInfo, back = false, limit = 110, winch = false) {
  const result = await runLeg(s, track, back, limit, winch);
  if (!result.done) throw new Error(`${track.def.id} stopped ${result.remaining.toFixed(1)} m from the end`);
  return result;
}

/** Drives on one world: a vehicle parked at either end of a track, in low range unless 'high'. */
export function driver(world: World, env: EnvironmentConfig = lateAfternoon) {
  const trackOf = (id: string) => {
    const track = world.features.tracks.find((t) => t.def.id === id);
    if (!track) throw new Error(`No track ${id}`);
    return track;
  };

  async function scene(
    trackId: string,
    back = false,
    lockers: Lockers = 'both',
    tuning: VehicleTuning = vehicleTuning,
  ) {
    const sim = new Simulation(await loadRapier(), world, env);
    const track = trackOf(trackId);
    const p = trailPoint(track, back ? track.poly.length : 0);
    const pose = sim.poseAt(p.x, p.z, p.headingDeg + (back ? 180 : 0), tuning.wheelRadius);
    const v = sim.addVehicle('p', pose, tuning);
    const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
    for (let i = 0; i < 90; i++) sim.step(inputs, DT);
    if (lockers !== 'high') {
      v.toggleRange();
      v.precisionCrawl = true;
    }
    const s: Scene = {
      sim,
      v,
      inputs,
      lockers: { front: lockers === 'both', rear: lockers === 'both' || lockers === 'rear' },
    };
    return { ...s, track };
  }

  async function drive(
    trackId: string,
    lockers: Lockers = 'both',
    back = false,
    limit = 110,
    tuning: VehicleTuning = vehicleTuning,
  ) {
    const s = await scene(trackId, back, lockers, tuning);
    try {
      return await runLeg(s, s.track, back, limit);
    } finally {
      s.sim.physics.free();
    }
  }

  return { trackOf, scene, drive };
}

/**
 * Drive one line of a fork (see `forkPaths`) in low range with both lockers, as a careful
 * player would, winching out of a bog to a tree ahead. Reports the time taken, the winching
 * and any cut tyres (damage on Realistic).
 */
export async function driveFork(
  world: World,
  env: EnvironmentConfig,
  path: ReadonlyArray<readonly [number, number]>,
  tuning: VehicleTuning,
  limit = 400,
) {
  const sim = new Simulation(await loadRapier(), world, env);
  try {
    sim.damage = 'realistic';
    const [[x0, z0], [x1, z1]] = [path[0], path[4]];
    const heading = (Math.atan2(x1 - x0, -(z1 - z0)) * 180) / Math.PI;
    const v = sim.addVehicle('p', sim.poseAt(x0, z0, heading, tuning.wheelRadius), tuning);
    const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
    for (let i = 0; i < 90; i++) sim.step(inputs, DT);
    v.toggleRange();
    v.precisionCrawl = true;
    const pilot = new Autopilot(path, 1.2);
    pilot.lowRange = true;
    const recovery = new WinchRecovery(sim, v, path);
    let cuts = 0;
    sim.events.on('damage', (e) => {
      if (e.part === 'tyre') cuts++;
    });
    let time = 0;
    for (let step = 0; time < limit; time += DT, step++) {
      if (step % 600 === 599) await yieldToRunner();
      const command = pilot.input(v, DT);
      if (pilot.done) break;
      command.throttle = 1;
      command.brake = 0;
      command.winchIn = recovery.update(DT);
      for (const axle of ['front', 'rear'] as const)
        if (!v.differentials[axle] && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
      inputs.set('p', command);
      sim.step(inputs, DT);
    }
    return {
      done: pilot.done,
      remaining: pilot.remaining(v),
      time,
      winched: recovery.uses,
      cuts,
      stalled: v.condition.flood.stalled,
    };
  } finally {
    sim.physics.free();
  }
}
