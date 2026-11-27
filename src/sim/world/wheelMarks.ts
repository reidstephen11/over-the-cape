import type { TrackInfo } from './features';
import type { WheelMarkStretch } from './mapTypes';
import { trailPoint } from './crawlTrail';

/** Half the distance between the two wheel lines (m): a 4WD's track. */
export const WHEEL_MARK_HALF_GAUGE = 0.72;
/** Distance between one mark and the next along a wheel line (m): they run together into a line. */
const STEP = 0.22;
/** The marks grow in over this far at each end of a stretch (m). */
const TAPER = 2.5;

export interface WheelMark {
  x: number;
  z: number;
  /**
   * How worn the line is here: it fades in and out at the ends of a stretch, up to the
   * stretch's own strength (1 for an ordinary line, under 1 fainter, over 1 a deep rut).
   */
  strength: number;
}

/** The side offset of a stretch at a distance along the track (m). */
function offsetAt(points: WheelMarkStretch['offset'], s: number): number {
  if (!points?.length) return 0;
  if (s <= points[0][0]) return points[0][1];
  for (let i = 0; i < points.length - 1; i++) {
    const [s0, o0] = points[i];
    const [s1, o1] = points[i + 1];
    if (s <= s1) return o0 + ((o1 - o0) * (s - s0)) / Math.max(1e-6, s1 - s0);
  }
  return points[points.length - 1][1];
}

/** A repeatable scatter in -1..1 for the k-th mark of a cut-up stretch. */
const scatter = (k: number) => {
  const x = Math.sin(k * 12.9898 + 4.1414) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

/**
 * Where a map's worn wheel lines are (`TrackDef.wheelMarks`, v2.25): two lines of marks along
 * each stretch, on dry ground only. They show which way others have driven: down to the water
 * here, out of it there. Only drawn (src/render/wheelMarks.ts); the ground is the same.
 */
export function wheelMarkSpots(
  tracks: readonly TrackInfo[],
  waterDepthAt: (x: number, z: number) => number,
): WheelMark[] {
  const out: WheelMark[] = [];
  for (const track of tracks)
    for (const stretch of track.def.wheelMarks ?? []) {
      const def: WheelMarkStretch = 'from' in stretch ? stretch : { from: stretch[0], to: stretch[1] };
      const from = def.from;
      const to = Math.min(def.to, track.poly.length);
      const strength = def.strength ?? 1;
      let k = 0;
      for (let s = Math.max(0, from); s <= to; s += STEP) {
        const taper = Math.min(1, (s - from + 0.4) / TAPER, (to - s + 0.4) / TAPER);
        const centre = offsetAt(def.offset, s);
        for (const side of [-WHEEL_MARK_HALF_GAUGE, WHEEL_MARK_HALF_GAUGE]) {
          // A cut-up stretch lays a second mark beside each, scattered either side of the line.
          for (const extra of def.cutUp ? [0, 1] : [0]) {
            const jitter = extra ? def.cutUp! * scatter(k++) : 0;
            const p = trailPoint(track, s + (extra ? STEP / 2 : 0), centre + side + jitter);
            if (waterDepthAt(p.x, p.z) > 0.02) continue;
            out.push({ x: p.x, z: p.z, strength: strength * taper });
          }
        }
      }
    }
  return out;
}
