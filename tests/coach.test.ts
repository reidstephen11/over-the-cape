import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { coachEpisode } from '../src/data/episodes/coach';
import { coachMap } from '../src/data/episodes/coachMap';
import { perentieTuning } from '../src/data/perentie';
import { SurfaceId } from '../src/data/surfaces';
import { vehicleTuning } from '../src/data/vehicle';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { NO_WATER } from '../src/sim/world/terrain';
import { buildWorld } from '../src/sim/world/world';
import { driveLeg, driver, runLeg, type Lockers } from './helpers/drive';

const world = buildWorld(coachMap);
const dry = environmentAt(coachEpisode.startHour, coachEpisode.weather);
const { trackOf, scene } = driver(world, dry);

/** The route north, on the first line at each fork. */
const route = [
  'palmer-camp-road',
  'palmer-crossing',
  'maytown-road',
  'coach-road-south',
  'north-palmer-sand',
  'range-foot',
  'climb-middle',
  'range-top-south',
  'big-step-line',
  'range-top-north',
  'range-descent',
  'coach-road-north',
  'little-laura-crossing',
  'laura-road',
];
/** The forks: the lines between the same two points, shortest first, and their signs. */
const forks = [
  { id: 'north-palmer', lines: ['north-palmer-sand', 'north-palmer-rocky'], signs: ['Rocky crossing'] },
  {
    id: 'range-face',
    lines: ['climb-middle', 'climb-old-coach', 'climb-bypass'],
    signs: ['Old coach road', 'Bypass'],
  },
  { id: 'big-step', lines: ['big-step-line', 'east-bypass'], signs: ['Eastern track'] },
];
const ends = (id: string) => {
  const t = trackOf(id);
  return [trailPoint(t, 0), trailPoint(t, t.poly.length)];
};

describe('Episode 2: the Old Coach Road', () => {
  it('is a long, narrow map with about 7 km of road from the Palmer River to Laura', () => {
    expect([coachMap.width, coachMap.length]).toEqual([1280, 7168]);
    const length = route.reduce((sum, id) => sum + trackOf(id).poly.length, 0);
    expect(length).toBeGreaterThan(6800);
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

  it('splits at three forks, each line leaving and rejoining level, at a sign, with a note', () => {
    for (const fork of forks) {
      const [start, end] = ends(fork.lines[0]);
      const lengths = fork.lines.map((id) => trackOf(id).poly.length);
      for (const id of fork.lines) {
        const t = trackOf(id);
        const [a, b] = ends(id);
        expect(Math.hypot(a.x - start.x, a.z - start.z), id).toBeLessThan(0.01);
        expect(Math.hypot(b.x - end.x, b.z - end.z), id).toBeLessThan(0.01);
        const first = trackOf(fork.lines[0]);
        expect(Math.abs(t.profile[0] - first.profile[0]), id).toBeLessThan(0.15);
        expect(
          Math.abs(t.profile[t.profile.length - 1] - first.profile[first.profile.length - 1]),
          id,
        ).toBeLessThan(0.15);
      }
      // Each line is a good deal longer than the one before it.
      for (let k = 1; k < lengths.length; k++)
        expect(lengths[k], fork.id).toBeGreaterThan(lengths[k - 1] * 1.2);
      // A sign for each other line stands near the split, clear of every line.
      for (const text of fork.signs) {
        const sign = coachMap.props.find((p) => p.kind === 'signpost' && p.text === text)!;
        expect(Math.hypot(sign.x - start.x, sign.z - start.z), text).toBeLessThan(16);
        for (const id of fork.lines) {
          const t = trackOf(id);
          expect(trailProgress(t, sign.x, sign.z).distance, `${text} by ${id}`).toBeGreaterThan(
            t.def.width / 2 + 1,
          );
        }
      }
      expect(world.pois.some((p) => p.id === fork.id)).toBe(true);
      expect(coachEpisode.notes[fork.id], fork.id).toBeDefined();
    }
  });

  it('climbs the range face steepest up the middle, then the old coach road, then the bypass', () => {
    const steepest = (id: string) => {
      const t = trackOf(id);
      let worst = 0;
      for (let k = 0; k + 4 < t.profile.length; k++)
        worst = Math.max(
          worst,
          (t.profile[k + 4] - t.profile[k]) / Math.max(0.1, t.poly.s[k + 4] - t.poly.s[k]),
        );
      return (Math.atan(worst) * 180) / Math.PI;
    };
    const [middle, old, bypass] = ['climb-middle', 'climb-old-coach', 'climb-bypass'].map(steepest);
    expect(middle).toBeGreaterThan(24);
    expect(old).toBeLessThan(middle - 4);
    expect(bypass).toBeLessThan(old - 3);
    expect(bypass).toBeLessThan(13);
  });

  it('has its goal, camps and history notes on the map', () => {
    const ids = new Set(world.pois.map((p) => p.id));
    expect(world.pois.find((p) => p.id === coachEpisode.goal)!.kind).toBe('campsite');
    expect(world.pois.filter((p) => p.kind === 'campsite').map((p) => p.id)).toEqual([
      'palmer-camp',
      'maytown',
      'hotel-site',
      'laura',
    ]);
    for (const id of Object.keys(coachEpisode.notes)) expect(ids.has(id), id).toBe(true);
    // Every camp's start position is on level ground, clear of the water.
    for (const camp of world.pois.filter((p) => p.reset)) {
      const r = camp.reset!;
      expect(world.terrain.slopeDegAt(r.x, r.z), camp.id).toBeLessThan(12);
      expect(world.terrain.waterSurfaceAt(r.x, r.z), camp.id).toBeNull();
    }
  });

  it('keeps its rivers below their banks, low in shallow channels over wide beds of sand', () => {
    const t = world.terrain;
    for (const c of world.features.creeks) {
      for (let k = 0; k < c.poly.count; k += 8) {
        const x = c.poly.xs[k];
        const z = c.poly.zs[k];
        if (!t.inBounds(x, z)) continue;
        const dx = c.poly.zs[Math.min(c.poly.count - 1, k + 1)] - z;
        const dz = x - c.poly.xs[Math.min(c.poly.count - 1, k + 1)];
        const len = Math.hypot(dx, dz) || 1;
        for (const side of [-1, 1]) {
          const bx = x + (dx / len) * (c.halfWidth[k] + 3) * side;
          const bz = z + (dz / len) * (c.halfWidth[k] + 3) * side;
          const wi = t.index(bx, bz);
          if (t.inBounds(bx, bz) && t.water[wi] <= NO_WATER && world.features.trackDistance[wi] > 2)
            expect(t.heightAt(bx, bz), `${c.def.id} at ${k}`).toBeGreaterThan(c.water[k] - 0.05);
        }
      }
    }
    // Each crossing runs through soft sand either side of a shallow channel.
    for (const id of ['palmer-crossing', 'north-palmer-sand', 'little-laura-crossing']) {
      const track = trackOf(id);
      let sand = 0;
      let deepest = 0;
      for (let s = 0; s <= track.poly.length; s += 1) {
        const p = trailPoint(track, s);
        if (t.surfaceAt(p.x, p.z) === SurfaceId.Sand) sand++;
        deepest = Math.max(deepest, t.waterDepthAt(p.x, p.z));
      }
      expect(sand, id).toBeGreaterThan(20);
      expect(deepest, id).toBeGreaterThan(0.15);
      expect(deepest, id).toBeLessThan(0.5);
    }
  });

  it('lays sand in the dry creeks on the road north, and termite mounds in the woodland clear of the road', () => {
    const t = world.terrain;
    const north = trackOf('coach-road-north');
    for (const [from, to] of north.def.sand!) {
      const p = trailPoint(north, (from + to) / 2);
      expect(t.surfaceAt(p.x, p.z)).toBe(SurfaceId.Sand);
      // The creek bed is a dip in the road.
      const before = trailPoint(north, from - 25);
      expect(t.heightAt(before.x, before.z) - t.heightAt(p.x, p.z)).toBeGreaterThan(0.4);
    }
    const mounds = world.scatter.rocks.filter((r) => r.mound);
    // About six to the hectare on the open ground of a 92 ha strip less its border hills.
    expect(mounds.length).toBeGreaterThan(1000);
    for (const m of mounds)
      expect(world.features.trackDistance[t.index(m.x, m.z)], `${m.x},${m.z}`).toBeGreaterThan(2);
    // Mostly knee to waist high, a few taller than a person; they collide.
    const heights = mounds.map((m) => 2 * m.radius * m.squash);
    expect(Math.max(...heights)).toBeGreaterThan(2.2);
    expect(heights.filter((h) => h < 1.5).length).toBeGreaterThan(mounds.length / 2);
    expect(mounds.every((m) => !m.solid || Math.abs(m.x) < coachMap.wall[0] + 2)).toBe(true);
  });

  it('leaves the ruins of Maytown: the baker’s oven, chimneys, kerbing, a rebuilt hut and the cemetery', () => {
    const maytown = world.pois.find((p) => p.id === 'maytown')!;
    const near = coachMap.props.filter((p) => Math.hypot(p.x - maytown.x, p.z - maytown.z) < 150);
    const count = (kind: string) => near.filter((p) => p.kind === kind).length;
    expect(count('bakerOven')).toBe(1);
    expect(count('chimney')).toBeGreaterThanOrEqual(2);
    expect(count('stoneKerb')).toBe(2);
    expect(count('hut')).toBe(1);
    expect(count('headstone')).toBeGreaterThanOrEqual(6);
    // The props stand clear of the road.
    for (const p of near.filter((q) => q.kind !== 'stoneKerb' && q.kind !== 'signpost'))
      expect(trailProgress(trackOf('maytown-road'), p.x, p.z).distance, p.kind).toBeGreaterThan(8);
  });

  const realistic = async (id: string, lockers: Lockers, tuning = vehicleTuning, limit = 300) => {
    const s = await scene(id, false, lockers, tuning);
    s.sim.damage = 'realistic';
    try {
      const r = await runLeg(s, s.track, false, limit);
      return { ...r, tyres: s.v.condition.tyres };
    } finally {
      s.sim.physics.free();
    }
  };

  for (const tuning of [vehicleTuning, perentieTuning])
    it(`stops the ${tuning.name} on the middle line in high range or with the diffs open, and climbs it with both lockers`, async () => {
      for (const lockers of ['high', 'open'] as const) {
        const r = await realistic('climb-middle', lockers, tuning, 200);
        expect(r.done, lockers).toBe(false);
        // Spinning on the rock cuts the tyres.
        expect(Math.min(...r.tyres), lockers).toBeLessThan(1);
      }
      const r = await realistic('climb-middle', 'both', tuning);
      expect(r.done).toBe(true);
      expect(Math.min(...r.tyres)).toBe(1);
    }, 900_000);

  const lines: [string, Lockers][] = [
    ['palmer-crossing', 'high'],
    ['north-palmer-sand', 'high'],
    ['north-palmer-rocky', 'both'],
    ['climb-old-coach', 'both'],
    ['climb-bypass', 'high'],
    ['big-step-line', 'both'],
    ['east-bypass', 'high'],
    ['range-descent', 'both'],
    ['little-laura-crossing', 'high'],
  ];
  for (const [id, lockers] of lines)
    it(`drives ${id} in the dry in the short-wheelbase 4WD`, async () => {
      const s = await scene(id, false, lockers, vehicleTuning);
      try {
        const r = await driveLeg(s, s.track, false, 700);
        expect(r.tilt).toBeLessThan(48);
        expect(s.v.condition.flood.stalled).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);
});
