import { describe, expect, it } from 'vitest';
import { scoreRun } from '../src/sim/runScore';
import { createCondition } from '../src/sim/vehicle/condition';

describe('scoreRun', () => {
  it('gives gold to an early, clean finish with fuel and kit left', () => {
    const c = createCondition(70);
    c.jerryCans = 1;
    c.spares = 2;
    c.plugs = 3;
    const s = scoreRun({ condition: c, startFuel: 70, minutes: 25, hoursSpare: 2, targetMinutes: 30 });
    expect(s.points).toBe(1000);
    expect(s.medal).toBe('gold');
  });

  it('gives bronze to a late, battered finish', () => {
    const c = createCondition(5);
    c.engine = 0.3;
    c.jerryCans = 0;
    c.spares = 0;
    c.plugs = 0;
    const s = scoreRun({ condition: c, startFuel: 70, minutes: 90, hoursSpare: 0.1, targetMinutes: 30 });
    expect(s.medal).toBe('bronze');
  });
});
