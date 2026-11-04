import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { hiluxTuning } from '../src/data/hilux';
import { perentieTuning } from '../src/data/perentie';
import { troopyTuning } from '../src/data/troopy';
import { patrolTuning } from '../src/data/patrol';
import { lc79Tuning } from '../src/data/lc79';
import { unimogTuning } from '../src/data/unimog';
import { vehicleTuning } from '../src/data/vehicle';
import { driveLeg, driver, GIVE_UP_AFTER, runLeg } from './helpers/drive';
import { crebWorld } from './world';

/** The wet clay climbs: which vehicles and settings get up them and which stop (split from creb.test.ts in v1.45). */
const world = crebWorld();
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { scene } = driver(world, wet);

describe('Episode 1: the CREB Track', () => {
  it('stops high range and open diffs on its wet clay climbs', async () => {
    for (const id of ['big-red', 'bobs-hill'])
      for (const tuning of [
        vehicleTuning,
        perentieTuning,
        hiluxTuning,
        troopyTuning,
        patrolTuning,
        lc79Tuning,
      ])
        for (const lockers of ['high', 'open'] as const) {
          const s = await scene(id, false, lockers, tuning);
          try {
            const r = await runLeg(s, s.track, false, 150, false, undefined, undefined, 0, GIVE_UP_AFTER);
            expect(r.done, `${id}, ${tuning.name}, ${lockers}`).toBe(false);
          } finally {
            s.sim.physics.free();
          }
        }
  }, 900_000);

  it('stops the Unimog in high range on its wet clay climbs, and on Big Red with open diffs', async () => {
    for (const [id, lockers] of [
      ['big-red', 'high'],
      ['big-red', 'open'],
      ['bobs-hill', 'high'],
    ] as const) {
      const s = await scene(id, false, lockers, unimogTuning);
      try {
        const r = await runLeg(s, s.track, false, 150, false, undefined, undefined, 0, GIVE_UP_AFTER);
        expect(r.done, `${id}, ${lockers}`).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }
  }, 900_000);

  it("climbs Bob's Hill in the wet in the Unimog in low range with open diffs, with a pull or two on the winch, where the others need both lockers", async () => {
    const s = await scene('bobs-hill', false, 'open', unimogTuning);
    try {
      // The pinches cut up under it (v0.70's churn) and it winches to a tree.
      const r = await driveLeg(s, s.track, false, 200, true);
      expect(r.winched).toBeLessThanOrEqual(2);
    } finally {
      s.sim.physics.free();
    }
  }, 300_000);
});
