import { describe, expect, it } from 'vitest';
import { lateAfternoon } from '../src/data/environment';
import { boxTrailer, drumLoad, hitchPoint } from '../src/data/trailers';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { emptyInput, type VehicleInput } from '../src/sim/input/vehicleInput';
import { poseBehind, Trailer, type TrailerEvent } from '../src/sim/trailer';
import type { Vehicle } from '../src/sim/vehicle/vehicle';
import { makeScene } from './helpers/scenes';
import { vehicleOrder, vehicles } from '../src/data/vehicles';
import { testWorld } from './world';

/** Two 200 L drums of diesel standing in the box: a full load. */
const DRUMS = 2;

/** A scene on flat or tilted ground with the box trailer hitched behind, loaded or empty. */
async function towScene(opts: Parameters<typeof makeScene>[0], drums = DRUMS) {
  const s = await makeScene(opts);
  const v = s.vehicle;
  const pitch = Math.tan(((opts.pitchDeg ?? 0) * Math.PI) / 180);
  const roll = Math.tan(((opts.rollDeg ?? 0) * Math.PI) / 180);
  // The scene's ground: -z goes uphill, +x goes down.
  const t = new Trailer(
    't',
    s.physics,
    boxTrailer,
    poseBehind(v, boxTrailer, (x, z) => -pitch * z - roll * x),
  );
  if (drums > 0) {
    const load = drumLoad(drums, boxTrailer.bed);
    t.setLoad(load.mass, load.com, load.half);
  }
  t.hitch(v);
  const events: TrailerEvent[] = [];
  s.beforeStep = (dt) => t.step(dt);
  s.afterStep = () => events.push(...t.postStep());
  s.run(1, {});
  return { s, v, t, events };
}

/** How far the coupling has come off the ball (m). */
function gap(v: Vehicle, t: Trailer): number {
  const h = hitchPoint(v.tuning);
  const b = v.localToWorld(h.x, h.y, h.z);
  const c = t.couplingWorld();
  return Math.hypot(b.x - c.x, b.y - c.y, b.z - c.z);
}

describe('towing a trailer', () => {
  it('follows on the flat, on the ball, behind the car and upright', async () => {
    const { s, v, t } = await towScene({});
    s.run(6, { throttle: 1 });
    expect(-v.position.z).toBeGreaterThan(30);
    expect(gap(v, t)).toBeLessThan(0.02);
    // Still straight behind.
    expect(t.body.translation().z - v.position.z).toBeGreaterThan(3.5);
    expect(Math.abs(t.hitchAngleDeg())).toBeLessThan(3);
    expect(t.tiltDeg()).toBeLessThan(8);
  });

  it.each(vehicleOrder)('follows behind the %s, forwards and in reverse', async (id) => {
    const { s, v, t, events } = await towScene({ tuning: vehicles[id].tuning });
    s.run(5, { throttle: 0.6 });
    expect(gap(v, t)).toBeLessThan(0.02);
    expect(Math.abs(t.hitchAngleDeg())).toBeLessThan(3);
    s.run(4, { throttle: 0.4, steer: 1 });
    s.run(3, { brake: 1 });
    s.run(3, { brake: 0.3 });
    expect(gap(v, t)).toBeLessThan(0.02);
    // However hard it's reversed into the fold, the drawbar stops against the towbar.
    expect(Math.abs(t.hitchAngleDeg())).toBeLessThan(75);
    expect(events.map((e) => e.type)).not.toContain('tipped');
    expect(t.tiltDeg()).toBeLessThan(15);
  });

  it('the load slows the car down', async () => {
    const empty = await makeScene({});
    empty.run(6, { throttle: 1 });
    const { s, v } = await towScene({});
    s.run(6, { throttle: 1 });
    expect(-v.position.z).toBeLessThan(-empty.vehicle.position.z - 2);
  });

  it('follows round a corner without tipping', async () => {
    const { s, v, t, events } = await towScene({});
    s.run(4, { throttle: 0.6 });
    s.run(4, { throttle: 0.4, steer: 1 });
    expect(gap(v, t)).toBeLessThan(0.02);
    expect(t.hitchAngleDeg()).toBeGreaterThan(5);
    expect(events.map((e) => e.type)).not.toContain('tipped');
  });

  it('climbs a 20° slope behind the car in low range, loaded', async () => {
    const { s, v, t } = await towScene({ pitchDeg: 20 });
    v.toggleRange();
    const y0 = v.position.y;
    s.run(10, { throttle: 1 });
    expect(v.position.y - y0).toBeGreaterThan(8);
    expect(gap(v, t)).toBeLessThan(0.02);
  });

  it('reverses straight back, then jackknifes reversing on full lock', async () => {
    const { s, v, t, events } = await towScene({});
    const z0 = t.body.translation().z;
    s.run(3, { brake: 0.5 });
    expect(t.body.translation().z - z0).toBeGreaterThan(1.5);
    expect(Math.abs(t.hitchAngleDeg())).toBeLessThan(20);
    s.run(6, { brake: 0.7, steer: 1 });
    expect(events.map((e) => e.type)).toContain('jackknifed');
    // The drawbar has come up against the towbar: it folds no further, and the car only
    // creeps back, shoving the trailer sideways.
    expect(Math.abs(t.hitchAngleDeg())).toBeLessThan(75);
    expect(Math.abs(v.speed)).toBeLessThan(1.5);
    expect(gap(v, t)).toBeLessThan(0.02);
  });

  it('stands hitched across a 30° side slope', async () => {
    const { s, t, events } = await towScene({ rollDeg: 30 });
    s.run(4, { handbrake: true });
    expect(t.tiltDeg()).toBeLessThan(40);
    expect(events.map((e) => e.type)).not.toContain('tipped');
  });

  it('the loaded trailer tips over in a hard turn across a slope', async () => {
    const { s, v, t, events } = await towScene({ rollDeg: 15 });
    const f = v.forward();
    const sp = 30 / 3.6;
    for (const b of [v.body, t.body]) b.setLinvel({ x: f.x * sp, y: f.y * sp, z: f.z * sp }, true);
    s.run(4, (time) => ({ throttle: 0.4, steer: time > 2.5 ? 1 : 0 }));
    expect(events.map((e) => e.type)).toContain('tipped');
    expect(t.tipped).toBe(true);
  });

  it('unhitched, stands chocked on an 8° slope while the car drives away', async () => {
    const { s, v, t } = await towScene({ pitchDeg: 8 });
    t.unhitch();
    s.run(1, {});
    const p0 = { ...t.body.translation() };
    s.run(6, { throttle: 0.5 });
    const p1 = t.body.translation();
    expect(Math.hypot(p1.x - p0.x, p1.z - p0.z)).toBeLessThan(0.1);
    expect(gap(v, t)).toBeGreaterThan(10);
    expect(t.tiltDeg()).toBeLessThan(15);
  });
});

describe('hitching in the game', () => {
  const DT = 1 / 60;
  function run(sim: Simulation, seconds: number, input: Partial<VehicleInput>): void {
    const inputs = new Map<string, VehicleInput>();
    for (let i = 0; i < Math.round(seconds / DT); i++) {
      inputs.set('p', { ...emptyInput(), ...input });
      sim.step(inputs, DT);
      // An edge-triggered key is pressed for one step only.
      if (input.interact) input = { ...input, interact: false };
    }
  }

  async function campSim() {
    const R = await loadRapier();
    const sim = new Simulation(R, testWorld(), lateAfternoon);
    const v = sim.addVehicle('p', sim.campsitePose('river-flat-camp'));
    run(sim, 1, {});
    const t = sim.addTrailer('box', boxTrailer, 'p');
    run(sim, 1, {});
    return { sim, v, t };
  }

  it('unhitches when stopped, and the use key hitches it again once the ball is back under it', async () => {
    const { sim, v, t } = await campSim();
    const events: string[] = [];
    sim.events.on('trailer', (e) => events.push(e.event.type));
    expect(sim.trailerOf('p')).toBe(t);
    expect(sim.hitchOption('p')?.kind).toBe('unhitch');
    expect(sim.unhitchTrailer('p')).toBe(true);
    expect(sim.trailerOf('p')).toBeNull();
    // Creep forward a little: the coupling is still in reach of the ball.
    run(sim, 0.5, { throttle: 0.1 });
    run(sim, 2, {});
    const away = t.distanceToHitch(v);
    expect(away).toBeGreaterThan(0.1);
    const option = sim.hitchOption('p');
    expect(option?.kind).toBe('hitch');
    expect(option?.possible).toBe(true);
    run(sim, 0.5, { interact: true });
    expect(sim.trailerOf('p')).toBe(t);
    expect(events).toEqual(['unhitched', 'hitched']);
    // And it comes along.
    const p0 = { ...t.body.translation() };
    run(sim, 4, { throttle: 0.5 });
    const p1 = t.body.translation();
    expect(Math.hypot(p1.x - p0.x, p1.z - p0.z)).toBeGreaterThan(5);
    expect(gap(v, t)).toBeLessThan(0.02);
  });

  it('won’t hitch or unhitch on the move', async () => {
    const { sim } = await campSim();
    run(sim, 2, { throttle: 0.6 });
    expect(sim.hitchOption('p')).toMatchObject({ kind: 'unhitch', possible: false, reason: 'Stop first' });
    expect(sim.unhitchTrailer('p')).toBe(false);
    expect(sim.trailerOf('p')).not.toBeNull();
  });

  it('comes back to camp hitched behind the car', async () => {
    const { sim, v, t } = await campSim();
    run(sim, 5, { throttle: 0.7 });
    sim.returnToCampsite('p', 'river-flat-camp');
    run(sim, 2, {});
    expect(sim.trailerOf('p')).toBe(t);
    expect(gap(v, t)).toBeLessThan(0.02);
    expect(t.tiltDeg()).toBeLessThan(15);
  });
});
