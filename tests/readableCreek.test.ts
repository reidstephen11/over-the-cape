import { describe, expect, it } from 'vitest';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import { telegraphNorthMap } from '../src/data/episodes/telegraphNorthMap';
import { canalFarEdge } from '../src/data/episodes/telegraphNorthRoute';
import { SurfaceId } from '../src/data/surfaces';
import { clearWater, depthTone, shallowsOf } from '../src/render/water';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { GroundTint } from '../src/sim/world/terrain';
import { WHEEL_MARK_HALF_GAUGE, wheelMarkSpots } from '../src/sim/world/wheelMarks';
import { telegraphNorthWorld } from './world';

/**
 * Canal Creek can be read from the ramp (v2.25): clear water that shows the pale shelf and
 * breaks over it, dark water where it is deep, and worn wheel lines down to the water and up
 * the exit that is used. Only what is drawn: the creek drives as it did.
 */
const world = telegraphNorthWorld();
const t = world.terrain;
const track = (id: string) => world.features.tracks.find((x) => x.def.id === id)!;

describe('clear water', () => {
  it('shows the bed and breaks up over the shelf, and not where it is deep', () => {
    // The shelf (0.6 m) and the shallows along the far bank (0.3 m) count in full.
    expect(shallowsOf(0.3)).toBe(1);
    expect(shallowsOf(0.6)).toBe(1);
    // Beside the shelf (1.7 m) and in the creek's ordinary 1.1 m, not at all.
    expect(shallowsOf(1.1)).toBe(0);
    expect(shallowsOf(1.7)).toBe(0);
    // In between it fades.
    expect(shallowsOf(0.8)).toBeGreaterThan(0.4);
    expect(shallowsOf(0.8)).toBeLessThan(0.7);
    // The water's edge is as clear as it gets.
    expect(shallowsOf(0)).toBe(1);
  });

  it('is at its darkest from 1.1 m, so the shelf is far paler than the water beside it', () => {
    expect(clearWater.deepAt).toBe(1.1);
    expect(depthTone(0.6, true)).toBeLessThan(0.5);
    expect(depthTone(1.1, true)).toBe(1);
    expect(depthTone(1.7, true)).toBe(1);
    // Water that is not clear is drawn as before: as dark as it gets by 0.8 m.
    expect(depthTone(0.6, false)).toBeCloseTo(0.667, 2);
    expect(depthTone(0.8, false)).toBe(1);
  });

  it('is asked for by Canal Creek alone, and marks its water and no other creek’s', () => {
    for (const c of telegraphNorthMap.creeks) expect(!!c.clear, c.id).toBe(c.id === 'canal-creek');
    const clear = world.features.creekClear!;
    expect(clear).toBeDefined();
    const at = (x: number, z: number) => clear[t.index(x, z)];
    // The shelf, the deep beside it and the far-bank shallows at Canal Creek.
    expect(at(-0.5, 612)).toBe(1);
    expect(at(6, 612)).toBe(1);
    expect(at(-8, 603.5)).toBe(1);
    // Sam Creek, Nolans Brook and Fruit Bat's pool are drawn as they were.
    expect(at(2, 332)).toBe(0);
    expect(at(18, -872)).toBe(0);
    expect(at(254, 890)).toBe(0);
  });

  it('gives the shelf a pale gravel bed to show through it, and changes nothing a wheel meets', () => {
    // Pale across the shelf; the creek's own gravel in the deep either side and upstream.
    for (const [x, z] of [
      [-0.5, 612],
      [2, 612],
      [-3, 612],
      [1.5, 608],
      [-2.5, 616],
    ])
      expect(t.tintAt(x, z), `${x}, ${z}`).toBe(GroundTint.Sand);
    expect(t.tintAt(7, 612.5)).toBe(GroundTint.Gravel);
    expect(t.tintAt(-8, 613)).toBe(GroundTint.Gravel);
    expect(t.tintAt(30, 614)).toBe(GroundTint.Gravel);
    // Depths and the surface under the wheels are what they were in v2.19.
    expect(t.waterDepthAt(-0.5, 612)).toBeGreaterThan(0.55);
    expect(t.waterDepthAt(-0.5, 612)).toBeLessThan(0.65);
    expect(t.waterDepthAt(4.5, 612) - t.waterDepthAt(-0.5, 612)).toBeGreaterThan(0.5);
    expect(t.surfaceAt(-0.5, 612)).toBe(SurfaceId.Water);
    expect(t.surfaceAt(7, 612.5)).toBe(SurfaceId.Water);
  });
});

describe('worn wheel lines at Canal Creek', () => {
  const marks = wheelMarkSpots(world.features.tracks, (x, z) => t.waterDepthAt(x, z));
  const line = track('canal-creek');

  it('run down the ramp to the water and up the winding exit, two lines a wheel track apart, on dry ground', () => {
    expect(marks.length).toBeGreaterThan(400);
    for (const m of marks) {
      expect(t.waterDepthAt(m.x, m.z)).toBeLessThanOrEqual(0.02);
      const on = trailProgress(line, m.x, m.z);
      expect(Math.abs(on.distance - WHEEL_MARK_HALF_GAUGE)).toBeLessThan(0.15);
      expect(m.strength).toBeGreaterThan(0);
      expect(m.strength).toBeLessThanOrEqual(1);
    }
    // On the ramp: from its top to within 3 m of the water.
    const near = marks.filter((m) => m.z > 615);
    expect(Math.max(...near.map((m) => m.z))).toBeGreaterThan(650);
    expect(Math.min(...near.map((m) => m.z))).toBeLessThan(623);
    // On the far bank: from the foot of the bank to the top of the winding exit.
    const far = marks.filter((m) => m.z < 606);
    expect(far.length).toBeGreaterThan(200);
    const top = trailPoint(line, line.poly.length);
    expect(Math.min(...far.map((m) => Math.hypot(m.x - top.x, m.z - top.z)))).toBeLessThan(1.5);
    // They leave the water to the left: the first dry marks on the far bank are west of the shelf.
    const first = far.filter((m) => trailProgress(line, m.x, m.z).along < canalFarEdge + 14);
    expect(first.length).toBeGreaterThan(10);
    for (const m of first) expect(m.x).toBeLessThan(0);
  });

  it('leave the old exit bare, and no other track on the map has any', () => {
    const old = track('canal-old-exit');
    expect(old.def.wheelMarks).toBeUndefined();
    // Between where the two exits part (8 m up the old one) and where they join again at the
    // top (its last 12 m), no mark is on the old exit's line.
    for (const m of marks) {
      const on = trailProgress(old, m.x, m.z);
      if (on.along > 8 && on.along < old.poly.length - 12) expect(on.distance).toBeGreaterThan(1.6);
    }
    for (const tr of world.features.tracks)
      if (tr.def.id !== 'canal-creek') expect(tr.def.wheelMarks, tr.def.id).toBeUndefined();
  });

  it('are spoken for in the hint and the note, which say how to read the creek and not where to steer', () => {
    expect(line.def.routeHint).toMatch(/pale and broken is the shelf, dark is deep/);
    expect(line.def.routeHint).toMatch(/[Ww]heel lines/);
    const note = telegraphNorthEpisode.notes['canal-creek'].text;
    expect(note).toMatch(/read it before you commit/);
    expect(note).toMatch(/pale and broken/);
    expect(note).toMatch(/dark and smooth/);
    // What Hema says is still there.
    expect(note).toMatch(/washed out into gullies/);
    expect(note).toMatch(/winding one to the left/);
  });
});
