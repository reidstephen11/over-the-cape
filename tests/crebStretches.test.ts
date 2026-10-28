import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebWashout } from '../src/data/episodes/crebStretches';
import { perentieTuning } from '../src/data/perentie';
import { unimogTuning } from '../src/data/unimog';
import { vehicleTuning } from '../src/data/vehicle';
import { trailProgress } from '../src/sim/world/crawlTrail';
import type { TrackInfo } from '../src/sim/world/features';
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

/** Steepest rise or fall over `window` metres of centreline, in degrees. */
function steepest(track: TrackInfo, window = 12) {
  let max = 0;
  for (let k = 0; k < track.poly.count; k++) {
    let j = k;
    while (j + 1 < track.poly.count && track.poly.s[j] - track.poly.s[k] < window) j++;
    const ds = track.poly.s[j] - track.poly.s[k];
    if (ds < window * 0.8) continue;
    const grade = Math.abs(Math.atan2(track.profile[j] - track.profile[k], ds)) * (180 / Math.PI);
    if (grade > max) max = grade;
  }
  return max;
}

/** Metres along a road between on-road bogs, plank gaps, rock steps and creek crossings. */
function gaps(trackId: string) {
  const track = trackOf(trackId);
  const marks = [0, track.poly.length];
  const near = (x: number, z: number, reach: number) => {
    const at = trailProgress(track, x, z);
    if (at.distance < reach) marks.push(at.along);
  };
  for (const bog of world.map.bogs) near(bog.x, bog.z, track.def.width);
  for (const gully of world.map.gullies) near(gully.x, gully.z, 3);
  for (const step of track.def.rockySteps ?? []) marks.push(step.at);
  for (const creek of world.features.creeks) {
    let best = { along: 0, distance: Infinity };
    for (let i = 0; i < creek.poly.count; i += 2) {
      const at = trailProgress(track, creek.poly.xs[i], creek.poly.zs[i]);
      if (at.distance < best.distance) best = at;
    }
    if (best.distance < track.def.width) marks.push(best.along);
  }
  marks.sort((a, b) => a - b);
  let gap = 0;
  for (let i = 1; i < marks.length; i++) gap = Math.max(gap, marks[i] - marks[i - 1]);
  return gap;
}

describe('the CREB, stretch by stretch', () => {
  it('puts deep bogs across the roads and keeps the ridge’s long wet stretch', () => {
    const holes = world.features.mudHoles;
    // Procedural holes are the saddle bog and its long wet chain, not a scatter of mud.
    const deep = holes.filter((b) => b.deep);
    expect(deep.length).toBe(1);
    expect(deep[0].id.startsWith('creb-ridge')).toBe(true);
    for (const b of holes.filter((h) => !h.deep))
      expect(
        holes.some((o) => o !== b && !o.deep && Math.hypot(o.x - b.x, o.z - b.z) < 9),
        b.id,
      ).toBe(true);
    const chains = holes.filter((b) => !b.deep && b.winchTrees).length / 2;
    expect(chains).toBeGreaterThanOrEqual(1);
    expect(chains).toBeLessThanOrEqual(3);
    // The road bogs are authored across the wheel lines, wider than the track, so they cannot be missed.
    for (const id of ['upper-daintree-road', 'paddock-road', 'bloomfield-track', 'big-red-bypass']) {
      const bogs = world.map.bogs.filter((b) => b.id.startsWith(id));
      expect(bogs.length, id).toBeGreaterThan(0);
      for (const bog of bogs) {
        expect(bog.deep, bog.id).toBe(true);
        const track = trackOf(id);
        expect(trailProgress(track, bog.x, bog.z).distance, bog.id).toBeLessThan(track.def.width / 2);
        expect(bog.radiusX, bog.id).toBeGreaterThan(track.def.width / 2 + 1);
      }
    }
  });

  it('teaches the controls out of the village, then puts a real obstacle every few hundred metres', () => {
    for (const text of ['Low range — L', 'Diff locks — Z X', 'Crawl — P', 'Winch — E R F'])
      expect(
        crebMap.props.some((p) => p.kind === 'signpost' && p.text === text),
        text,
      ).toBe(true);
    for (const id of ['orient-low-range', 'orient-lockers', 'orient-crawl', 'orient-winch'])
      expect(crebEpisode.notes[id], id).toBeDefined();
    expect(crebEpisode.clockRate).toBe(4.5);
    expect(crebEpisode.fuelScale).toBe(6);
    // The west line and the chicken track are pinches, not walks around the hard face.
    expect(steepest(trackOf('big-red'))).toBeGreaterThan(18);
    expect(steepest(trackOf('big-red-bypass'))).toBeGreaterThan(20);
    expect(steepest(trackOf('chicken-track'))).toBeGreaterThan(20);
    expect(steepest(trackOf('upper-daintree-road'))).toBeGreaterThan(15);
    expect(gaps('paddock-road')).toBeLessThan(400);
    expect(gaps('bloomfield-track')).toBeLessThan(450);
  });

  it('pinches tyres on the paddock road taken fast, but not at a steady 30 km/h', async () => {
    // Clear of the on-road bog, rock steps and plank gap, so the potholes are the only obstacle.
    // Each vehicle pinches on a different clear stretch; together they still do, and neither stops.
    const clear: ReadonlyArray<readonly [number, number]> = [
      [300, 540],
      [590, 700],
    ];
    for (const tuning of both) {
      let steadyCuts = 0;
      let fastCuts = 0;
      for (const [from, to] of clear) {
        const steady = await stretch('paddock-road', from, to, 'high', tuning, { speed: 8, limit: 80 });
        expect(steady.done, `${tuning.name} ${from}`).toBe(true);
        steadyCuts += steady.cuts;
        const fast = await stretch('paddock-road', from, to, 'high', tuning, { speed: 13, limit: 50 });
        expect(fast.done, `${tuning.name} fast ${from}`).toBe(true);
        fastCuts += fast.cuts;
      }
      expect(steadyCuts, tuning.name).toBe(0);
      expect(fastCuts, tuning.name).toBeGreaterThan(0);
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
      // The muddy edge (v0.37) lets it slide more than it digs in, so it leans less than on dry dirt.
      expect(fast.roll, tuning.name).toBeGreaterThan(crawl.roll + 1);
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
