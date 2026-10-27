import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { coachEpisode } from '../src/data/episodes/coach';
import { coachMap } from '../src/data/episodes/coachMap';
import { perentieTuning } from '../src/data/perentie';
import { vehicleTuning } from '../src/data/vehicle';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { buildWorld } from '../src/sim/world/world';
import { driveLeg, driver, runLeg, type Lockers } from './helpers/drive';

const world = buildWorld(coachMap);
const dry = environmentAt(coachEpisode.startHour, coachEpisode.weather);
const { trackOf, scene } = driver(world, dry);

/** The route north, on the first line at each fork. */
const route = [
  'range-foot',
  'climb-middle',
  'range-top-south',
  'big-step-line',
  'range-top-north',
  'range-descent',
  'range-exit-road',
];
/** The forks: the lines between the same two points, shortest first, and their signs. */
const forks = [
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
  it('keeps the direct range crossing compact and every track junction level', () => {
    expect([coachMap.width, coachMap.length]).toEqual([1280, 2048]);
    const length = route.reduce((sum, id) => sum + trackOf(id).poly.length, 0);
    expect(length).toBeGreaterThan(1100);
    expect(length).toBeLessThan(1400);
    expect(coachEpisode.deadline).toBeUndefined();
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

  it('splits at two forks, each line leaving and rejoining level, at a sign, with a note', () => {
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
      'range-camp',
      'hotel-site',
      'range-exit',
    ]);
    for (const id of Object.keys(coachEpisode.notes)) expect(ids.has(id), id).toBe(true);
    // Every camp's start position is on level ground, clear of the water.
    for (const camp of world.pois.filter((p) => p.reset)) {
      const r = camp.reset!;
      expect(world.terrain.slopeDegAt(r.x, r.z), camp.id).toBeLessThan(12);
      expect(world.terrain.waterSurfaceAt(r.x, r.z), camp.id).toBeNull();
    }
  });

  it('keeps full-size rock obstacles and a short, technical ridge between them', () => {
    expect(coachMap.creeks).toEqual([]);
    const middle = trackOf('climb-middle');
    expect(middle.def.rockySteps!.map((step) => step.rise)).toEqual([0.7, 0.75, 0.7]);
    expect(trackOf('big-step-line').def.rockySteps).toEqual([{ at: 112, rise: 1.1 }]);
    expect(trackOf('range-descent').def.rockySteps).toHaveLength(4);
    expect(trackOf('range-top-south').poly.length).toBeLessThan(330);
    expect(trackOf('range-top-north').poly.length).toBeLessThan(170);
    expect(trackOf('range-top-south').def.stones!.length).toBeGreaterThan(0);
    for (const track of world.features.tracks) {
      for (let k = 0; k < track.poly.count; k++) {
        expect(Math.abs(track.poly.xs[k])).toBeLessThan(coachMap.wall[0] - 10);
        expect(Math.abs(track.poly.zs[k])).toBeLessThan(coachMap.wall[1] - 10);
      }
    }
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
    ['climb-old-coach', 'both'],
    ['climb-bypass', 'high'],
    ['big-step-line', 'both'],
    ['east-bypass', 'high'],
    ['range-descent', 'both'],
    ['range-top-south', 'both'],
    ['range-top-north', 'both'],
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
