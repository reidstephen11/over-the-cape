import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { xtracabTuning } from '../src/data/xtracab';
import { driveLeg, driver } from './helpers/drive';
import { crebWorld } from './world';

/** The SR5 Xtra Cab on the CREB: the knoll's rock climb, and the river and creek crossings in the wet. */
const world = crebWorld();
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);

describe('Hilux SR5 Xtra Cab on the CREB', () => {
  it('climbs the knoll rock climb in low range with both lockers, and stops on it with open diffs', async () => {
    const { drive } = driver(world);
    const locked = await drive('knoll-rock-climb', 'both', false, 200, xtracabTuning);
    expect(locked.done, `stopped ${locked.remaining.toFixed(1)} m from the top`).toBe(true);
    const open = await drive('knoll-rock-climb', 'open', false, 200, xtracabTuning);
    expect(open.done, 'open diffs').toBe(false);
  }, 300_000);

  for (const [id, limit] of [
    ['daintree-crossing', 150],
    ['roaring-meg-climb', 300],
    ['donovans-creek', 200],
  ] as const)
    it(`crosses ${id} in the wet without drowning the engine`, async () => {
      const { scene } = driver(world, wet);
      const s = await scene(id, false, 'both', xtracabTuning);
      try {
        // Bogged in a deep bog, it winches out to a tree ahead, as the other vehicles do.
        const r = await driveLeg(s, s.track, false, limit, true);
        expect(r.tilt).toBeLessThan(45);
        expect(s.v.condition.flood.stalled).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);
});
