import type { EpisodeLoadout } from '../data/episodes';
import type { VehicleCondition } from './vehicle/condition';

export type Medal = 'gold' | 'silver' | 'bronze';

export interface RunScore {
  /** 0..1000. */
  points: number;
  medal: Medal;
  /** Each part of the score, for the finish screen. */
  parts: { label: string; points: number }[];
}

const avg = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Scores a finished run out of 1000: time to spare before the deadline (400), the car's
 * condition (400) and what's left on board of what was packed (200). Without a deadline,
 * time counts against a target of `targetMinutes` of driving.
 */
export function scoreRun(input: {
  condition: VehicleCondition;
  /** What the run set out with. */
  packed: EpisodeLoadout;
  minutes: number;
  /** Hours left before the deadline when you arrived (null: no deadline or untimed). */
  hoursSpare: number | null;
  targetMinutes: number;
}): RunScore {
  const c = input.condition;
  const timeShare =
    input.hoursSpare !== null
      ? Math.min(1, Math.max(0, input.hoursSpare / 2))
      : Math.min(1, Math.max(0, (2 * input.targetMinutes - input.minutes) / input.targetMinutes));
  const panels = avg(Object.values(c.panels));
  const carShare = Math.min(1, Math.max(0, (c.engine + avg(c.suspension) + panels + avg(c.tyres)) / 4));
  const p = input.packed;
  const fuelShare = Math.min(1, (c.fuel + c.jerryCans * 20) / Math.max(1, p.fuel + p.jerryCans * 20));
  // A spare counts as three plugs.
  const kitShare = Math.min(1, (c.spares + c.plugs / 3) / Math.max(1, p.spares + p.plugs / 3));
  const parts = [
    { label: 'Time', points: Math.round(400 * timeShare) },
    { label: 'Car', points: Math.round(400 * carShare) },
    { label: 'Fuel and kit', points: Math.round(100 * fuelShare + 100 * kitShare) },
  ];
  const points = parts.reduce((a, p) => a + p.points, 0);
  return { points, medal: points >= 800 ? 'gold' : points >= 600 ? 'silver' : 'bronze', parts };
}
