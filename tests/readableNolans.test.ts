import { describe, expect, it } from 'vitest';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import { telegraphNorthMap } from '../src/data/episodes/telegraphNorthMap';
import { NOLANS_MARKER } from '../src/data/episodes/telegraphNorthRoute';
import { telegraphNorthWeather } from '../src/data/episodes/telegraphNorthWeather';
import { SurfaceId } from '../src/data/surfaces';
import { weatherAt } from '../src/data/weatherTimeline';
import { clearLeft, depthTone, shallowsOf } from '../src/render/water';
import { trailProgress } from '../src/sim/world/crawlTrail';
import { GroundTint } from '../src/sim/world/terrain';
import { WHEEL_MARK_HALF_GAUGE, wheelMarkSpots } from '../src/sim/world/wheelMarks';
import { telegraphNorthWorld } from './world';

/**
 * Nolans Brook can be read from the bank (v2.32): clear water over the shoal that breaks as
 * it runs, dark water where it is deep, and worn wheel lines down to the water and up the far
 * bank. The two steering signs are gone; the big rock stays. Only what is drawn and said: the
 * brook drives as it did.
 */
const world = telegraphNorthWorld();
const t = world.terrain;
const line = world.features.tracks.find((x) => x.def.id === 'nolans-brook')!;
const creek = telegraphNorthMap.creeks.find((c) => c.id === 'nolans-brook')!;

describe('Nolans Brook, read from the bank', () => {
  it('asks for clear water, and its shoal and its deep are both marked for it', () => {
    expect(creek.clear).toBe(true);
    const clear = world.features.creekClear!;
    for (const [x, z] of [
      [16, -872],
      [5, -857],
      [-1, -873],
      [30, -870],
    ])
      expect(clear[t.index(x, z)], `${x}, ${z}`).toBe(1);
  });

  it('shows the shoal pale and broken, and the dug-out straight line dark', () => {
    // The shoal, half a metre down: shallows in full, under half-way to the deep colour.
    for (const [x, z] of [
      [16, -872],
      [5, -857],
      [18, -880],
    ]) {
      const d = t.waterDepthAt(x, z);
      expect(shallowsOf(d), `${x}, ${z}`).toBe(1);
      expect(depthTone(d, true), `${x}, ${z}`).toBeLessThan(0.45);
    }
    // The old straight line, dug out by wheels, and the brook either side of the shoal.
    for (const [x, z] of [
      [-1, -873],
      [-1, -882],
      [-10, -870],
      [30, -870],
    ]) {
      const d = t.waterDepthAt(x, z);
      expect(shallowsOf(d), `${x}, ${z}`).toBe(0);
      expect(depthTone(d, true), `${x}, ${z}`).toBe(1);
    }
  });

  it('has a pale bed on the shoal and in the shallows, and a dark one under the deep', () => {
    // Without this the brook's sand shows pale through the deep water too.
    for (const [x, z] of [
      [16, -872],
      [5, -857],
      [18, -880],
      [10, -851],
    ])
      expect(t.tintAt(x, z), `${x}, ${z}`).toBe(GroundTint.Sand);
    for (const [x, z] of [
      [-1, -873],
      [-10, -870],
      [30, -870],
    ])
      expect(t.tintAt(x, z), `${x}, ${z}`).toBe(GroundTint.CreekBed);
    // Sam Creek and the other sand creeks are not clear, and keep their sand.
    expect(t.tintAt(2, 332)).not.toBe(GroundTint.CreekBed);
  });

  it('is easy to read before the rain, faint by five and gone soon after', () => {
    const left = (hour: number) => clearLeft(weatherAt(telegraphNorthWeather, hour).creekRise);
    // Nolans takes the whole of the storm's rise (the other creeks a third).
    expect(telegraphNorthWeather.creeks.shares?.['nolans-brook']).toBeUndefined();
    expect(left(12)).toBe(1);
    expect(left(15)).toBe(1);
    expect(left(16)).toBeGreaterThan(0.5);
    // Five o'clock: the shoal still shows, faintly.
    expect(left(17)).toBeGreaterThan(0.05);
    expect(left(17)).toBeLessThan(0.3);
    // Half past: brown from bank to bank, and the rock is what is left to steer by.
    expect(left(17.5)).toBe(0);
  });

  it('changes nothing a wheel meets', () => {
    // Depths and surfaces as they were in v2.31.
    expect(t.waterDepthAt(16, -872)).toBeCloseTo(0.551, 2);
    expect(t.waterDepthAt(5, -857)).toBeCloseTo(0.551, 2);
    expect(t.waterDepthAt(-1, -873)).toBeCloseTo(2.364, 2);
    expect(t.waterDepthAt(-10, -870)).toBeCloseTo(1.399, 2);
    expect(t.surfaceAt(16, -872)).toBe(SurfaceId.Water);
    expect(t.surfaceAt(-1, -873)).toBe(SurfaceId.SoftBed);
  });

  it('has worn wheel lines down to the water and up the far bank, on dry ground', () => {
    const marks = wheelMarkSpots([line], (x, z) => t.waterDepthAt(x, z));
    expect(marks.length).toBeGreaterThan(300);
    for (const m of marks) {
      expect(t.waterDepthAt(m.x, m.z)).toBeLessThanOrEqual(0.02);
      expect(Math.abs(trailProgress(line, m.x, m.z).distance - WHEEL_MARK_HALF_GAUGE)).toBeLessThan(0.15);
    }
    // The near bank: from the top of the way in to within 3 m of the water.
    const near = marks.filter((m) => m.z > -860);
    expect(Math.max(...near.map((m) => m.z))).toBeGreaterThan(-826);
    expect(Math.min(...near.map((m) => m.z))).toBeLessThan(-847);
    // The far bank: they come out of the water on the shoal's line, well upstream of where
    // the near bank's lines went in, and run on up to the camp.
    const far = marks.filter((m) => m.z < -885);
    expect(far.length).toBeGreaterThan(100);
    const out = far.filter((m) => m.z > -893);
    expect(out.length).toBeGreaterThan(5);
    for (const m of out) expect(m.x).toBeGreaterThan(15);
  });

  it('keeps the big rock and loses the two steering signs', () => {
    const [mx, mz] = NOLANS_MARKER;
    expect(telegraphNorthMap.boulders.some((b) => b.x === mx && b.z === mz && !b.anchor)).toBe(true);
    const signs = telegraphNorthMap.props.filter((p) => p.kind === 'signpost' && p.z < -800 && p.z > -910);
    expect(signs.map((s) => s.text)).toEqual(['Nolans Brook — deep crossing']);
    for (const p of telegraphNorthMap.props) expect(p.text ?? '').not.toMatch(/Turn across|Aim here from/);
  });

  it('says how to read the brook and not where to steer', () => {
    const steer = /\b(left|right|straight)\b/i;
    const hint = line.def.routeHint!;
    const place = telegraphNorthMap.pois.find((p) => p.id === 'nolans-brook')!.note!;
    const note = telegraphNorthEpisode.notes!['nolans-brook'].text;
    for (const words of [hint, place, note]) expect(words).not.toMatch(steer);
    expect(hint).toMatch(/pale/i);
    expect(hint).toMatch(/dark/i);
    expect(note).toMatch(/pale/i);
    expect(note).toMatch(/dark/i);
    expect(note).toMatch(/wheel lines/i);
    expect(note).toMatch(/rock/i);
    // The briefing no longer gives the line away either.
    for (const para of telegraphNorthEpisode.briefing ?? []) expect(para).not.toMatch(/hard to the right/i);
  });
});
