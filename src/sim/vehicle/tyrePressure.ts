import type { VehicleCondition } from './condition';

/** Deliberately bounded touring pressures; the endpoints preserve road/trail tuning. */
export const tyrePressures = [18, 24, 36] as const;

export function pressurePsi(c: Pick<VehicleCondition, 'lowPressure' | 'tyrePressurePsi'>): number {
  return c.tyrePressurePsi ?? (c.lowPressure ? 18 : 36);
}

/** 0 at road pressure, 1 at the former let-down setting. */
export function pressureSoftness(c: VehicleCondition): number {
  return Math.max(0, Math.min(1, (36 - pressurePsi(c)) / 18));
}

export function setPressure(c: VehicleCondition, psi: number): void {
  c.tyrePressurePsi = psi;
  c.lowPressure = psi < 36;
}

/** A puncture's air loss is independent of the chosen pressure: pumping never repairs it. */
export function wheelPsi(c: VehicleCondition, wheel: number): number {
  return pressurePsi(c) * Math.max(0, Math.min(1, c.tyres[wheel]));
}
