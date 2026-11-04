import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebWashout } from '../src/data/episodes/crebStretches';
import { perentieTuning } from '../src/data/perentie';
import { unimogTuning } from '../src/data/unimog';
import { vehicleTuning } from '../src/data/vehicle';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { driver, GIVE_UP_AFTER, steepest } from './helpers/drive';
import { crebWorld } from './world';

/**
 * Each stretch of the CREB asks for something different (v0.09): for each one-off obstacle
 * the right way through gets through, and a careless one doesn't.
 */
const world = crebWorld();
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { trackOf, stretch } = driver(world, wet);
const both = [vehicleTuning, perentieTuning];

/** Metres along a road between on-road bogs, plank gaps, rock steps, creek crossings and steep climbs. */
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
  // A climb steeper than 15° over 12 m.
  for (let k = 0; k < track.poly.count; k += 4) {
    let j = k;
    while (j + 1 < track.poly.count && track.poly.s[j] - track.poly.s[k] < 12) j++;
    const ds = track.poly.s[j] - track.poly.s[k];
    if (ds > 9 && Math.atan2(track.profile[j] - track.profile[k], ds) > (15 * Math.PI) / 180)
      marks.push(track.poly.s[k]);
  }
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
    expect(gaps('paddock-road')).toBeLessThan(450);
    expect(gaps('bloomfield-track')).toBeLessThan(450);
    // No plank gaps cut across the roads: the planks are for the ridge washout.
    expect(world.map.gullies.map((g) => g.id)).toEqual([crebWashout.id]);
  });

  it('gets through the paddock road at a steady 30 km/h without a cut, and fast without stopping', async () => {
    // Clear of the on-road bogs and the creeks, so the potholes are the only obstacle.
    const clear: ReadonlyArray<readonly [number, number]> = [
      [255, 470],
      [530, 675],
      [940, 1100],
    ];
    // Until v1.19 this also expected the fast runs to cut a tyre between them. Since the
    // footprint rays sample along the wheel's true rolling direction (v1.19, kept in v1.25)
    // neither vehicle cuts one at 47 km/h on these stretches. Whether the potholes should
    // pinch more often is a tuning choice for the play test (README, v1.07–v1.08), so the
    // test keeps to what the game does now.
    let fastCuts = 0;
    for (const tuning of both) {
      let steadyCuts = 0;
      for (const [from, to] of clear) {
        const steady = await stretch('paddock-road', from, to, 'high', tuning, { speed: 8, limit: 80 });
        expect(steady.done, `${tuning.name} ${from}`).toBe(true);
        steadyCuts += steady.cuts;
        const fast = await stretch('paddock-road', from, to, 'high', tuning, { speed: 13, limit: 50 });
        expect(fast.done, `${tuning.name} fast ${from}`).toBe(true);
        fastCuts += fast.cuts;
      }
      expect(steadyCuts, tuning.name).toBe(0);
    }
    expect(fastCuts).toBeLessThanOrEqual(2);
  }, 600_000);

  it('cuts a washout across the ridge that stops a vehicle without the planks and not with them, but not the Unimog', async () => {
    // Square across the track.
    const ridge = trackOf('creb-ridge');
    const at = trailProgress(ridge, crebWashout.x, crebWashout.z);
    expect(at.distance).toBeLessThan(0.5);
    for (const tuning of both) {
      const without = await stretch('creb-ridge', at.along - 20, at.along + 20, 'crawl', tuning, {
        limit: 90,
        giveUpAfter: GIVE_UP_AFTER,
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
      const high = await stretch('roaring-meg-climb', 185, 235, 'high', tuning, {
        speed: 2,
        limit: 120,
        giveUpAfter: GIVE_UP_AFTER,
      });
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
      // The muddy edge (v0.37) and the clay it churns up (v0.70) let it slide rather than dig in,
      // so taken fast it goes sideways towards the drop instead of leaning further over.
      expect(fast.roll, tuning.name).toBeGreaterThan(20);
      expect(fast.deviation, tuning.name).toBeGreaterThan(2);
      expect(fast.deviation, tuning.name).toBeGreaterThan(crawl.deviation + 1);
    }
  }, 600_000);

  it('ramps the road into every ford: no hidden wall at the water on the centre line or the wheel tracks', () => {
    // Paddock-creek-north used to jump 0.5–1.5 m at the water (50–67°) because track
    // grading skipped a weir the banks had raised; the water hid the step, and only a
    // hard-left line around it got through. A ford may be steep, but not a cliff.
    const t = world.terrain;
    const lips: string[] = [];
    for (const id of ['paddock-road', 'bloomfield-track', 'donovans-creek']) {
      const track = trackOf(id);
      const lats = [0, -track.def.width * 0.35, track.def.width * 0.35];
      for (const lat of lats) {
        let wasWet = false;
        for (let s = 0; s <= track.poly.length; s += 0.5) {
          const p = trailPoint(track, s, lat);
          const wet = t.waterDepthAt(p.x, p.z) > 0.05;
          if (wet !== wasWet && s > 0) {
            const a = trailPoint(track, s - 0.5, lat);
            const dh = Math.abs(t.heightAt(p.x, p.z) - t.heightAt(a.x, a.z));
            const slope = Math.max(t.slopeDegAt(p.x, p.z), t.slopeDegAt(a.x, a.z));
            if (dh > 0.4 || slope > 40)
              lips.push(
                `${id} lat=${lat.toFixed(1)} at ${s.toFixed(1)}m Δh=${dh.toFixed(2)} slope=${slope.toFixed(1)}°`,
              );
          }
          wasWet = wet;
        }
      }
    }
    expect(lips, lips.join('\n')).toEqual([]);
  });
});
