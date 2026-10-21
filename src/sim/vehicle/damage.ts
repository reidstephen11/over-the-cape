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
   * What did it: a rock cut, wheelspin wearing through on rock, a hard landing, a chassis
   * knock, a crash, upside down, water.
   */
  cause: 'rock' | 'spin' | 'landing' | 'knock' | 'crash' | 'inverted' | 'water';
  /** Tyres: a slow puncture or a torn sidewall. */
  fault?: TyreFault;
}

/**
 * Mechanical damage (SPEC §11): hard knocks cut tyres, bend suspension corners and hurt
 * the engine. The physics reads the results through the condition multipliers. Returns
 * what was damaged this step (empty when nothing was, and always with damage off).
 */
export function updateDamage(v: Vehicle, mode: DamageMode, dt: number): DamageEvent[] {
  const events: DamageEvent[] = [];
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
    if (hit > D.tyre.punctureSpeed && w.surface === SurfaceId.Rock && intact)
      cut(i, hit > D.tyre.sidewallSpeed ? 'sidewall' : 'puncture', 'rock');
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
    // A heavy landing bends that corner.
    if (hit > D.suspension.bendSpeed) {
      const before = c.suspension[i];
      c.suspension[i] = Math.max(
        D.suspension.floor[mode],
        before - 0.12 - (hit - D.suspension.bendSpeed) * D.suspension.perSpeed,
      );
      if (c.suspension[i] < before)
        events.push({ part: 'suspension', wheel: i, health: c.suspension[i], cause: 'landing' });
    }
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
  // In realistic mode, water drawn in through the intake bends a connecting rod.
  if (mode === 'realistic' && v.floodEvent === 'stalled') hurt(E.floodStall, 'water');
  return events;
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
