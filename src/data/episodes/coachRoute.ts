import type { Waypoint } from './crebRoute';

/**
 * The driveable chapter is the Conglomerate Range, between Maytown and Laura.
 * Connecting travel is told in the diary; the climb, step and descent stay full size.
 * Coordinates in metres: x = east, z = south (north is -z).
 */
export const rangeFoot: Waypoint[] = [
  [-22, 600, 65.4],
  [-10, 558, 65.4],
  [0, 512, 65.4],
];

/** The steep middle line, over alternating rock bands and axle-twisting stones. */
export const climbMiddle: Waypoint[] = [
  [0, 512, 65.4],
  [0, 490],
  [0, 442, 68],
  [0, 374, 100.2],
  [0, 335],
  [0, 300, 99.9],
];

/** The rutted coach line slants up the face to the west. */
export const climbOldCoach: Waypoint[] = [
  [0, 512, 65.4],
  [-38, 488],
  [-86, 446, 69.4],
  [-102, 396],
  [-78, 350, 101],
  [-34, 316],
  [0, 300, 99.9],
];

/** The longer, gentler gravel line winds around the eastern end of the face. */
export const climbBypass: Waypoint[] = [
  [0, 512, 65.4],
  [70, 500],
  [160, 482],
  [230, 456, 68],
  [276, 410],
  [270, 360],
  [222, 328, 101],
  [150, 308],
  [70, 296],
  [0, 300, 99.9],
];

/** A short ridge traverse, with room to stop at the old hotel site. */
export const rangeTopSouth: Waypoint[] = [
  [0, 300, 99.9],
  [-28, 252, 101],
  [-12, 200, 103],
  [28, 150, 102],
  [12, 100, 102],
  [-20, 40, 102.2],
];

/** Into the sandy gully and out over the original metre-high sandstone step. */
export const bigStepLine: Waypoint[] = [
  [-20, 40, 102.2],
  [-24, -10, 102.3],
  [-22, -56, 97.4],
  [-17, -90, 100.6],
  [-10, -140, 100.8],
];

export const eastBypass: Waypoint[] = [
  [-20, 40, 102.2],
  [32, 12],
  [84, -44],
  [76, -110],
  [32, -150],
  [-10, -140, 100.8],
];

/** A final short stretch of sandstone leads to the descent. */
export const rangeTopNorth: Waypoint[] = [
  [-10, -140, 100.8],
  [16, -180, 102],
  [4, -220, 103],
  [-8, -260, 103.9],
];

/** The original north-face descent, with its cuttings and descending rock bands. */
export const rangeDescent: Waypoint[] = [
  [-8, -260, 103.9],
  [-6, -308, 101.5],
  [0, -360],
  [6, -412, 60.5],
  [10, -460, 60.3],
];

/** Pull clear of the last ledge and stop at the camp below the range. */
export const rangeExit: Waypoint[] = [
  [10, -460, 60.3],
  [20, -500, 60.3],
  [14, -544, 60.3],
];
