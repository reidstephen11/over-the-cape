import { describe, expect, it } from 'vitest';
import { episodeOrder, episodes } from '../src/data/episodes';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import { telegraphNorthMap } from '../src/data/episodes/telegraphNorthMap';
import {
  CANAL_AIM_SIGN,
  CANAL_MARKERS,
  CYPRESS_SPAN,
  LONG_DRIVE_BOG_ANCHORS,
  NOLANS_AIM_SIGN,
  NOLANS_MARKER,
  NOLANS_TURN_SIGN,
  canalGullies,
  cypressDeck,
  longDriveBog,
  mistakeWashout,
} from '../src/data/episodes/telegraphNorthRoute';
import { maps } from '../src/data/maps';
import { conditionById, conditionFor, stormFor } from '../src/data/trackConditions';
import { weatherAt } from '../src/data/weatherTimeline';
import { deckStripsAt } from '../src/sim/world/bridges';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { riseShare } from '../src/sim/world/flood';
import { steepest } from './helpers/drive';
import { telegraphNorthWorld } from './world';

/** Episode 3, the northern Telegraph Track (v2.17): the map's layout and the episode's facts. */
const world = telegraphNorthWorld();
const t = world.terrain;
const ep = telegraphNorthEpisode;
const track = (id: string) => world.features.tracks.find((x) => x.def.id === id)!;

/** The main route, south to north. */
const ROUTE = [
  'turnoff-road',
  'canal-creek',
  'canal-sam',
  'sam-crossing',
  'sam-mistake',
  'mistake-creek',
  'mistake-cannibal',
  'cannibal-crossing',
  'cannibal-cypress',
  'cypress-bridge',
  'long-drive',
  'nolans-brook',
];

describe('the northern Telegraph Track map', () => {
  it('is a 1 × 2 km strip in multiples of 256 m, with the camps inside the wall', () => {
    expect(telegraphNorthMap.width).toBe(1024);
    expect(telegraphNorthMap.length).toBe(2048);
    expect(maps.telegraphNorth.def).toBe(telegraphNorthMap);
    for (const p of telegraphNorthMap.pois) {
      expect(Math.abs(p.x), p.id).toBeLessThan(telegraphNorthMap.wall[0]);
      expect(Math.abs(p.z), p.id).toBeLessThan(telegraphNorthMap.wall[1]);
    }
  });

  it('joins the route end to end, about 2 km from the turn-off to Nolans Brook camp', () => {
    let length = 0;
    for (let k = 0; k < ROUTE.length; k++) {
      const a = track(ROUTE[k]);
      length += a.poly.length;
      if (k === 0) continue;
      const prev = track(ROUTE[k - 1]);
      const end = trailPoint(prev, prev.poly.length);
      const start = trailPoint(a, 0);
      expect(Math.hypot(end.x - start.x, end.z - start.z), `${ROUTE[k - 1]} → ${ROUTE[k]}`).toBeLessThan(0.5);
      expect(
        Math.abs(t.heightAt(end.x, end.z) - t.heightAt(start.x, start.z)),
        `${ROUTE[k - 1]} → ${ROUTE[k]}`,
      ).toBeLessThan(0.3);
    }
    expect(length).toBeGreaterThan(1900);
    expect(length).toBeLessThan(2400);
    const spawn = telegraphNorthMap.pois.find((p) => p.id === telegraphNorthMap.spawnCampsite)!;
    const goal = telegraphNorthMap.pois.find((p) => p.id === ep.goal)!;
    const first = trailPoint(track('turnoff-road'), 0);
    const last = trailPoint(track('nolans-brook'), track('nolans-brook').poly.length);
    expect(Math.hypot(first.x - spawn.x, first.z - spawn.z)).toBeLessThan(spawn.radius);
    expect(Math.hypot(last.x - goal.x, last.z - goal.z)).toBeLessThan(goal.radius);
  });

  it('has one camp between the ends, at Cannibal Creek, past half-way', () => {
    const camps = telegraphNorthMap.pois.filter((p) => p.kind === 'campsite').map((p) => p.id);
    expect(camps).toEqual(['bamaga-turnoff', 'cannibal-camp', 'nolans-camp']);
    let before = 0;
    for (const id of ROUTE.slice(0, ROUTE.indexOf('cannibal-cypress'))) before += track(id).poly.length;
    const total = ROUTE.reduce((sum, id) => sum + track(id).poly.length, 0);
    expect(before / total).toBeGreaterThan(0.45);
    expect(before / total).toBeLessThan(0.65);
  });

  it('gives Canal Creek a shelf to cross on, a winding exit to the left and a washed-out one to the right', () => {
    const line = track('canal-creek');
    let deepest = 0;
    for (let s = 0; s < line.poly.length; s += 0.5) {
      const p = trailPoint(line, s);
      deepest = Math.max(deepest, t.waterDepthAt(p.x, p.z));
    }
    expect(deepest).toBeGreaterThan(0.5);
    expect(deepest).toBeLessThan(0.7);
    // Off the shelf the bed drops away.
    expect(t.waterDepthAt(8, 612)).toBeGreaterThan(1);
    const old = track('canal-old-exit');
    // The two exits part at the far water's edge and meet again on the plain.
    const a = trailPoint(old, 0);
    expect(trailProgress(line, a.x, a.z).distance).toBeLessThan(0.5);
    const b = trailPoint(old, old.poly.length);
    const end = trailPoint(line, line.poly.length);
    expect(Math.hypot(b.x - end.x, b.z - end.z)).toBeLessThan(0.5);
    // The winding exit goes left (west) of the old one.
    const mid = trailPoint(line, line.poly.length - 35);
    expect(mid.x).toBeLessThan(trailPoint(old, old.poly.length / 2).x - 10);
    expect(old.def.erosion).toBe(canalGullies);
    for (const g of canalGullies) {
      expect(g.depth).toBeGreaterThanOrEqual(0.9);
      expect(g.ramp).toBe(0);
      // Right across the track: no wheel line misses it.
      expect(Math.min(g.path[0][1], g.path[1][1])).toBeLessThan(-1.6);
      expect(Math.max(g.path[0][1], g.path[1][1])).toBeGreaterThan(1.6);
    }
    expect(telegraphNorthMap.props.some((p) => p.kind === 'signpost' && /exit left/.test(p.text ?? ''))).toBe(
      true,
    );
    // v2.19: two rocks at the near water's edge, one either side of the shelf's line and
    // clear of the widest car, and a sign on the far bank straight across to aim at.
    expect(CANAL_MARKERS.map(([x]) => Math.sign(x + 0.5))).toEqual([-1, 1]);
    for (const [x, z] of CANAL_MARKERS) {
      expect(Math.abs(x + 0.5) - 0.55, 'clear of the track').toBeGreaterThan(1.7);
      expect(t.waterDepthAt(x, z)).toBeLessThan(0.3);
      expect(telegraphNorthMap.boulders.some((b) => b.x === x && b.z === z && !b.anchor)).toBe(true);
    }
    const aim = telegraphNorthMap.props.find((p) => p.kind === 'signpost' && /Aim here/.test(p.text ?? ''))!;
    expect([aim.x, aim.z]).toEqual([...CANAL_AIM_SIGN]);
    expect(Math.abs(aim.x + 0.5)).toBeLessThan(2);
    expect(aim.z).toBeLessThan(604);
    // Dry ground, off both exits.
    expect(t.waterDepthAt(aim.x, aim.z)).toBe(0);
    for (const id of ['canal-creek', 'canal-old-exit'])
      expect(trailProgress(track(id), aim.x, aim.z).distance, id).toBeGreaterThan(2.2);
    // Right beside the shelf the water is half a metre and more deeper than on it.
    expect(t.waterDepthAt(4.5, 612) - t.waterDepthAt(-0.5, 612)).toBeGreaterThan(0.5);
    expect(t.waterDepthAt(-5.5, 613) - t.waterDepthAt(-0.5, 612)).toBeGreaterThan(0.5);
  });

  it('makes Mistake Creek’s way in steep and eroded, and its way out easy', () => {
    const line = track('mistake-creek');
    expect(steepest(line, 5)).toBeGreaterThan(26);
    expect(line.def.erosion).toContain(mistakeWashout);
    expect(mistakeWashout.depth).toBeGreaterThan(0.9);
    // The hole is off the wheel line on the right: a wheel at 0.8 m clears its edge.
    expect(Math.min(...mistakeWashout.path.map((p) => p[1])) - mistakeWashout.width / 2).toBeGreaterThan(1);
    expect(line.def.cant?.some(([, deg]) => deg >= 6)).toBe(true);
    expect(line.def.cant?.some(([, deg]) => deg <= -6)).toBe(true);
    // Out: nowhere steeper than 18° over 5 m beyond the creek.
    let out = 0;
    for (let s = 34; s + 5 < line.poly.length; s += 0.5) {
      const p = trailPoint(line, s),
        q = trailPoint(line, s + 5);
      out = Math.max(out, (Math.atan((t.heightAt(q.x, q.z) - t.heightAt(p.x, p.z)) / 5) * 180) / Math.PI);
    }
    expect(out).toBeLessThan(18);
  });

  it('keeps Sam and Cannibal Creeks easy: ankle deep, gentle banks', () => {
    for (const id of ['sam-crossing', 'cannibal-crossing']) {
      const line = track(id);
      let deepest = 0;
      for (let s = 0; s < line.poly.length; s += 0.5) {
        const p = trailPoint(line, s);
        deepest = Math.max(deepest, t.waterDepthAt(p.x, p.z));
      }
      expect(deepest, id).toBeGreaterThan(0.15);
      expect(deepest, id).toBeLessThan(0.45);
      expect(steepest(line, 4), id).toBeLessThan(18);
    }
    // Sam Creek's swimming holes, downstream of the crossing.
    expect(t.waterDepthAt(-24, 334.5)).toBeGreaterThan(1);
  });

  it('carries the track over Cypress Creek on a log bridge with three holes and no way round', () => {
    const line = track('cypress-bridge');
    expect(line.def.bridges).toEqual([cypressDeck]);
    const [from, to] = CYPRESS_SPAN;
    expect(to - from).toBeGreaterThan(20);
    expect(cypressDeck.kerb).toBe(0);
    const gaps = cypressDeck.gaps!;
    expect(gaps).toHaveLength(3);
    // Right, then left, then one down the middle narrow enough to straddle.
    expect(gaps[0].left).toBeGreaterThan(0);
    expect(gaps[1].right).toBeLessThan(0);
    expect(gaps[2].right - gaps[2].left).toBeLessThan(0.7);
    // Every hole leaves a strip the Unimog (2.18 m over its tyres) fits on.
    for (const g of gaps.slice(0, 2)) {
      const strips = deckStripsAt(cypressDeck, (g.from + g.to) / 2);
      expect(Math.max(...strips.map(([l, r]) => r - l))).toBeGreaterThan(2.4);
    }
    // A long wheelbase (3.2 m) is clear of one hole before the next.
    expect(gaps[1].from - gaps[0].to).toBeGreaterThan(5);
    expect(gaps[2].from - gaps[1].to).toBeGreaterThan(5);
    // The creek under it is too deep and steep-sided to ford.
    const mid = trailPoint(line, (from + to) / 2);
    expect(t.waterDepthAt(mid.x, mid.z)).toBeGreaterThan(0.9);
    expect(t.heightAt(mid.x, mid.z)).toBeLessThan(40 - 3.5);
  });

  it('lays a bog across the right of the long drive, with firm ground along its left', () => {
    const line = track('long-drive');
    const near = trailProgress(line, longDriveBog.x, longDriveBog.z);
    // Its middle is right of the centreline, and its left edge is short of the left wheels' line.
    expect(near.distance).toBeGreaterThan(1.2);
    expect(near.distance - longDriveBog.radiusX).toBeGreaterThan(-0.9);
    expect(telegraphNorthMap.bogs).toContain(longDriveBog);
    // v2.20: a rock to winch to before the bog and one past it, each on firm ground left of
    // the track and off it. From anywhere in the bog one of them is within the cable's 29 m
    // ahead and the other behind.
    const rocks = world.rockGrid
      .near(longDriveBog.x, longDriveBog.z, 40)
      .filter((r) => r.anchor && r.solid)
      .map((r) => ({ r, on: trailProgress(line, r.x, r.z) }));
    expect(rocks.map(({ on }) => Math.round(on.along)).sort((a, b) => a - b)).toEqual([
      ...LONG_DRIVE_BOG_ANCHORS,
    ]);
    for (const { r, on } of rocks) {
      expect(on.distance - r.radius, 'off the track').toBeGreaterThan(line.def.width / 2 + 0.6);
      expect(Math.hypot(r.x - longDriveBog.x, r.z - longDriveBog.z)).toBeGreaterThan(
        longDriveBog.radiusZ + 4,
      );
      for (const end of [-1, 1]) {
        const p = trailPoint(line, near.along + end * longDriveBog.radiusZ);
        expect(Math.hypot(r.x - p.x, r.z - p.z), 'in reach from either end').toBeLessThan(29);
      }
    }
    // Both are on the left, the firm side; the bog is on the right.
    const side = (x: number, z: number) => {
      const p = trailPoint(line, near.along);
      const q = trailPoint(line, near.along + 1);
      return (q.x - p.x) * (z - p.z) - (q.z - p.z) * (x - p.x);
    };
    const bogSide = Math.sign(side(longDriveBog.x, longDriveBog.z));
    for (const { r } of rocks) expect(Math.sign(side(r.x, r.z))).toBe(-bogSide);
  });

  it('makes Nolans Brook wide and deep in the middle, with a shoal to the right', () => {
    const line = track('nolans-brook');
    let deepest = 0,
      wet = 0;
    for (let s = 0; s < line.poly.length; s += 0.5) {
      const p = trailPoint(line, s);
      const d = t.waterDepthAt(p.x, p.z);
      deepest = Math.max(deepest, d);
      if (d > 0.3) wet++;
    }
    // The line: about 0.55 m all the way, over 30 m of water.
    expect(deepest).toBeGreaterThan(0.45);
    expect(deepest).toBeLessThan(0.7);
    expect(wet * 0.5).toBeGreaterThan(30);
    // The straight line: about a metre and a half, and deeper where wheels have dug it out.
    expect(t.waterDepthAt(-8, -866)).toBeGreaterThan(1.3);
    expect(t.waterDepthAt(-1, -873)).toBeGreaterThan(2);
    // The shoal is upstream (east) of the straight line: the current pushes a car off it, to the west.
    const creek = telegraphNorthMap.creeks.find((c) => c.id === 'nolans-brook')!;
    expect(creek.points[0].x).toBeGreaterThan(creek.points[creek.points.length - 1].x);
    expect(trailPoint(line, 60).x).toBeGreaterThan(12);
  });

  it('marks Nolans Brook’s line with a rock on the near bank and a sign on the far one (v2.20)', () => {
    const [mx, mz] = NOLANS_MARKER;
    const [sx, sz] = NOLANS_AIM_SIGN;
    const line = track('nolans-brook');
    // The rock: at the near water's edge, dry on the day's own level and within 2 m of the
    // water, not an anchor, and well off the way in.
    expect(telegraphNorthMap.boulders.some((b) => b.x === mx && b.z === mz && !b.anchor)).toBe(true);
    expect(t.waterDepthAt(mx, mz)).toBe(0);
    expect(t.waterDepthAt(mx, mz - 2)).toBeGreaterThan(0);
    expect(trailProgress(line, mx, mz).distance).toBeGreaterThan(8);
    // A sign above the rock, on dry ground behind it, facing west along the bank.
    const turn = telegraphNorthMap.props.find(
      (p) => p.kind === 'signpost' && /Turn across/.test(p.text ?? ''),
    )!;
    expect([turn.x, turn.z]).toEqual([...NOLANS_TURN_SIGN]);
    expect(turn.headingDeg).toBe(270);
    expect(Math.hypot(turn.x - mx, turn.z - mz)).toBeLessThan(3);
    expect(t.heightAt(turn.x, turn.z)).toBeGreaterThan(t.heightAt(mx, mz));
    // The sign: on dry ground on the far bank, beside the way out and off it.
    const aim = telegraphNorthMap.props.find(
      (p) => p.kind === 'signpost' && /Aim here from/.test(p.text ?? ''),
    )!;
    expect([aim.x, aim.z]).toEqual([sx, sz]);
    expect(t.waterDepthAt(sx, sz)).toBe(0);
    const off = trailProgress(line, sx, sz).distance;
    expect(off).toBeGreaterThan(2.2);
    expect(off).toBeLessThan(4);
    // From the rock straight to the way out beside the sign is on the shoal all the way:
    // never deeper than 0.7 m, and over a metre deeper 12 m downstream of it.
    const exitX = trailPoint(line, trailProgress(line, sx, sz).along).x;
    expect(Math.abs(exitX - mx)).toBeLessThan(1);
    for (let z = mz - 2; z > sz + 8; z -= 1) {
      expect(t.waterDepthAt(mx, z), `z ${z}`).toBeLessThan(0.7);
    }
    expect(t.waterDepthAt(mx - 18, -873) - t.waterDepthAt(mx, -873)).toBeGreaterThan(0.8);
    // And so is the way to the rock: along the near bank, 6 to 8 m out from the water's edge.
    for (let x = 0; x <= mx; x += 1) expect(t.waterDepthAt(x, -857), `x ${x}`).toBeLessThan(0.7);
  });

  it('stands a line of surviving telegraph poles, leaning and off the track', () => {
    const poles = telegraphNorthMap.props.filter((p) => p.kind === 'powerPole');
    expect(poles.length).toBeGreaterThanOrEqual(8);
    for (const p of poles) expect(p.lean).toBeGreaterThan(0);
  });
});

describe('the northern Telegraph Track episode', () => {
  it('is episode 3 on its own map, with a lean load, one camp and a note for every place', () => {
    expect(episodes.telegraphNorth).toBe(ep);
    expect(episodeOrder).toEqual(['creb', 'telegraph', 'telegraphNorth']);
    expect(ep.number).toBe(3);
    expect(ep.mapId).toBe('telegraphNorth');
    expect(ep.loadout).toEqual({ fuel: 16, jerryCans: 0, spares: 1, plugs: 2 });
    expect(ep.briefing.length).toBeLessThanOrEqual(4);
    for (const p of telegraphNorthMap.pois)
      if (p.id !== 'nolans-camp') expect(ep.notes[p.id], p.id).toBeDefined();
    for (const id of ep.timedSections ?? []) expect(track(id), id).toBeDefined();
  });

  it('starts fine, with rain from 3 pm that a clean run beats to Nolans Brook', () => {
    const storm = ep.storm!;
    expect(weatherAt(storm, ep.startHour).rain).toBe(0);
    // 15 real minutes of driving: there as the first showers arrive, before the brook has risen.
    const arrive = ep.startHour + (15 * 60 * ep.clockRate) / 3600;
    expect(arrive).toBeLessThan(15.5);
    expect(weatherAt(storm, arrive).creekRise).toBeLessThan(0.03);
    expect(weatherAt(storm, 17).rain).toBe(1);
    expect(ep.deadline!.hour).toBeGreaterThan(18);
  });

  it('raises Nolans Brook with the rain, by the rolled day, and the small creeks a third as much', () => {
    const storm = ep.storm!;
    const at = (id: 'dry' | 'reopened' | 'wet', hour: number) =>
      weatherAt(stormFor(storm, conditionFor(conditionById(id), ep.conditions)), hour).creekRise;
    // At the start: lower in the dry, higher in the wet.
    expect(at('dry', ep.startHour)).toBeCloseTo(-0.1, 2);
    expect(at('reopened', ep.startHour)).toBe(0);
    expect(at('wet', ep.startHour)).toBeCloseTo(0.15, 2);
    // The commonest day: about 0.15 m up by 4:30 pm, over 0.3 m by 5:30 pm, still rising at dark.
    expect(at('reopened', 16.5)).toBeGreaterThan(0.1);
    expect(at('reopened', 16.5)).toBeLessThan(0.25);
    expect(at('reopened', 17.5)).toBeGreaterThan(0.3);
    expect(at('reopened', 18.25)).toBeGreaterThan(at('reopened', 17.5));
    // The wet day rises faster and further; the dry day less.
    expect(at('wet', 17.5) - at('wet', ep.startHour)).toBeGreaterThan(at('reopened', 17.5));
    expect(at('dry', 17.5) - at('dry', ep.startHour)).toBeLessThan(at('reopened', 17.5));
    // Nolans Brook takes the whole rise; the creeks before it about a third.
    const share = (x: number, z: number) => riseShare(world, t.index(x, z));
    expect(share(16, -872)).toBe(1);
    expect(share(0, 612)).toBeCloseTo(0.35, 2);
    expect(share(0, -424)).toBeCloseTo(0.35, 2);
    for (const id of Object.keys(storm.creeks.shares ?? {}))
      expect(
        telegraphNorthMap.creeks.some((c) => c.id === id),
        id,
      ).toBe(true);
  });
});
