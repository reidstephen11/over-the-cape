import { describe, expect, it } from 'vitest';
import { camelTuning } from '../src/data/camel';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { perentieTuning } from '../src/data/perentie';
import { vehicleTuning } from '../src/data/vehicle';
import { SurfaceId } from '../src/data/surfaces';
import { winchTuning } from '../src/data/tools';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { driver, GIVE_UP_AFTER, steepest } from './helpers/drive';
import { crebWorld } from './world';

/**
 * Each stretch of the CREB asks for something different (v0.09): for each one-off obstacle
 * the right way through gets through, and a careless one doesn't.
 * (The Bloomfield Track and the creek crossings, split from crebStretches.test.ts in v1.45.)
 */
const world = crebWorld();
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { trackOf, stretch } = driver(world, wet);
const both = [vehicleTuning, perentieTuning];

describe('the CREB, stretch by stretch', () => {
  it('takes the Bloomfield Track over two knolls that need both lockers: wet clay on the Rossville pinch, granite ledges at Helenvale', async () => {
    const track = trackOf('bloomfield-track');
    // The roads climb hills rather than embankments built on the flat.
    expect(steepest(track)).toBeGreaterThan(19);
    for (const tuning of both) {
      const clay = await stretch('bloomfield-track', 840, 935, 'crawl', tuning, { limit: 150 });
      expect(clay.done, `${tuning.name} clay`).toBe(true);
      const clayHigh = await stretch('bloomfield-track', 840, 935, 'high', tuning, {
        speed: 4,
        limit: 90,
        giveUpAfter: GIVE_UP_AFTER,
      });
      expect(clayHigh.done, `${tuning.name} clay high`).toBe(false);
      const clayOpen = await stretch('bloomfield-track', 840, 935, 'crawl', tuning, {
        limit: 150,
        open: true,
        giveUpAfter: GIVE_UP_AFTER,
      });
      expect(clayOpen.done, `${tuning.name} clay open diffs`).toBe(false);
      const granite = await stretch('bloomfield-track', 1435, 1520, 'crawl', tuning, { limit: 150 });
      expect(granite.done, `${tuning.name} granite`).toBe(true);
      expect(granite.cuts, `${tuning.name} granite`).toBe(0);
      const graniteOpen = await stretch('bloomfield-track', 1435, 1520, 'crawl', tuning, {
        limit: 150,
        open: true,
        giveUpAfter: GIVE_UP_AFTER,
      });
      expect(graniteOpen.done, `${tuning.name} granite open diffs`).toBe(false);
    }
  }, 600_000);

  it('crosses the paddock-road creeks on the centre line without the winch', async () => {
    const track = trackOf('paddock-road');
    const north = trailProgress(track, -232.5, 1634.35);
    expect(north.distance).toBeLessThan(2);
    const bed = trailPoint(track, north.along);
    expect(world.terrain.waterDepthAt(bed.x, bed.z)).toBeGreaterThan(0.2);
    const entry = world.map.bogs.find((b) => b.id === 'paddock-road-creek-entry')!;
    const exit = world.map.bogs.find((b) => b.id === 'paddock-road-creek-exit')!;
    expect(world.terrain.surfaceAt(entry.x, entry.z)).toBe(SurfaceId.BlackSoil);
    expect(world.terrain.surfaceAt(exit.x, exit.z)).toBe(SurfaceId.BlackSoil);
    expect(trailProgress(track, entry.x, entry.z).along).toBeLessThan(north.along);
    expect(trailProgress(track, exit.x, exit.z).along).toBeGreaterThan(north.along);
    const farBank = world.scatter.rocks.find(
      (r) =>
        r.anchor &&
        r.solid &&
        Math.hypot(r.x - exit.x, r.z - exit.z) < 12 &&
        Math.hypot(r.x - entry.x, r.z - entry.z) < winchTuning.cableLength,
    );
    expect(farBank, 'far-bank winch rock').toBeDefined();
    for (const [tuning, from, to] of [
      [vehicleTuning, 471, 522],
      [vehicleTuning, 872, 928],
      [camelTuning, 872, 928],
    ] as const) {
      const r = await stretch('paddock-road', from, to, 'crawl', tuning, { limit: 90 });
      expect(r.done, `${tuning.id} ${from} remaining=${r.remaining.toFixed(1)}`).toBe(true);
    }
    const high = await stretch('paddock-road', 872, 928, 'high', vehicleTuning, {
      speed: 6,
      limit: 50,
      giveUpAfter: GIVE_UP_AFTER,
    });
    expect(high.done, `high remaining=${high.remaining.toFixed(1)}`).toBe(false);
    expect(high.remaining, 'high range should bog in the bank mud').toBeGreaterThan(5);
  }, 300_000);

  it('crosses the Bloomfield Track’s fast creek driven steadily, but stopped in it the current carries the short-wheelbase 4WD into the hole below and pushes the heavier Perentie off its line', async () => {
    for (const tuning of both) {
      const steady = await stretch('bloomfield-track', 770, 815, 'crawl', tuning, { limit: 90 });
      expect(steady.done, tuning.name).toBe(true);
      expect(steady.flooded, tuning.name).toBe(false);
      const stopped = await stretch('bloomfield-track', 770, 815, 'crawl', tuning, {
        limit: 120,
        stopAt: 790,
      });
      if (tuning === vehicleTuning) {
        expect(stopped.done, tuning.name).toBe(false);
        expect(stopped.deviation, tuning.name).toBeGreaterThan(4);
      } else {
        // A tonne heavier, the Perentie lifts too little to be carried: the current
        // walks it sideways while it stands there, and it drives out once it moves again.
        // (Before v0.88 it only seemed to be carried off: a weir on the exit bank held it
        // in the water while the current pushed it along.)
        expect(stopped.crept, tuning.name).toBeGreaterThan(0.5);
        expect(stopped.done, tuning.name).toBe(true);
      }
    }
  }, 600_000);
});
