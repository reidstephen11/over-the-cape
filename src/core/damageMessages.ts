import type { DamageMode } from '../data/damage';
import type { VehicleTuning } from '../data/vehicle';
import type { DamageEvent } from '../sim/vehicle/damage';

/** "Front left", "Rear right", ... for a wheel. */
export function cornerName(t: VehicleTuning, wheel: number): string {
  const w = t.wheels[wheel];
  return `${w.front ? 'Front' : 'Rear'} ${w.x < 0 ? 'left' : 'right'}`;
}

/** What the HUD says when something is damaged. */
export function damageMessage(e: DamageEvent, t: VehicleTuning, mode: DamageMode): string {
  if (e.part === 'tyre') {
    const tyre = `${cornerName(t, e.wheel)} tyre`;
    if (mode !== 'realistic')
      return e.cause === 'hole'
        ? `${tyre} pinched in a hole — it’s going soft`
        : `${tyre} cut on a rock — it’s going soft`;
    if (e.fault === 'sidewall') return `${tyre}: sidewall torn on a rock — it needs a spare`;
    if (e.cause === 'spin') return `${tyre} worn through spinning on rock — a slow puncture`;
    if (e.cause === 'hole') return `${tyre} pinched in a hole at speed — plug it before it’s flat`;
    return `${tyre} punctured on a rock — plug it before it’s flat`;
  }
  if (e.part === 'suspension') return `${cornerName(t, e.wheel)} suspension bent`;
  if (e.health <= 0) return 'Engine wrecked';
  const what = {
    knock: 'Hit underneath — the engine is damaged',
    crash: 'Front-end damage — the engine is damaged',
    inverted: 'Upside down — the engine is starved of oil',
    water: 'Water in the engine — it’s damaged',
    rock: 'The engine is damaged',
    spin: 'The engine is damaged',
    hole: 'The engine is damaged',
    landing: 'The engine is damaged',
  }[e.cause];
  return `${what} (${Math.round(e.health * 100)}%)`;
}
