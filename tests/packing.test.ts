import { describe, expect, it } from 'vitest';
import { episodes } from '../src/data/episodes';
import { fitPack, loadKg, packLimitKg, stepPack } from '../src/data/packing';
import { vehicleLoadout } from '../src/data/vehicles';
import { startCheckpoint } from '../src/sim/episode';

const standard = episodes.creb.loadout;

describe('packing', () => {
  it('leaves the standard load as it is, under the limit', () => {
    const l = vehicleLoadout(standard, 'shortie');
    expect(fitPack(l, standard, 'shortie')).toEqual(l);
    expect(loadKg(l, 'shortie')).toBeLessThan(packLimitKg(standard, 'shortie'));
  });

  it('will not pack past the weight limit', () => {
    let l = vehicleLoadout(standard, 'camel');
    for (let i = 0; i < 10; i++) l = stepPack(l, 'spares', 1, standard, 'camel') ?? l;
    for (let i = 0; i < 10; i++) l = stepPack(l, 'jerryCans', 1, standard, 'camel') ?? l;
    expect(loadKg(l, 'camel')).toBeLessThanOrEqual(packLimitKg(standard, 'camel') + 0.01);
    expect(stepPack(l, 'jerryCans', 1, standard, 'camel')).toBeNull();
  });

  it('steps fuel in tens up to a full tank', () => {
    let l = vehicleLoadout(standard, 'shortie');
    l = stepPack(l, 'fuel', 1, standard, 'shortie')!;
    expect(l.fuel).toBe(60);
    l = stepPack(l, 'fuel', 1, standard, 'shortie')!;
    expect(l.fuel).toBe(62);
    expect(stepPack(l, 'fuel', 1, standard, 'shortie')).toBeNull();
    expect(stepPack(l, 'fuel', -1, standard, 'shortie')!.fuel).toBe(60);
  });

  it('starts a new run with the load packed, and remembers it', () => {
    const pack = { fuel: 40, jerryCans: 2, spares: 1, plugs: 6 };
    const c = startCheckpoint(episodes.creb, 'daintree', 'shortie', 7, pack);
    expect([c.fuel, c.jerryCans, c.spares, c.plugs]).toEqual([40, 2, 1, 6]);
    expect(c.packed).toEqual(pack);
  });
});

describe('a heavy load', () => {
  it('adds its weight to the car and slows it on a climb', async () => {
    const { makeScene } = await import('./helpers/scenes');
    const climb = async (extraKg: number) => {
      const s = await makeScene({ pitchDeg: 12 });
      s.vehicle.packing = { spareKg: 35, baseKg: s.vehicle.condition.fuel * 0.8 - extraKg };
      s.run(1, {});
      const y0 = s.vehicle.position.y;
      s.run(6, { throttle: 1 });
      return { gained: s.vehicle.position.y - y0, mass: s.vehicle.mass };
    };
    const light = await climb(0);
    const heavy = await climb(400);
    expect(heavy.mass - light.mass).toBeCloseTo(400, 0);
    expect(heavy.gained).toBeLessThan(light.gained);
  });
});
