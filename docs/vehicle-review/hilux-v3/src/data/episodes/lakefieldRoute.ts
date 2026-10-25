import type { Waypoint } from './crebRoute';

/**
 * Waypoints of the Lakefield episode, south to north: from Laura out to the Laura River at
 * Old Laura homestead, north through the woodland and over the black soil plains to
 * Lakefield, past the stockman bogged beside the road to Hann Crossing on the North Kennedy
 * River, and on to Musgrave. Coordinates in metres: x = east, z = south (north is -z).
 * Heights are pinned where tracks meet and at the crossings; elsewhere the track follows
 * the ground.
 */

/** North out of Laura to the Laura River. */
export const lauraRoad: Waypoint[] = [
  [-30, 3380],
  [-12, 3300],
  [20, 3180],
  [42, 3060],
  [30, 2940],
  [8, 2830],
  [0, 2770],
];

/** Across the Laura River below Old Laura: sand either side of a shallow run of water. */
export const lauraRiverCrossing: Waypoint[] = [
  [0, 2770],
  [4, 2736],
  [6, 2704],
  [2, 2668],
  [-4, 2636],
];

/** Up past Old Laura homestead and north through the woodland. */
export const oldLauraRoad: Waypoint[] = [
  [-4, 2636],
  [-18, 2580],
  [-30, 2500],
  [-12, 2380],
  [24, 2240],
  [40, 2080],
  [16, 1920],
  [-24, 1760],
  [-46, 1600],
  [-30, 1440],
  [10, 1280],
  [30, 1120],
  [20, 960],
  [0, 820],
];

/** Out of the trees and across the black soil plains to Lakefield. */
export const plainsRoad: Waypoint[] = [
  [0, 820],
  [-20, 680],
  [-36, 520],
  [-24, 360],
  [8, 200],
  [30, 40],
  [22, -120],
  [-2, -240],
];

/** On from Lakefield over more plain, past the stockman's bog, to the North Kennedy. */
export const lakefieldRoad: Waypoint[] = [
  [-2, -240],
  [-26, -380],
  [-40, -540],
  [-26, -700],
  [0, -860],
  [10, -1000],
  [6, -1140],
  [-14, -1300],
  [-30, -1460],
  [-22, -1620],
  [0, -1760],
  [6, -1880],
];

/** Down over the rock bar at Hann Crossing and up the north bank. */
export const hannCrossing: Waypoint[] = [
  [6, -1880],
  [6, -1920],
  [4, -1960],
  [2, -2000],
  [0, -2040],
  [-2, -2080],
];

/** North from the crossing through the woodland to Musgrave. */
export const musgraveRoad: Waypoint[] = [
  [-2, -2080],
  [-14, -2180],
  [-36, -2320],
  [-30, -2480],
  [0, -2640],
  [28, -2800],
  [30, -2960],
  [10, -3120],
  [-6, -3240],
  [-10, -3330],
];
