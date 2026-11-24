import type { BoulderDef, ClearingDef, CreekDef, PropDef, TrackDef, XZ } from '../../sim/world/mapTypes';
import { densify, segmentDistance } from '../../sim/world/polyline';

/**
 * What the two Telegraph Track maps share (v2.17): the sand track and creek bank styles, a
 * ledge of rock to go down, a marked winch rock, the surviving telegraph poles and the
 * woodland that stops short of the creeks.
 */
export const sand = {
  shoulder: 2.5,
  batter: 0.6,
  smooth: 8,
  ruts: 0.06,
  camber: 0.3,
  pinMode: 'follow',
  surface: 'sand',
  rough: { bumps: 0.08, swells: 0.12, potholes: 1, potholeDepth: 0.15, washouts: 1, washoutDepth: 0.2 },
} as const;

/** A creek crossing: graded straight between its pinned heights, with steep clay walls. */
export const bank = {
  shoulder: 2,
  batter: 1.4,
  smooth: 2,
  ruts: 0.04,
  camber: 0.2,
  pinMode: 'linear',
  pinSmooth: 2,
  surface: 'clay',
} as const;

/** A ledge of rock across a track that goes down it: its riser is on the far, lower side. */
export function descendingLedge(at: number, rise: number) {
  return {
    shape: 'ridge' as const,
    at,
    lateral: 0,
    width: 4.2,
    length: 1.2,
    height: rise,
    profile: [
      [-0.6, 0.04],
      [0.45, rise],
      [0.6, rise * 0.65],
    ] as const,
  };
}

/** A marked anchor: a rock to winch from. */
export const anchor = (x: number, z: number, radius = 0.8): BoulderDef => ({
  x,
  z,
  radius,
  sink: 0.3,
  anchor: true,
});

/**
 * The surviving telegraph poles along the straight line [x0, z0, x1, z1]: about one in three
 * of `n` + 1 still stands (the pattern is fixed), leaning, none on a track or in a creek.
 */
export function survivingPoles(
  tracks: readonly TrackDef[],
  creeks: readonly CreekDef[],
  [x0, z0, x1, z1]: readonly [number, number, number, number],
  n = 46,
): PropDef[] {
  // Every track centreline, to keep the poles off them.
  const lines = tracks.map((t) =>
    densify(
      t.points.map((p) => [p[0], p[1]] as XZ),
      2,
    ),
  );
  const offTracks = (x: number, z: number, margin: number) =>
    lines.every((poly) => {
      for (let k = 0; k + 1 < poly.count; k++)
        if (segmentDistance(x, z, poly.xs[k], poly.zs[k], poly.xs[k + 1], poly.zs[k + 1]).d < margin)
          return false;
      return true;
    });
  const out: PropDef[] = [];
  for (let k = 0; k <= n; k++) {
    if ((k * 7 + 3) % 3 !== 0) continue;
    const t = k / n;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    if (!offTracks(x, z, 5)) continue;
    // Keep them out of the creeks.
    if (
      creeks.some((c) =>
        c.points.some((p, i) => {
          const q = c.points[i + 1];
          return q && segmentDistance(x, z, p.x, p.z, q.x, q.z).d < p.halfWidth + 8;
        }),
      )
    )
      continue;
    out.push({
      kind: 'powerPole',
      x: Math.round(x * 10) / 10,
      z: Math.round(z * 10) / 10,
      headingDeg: (k * 67) % 360,
      lean: 4 + ((k * 5) % 11),
    });
  }
  return out;
}

/**
 * Open eucalypt woodland everywhere except a strip along each creek, which keeps its gallery
 * forest: circles of woodland on a 100 m grid over a 1 × 2 km map, each shrunk to stop short
 * of the creeks.
 */
export function woodlandGrid(creeks: readonly CreekDef[]): ClearingDef[] {
  const out: ClearingDef[] = [];
  const creekDist = (x: number, z: number) => {
    let d = Infinity;
    for (const c of creeks)
      for (let i = 0; i + 1 < c.points.length; i++) {
        const p = c.points[i];
        const q = c.points[i + 1];
        d = Math.min(d, segmentDistance(x, z, p.x, p.z, q.x, q.z).d - p.halfWidth);
      }
    return d;
  };
  for (let z = -1000; z <= 1000; z += 100)
    for (let x = -500; x <= 500; x += 100) {
      // Woodland fades out over 30 m beyond a circle's edge: stop it 25 m short of the water.
      const r = Math.min(130, creekDist(x, z) - 55);
      if (r >= 20) out.push({ x, z, radius: Math.round(r) });
    }
  return out;
}
