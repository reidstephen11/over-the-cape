import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebWashout } from '../src/data/episodes/crebStretches';
import { perentieTuning } from '../src/data/perentie';
import { unimogTuning } from '../src/data/unimog';
import { vehicleTuning } from '../src/data/vehicle';
import { trailProgress } from '../src/sim/world/crawlTrail';
import { buildWorld } from '../src/sim/world/world';
import { driver } from './helpers/drive';

/**
 * Each stretch of the CREB asks for something different (v0.09): for each one-off obstacle
 * the right way through gets through, and a careless one doesn't.
 */
const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { trackOf, stretch } = driver(world, wet);
const both = [vehicleTuning, perentieTuning];

describe('the CREB, stretch by stretch', () => {
  it('keeps only the deep bogs and a few long boggy stretches, no scattered mud holes', () => {
    const holes = world.features.mudHoles;
    expect(holes.filter((b) => b.deep).length).toBe(4);
    // Every other hole is part of a long stretch: a chain of hollows a few metres apart.
    for (const b of holes.filter((h) => !h.deep))
      expect(
        holes.some((o) => o !== b && !o.deep && Math.hypot(o.x - b.x, o.z - b.z) < 9),
        b.id,
      ).toBe(true);
    const chains = holes.filter((b) => !b.deep && b.winchTrees).length / 2;
    expect(chains).toBeGreaterThanOrEqual(2);
    expect(chains).toBeLessThanOrEqual(3);
    // None on the paddock road but its deep bog: it is potholes there.
    expect(holes.filter((b) => b.id.startsWith('paddock-road')).every((b) => b.deep)).toBe(true);
  });

  it('pinches tyres on the paddock road taken fast, but not at a steady 30 km/h', async () => {
    for (const tuning of both) {
      const steady = await stretch('paddock-road', 300, 1150, 'high', tuning, { speed: 8, limit: 200 });
      expect(steady.done, tuning.name).toBe(true);
      expect(steady.cuts, tuning.name).toBe(0);
      const fast = await stretch('paddock-road', 300, 1150, 'high', tuning, { speed: 13, limit: 200 });
      expect(fast.cuts, tuning.name).toBeGreaterThan(0);
    }
  }, 600_000);

  it('cuts a washout across the ridge that stops a vehicle without the planks and not with them, but not the Unimog', async () => {
    // Square across the track.
    const ridge = trackOf('creb-ridge');
    const at = trailProgress(ridge, crebWashout.x, crebWashout.z);
    expect(at.distance).toBeLessThan(0.5);
    for (const tuning of both) {
      const without = await stretch('creb-ridge', at.along - 20, at.along + 20, 'crawl', tuning, {
        limit: 90,
      });
      expect(without.done, tuning.name).toBe(false);
      expect(without.remaining, tuning.name).toBeGreaterThan(18);
      const bridged = await stretch('creb-ridge', at.along - 20, at.along + 20, 'crawl', tuning, {
        limit: 90,
        planks: crebWashout,
      });
      expect(bridged.done, tuning.name).toBe(true);
      expect(bridged.tilt, tuning.name).toBeLessThan(30);
    }
    // The Unimog's big wheels climb out of it.
    const unimog = await stretch('creb-ridge', at.along - 20, at.along + 20, 'crawl', unimogTuning, {
      limit: 90,
    });
    expect(unimog.done).toBe(true);
  }, 600_000);

  it('climbs the rock ledge out of Roaring Meg crawling with the lockers, not spinning up it in high range', async () => {
    for (const tuning of both) {
      const crawl = await stretch('roaring-meg-climb', 185, 235, 'crawl', tuning, { limit: 120 });
      expect(crawl.done, tuning.name).toBe(true);
      expect(crawl.cuts, tuning.name).toBe(0);
      const high = await stretch('roaring-meg-climb', 185, 235, 'high', tuning, { speed: 2, limit: 120 });
      expect(high.done, tuning.name).toBe(false);
      // Spinning on the rock wears through the tyres.
      expect(high.cuts, tuning.name).toBeGreaterThan(0);
    }
  }, 600_000);

  it('leans the car over on the range-top sideling, sliding it towards the drop when taken fast', async () => {
    for (const tuning of both) {
      const crawl = await stretch('range-top', 140, 240, 'crawl', tuning, { limit: 120 });
      expect(crawl.done, tuning.name).toBe(true);
      expect(crawl.roll, tuning.name).toBeGreaterThan(22);
      expect(crawl.roll, tuning.name).toBeLessThan(30);
      expect(crawl.deviation, tuning.name).toBeLessThan(1.2);
      const fast = await stretch('range-top', 140, 240, 'high', tuning, { speed: 9, limit: 120 });
      expect(fast.roll, tuning.name).toBeGreaterThan(crawl.roll + 3);
      expect(fast.deviation, tuning.name).toBeGreaterThan(2);
    }
  }, 600_000);

  it('crosses the Bloomfield Track’s fast creek driven steadily, but stopped in it the current carries the car into the hole below', async () => {
    for (const tuning of both) {
      const steady = await stretch('bloomfield-track', 770, 815, 'crawl', tuning, { limit: 90 });
      expect(steady.done, tuning.name).toBe(true);
      expect(steady.flooded, tuning.name).toBe(false);
      const stopped = await stretch('bloomfield-track', 770, 815, 'crawl', tuning, {
        limit: 120,
        stopAt: 790,
      });
      expect(stopped.done, tuning.name).toBe(false);
      expect(stopped.deviation, tuning.name).toBeGreaterThan(4);
    }
  }, 600_000);
});
