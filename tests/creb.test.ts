import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { perentieTuning } from '../src/data/perentie';
import { vehicleTuning } from '../src/data/vehicle';
import { trailPoint } from '../src/sim/world/crawlTrail';
import { NO_WATER } from '../src/sim/world/terrain';
import { buildWorld } from '../src/sim/world/world';
import { driveLeg, driver } from './helpers/drive';

const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { trackOf, scene } = driver(world, wet);

describe('Episode 1: the CREB Track', () => {
  it('is a 3 km map with about 5 km of track from Daintree Village to the Lions Den', () => {
    expect(crebMap.size).toBe(3072);
    const route = [
      'upper-daintree-road',
      'daintree-crossing',
      'paddock-road',
      'big-red',
      'creb-ridge',
      'roaring-meg-climb',
      'bobs-hill',
      'range-top',
      'concrete-descent',
      'donovans-creek',
      'bloomfield-bridge',
      'bloomfield-track',
    ];
    const length = route.reduce((sum, id) => sum + trackOf(id).poly.length, 0);
    expect(length).toBeGreaterThan(4500);
    // Each leg starts where the one before it ends, at the same height.
    for (let k = 0; k + 1 < route.length; k++) {
      const a = trackOf(route[k]);
      const b = trackOf(route[k + 1]);
      const end = trailPoint(a, a.poly.length);
      const start = trailPoint(b, 0);
      expect(Math.hypot(end.x - start.x, end.z - start.z), route[k]).toBeLessThan(0.01);
      expect(Math.abs(a.profile[a.profile.length - 1] - b.profile[0]), route[k]).toBeLessThan(0.15);
    }
  });

  it('has its goal, camps and history notes on the map', () => {
    const ids = new Set(world.pois.map((p) => p.id));
    expect(ids.has(crebEpisode.goal)).toBe(true);
    expect(world.pois.find((p) => p.id === crebEpisode.goal)!.kind).toBe('campsite');
    expect(world.pois.filter((p) => p.kind === 'campsite').map((p) => p.id)).toEqual([
      'daintree-village',
      'roaring-meg-camp',
      'bloomfield-camp',
      'lions-den',
    ]);
    for (const id of Object.keys(crebEpisode.notes)) expect(ids.has(id), id).toBe(true);
    // Every camp's start position is on level ground, clear of the water.
    for (const camp of world.pois.filter((p) => p.reset)) {
      const r = camp.reset!;
      expect(world.terrain.slopeDegAt(r.x, r.z), camp.id).toBeLessThan(12);
      expect(world.terrain.waterSurfaceAt(r.x, r.z), camp.id).toBeNull();
    }
  });

  it('keeps every creek and river below its banks, with a shallow line across the Daintree', () => {
    const t = world.terrain;
    for (const c of world.features.creeks) {
      for (let k = 0; k < c.poly.count; k += 8) {
        const x = c.poly.xs[k];
        const z = c.poly.zs[k];
        if (!t.inBounds(x, z)) continue;
        // A little way out from each bank the ground stands above the water.
        const dx = c.poly.zs[Math.min(c.poly.count - 1, k + 1)] - z;
        const dz = x - c.poly.xs[Math.min(c.poly.count - 1, k + 1)];
        const len = Math.hypot(dx, dz) || 1;
        const out = c.halfWidth[k] + 3;
        for (const side of [-1, 1]) {
          const bx = x + (dx / len) * out * side;
          const bz = z + (dz / len) * out * side;
          // (Where two creeks meet the bank can be the other one's water, and a track's
          // ramp into a crossing can dip to the water's edge.)
          const wi = Math.round(bz + t.half) * t.res + Math.round(bx + t.half);
          if (t.inBounds(bx, bz) && t.water[wi] <= NO_WATER && world.features.trackDistance[wi] > 2)
            expect(t.heightAt(bx, bz), `${c.def.id} at ${k}`).toBeGreaterThan(c.water[k] - 0.05);
        }
      }
    }
    // Straight across the Daintree is over a metre deep; the bar downstream is about half that.
    const i = Math.round(1034 + t.half) * t.res + Math.round(-1010 + t.half);
    expect(t.water[i] - t.heights[i]).toBeGreaterThan(0.9);
    const bar = Math.round(1036 + t.half) * t.res + Math.round(-994 + t.half);
    expect(t.water[bar]).toBeGreaterThan(NO_WATER);
    expect(t.water[bar] - t.heights[bar]).toBeLessThan(0.65);
  });

  it('roughs up its roads and tracks after the wet, but not the concrete or the river crossing', () => {
    const t = world.terrain;
    const survey = (id: string) => {
      const track = trackOf(id);
      // Along the left wheel line: how sharply the ground bends (bumps), and the holes crossed.
      let bend = 0;
      let n = 0;
      let holes = 0;
      let inHole = false;
      for (let s = 15; s < track.poly.length - 15; s += 1) {
        const [a, b, c] = [s - 1, s, s + 1].map((k) => {
          const p = trailPoint(track, k, 0.75);
          return t.heightAt(p.x, p.z);
        });
        bend += Math.abs(a - 2 * b + c);
        n++;
        for (const lateral of [-0.75, 0.75]) {
          const p = trailPoint(track, s, lateral);
          const hole = t.holeAt(p.x, p.z) > 0;
          if (hole && !inHole) holes++;
          inHole = hole;
        }
      }
      return { bumps: bend / n, holes, length: track.poly.length };
    };
    const concrete = survey('concrete-descent');
    expect(concrete.holes).toBe(0);
    expect(survey('daintree-crossing').holes).toBe(0);
    for (const id of ['paddock-road', 'creb-ridge', 'bloomfield-track']) {
      const r = survey(id);
      expect(r.bumps, id).toBeGreaterThan(concrete.bumps * 2);
      // A pothole or washout in a wheel line every 50 m or so at least.
      expect(r.holes, id).toBeGreaterThan(r.length / 50);
    }
  });

  const legs: [string, 'both' | 'high', number][] = [
    ['daintree-crossing', 'both', 150],
    ['big-red', 'both', 200],
    ['big-red-bypass', 'both', 400],
    ['roaring-meg-climb', 'both', 200],
    ['bobs-hill', 'both', 200],
    ['concrete-descent', 'both', 300],
    ['donovans-creek', 'both', 200],
    ['bloomfield-bridge', 'high', 60],
  ];
  for (const [id, lockers, limit] of legs)
    it(`drives ${id} in the wet in the short-wheelbase 4WD`, async () => {
      const s = await scene(id, false, lockers, vehicleTuning);
      try {
        const r = await driveLeg(s, s.track, false, limit);
        expect(r.tilt).toBeLessThan(42);
        expect(s.v.condition.flood.stalled).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);

  for (const id of ['big-red', 'bobs-hill'])
    it(`drives ${id} in the wet in the Land Rover Perentie`, async () => {
      const s = await scene(id, false, 'both', perentieTuning);
      try {
        await driveLeg(s, s.track, false, 200);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);
});
