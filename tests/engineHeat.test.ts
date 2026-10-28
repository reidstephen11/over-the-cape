import { describe, expect, it } from 'vitest';
import { updateDamage } from '../src/sim/vehicle/damage';
import { createCondition, tyreGripMultiplier } from '../src/sim/vehicle/condition';
import { vehicleTuning } from '../src/data/vehicle';
import type { Vehicle } from '../src/sim/vehicle/vehicle';

/** Just enough of a vehicle for the engine-heat part of updateDamage. */
function fake(throttle: number, rpm: number, range: 'high' | 'low', speed: number) {
  return {
    condition: createCondition(),
    throttle,
    speed,
    tuning: vehicleTuning,
    drivetrain: { engineRunning: true, rpm, range },
    wheels: Array.from({ length: 4 }, () => ({ contact: true, surface: 0, spin: 0 })),
    wheelLandings: [0, 0, 0, 0],
    wheelStrikes: [0, 0, 0, 0],
    lastImpact: 0,
    lastImpactDir: { x: 0, y: 0, z: 0 },
    bodyContact: { knock: 0 },
    body: { rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }) },
    tiltDeg: () => 0,
    floodEvent: null,
  } as unknown as Vehicle;
}

function run(v: Vehicle, seconds: number) {
  const events = [];
  for (let t = 0; t < seconds; t += 0.1) events.push(...updateDamage(v, 'realistic', 0.1));
  return events;
}

describe('engine heat', () => {
  it('boils at full revs in low range within a couple of minutes and damages the engine', () => {
    const v = fake(1, vehicleTuning.engine.redlineRpm, 'low', 1);
    const events = run(v, 150);
    expect(v.condition.engineHeat).toBeGreaterThan(1);
    expect(v.condition.engine).toBeLessThan(1);
    expect(events.some((e) => e.cause === 'overheat')).toBe(true);
  });

  it('stays cool cruising in high range', () => {
    const v = fake(0.4, 2200, 'high', 20);
    run(v, 300);
    expect(v.condition.engineHeat).toBeLessThan(0.85);
    expect(v.condition.engine).toBe(1);
  });
});

describe('tyre pressure', () => {
  it('gives more grip let down', () => {
    const c = createCondition();
    const normal = tyreGripMultiplier(c, 0);
    c.lowPressure = true;
    expect(tyreGripMultiplier(c, 0)).toBeGreaterThan(normal);
  });
});
