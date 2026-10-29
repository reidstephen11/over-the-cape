import { describe, expect, it } from 'vitest';
import { sectionTargetsMet, vehicleOpen } from '../src/data/unlocks';
import { loadSave, type KeyValueStore } from '../src/sim/save/save';
import { SAVE_KEY } from '../src/core/config';

const fake = (data: unknown): KeyValueStore => ({
  getItem: (k) => (k === SAVE_KEY ? JSON.stringify(data) : null),
  setItem: () => {},
});

describe('vehicle unlocks', () => {
  it('opens the 40 Series and the Land Rover from the start, and the rest once earned', () => {
    expect(vehicleOpen('shortie', [])).toBe(true);
    expect(vehicleOpen('camel', [])).toBe(true);
    expect(vehicleOpen('unimog', [])).toBe(false);
    expect(vehicleOpen('unimog', ['unimog'])).toBe(true);
    expect(vehicleOpen('lc79', [], true)).toBe(true);
  });

  it('needs every section under its target', () => {
    expect(sectionTargetsMet({ 'big-red': 100, 'bobs-hill': 110 })).toBe(false);
    expect(sectionTargetsMet({ 'big-red': 100, 'bobs-hill': 110, 'concrete-descent': 170 })).toBe(true);
  });

  it('reads unlocked vehicles from the save, dropping unknown ids', () => {
    const save = loadSave(fake({ version: 1, settings: {}, unlocked: ['hilux', 'tank', 'hilux'] }));
    expect(save?.unlocked).toEqual(['hilux']);
  });
});
