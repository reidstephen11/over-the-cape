import type { Waypoint } from './crebRoute';
import type { FindDef, FlatDef, PoiDef, PropDef, TrackDef } from '../../sim/world/mapTypes';

/**
 * Side trips on the CREB that pay off: short tracks off the main line to what the old
 * powerline left behind, each with something to load (docs/DECISIONS.md, v0.10). The huts
 * and what's in them are the game's own; the history is in the briefing (docs/HISTORY.md).
 *
 *   Old line camp  – a short level spur east off the ridge between Big Red and Roaring Meg,
 *                    with two tyre plugs: a cheap stop.
 *   Linesman's hut – down the range's west flank from the range top, following the old
 *                    line's poles, with a full 20 L jerry can: a longer trip with a greasy
 *                    climb back up to the track.
 */

const BATTER = 0.5;
/** A side track: narrow, washed out like the range tracks, but not bogged (no mud holes). */
const spur = {
  width: 3,
  surface: 'clay',
  shoulder: 3,
  batter: BATTER,
  smooth: 8,
  ruts: 0.05,
  camber: 0.3,
  pinMode: 'follow',
  rough: { bumps: 0.12, swells: 0.15, potholes: 2, potholeDepth: 0.25, washouts: 4, washoutDepth: 0.32 },
} as const;

export const lineCampTrack: Waypoint[] = [
  [-8, 960, 84.4],
  [22, 955],
  [50, 946],
  [70, 940],
];

export const linesmansTrack: Waypoint[] = [
  [-18, -157, 141.8],
  [-42, -150],
  [-60, -138],
  [-74, -120],
  [-86, -100],
  [-95, -85, 125.5],
];

/** A point `off` metres to the right of a waypoint line (left when negative), `t` of the way along segment `seg`. */
function beside(w: readonly Waypoint[], seg: number, t: number, off: number): { x: number; z: number } {
  const [ax, az] = w[seg];
  const [bx, bz] = w[seg + 1];
  const len = Math.hypot(bx - ax, bz - az);
  // Facing along the segment (x east, z south), right is (-dz, dx).
  return { x: ax + (bx - ax) * t - ((bz - az) / len) * off, z: az + (bz - az) * t + ((bx - ax) / len) * off };
}

export const crebFindTracks: TrackDef[] = [
  { id: 'line-camp-track', name: 'Line camp track', points: lineCampTrack, ...spur },
  { id: 'linesmans-track', name: 'Old line', points: linesmansTrack, ...spur },
];

export const crebFindFlats: FlatDef[] = [
  { id: 'line-camp', x: 78, z: 934, radius: 9, blend: 10 },
  { id: 'linesmans-hut', x: -100, z: -79, radius: 8, blend: 10, height: 125.5 },
];

export const crebFinds: FindDef[] = [
  {
    id: 'line-camp-plugs',
    name: 'Tyre plugs',
    x: 72,
    z: 938,
    radius: 7,
    gives: { plugs: 2 },
    taken: 'Two tyre plugs from the line camp',
  },
  {
    id: 'linesmans-jerry-can',
    name: 'Jerry can',
    x: -97,
    z: -82,
    radius: 7,
    gives: { jerryCans: 1 },
    taken: 'A full 20 L jerry can from the linesman’s hut',
  },
];

export const crebFindPois: PoiDef[] = [
  {
    id: 'line-camp',
    name: 'Old line camp',
    kind: 'landmark',
    x: 76,
    z: 936,
    radius: 16,
    note: 'A hut left from the powerline days',
  },
  {
    id: 'linesmans-hut',
    name: 'Linesman’s hut',
    kind: 'landmark',
    x: -100,
    z: -79,
    radius: 16,
    note: 'Down the old line from the range top',
  },
];

export const crebFindProps: PropDef[] = [
  { kind: 'signpost', x: -2, z: 966, headingDeg: 200, text: 'Line camp →' },
  { kind: 'hut', x: 82, z: 931, headingDeg: 290 },
  { kind: 'signpost', x: -24, z: -164, headingDeg: 20, text: 'Old line →' },
  { kind: 'hut', x: -104, z: -75, headingDeg: 130 },
  // The old line's poles, leaning and without their wires, beside the track down to the hut.
  ...(
    [
      [0, 0.3, 4],
      [1, 0.6, 7],
      [2, 0.7, 3],
      [3, 0.8, 9],
    ] as const
  ).map(([seg, t, lean]): PropDef => ({
    kind: 'powerPole',
    ...beside(linesmansTrack, seg, t, -6),
    headingDeg: 210 + lean * 7,
    lean,
  })),
];
