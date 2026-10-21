import type { TrackDef } from './mapTypes';
import type { Noise2D } from './noise';
import { mulberry32 } from './rng';

/** Keep potholes and washouts this far (m) from a track's ends, where it meets another. */
const CLEAR_ENDS = 10;
/** Bumps and dips repeat about this often along a track (m); swells about three times as far. */
const BUMP_SCALE = 3.2;
const SWELL_SCALE = 9.5;
/** The wheel lines are this far (m) either side of the centreline. */
const WHEEL_LINE = 0.75;

interface Pothole {
  s: number;
  /** Metres left of the centreline. */
  l: number;
  radius: number;
  depth: number;
}

interface Washout {
  s: number;
  /** Tangent of the channel's angle away from square across the track. */
  skew: number;
  /** Cosine of that angle (turns along-track distance into distance across the channel). */
  cos: number;
  half: number;
  depth: number;
}

/** The potholes and washouts on one track, placed once from the map's seed. */
export interface TrackRoughness {
  bumps: number;
  swells: number;
  potholes: Pothole[];
  washouts: Washout[];
}

/** Lay out a track's rough spots along its length (null if it is graded smooth). */
export function trackRoughness(def: TrackDef, length: number, seed: number): TrackRoughness | null {
  const r = def.rough;
  if (!r) return null;
  const rand = mulberry32(seed);
  const potholes: Pothole[] = [];
  const washouts: Washout[] = [];
  // Spots come every 100 / count metres on average, never evenly.
  const place = (perHundred: number, add: (s: number) => void) => {
    if (!perHundred) return;
    const gap = 100 / perHundred;
    for (let s = CLEAR_ENDS + rand() * gap; s < length - CLEAR_ENDS; s += gap * (0.4 + 1.2 * rand())) add(s);
  };
  place(r.potholes ?? 0, (s) =>
    potholes.push({
      s,
      l: (rand() < 0.5 ? -1 : 1) * (WHEEL_LINE + (rand() - 0.5) * 0.6),
      radius: 0.7 + rand() * 0.7,
      depth: (r.potholeDepth ?? 0.2) * (0.55 + 0.45 * rand()),
    }),
  );
  place(r.washouts ?? 0, (s) => {
    const angle = (rand() < 0.5 ? -1 : 1) * (15 + rand() * 35) * (Math.PI / 180);
    washouts.push({
      s,
      skew: Math.tan(angle),
      cos: Math.cos(angle),
      half: 0.6 + rand() * 0.35,
      depth: (r.washoutDepth ?? 0.25) * (0.6 + 0.4 * rand()),
    });
  });
  return { bumps: r.bumps, swells: r.swells ?? 0, potholes, washouts };
}

/** Inner share of a pothole or washout that counts as in it (for strikes and the tint). */
const INNER = 0.8;

/**
 * Height to add to the graded track at a point `s` metres along it and `l` metres left
 * of its centreline (world position x, z): bumps and swells, less any pothole or washout.
 */
export function roughOffset(
  rough: TrackRoughness,
  noise: Noise2D,
  x: number,
  z: number,
  s: number,
  l: number,
): number {
  let h = rough.bumps * noise.fbm(x / BUMP_SCALE, z / BUMP_SCALE, 2);
  if (rough.swells) h += rough.swells * noise.noise(x / SWELL_SCALE + 71.3, z / SWELL_SCALE - 19.7);
  for (const p of rough.potholes) {
    if (Math.abs(s - p.s) > p.radius) continue;
    const q = Math.hypot(s - p.s, l - p.l) / p.radius;
    if (q < 1) h -= p.depth * (1 - q * q);
  }
  for (const w of rough.washouts) {
    const d = washoutDistance(w, s, l);
    if (d < w.half) h -= w.depth * (1 - (d / w.half) ** 2);
  }
  return h;
}

/**
 * The pothole or washout a point is well inside, if any: its full depth (m) and which
 * kind. A wheel dropping in is judged by this depth, however near the edge it lands.
 */
export function roughHole(
  rough: TrackRoughness,
  s: number,
  l: number,
): { depth: number; kind: 'pothole' | 'washout' } | null {
  let hole: { depth: number; kind: 'pothole' | 'washout' } | null = null;
  for (const p of rough.potholes) {
    if (Math.abs(s - p.s) > p.radius) continue;
    if (Math.hypot(s - p.s, l - p.l) < p.radius * INNER && p.depth > (hole?.depth ?? 0))
      hole = { depth: p.depth, kind: 'pothole' };
  }
  for (const w of rough.washouts)
    if (washoutDistance(w, s, l) < w.half * INNER && w.depth > (hole?.depth ?? 0))
      hole = { depth: w.depth, kind: 'washout' };
  return hole;
}

/** Distance across a washout's channel, which runs over the track at its angle. */
function washoutDistance(w: Washout, s: number, l: number): number {
  return Math.abs(s - w.s - l * w.skew) * w.cos;
}
