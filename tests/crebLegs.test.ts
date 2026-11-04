import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebWashout } from '../src/data/episodes/crebStretches';
import { hiluxTuning } from '../src/data/hilux';
import { perentieTuning } from '../src/data/perentie';
import { troopyTuning } from '../src/data/troopy';
import { patrolTuning } from '../src/data/patrol';
import { lc79Tuning } from '../src/data/lc79';
import { unimogTuning } from '../src/data/unimog';
import { vehicleTuning } from '../src/data/vehicle';
import { driveLeg, driver } from './helpers/drive';
import { crebWorld } from './world';

/** The CREB leg by leg in the wet in the short-wheelbase 4WD (split from creb.test.ts in v1.45). */
const world = crebWorld();
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { scene } = driver(world, wet);

describe('Episode 1: the CREB Track', () => {
  const legs: [string, 'both' | 'high', number][] = [
    ['daintree-crossing', 'both', 150],
    ['big-red', 'both', 300],
    ['big-red-bypass', 'both', 400],
    ['creb-ridge', 'both', 700],
    ['roaring-meg-climb', 'both', 300],
    ['bobs-hill', 'both', 200],
    ['concrete-descent', 'both', 300],
    ['donovans-creek', 'both', 200],
  ];
  for (const [id, lockers, limit] of legs)
    it(`drives ${id} in the wet in the short-wheelbase 4WD`, async () => {
      const s = await scene(id, false, lockers, vehicleTuning);
      try {
        // Bogged in a deep bog, it winches out to a tree ahead; it bridges the ridge's washout.
        const planks = id === 'creb-ridge' ? crebWashout : undefined;
        const r = await driveLeg(s, s.track, false, limit, true, planks);
        // The rock ledge out of Roaring Meg pitches the car up to 43°.
        expect(r.tilt).toBeLessThan(id === 'roaring-meg-climb' ? 45 : 42);
        expect(s.v.condition.flood.stalled).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);

  // The other vehicles up Bob's Hill (Big Red is in creb.test.ts).
  for (const tuning of [perentieTuning, hiluxTuning, unimogTuning, troopyTuning, patrolTuning, lc79Tuning])
    for (const id of ['bobs-hill'])
      it(`drives ${id} in the wet in the ${tuning.name}`, async () => {
        const s = await scene(id, false, 'both', tuning);
        try {
          // Big Red's pinches cut up under the wheels in the wet; the winch to the marked
          // rocks (v0.87) is part of the climb. Bob's Hill goes without it.
          const bigRed = id === 'big-red';
          const r = await driveLeg(s, s.track, false, bigRed ? 300 : 200, bigRed);
          expect(r.winched).toBeLessThanOrEqual(bigRed ? 4 : 0);
        } finally {
          s.sim.physics.free();
        }
      }, 300_000);
});
