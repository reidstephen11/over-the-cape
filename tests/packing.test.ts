import { describe, expect, it } from 'vitest';
import { episodes } from '../src/data/episodes';
import { choiceFromSave } from '../src/core/launch';
import {
  fitPack,
  isStandardPack,
  loadKg,
  packFor,
  packLimitKg,
  rememberPack,
  stepPack,
} from '../src/data/packing';
import { loadSave } from '../src/sim/save/save';
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

describe('each episode starts with its own load (v2.23)', () => {
  const north = episodes.telegraphNorth.loadout;
  const store = (data: unknown) => ({
    getItem: () => JSON.stringify(data),
    setItem: () => undefined,
    removeItem: () => undefined,
  });

  it('gives a new player the episode’s load on every episode, whichever the journey page opened on', () => {
    // No save: the page opens on the first episode with its load.
    const first = choiceFromSave(null);
    expect(first.episode).toBe('creb');
    expect(first.load).toEqual(vehicleLoadout(standard, 'shortie'));
    // The northern track's load is its own lean one, not the CREB's.
    expect(packFor(undefined, 'telegraphNorth', north, 'shortie')).toEqual({
      fuel: 16,
      jerryCans: 0,
      spares: 1,
      plugs: 2,
    });
    expect(packFor(undefined, 'telegraphNorth', north, 'shortie')).not.toEqual(first.load);
  });

  it('keeps a load packed by hand for the episode and vehicle it was packed for, and nowhere else', () => {
    const heavy = stepPack(vehicleLoadout(standard, 'shortie'), 'jerryCans', 1, standard, 'shortie')!;
    const packs = rememberPack(undefined, 'creb', standard, 'shortie', heavy);
    expect(packFor(packs, 'creb', standard, 'shortie')).toEqual(heavy);
    expect(packFor(packs, 'creb', standard, 'hilux')).toEqual(vehicleLoadout(standard, 'hilux'));
    expect(packFor(packs, 'telegraphNorth', north, 'shortie')).toEqual(vehicleLoadout(north, 'shortie'));
    expect(packFor(packs, 'telegraph', episodes.telegraph.loadout, 'shortie')).toEqual(
      vehicleLoadout(episodes.telegraph.loadout, 'shortie'),
    );
  });

  it('does not remember the standard load, and forgets a hand-packed one when it is put back', () => {
    const base = vehicleLoadout(standard, 'shortie');
    expect(isStandardPack(base, standard, 'shortie')).toBe(true);
    expect(rememberPack(undefined, 'creb', standard, 'shortie', base).creb).toEqual({});
    const lighter = stepPack(base, 'plugs', -1, standard, 'shortie')!;
    expect(isStandardPack(lighter, standard, 'shortie')).toBe(false);
    const kept = rememberPack(undefined, 'creb', standard, 'shortie', lighter);
    expect(kept.creb?.shortie).toEqual(lighter);
    expect(rememberPack(kept, 'creb', standard, 'shortie', base).creb?.shortie).toBeUndefined();
  });

  it('reads a save from before v2.23: a load kept per vehicle goes to the episode last played, unless it is that episode’s standard', () => {
    const old = (episode: string, packs: unknown) =>
      loadSave(store({ version: 1, settings: {}, vehicle: 'shortie', episode, episodes: {}, packs }))!;
    // The CREB's standard load, recorded by a CREB run: no longer a pack at all.
    const fromCreb = old('creb', { shortie: vehicleLoadout(standard, 'shortie') });
    expect(fromCreb.packs).toEqual({ creb: {} });
    expect(choiceFromSave({ ...fromCreb, episode: 'telegraphNorth' }).load).toEqual(
      vehicleLoadout(north, 'shortie'),
    );
    // A load packed by hand stays with the episode last played.
    const heavy = { fuel: 40, jerryCans: 2, spares: 1, plugs: 6 };
    const custom = old('creb', { shortie: heavy });
    expect(custom.packs?.creb?.shortie).toEqual(heavy);
    expect(choiceFromSave(custom).load).toEqual(heavy);
    expect(choiceFromSave({ ...custom, episode: 'telegraphNorth' }).load).toEqual(
      vehicleLoadout(north, 'shortie'),
    );
    // A save in the new form reads back as written.
    const fresh = old('creb', {
      telegraphNorth: { shortie: { fuel: 20, jerryCans: 0, spares: 1, plugs: 2 } },
    });
    expect(fresh.packs?.telegraphNorth?.shortie?.fuel).toBe(20);
    expect(fresh.packs?.creb).toBeUndefined();
  });
});
