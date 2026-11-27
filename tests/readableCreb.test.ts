import { describe, expect, it } from 'vitest';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { clearWater, depthTone, shallowsOf } from '../src/render/water';
import { trailProgress } from '../src/sim/world/crawlTrail';
import type { ClearWaterDef } from '../src/sim/world/mapTypes';
import { GroundTint } from '../src/sim/world/terrain';
import { wheelMarkSpots } from '../src/sim/world/wheelMarks';
import { crebWorld } from './world';

/**
 * The CREB's three fords with a line to pick can be read from the bank (v2.34): the
 * Daintree's gravel bar, the Little Annan's shallow bar below the road's ford, and the scour
 * hole below the middle creek on the Bloomfield Track. Only what is drawn and said.
 */
const world = crebWorld();
const t = world.terrain;
const creek = (id: string) => crebMap.creeks.find((c) => c.id === id)!;
const track = (id: string) => world.features.tracks.find((x) => x.def.id === id)!;
const depthsOf = (id: string): ClearWaterDef => {
  const c = creek(id).clear;
  return typeof c === 'object' ? c : clearWater;
};
const look = (id: string, x: number, z: number) => {
  const d = t.waterDepthAt(x, z);
  return { depth: d, shallows: shallowsOf(d, depthsOf(id)), tone: depthTone(d, depthsOf(id)) };
};

describe('the CREB’s fords with a line to pick', () => {
  it('asks for clear water at the Daintree, the Little Annan and the middle Bloomfield creek, and nowhere else', () => {
    for (const c of crebMap.creeks)
      expect(!!c.clear, c.id).toBe(['daintree', 'little-annan', 'bloomfield-creek-middle'].includes(c.id));
    const clear = world.features.creekClear!;
    for (const [x, z] of [
      [6, 2236],
      [124, -2466],
      [-82.83, -1399.01],
    ])
      expect(clear[t.index(x, z)], `${x}, ${z}`).toBeGreaterThan(0);
    // Roaring Meg's ford is drawn as it was.
    expect(clear[t.index(35, 508)]).toBe(0);
  });

  it('shows the Daintree’s gravel bar pale and broken, its holes and the river beside it dark', () => {
    const bar = look('daintree', 6, 2236);
    expect(bar.shallows).toBe(1);
    expect(bar.tone).toBeLessThan(0.5);
    expect(t.tintAt(6, 2236)).toBe(GroundTint.Sand);
    for (const [x, z] of [
      [6.5, 2241],
      [0.4, 2218.5],
      [-60, 2240],
    ]) {
      const deep = look('daintree', x, z);
      expect(deep.shallows, `${x}, ${z}`).toBe(0);
      expect(deep.tone, `${x}, ${z}`).toBeGreaterThan(0.9);
    }
  });

  it('shows the Little Annan’s bar pale and broken and the road’s ford dark, with depths of its own', () => {
    // A small river: half a metre is its deep water.
    const d = depthsOf('little-annan');
    expect(d.deepAt).toBeLessThan(clearWater.deepAt);
    const bar = look('little-annan', 124, -2466);
    expect(bar.shallows).toBe(1);
    expect(bar.tone).toBeLessThan(0.3);
    expect(t.tintAt(124, -2466)).toBe(GroundTint.Sand);
    const ford = look('little-annan', 40, -2458);
    expect(ford.shallows).toBe(0);
    expect(ford.tone).toBeGreaterThan(0.8);
  });

  it('shows the scour hole below the middle creek’s ford as a dark patch in pale water', () => {
    const ford = look('bloomfield-creek-middle', -82.83, -1399.01);
    expect(ford.shallows).toBeGreaterThan(0.9);
    expect(ford.tone).toBeLessThan(0.55);
    const hole = look('bloomfield-creek-middle', -87.3, -1395.9);
    expect(hole.depth).toBeGreaterThan(1);
    expect(hole.shallows).toBe(0);
    expect(hole.tone).toBeGreaterThan(0.9);
  });

  it('changes nothing a wheel meets', () => {
    // Depths as they were in v2.33.
    expect(t.waterDepthAt(6, 2236)).toBeCloseTo(0.58, 1);
    expect(t.waterDepthAt(6.5, 2241)).toBeCloseTo(1.05, 1);
    expect(t.waterDepthAt(124, -2466)).toBeCloseTo(0.28, 1);
    expect(t.waterDepthAt(40, -2458)).toBeCloseTo(0.55, 1);
    expect(t.waterDepthAt(-82.83, -1399.01)).toBeCloseTo(0.64, 1);
  });

  it('has worn wheel lines down to the water and up the far bank at each, on dry ground', () => {
    const near = (id: string, from: number, to: number) => {
      const line = track(id);
      const marks = wheelMarkSpots([line], (x, z) => t.waterDepthAt(x, z)).map((m) => ({
        ...m,
        along: trailProgress(line, m.x, m.z).along,
      }));
      for (const m of marks) expect(t.waterDepthAt(m.x, m.z)).toBeLessThanOrEqual(0.02);
      // On the way in: within 4 m of the water. On the way out: the same.
      const before = marks.filter((m) => m.along < from && m.along > from - 30);
      const after = marks.filter((m) => m.along > to && m.along < to + 30);
      expect(before.length, `${id} in`).toBeGreaterThan(40);
      expect(after.length, `${id} out`).toBeGreaterThan(40);
      expect(from - Math.max(...before.map((m) => m.along)), `${id} in`).toBeLessThan(4);
      expect(Math.min(...after.map((m) => m.along)) - to, `${id} out`).toBeLessThan(4);
    };
    // Where each track is under water (metres along it).
    near('daintree-crossing', 64.5, 130);
    near('bloomfield-track', 786.5, 794);
    near('bloomfield-track', 2176.5, 2201.5);
    near('shallow-crossing', 183.5, 196.5);
  });

  it('says how to read each, and not where to steer', () => {
    const steer = /\b(left|right|straight)\b/i;
    for (const id of ['daintree-crossing', 'little-annan', 'bloomfield-creeks']) {
      const note = crebEpisode.notes![id].text;
      expect(note, id).not.toMatch(steer);
      expect(note, id).toMatch(/pale/i);
      expect(note, id).toMatch(/dark/i);
    }
    // The Daintree's note no longer says which way the bar goes.
    expect(crebEpisode.notes!['daintree-crossing'].text).not.toMatch(/curves downstream/i);
  });
});

describe('the CREB’s six plain fords (v2.35)', () => {
  it('have worn wheel lines down to the water and up the far bank, and ordinary water', () => {
    const lines = (id: string) => {
      const line = track(id);
      return wheelMarkSpots([line], (x, z) => t.waterDepthAt(x, z)).map((m) => ({
        ...m,
        along: trailProgress(line, m.x, m.z).along,
      }));
    };
    const edge = (marks: { along: number }[], from: number, to: number, id: string) => {
      const before = marks.filter((m) => m.along < from && m.along > from - 30);
      const after = marks.filter((m) => m.along > to && m.along < to + 30);
      expect(before.length, `${id} in`).toBeGreaterThan(40);
      expect(after.length, `${id} out`).toBeGreaterThan(40);
      expect(from - Math.max(...before.map((m) => m.along)), `${id} in`).toBeLessThan(4);
      expect(Math.min(...after.map((m) => m.along)) - to, `${id} out`).toBeLessThan(4);
    };
    // Where each track is under water (metres along it).
    edge(lines('paddock-road'), 497.5, 503, 'paddock creek south');
    edge(lines('paddock-road'), 897, 903, 'paddock creek north');
    edge(lines('donovans-creek'), 112.5, 119.5, 'Donovan’s');
    edge(lines('bloomfield-track'), 497.5, 503, 'southern creek');
    edge(lines('bloomfield-track'), 1377.5, 1383, 'northern creek');
    // Roaring Meg's ford is where one track ends and the next starts.
    const ridge = track('creb-ridge');
    const down = lines('creb-ridge');
    expect(down.length).toBeGreaterThan(40);
    expect(Math.min(...down.map((m) => m.along))).toBeGreaterThan(ridge.poly.length - 23);
    const up = lines('roaring-meg-climb');
    expect(up.length).toBeGreaterThan(40);
    expect(Math.max(...up.map((m) => m.along))).toBeLessThan(26.5);
    // Every mark anywhere on the CREB is on dry ground.
    for (const m of wheelMarkSpots(world.features.tracks, (x, z) => t.waterDepthAt(x, z)))
      expect(t.waterDepthAt(m.x, m.z)).toBeLessThanOrEqual(0.02);
    // These six are straight, shallow crossings with nothing to read: their water is as it was.
    for (const id of ['paddock-creek-south', 'paddock-creek-north', 'roaring-meg', 'donovans'])
      expect(creek(id).clear, id).toBeUndefined();
  });
});
