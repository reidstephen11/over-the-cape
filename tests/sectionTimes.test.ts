import { describe, expect, it } from 'vitest';
import { SectionTimes } from '../src/sim/sectionTimes';

const hill = { id: 'hill', name: 'Hill', a: { x: 0, z: 0 }, b: { x: 0, z: -100 } };

/** Drives from z0 to z1 at 1 m per 0.1 s step. */
function drive(t: SectionTimes, z0: number, z1: number) {
  const out = [];
  for (let z = z0; z0 < z1 ? z <= z1 : z >= z1; z += z0 < z1 ? 1 : -1) {
    const r = t.update(0, z, 0.1);
    if (r) out.push(r);
  }
  return out;
}

describe('SectionTimes', () => {
  it('times a section end to end, from leaving the start', () => {
    const t = new SectionTimes([hill], {});
    const [r] = drive(t, 20, -120);
    expect(r.seconds).toBeCloseTo(8, 0);
    expect(r.best).toBeNull();
    expect(t.bests.hill).toBeCloseTo(r.seconds);
  });

  it('times it driven the other way and keeps the quicker best', () => {
    const t = new SectionTimes([hill], { hill: 5 });
    const [r] = drive(t, -120, 20);
    expect(r.best).toBe(5);
    expect(t.bests.hill).toBe(5);
  });

  it('drops an attempt that turns back', () => {
    const t = new SectionTimes([hill], {});
    expect(drive(t, 20, -50)).toEqual([]);
    expect(drive(t, -50, 20)).toEqual([]);
  });
});
