import { describe, expect, it } from 'vitest';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import {
  LONG_DRIVE_BOG,
  LONG_DRIVE_BOG_ANCHOR_SIDE,
  longDriveBog,
} from '../src/data/episodes/telegraphNorthRoute';
import { SurfaceId } from '../src/data/surfaces';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { wheelMarkSpots } from '../src/sim/world/wheelMarks';
import { telegraphNorthWorld } from './world';

/**
 * The long drive's bog shows who went in and who went round (v2.33): deep, cut-up ruts run
 * straight into the dark patch, and a fainter set of wheel lines swings round it on firm
 * ground. Only what is drawn and said: the bog is what it was.
 */
const world = telegraphNorthWorld();
const t = world.terrain;
const line = world.features.tracks.find((x) => x.def.id === 'long-drive')!;
const marks = wheelMarkSpots([line], (x, z) => t.waterDepthAt(x, z)).map((m) => ({
  ...m,
  on: trailProgress(line, m.x, m.z),
}));
/** Which side of the track's line a point is on: the sign matches a stretch's offset there. */
const sideOf = (x: number, z: number, along: number) => {
  const off = trailProgress(line, x, z).distance;
  const d = (lateral: number) => {
    const q = trailPoint(line, along, lateral);
    return Math.hypot(q.x - x, q.z - z);
  };
  return d(off) < d(-off) ? 1 : -1;
};
const bog = (m: { x: number; z: number }) => {
  const s = t.surfaceAt(m.x, m.z);
  return s === SurfaceId.BlackSoil || s === SurfaceId.Mud;
};
const deep = marks.filter((m) => m.strength > 1);
const faint = marks.filter((m) => m.strength < 0.6);

describe('the long drive’s bog', () => {
  it('has two sets of wheel lines: strong ones and faint ones, and nothing in between at the bog', () => {
    expect(deep.length).toBeGreaterThan(150);
    expect(faint.length).toBeGreaterThan(150);
    const atBog = marks.filter((m) => Math.abs(m.on.along - LONG_DRIVE_BOG) < 8);
    for (const m of atBog) expect(m.strength > 1 || m.strength < 0.6).toBe(true);
  });

  it('runs the strong, cut-up ruts straight into the bog', () => {
    const inBog = deep.filter((m) => bog(m));
    expect(inBog.length).toBeGreaterThan(40);
    // They reach the middle of it, on the bog's side of the track's line.
    const middle = deep.filter((m) => Math.abs(m.on.along - LONG_DRIVE_BOG) < 2);
    expect(middle.length).toBeGreaterThan(8);
    const bogSide = -Math.sign(LONG_DRIVE_BOG_ANCHOR_SIDE);
    const mean = middle.reduce((s, m) => s + m.on.distance * sideOf(m.x, m.z, m.on.along), 0) / middle.length;
    expect(mean * bogSide).toBeGreaterThan(0.5);
    // Cut up: not two neat lines, but marks scattered about them.
    const spread = new Set(middle.map((m) => m.on.distance.toFixed(1)));
    expect(spread.size).toBeGreaterThan(3);
  });

  it('swings the faint set round it on firm ground, on the side the winch rocks are', () => {
    for (const m of faint) expect(bog(m), `${m.x.toFixed(1)}, ${m.z.toFixed(1)}`).toBe(false);
    const beside = faint.filter((m) => Math.abs(m.on.along - LONG_DRIVE_BOG) < 6);
    expect(beside.length).toBeGreaterThan(20);
    for (const m of beside) {
      expect(sideOf(m.x, m.z, m.on.along)).toBe(Math.sign(LONG_DRIVE_BOG_ANCHOR_SIDE));
      expect(m.on.distance).toBeLessThan(3);
    }
    // By the winch rocks, 17 m either side of the bog and 3.6 m out, the lines are back in
    // towards the track: a car on them clears the rocks.
    const byRocks = faint.filter((m) => Math.abs(Math.abs(m.on.along - LONG_DRIVE_BOG) - 17) < 1.5);
    expect(byRocks.length).toBeGreaterThan(10);
    for (const m of byRocks) expect(m.on.distance).toBeLessThan(2.4);
  });

  it('lets the driver see the two part company well before the bog, and join again after it', () => {
    const start = Math.min(...faint.map((m) => m.on.along));
    const end = Math.max(...faint.map((m) => m.on.along));
    expect(LONG_DRIVE_BOG - start).toBeGreaterThan(25);
    expect(end - LONG_DRIVE_BOG).toBeGreaterThan(25);
    // Where they start and end, the faint lines are on the track's own line.
    for (const m of faint.filter((q) => q.on.along < start + 1 || q.on.along > end - 1))
      expect(m.on.distance).toBeLessThan(1);
  });

  it('leaves the bog itself as it was', () => {
    expect(longDriveBog).toMatchObject({ radiusX: 2, radiusZ: 10, depth: 0.6, deep: true });
    expect(t.surfaceAt(longDriveBog.x, longDriveBog.z)).toBe(SurfaceId.BlackSoil);
  });

  it('says what cut-up dark ground means, not where to steer', () => {
    const steer = /\b(left|right|straight)\b/i;
    const hint = line.def.routeHint!;
    const note = telegraphNorthEpisode.notes!['long-drive'].text;
    for (const words of [hint, note]) {
      expect(words).not.toMatch(steer);
      expect(words).toMatch(/cut.up/i);
      expect(words).toMatch(/soft/i);
    }
    expect(note).toMatch(/wheel lines/i);
    expect(note).toMatch(/rock/i);
  });
});
