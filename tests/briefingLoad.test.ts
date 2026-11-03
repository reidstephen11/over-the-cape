import { describe, expect, it } from 'vitest';
import { briefingLoad } from '../src/core/launch';
import { episodes } from '../src/data/episodes';
import { vehicleLoadout } from '../src/data/vehicles';
import type { Checkpoint } from '../src/sim/episode';

const camp = {
  camp: 'bloomfield',
  fuel: 61.5,
  jerryCans: 1,
  spares: 0,
  plugs: 3,
} as Checkpoint;

describe("the briefing's On board line (v1.23)", () => {
  it('continuing from a camp lists what was on board there', () => {
    expect(briefingLoad(camp, { fuel: 90, jerryCans: 2, spares: 1, plugs: 4 }, 'creb', 'shortie')).toEqual({
      fuel: 61.5,
      jerryCans: 1,
      spares: 0,
      plugs: 3,
    });
  });

  it('a new run lists the pack chosen, else the standard load', () => {
    const packed = { fuel: 90, jerryCans: 2, spares: 1, plugs: 4 };
    expect(briefingLoad(null, packed, 'creb', 'shortie')).toEqual(packed);
    expect(briefingLoad(undefined, undefined, 'creb', 'shortie')).toEqual(
      vehicleLoadout(episodes.creb.loadout, 'shortie'),
    );
  });
});
