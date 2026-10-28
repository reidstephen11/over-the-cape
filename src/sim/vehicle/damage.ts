import { damageTuning as D, type DamageMode } from '../../data/damage';
import { SurfaceId } from '../../data/surfaces';
import type { TyreFault, VehicleCondition } from './condition';
import { unrotate } from './math';
import type { Vehicle } from './vehicle';

export type DamagePart = 'tyre' | 'suspension' | 'engine';

/** A part was damaged this step: which, which wheel (tyres and suspension) and how badly now. */
export interface DamageEvent {
  part: DamagePart;
  wheel: number;
  health: number;
  /**
   * What did it: a rock cut, wheelspin wearing through on rock, a pothole or washout hit at
   * speed, a hard landing, a chassis knock, a crash, upside down, water.
   */
  cause: 'rock' | 'spin' | 'hole' | 'landing' | 'knock' | 'crash' | 'inverted' | 'water' | 'overheat';
  /** Tyres: a slow puncture or a torn sidewall. */
  fault?: TyreFault;
}

/**
 * Mechanical damage (SPEC §11): hard knocks cut tyres, bend suspension corners and hurt
 * the engine. The physics reads the results through the condition multipliers. Returns
 * what was damaged this step (with damage off, only the overheating warning).
 */
export function updateDamage(v: Vehicle, mode: DamageMode, dt: number): DamageEvent[] {
  const events: DamageEvent[] = [];
  // The engine heats with any damage setting, so the gauge always reads true; only the
  // harm from boiling it is left out with damage off.
  const heated = updateEngineHeat(v, dt);
  if (heated) events.push(heated);
  if (mode === 'off') return events;
  const c = v.condition;

  const cut = (i: number, fault: TyreFault, cause: DamageEvent['cause']) => {
    c.tyreTarget[i] = D.tyre.floor[mode];
    c.tyreFault[i] = fault;
    events.push({ part: 'tyre', wheel: i, health: c.tyres[i], cause, fault });
  };
  for (let i = 0; i < 4; i++) {
    const hit = v.wheelLandings[i];
    const w = v.wheels[i];
    const intact = c.tyreFault[i] === 'none';
    // A tyre landing hard on rock is cut and starts going down; harder still tears the sidewall.
    const low = c.lowPressure ? D.tyre.lowPressureCut : 1;
    if (hit > D.tyre.punctureSpeed * low && w.surface === SurfaceId.Rock && intact)
      cut(i, hit > D.tyre.sidewallSpeed ? 'sidewall' : 'puncture', 'rock');
    // A pothole or washout hit at speed pinches the tyre.
    else if (intact && v.wheelStrikes[i] > D.tyre.strike * low) cut(i, 'puncture', 'hole');
    // Spinning hard on rock wears through the tread.
    else if (intact && w.contact && w.surface === SurfaceId.Rock && w.spin > D.tyre.abrasionSpin) {
      c.abrasion[i] += w.spin * dt;
      if (c.abrasion[i] > D.tyre.abrasionSeconds) cut(i, 'puncture', 'spin');
    }
    const fault = c.tyreFault[i];
    const seconds =
      mode === 'mild'
        ? D.tyre.deflateSeconds.mild
        : D.tyre.deflateSeconds[fault === 'sidewall' ? 'sidewall' : 'puncture'];
    if (c.tyres[i] > c.tyreTarget[i]) c.tyres[i] = Math.max(c.tyreTarget[i], c.tyres[i] - dt / seconds);
    // A heavy landing bends that corner, and so does a hole hit hard enough.
    const bend = (loss: number, cause: DamageEvent['cause']) => {
      const before = c.suspension[i];
      c.suspension[i] = Math.max(D.suspension.floor[mode], before - loss);
      if (c.suspension[i] < before)
        events.push({ part: 'suspension', wheel: i, health: c.suspension[i], cause });
    };
    if (hit > D.suspension.bendSpeed)
      bend(0.12 + (hit - D.suspension.bendSpeed) * D.suspension.perSpeed, 'landing');
    else if (v.wheelStrikes[i] > D.suspension.strike) bend(D.suspension.strikeLoss, 'hole');
  }

  const E = D.engine;
  const hurt = (loss: number, cause: DamageEvent['cause'], quiet = false) => {
    const before = c.engine;
    c.engine = Math.max(E.floor[mode], before - loss);
    if (c.engine < before && !quiet) events.push({ part: 'engine', wheel: -1, health: c.engine, cause });
  };
  // Running into something on the nose: the body's sudden change of speed points back.
  let crash = false;
  if (v.lastImpact > E.crashSpeed) {
    const d = unrotate(v.body.rotation(), v.lastImpactDir.x, v.lastImpactDir.y, v.lastImpactDir.z);
    crash = d.z > 0.6;
    if (crash) hurt(0.1 + (v.lastImpact - E.crashSpeed) * E.perSpeed, 'crash');
  }
  // Otherwise a big knock on the chassis: the sump on a rock, a heavy landing on the belly.
  if (!crash && v.bodyContact.knock > E.knockImpulse)
    hurt(0.08 + (v.bodyContact.knock - E.knockImpulse) * E.perImpulse, 'knock');
  // Upside down with the engine running, the oil drains away from the pump.
  if (v.drivetrain.engineRunning && v.tiltDeg() > 120) {
    const before = c.engine;
    hurt(E.invertedPerSecond * dt, 'inverted', true);
    // Report it once per tenth of the engine's health lost.
    if (Math.floor(before * 10) !== Math.floor(c.engine * 10))
      events.push({ part: 'engine', wheel: -1, health: c.engine, cause: 'inverted' });
  }
  if (c.engineHeat > 1) {
    const before = c.engine;
    hurt(E.overheatPerSecond * dt, 'overheat', true);
    if (Math.floor(before * 10) !== Math.floor(c.engine * 10))
      events.push({ part: 'engine', wheel: -1, health: c.engine, cause: 'overheat' });
  }
  // In realistic mode, water drawn in through the intake bends a connecting rod.
  if (mode === 'realistic' && v.floodEvent === 'stalled') hurt(E.floodStall, 'water');
  return events;
}

/**
 * Engine temperature (0.5 normal). The thermostat holds it at normal until the work outruns
 * the radiator: heavy throttle, worst in low range at a crawl with little air through the
 * core. It climbs in about `heatSeconds` and cools back over the slower `coolSeconds`, so
 * burst after burst up a climb adds up. Returns the warning when it reaches `heatWarn`.
 */
function updateEngineHeat(v: Vehicle, dt: number): DamageEvent | null {
  const E = D.engine;
  const c = v.condition;
  const d = v.drivetrain;
  const heat = c.engineHeat ?? 0.5;
  // Load: the pedal times the revs, with a quarter of the work even when lugging at low revs.
  const load = d.engineRunning
    ? Math.abs(v.throttle) *
      (0.25 + 0.75 * Math.min(1, d.rpm / v.tuning.engine.redlineRpm)) *
      (d.range === 'low' ? E.lowRangeHeat : 1)
    : 0;
  const target = d.engineRunning
    ? Math.max(0.5, 0.5 + load * E.heatGain - E.airflowCool * Math.abs(v.speed))
    : 0.3;
  const seconds = target > heat ? E.heatSeconds : E.coolSeconds;
  c.engineHeat = Math.min(E.maxHeat, heat + ((target - heat) * dt) / seconds);
  return heat < E.heatWarn && c.engineHeat >= E.heatWarn
    ? { part: 'engine', wheel: -1, health: c.engine, cause: 'overheat' }
    : null;
}

/** Mend one tyre (a plug, a spare fitted, or a camp's repair). */
export function mendTyre(c: VehicleCondition, i: number): void {
  c.tyres[i] = 1;
  c.tyreTarget[i] = 1;
  c.tyreFault[i] = 'none';
  c.abrasion[i] = 0;
}

/** Every part as new (a field repair, or damage turned off). Spares, plugs and fuel are untouched. */
export function repairAll(c: VehicleCondition): void {
  c.engine = 1;
  for (let i = 0; i < 4; i++) mendTyre(c, i);
  c.suspension.fill(1);
  c.engineHeat = 0.5;
}

/** Keep damage within what a mode allows (after changing the setting). */
export function limitDamage(c: VehicleCondition, mode: DamageMode): void {
  if (mode === 'off') {
    repairAll(c);
    return;
  }
  c.engine = Math.max(c.engine, D.engine.floor[mode]);
  for (let i = 0; i < 4; i++) {
    c.tyres[i] = Math.max(c.tyres[i], D.tyre.floor[mode]);
    c.tyreTarget[i] = Math.max(c.tyreTarget[i], D.tyre.floor[mode]);
    c.suspension[i] = Math.max(c.suspension[i], D.suspension.floor[mode]);
  }
}

/** The worst tyre, if any is cut or down (-1 if none). */
export function worstTyre(c: VehicleCondition): number {
  let worst = -1;
  for (let i = 0; i < 4; i++)
    if (c.tyreTarget[i] < 1 && (worst < 0 || c.tyres[i] < c.tyres[worst])) worst = i;
  return worst;
}

/** Is anything damaged enough to show? */
export function isDamaged(c: VehicleCondition): boolean {
  return (
    c.engine < D.shown ||
    c.tyreTarget.some((h) => h < 1) ||
    c.tyres.some((h) => h < D.shown) ||
    c.suspension.some((h) => h < D.shown)
  );
}
