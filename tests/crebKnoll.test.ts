import { describe, expect, it } from 'vitest';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { knollBogs, knollPois } from '../src/data/episodes/crebKnoll';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { driver, steepest } from './helpers/drive';
import { crebWorld } from './world';

/** The knoll play area between Daintree Village and the river (v1.47). */
const world = crebWorld();
const { trackOf } = driver(world);
const t = world.terrain;
const LINES = [
  'knoll-rock-climb',
  'knoll-switchbacks',
  'knoll-side-slope',
  'knoll-drop',
  'knoll-steep-descent',
  'knoll-axle-twisters',
  'knoll-bog-trench',
];

describe('the knoll play area', () => {
  it('rings the knoll with a loop from the village road to the river crossing, level with both', () => {
    const loop = trackOf('knoll-loop');
    for (const [id, s, end] of [
      ['upper-daintree-road', 0, 0],
      ['daintree-crossing', loop.poly.length, 0],
    ] as const) {
      const a = trailPoint(loop, s);
      const other = trackOf(id);
      const at = trailProgress(other, a.x, a.z);
      expect(at.distance, id).toBeLessThan(0.5);
      const b = trailPoint(other, end === 0 ? at.along : other.poly.length);
      expect(Math.abs(t.heightAt(a.x, a.z) - t.heightAt(b.x, b.z)), id).toBeLessThan(0.3);
    }
  });

  it('joins every line to the loop or the summit, level with it, with a sign at each end and a note', () => {
    const loop = trackOf('knoll-loop');
    const summit = crebMap.flats.find((f) => f.id === 'knoll-top')!;
    for (const id of LINES) {
      const line = trackOf(id);
      for (const s of [0, line.poly.length]) {
        const p = trailPoint(line, s);
        const onLoop = trailProgress(loop, p.x, p.z);
        const top = Math.hypot(p.x - summit.x, p.z - summit.z) < summit.radius + 2;
        expect(onLoop.distance < 0.5 || top, `${id}@${s}`).toBe(true);
        if (!top) {
          // The two graded profiles agree where they meet: a line graded higher than the loop
          // left a ridge across the loop that stopped a crawling car (v1.47).
          let k = 0;
          for (let i = 0; i < loop.poly.count; i++)
            if (
              Math.hypot(loop.poly.xs[i] - p.x, loop.poly.zs[i] - p.z) <
              Math.hypot(loop.poly.xs[k] - p.x, loop.poly.zs[k] - p.z)
            )
              k = i;
          const end = s === 0 ? line.profile[0] : line.profile[line.profile.length - 1];
          expect(Math.abs(end - loop.profile[k]), `${id}@${s}`).toBeLessThan(0.1);
          // And the ground across the loop there has no hump: within 1.5 m either side along it.
          const heights = [-1.5, 0, 1.5].map((ds) => {
            const q = trailPoint(loop, onLoop.along + ds);
            return t.heightAt(q.x, q.z);
          });
          const mid = (heights[0] + heights[2]) / 2;
          expect(Math.max(...heights) - mid, `${id}@${s} hump`).toBeLessThan(0.2);
        }
      }
      // A sign at both ends, so a player arriving at the far end knows which way it goes.
      for (const s of [0, line.poly.length]) {
        const end = trailPoint(line, s);
        expect(
          crebMap.props.some((p) => p.kind === 'signpost' && Math.hypot(p.x - end.x, p.z - end.z) < 14),
          `${id} sign @${s.toFixed(0)}`,
        ).toBe(true);
      }
    }
    for (const poi of knollPois) expect(crebEpisode.notes[poi.id], poi.id).toBeDefined();
  });

  it('climbs and drops the faces steeply: the rock climb, the drop and the steep descent', () => {
    expect(steepest(trackOf('knoll-rock-climb'))).toBeGreaterThan(24);
    expect(steepest(trackOf('knoll-steep-descent'))).toBeGreaterThan(26);
    // The drop: the ground falls more than 1.5 m in 3 m below the lip, under a rock band.
    const drop = trackOf('knoll-drop');
    let fall = 0;
    for (let s = 0; s + 3 < drop.poly.length; s += 0.5) {
      const a = trailPoint(drop, s),
        b = trailPoint(drop, s + 3);
      fall = Math.max(fall, t.heightAt(a.x, a.z) - t.heightAt(b.x, b.z));
    }
    expect(fall).toBeGreaterThan(1.5);
    expect(drop.def.stones?.some((st) => st.shape === 'ridge' && st.height >= 0.6)).toBe(true);
  });

  it('turns the switchbacks back on themselves three times', () => {
    const line = trackOf('knoll-switchbacks');
    let hairpins = 0;
    for (let s = 0; s + 25 < line.poly.length;) {
      const a = trailPoint(line, s).headingDeg,
        b = trailPoint(line, s + 25).headingDeg;
      const turn = Math.abs(((b - a + 540) % 360) - 180);
      if (turn > 150) {
        hairpins++;
        s += 30;
      } else s += 1;
    }
    expect(hairpins).toBe(3);
  });

  it('leans the side slope past 18° for most of its flank', () => {
    const line = trackOf('knoll-side-slope');
    let leaning = 0;
    for (let s = 0; s < line.poly.length; s += 1) {
      const l = trailPoint(line, s, -1.2),
        r = trailPoint(line, s, 1.2);
      const lean = (Math.atan2(Math.abs(t.heightAt(r.x, r.z) - t.heightAt(l.x, l.z)), 2.4) * 180) / Math.PI;
      if (lean > 18) leaning++;
    }
    expect(leaning).toBeGreaterThan(40);
  });

  it('sinks the bog trench between walls over a metre high, with deep bogs end to end', () => {
    const line = trackOf('knoll-bog-trench');
    const bogs = knollBogs.filter((b) => b.id.startsWith('knoll-bog-trench'));
    expect(bogs.length).toBeGreaterThanOrEqual(4);
    for (const b of bogs) {
      expect(b.deep, b.id).toBe(true);
      const at = trailProgress(line, b.x, b.z);
      expect(at.distance, b.id).toBeLessThan(0.5);
      const p = trailPoint(line, at.along);
      const h = (p.headingDeg * Math.PI) / 180;
      const out = line.def.width / 2 + 2;
      const road = t.heightAt(p.x, p.z);
      for (const side of [-1, 1])
        expect(
          t.heightAt(p.x + Math.cos(h) * side * out, p.z + Math.sin(h) * side * out) - road,
          `${b.id} wall`,
        ).toBeGreaterThan(1);
    }
    const along = bogs.map((b) => trailProgress(line, b.x, b.z).along).sort((a, b) => a - b);
    expect(along[along.length - 1] - along[0]).toBeGreaterThan(40);
  });

  it('digs the axle twisters under alternate wheels', () => {
    const line = trackOf('knoll-axle-twisters');
    const ruts = line.def.erosion ?? [];
    const holes = ruts.filter((e) => e.depth > 0);
    expect(holes.length).toBeGreaterThanOrEqual(10);
    holes.forEach(
      (e, k) => k > 0 && expect(Math.sign(e.path[0][1])).toBe(-Math.sign(holes[k - 1].path[0][1])),
    );
    expect(ruts.filter((e) => e.depth < 0).length).toBe(holes.length);
  });
});
