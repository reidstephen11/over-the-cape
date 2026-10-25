import type { CreekBarDef, PoiDef, PropDef, TrackDef } from '../../sim/world/mapTypes';
import type { Waypoint } from './crebRoute';

/**
 * Forks on the CREB: places where the player picks a line, a short, risky one against a
 * longer, safer one, like Big Red and its bypass. Each leaves the main route at a sign and
 * comes back to it a little further on:
 *   - the chicken track: round the deep bog in the ridge's saddle, longer and rough, but
 *     no bog to winch out of
 *   - the steep shortcut: straight down the spur over rock ledges where the concrete swings
 *     round; shorter, but it needs low range and the lockers, and a ledge taken too fast
 *     cuts a tyre
 *   - the shallow crossing: across the Little Annan on a gravel bar downstream of the ford;
 *     twice as long, but half the depth
 * Coordinates in metres: x = east, z = south (north is -z).
 */

/** Round the ridge's deep bog to the west, along the side of the saddle. */
export const chickenTrack: Waypoint[] = [
  [-36, 1028, 95],
  [-62, 1012],
  [-92, 990],
  [-108, 955],
  [-104, 918],
  [-82, 895],
  [-58, 884],
  [-40, 890, 86.6],
];

/** Straight down the spur where the concrete swings west and back. */
export const steepShortcut: Waypoint[] = [
  [16, -385, 86],
  [9, -420],
  [-5, -455],
  [-21, -486, 47],
];

/** Along the south bank of the Little Annan, over the bar downstream and back to the road. */
export const shallowCrossing: Waypoint[] = [
  [-40, -2410],
  [0, -2414],
  [50, -2420],
  [98, -2428],
  [120, -2446],
  [130, -2468],
  [128, -2490],
  [105, -2505],
  [82, -2509],
];

const BATTER = 0.5;

export const crebForkTracks: TrackDef[] = [
  {
    id: 'chicken-track',
    name: 'Chicken track',
    points: chickenTrack,
    width: 3.2,
    shoulder: 3,
    batter: BATTER,
    smooth: 6,
    surface: 'clay',
    ruts: 0.1,
    // Across the side of the saddle: it leans with the hill.
    camber: 0.55,
    pinMode: 'follow',
    // Rough and washed out, but no mud: it keeps to the side of the saddle, above the wet.
    rough: { bumps: 0.16, swells: 0.2, potholes: 5, potholeDepth: 0.3, washouts: 8, washoutDepth: 0.4 },
  },
  {
    id: 'steep-shortcut',
    name: 'Steep shortcut',
    points: steepShortcut,
    width: 3.2,
    shoulder: 3,
    batter: BATTER,
    smooth: 4,
    surface: 'rock',
    ruts: 0,
    camber: 0.35,
    pinMode: 'follow',
    pinSmooth: 8,
    // Granite ledges a car has to step down, and cross-ruts that lift a wheel on each axle.
    rockySteps: [
      // (Negative: a sudden drop going down, easing off below it.)
      { at: 22, rise: -0.7 },
      { at: 45, rise: -0.75 },
      { at: 68, rise: -0.7 },
      { at: 88, rise: -0.75 },
    ],
    rough: { bumps: 0.1, washouts: 9, washoutDepth: 0.42 },
  },
  {
    id: 'shallow-crossing',
    name: 'Shallow crossing',
    points: shallowCrossing,
    width: 3.6,
    shoulder: 3,
    batter: BATTER,
    smooth: 8,
    surface: 'gravel',
    ruts: 0.06,
    camber: 0.3,
    pinMode: 'follow',
    rough: { bumps: 0.12, swells: 0.15, potholes: 4, potholeDepth: 0.25, washouts: 3, washoutDepth: 0.3 },
  },
];

/** The Little Annan's shallow line: a gravel bar where the river widens below the ford. */
export const littleAnnanBars: CreekBarDef[] = [
  { x: 124, z: -2466, radiusX: 14, radiusZ: 9, rotationDeg: 20, depth: 0.28 },
];

/** A sign at each fork, facing the driver coming north. */
export const crebForkProps: PropDef[] = [
  { kind: 'signpost', x: -40, z: 1040, headingDeg: 200, text: 'Chicken track' },
  { kind: 'signpost', x: 22, z: -393, headingDeg: 120, text: 'Steep shortcut' },
  { kind: 'signpost', x: -34, z: -2400, headingDeg: 210, text: 'Shallow crossing' },
];

/** Each fork is a place on the map, with a note on the choice. */
export const crebForkPois: PoiDef[] = [
  {
    id: 'ridge-bog',
    name: 'Bog in the saddle',
    kind: 'feature',
    x: -16,
    z: 937,
    radius: 26,
    note: 'Deep bog; a chicken track goes round to the west',
  },
  {
    id: 'steep-shortcut',
    name: 'Steep shortcut',
    kind: 'feature',
    x: 14,
    z: -425,
    radius: 26,
    note: 'Rock ledges straight down the spur',
  },
  {
    id: 'little-annan',
    name: 'Little Annan River',
    kind: 'feature',
    x: 40,
    z: -2458,
    radius: 26,
    note: 'Deeper at the ford; a gravel bar downstream',
  },
];

/** Each fork: the main route's track it leaves and rejoins, and the other line. */
export interface CrebFork {
  id: string;
  main: string;
  alt: string;
  /** Which is the short, risky line: the main route, or the other line (the steep shortcut). */
  short: 'main' | 'alt';
  /** How far past the rejoin a test drive runs (m); short where a bog lies just beyond. */
  tail?: number;
}
export const crebForks: CrebFork[] = [
  { id: 'chicken-track', main: 'creb-ridge', alt: 'chicken-track', short: 'main' },
  { id: 'steep-shortcut', main: 'concrete-descent', alt: 'steep-shortcut', short: 'alt' },
  { id: 'shallow-crossing', main: 'bloomfield-track', alt: 'shallow-crossing', short: 'main', tail: 4 },
];
