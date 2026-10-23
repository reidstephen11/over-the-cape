import type { DamageMode } from '../data/damage';
import { sweptTuning } from '../data/surfaces';
import type { EpisodeDef, FailReason } from '../data/episodes';
import type { VehicleId } from '../data/vehicle';
import { vehicleLoadout } from '../data/vehicles';
import type { TyreFault } from './vehicle/condition';
import type { Vehicle } from './vehicle/vehicle';
import type { PoiDef } from './world/mapTypes';

/**
 * Where an episode restarts from: the last camp reached, the clock when you got there,
 * and what was left on board. Plain data, kept in the save.
 */
export interface Checkpoint {
  camp: string;
  hour: number;
  /** Real seconds of driving so far. */
  elapsed: number;
  fuel: number;
  jerryCans: number;
  spares: number;
  plugs: number;
  /** Tyres as they were (a torn sidewall stays torn through camp). */
  tyres: number[];
  tyreFault: TyreFault[];
  discovered: string[];
  /** Finds off the main line already loaded (src/sim/finds.ts). */
  taken: string[];
  /** The run's seed: where its surprises happen (kept, so a restart sees the same ones). */
  seed: number;
  /** Surprises that had happened by the camp (they stay as they fell). */
  surprises: string[];
  /** The episode's bogged vehicle had been winched out by the camp. */
  rescued: boolean;
}

export type EpisodeStatus = 'driving' | 'complete' | 'failed';

/**
 * One run of an episode: the clock, the mission and the ways it can end (SPEC §3). The
 * damage setting decides which apply: running dry and the clock always; being swept
 * away with mild or realistic damage; a flat tyre with nothing left to fix it and a
 * wrecked engine with realistic damage only.
 */
export class EpisodeRun {
  status: EpisodeStatus = 'driving';
  reason: FailReason | null = null;
  hour: number;
  elapsed: number;
  /** Where this run's surprises happen. */
  readonly seed: number;
  /** The episode's bogged vehicle is out (true when there's none). */
  rescued: boolean;
  /** The place the deadline holds until has been reached (false when it has none). */
  deadlineMet: boolean;
  /** Test mode: the clock stands still. */
  clockStopped = false;
  /** Test mode: the deadline never runs out. */
  noTimeLimit = false;

  constructor(
    readonly def: EpisodeDef,
    start: {
      hour: number;
      elapsed: number;
      seed?: number;
      rescued?: boolean;
      discovered?: readonly string[];
    },
    /** The clock runs and the deadline applies (not when replaying with chosen conditions). */
    readonly timed: boolean,
  ) {
    this.hour = start.hour;
    this.elapsed = start.elapsed;
    this.seed = start.seed ?? 1;
    this.rescued = !def.rescue || (start.rescued ?? false);
    this.deadlineMet = this.metBy(start.discovered ?? []);
  }

  private metBy(discovered: readonly string[]): boolean {
    const until = this.def.deadline?.until;
    return until !== undefined && discovered.includes(until);
  }

  /** A place reached: the deadline stops holding if it was the one it holds until. */
  reach(poiId: string): void {
    if (this.metBy([poiId])) this.deadlineMet = true;
  }

  /** The HUD's mission line: the rescue first, then beating the deadline, then the last leg. */
  missionLine(): string {
    const d = this.def;
    if (!this.rescued && d.rescue) return d.rescue.mission;
    if (d.deadline?.until && !this.deadlineMet && d.deadline.mission) return d.deadline.mission;
    return d.lastLeg ?? d.mission;
  }

  /** Advance the clock while driving (real seconds). */
  tick(dt: number): void {
    if (this.status !== 'driving') return;
    this.elapsed += dt;
    if (this.timed && !this.clockStopped) this.hour += (dt * this.def.clockRate) / 3600;
  }

  /** Hours left before the deadline (Infinity without one). */
  hoursLeft(): number {
    const d = this.def.deadline;
    return this.timed && d && !this.deadlineMet && !this.noTimeLimit ? d.hour - this.hour : Infinity;
  }

  /** Check the goal and the ways the episode can end. Returns the new status when it changes. */
  check(v: Vehicle, mode: DamageMode, goal: PoiDef): EpisodeStatus | null {
    if (this.status !== 'driving') return null;
    const p = v.body.translation();
    if (this.rescued && Math.hypot(p.x - goal.x, p.z - goal.z) <= goal.radius) {
      this.status = 'complete';
      return this.status;
    }
    const reason = failure(v, mode, this.hoursLeft());
    if (!reason) return null;
    this.status = 'failed';
    this.reason = reason;
    return this.status;
  }

  /** Back to a checkpoint's clock (restarting from camp). */
  restart(c: Checkpoint): void {
    this.status = 'driving';
    this.reason = null;
    this.hour = c.hour;
    this.elapsed = c.elapsed;
    this.rescued = !this.def.rescue || c.rescued;
    this.deadlineMet = this.metBy(c.discovered);
  }
}

/** Why the episode ends now, if it does. */
export function failure(v: Vehicle, mode: DamageMode, hoursLeft: number): FailReason | null {
  const c = v.condition;
  if (hoursLeft <= 0) return 'time';
  // Rolled to a stop with an empty tank and no cans to pour in.
  if (c.fuel <= 0 && c.jerryCans === 0 && Math.abs(v.speed) < 0.5) return 'fuel';
  if (mode === 'off') return null;
  // Lifted off its tyres and carried downstream for a few seconds.
  if (v.swept >= sweptTuning.seconds) return 'swept';
  if (mode !== 'realistic') return null;
  if (c.engine <= 0) return 'engine';
  for (let i = 0; i < 4; i++) {
    if (c.tyres[i] > 0.001) continue;
    const fixable = c.spares > 0 || (c.tyreFault[i] === 'puncture' && c.plugs > 0);
    if (!fixable) return 'tyre';
  }
  return null;
}

/** Snapshot what's on board at a camp. */
export function checkpointAt(
  camp: string,
  run: EpisodeRun,
  v: Vehicle,
  discovered: Iterable<string>,
  taken: Iterable<string> = [],
  surprises: Iterable<string> = [],
): Checkpoint {
  const c = v.condition;
  return {
    camp,
    hour: run.hour,
    elapsed: run.elapsed,
    fuel: c.fuel,
    jerryCans: c.jerryCans,
    spares: c.spares,
    plugs: c.plugs,
    tyres: [...c.tyres],
    tyreFault: [...c.tyreFault],
    discovered: [...discovered],
    taken: [...taken],
    seed: run.seed,
    surprises: [...surprises],
    rescued: run.rescued && !!run.def.rescue,
  };
}

/** A fresh seed for a new run's surprises. */
export function newRunSeed(): number {
  return Math.floor(Math.random() * 2 ** 31) + 1;
}

/** Put a vehicle's load and tyres back as a checkpoint (or the episode's start) had them. */
export function applyCheckpoint(v: Vehicle, c: Checkpoint): void {
  const k = v.condition;
  k.fuel = Math.min(c.fuel, v.tuning.engine.fuel.tankLitres);
  k.jerryCans = c.jerryCans;
  k.spares = c.spares;
  k.plugs = c.plugs;
  for (let i = 0; i < 4; i++) {
    const fault = c.tyreFault[i] ?? 'none';
    const health = c.tyres[i] ?? 1;
    k.tyres[i] = health;
    k.tyreFault[i] = fault;
    k.tyreTarget[i] = fault === 'none' ? 1 : health;
    k.abrasion[i] = 0;
  }
  k.engine = 1;
  k.suspension.fill(1);
}

/**
 * The checkpoint an episode starts from, with the episode's load and the vehicle's own
 * extras. Only here: changing vehicle later carries the load across as it is (fuel that
 * won't fit the new tank stays behind), so changing back and forth never adds anything.
 */
export function startCheckpoint(
  def: EpisodeDef,
  spawnCamp: string,
  vehicle: VehicleId,
  seed = newRunSeed(),
): Checkpoint {
  const l = vehicleLoadout(def.loadout, vehicle);
  return {
    camp: spawnCamp,
    hour: def.startHour,
    elapsed: 0,
    fuel: l.fuel,
    jerryCans: l.jerryCans,
    spares: l.spares,
    plugs: l.plugs,
    tyres: [1, 1, 1, 1],
    tyreFault: ['none', 'none', 'none', 'none'],
    discovered: [],
    taken: [],
    seed,
    surprises: [],
    rescued: false,
  };
}
