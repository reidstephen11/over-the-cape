import type { Waypoint } from './crebRoute';

/**
 * Waypoints of the Old Coach Road episode, south to north: from a camp on the Palmer River
 * across to Maytown, up the old coach road over the North Palmer River and the Conglomerate
 * Range, and down to the Little Laura River and Laura. Coordinates in metres: x = east,
 * z = south (north is -z). Heights are pinned where tracks meet, at crossings and on the
 * designed climbs; elsewhere the track follows the ground.
 */

/** From the camp on the Palmer River down to the river's sand. */
export const palmerCampRoad: Waypoint[] = [
  [-40, 3390],
  [-22, 3330],
  [8, 3272],
  [20, 3226, 53.4],
];

/** Across the Palmer River's wide sand bed and its shallow channel. */
export const palmerCrossing: Waypoint[] = [
  [20, 3226, 53.4],
  [24, 3190],
  [28, 3150],
  [26, 3112],
  [18, 3078, 53.2],
];

/** Up from the river into Maytown, along the old main street. */
export const maytownRoad: Waypoint[] = [
  [18, 3078, 53.2],
  [2, 3020],
  [-24, 2962],
  [-36, 2906],
  [-22, 2846, 59.2],
];

/** The old coach road north from Maytown to the North Palmer River, where it divides. */
export const coachRoadSouth: Waypoint[] = [
  [-22, 2846, 59.2],
  [8, 2764],
  [40, 2664],
  [12, 2562],
  [-40, 2472],
  [-32, 2382],
  [18, 2292],
  [58, 2202],
  [40, 2112],
  [4, 2032],
  [0, 1960, 56.7],
];

/** The North Palmer straight across, through its soft sand. */
export const northPalmerSand: Waypoint[] = [
  [0, 1960, 56.7],
  [0, 1912],
  [2, 1882],
  [0, 1860],
  [-2, 1838],
  [0, 1808],
  [0, 1770, 62.6],
];

/** The other line over the North Palmer, upstream across a rocky bar. */
export const northPalmerRocky: Waypoint[] = [
  [0, 1960, 56.7],
  [58, 1946],
  [112, 1918],
  [138, 1884],
  [138, 1850],
  [106, 1810],
  [46, 1782],
  [0, 1770, 62.6],
];

/** North from the river to the foot of the Conglomerate Range. */
export const rangeFoot: Waypoint[] = [
  [0, 1770, 62.6],
  [-28, 1700],
  [-46, 1604],
  [-22, 1500],
  [18, 1404],
  [10, 1320],
  [0, 1262, 65.4],
];

/** Straight up the range's face: the steepest line, over bands of rock. */
export const climbMiddle: Waypoint[] = [
  [0, 1262, 65.4],
  [0, 1240],
  [0, 1192, 68],
  [0, 1124, 100.2],
  [0, 1085],
  [0, 1050, 99.9],
];

/** The old coach line: slanting up the face to the west, worn into deep ruts and washouts. */
export const climbOldCoach: Waypoint[] = [
  [0, 1262, 65.4],
  [-38, 1238],
  [-86, 1196, 69.4],
  [-102, 1146],
  [-78, 1100, 101],
  [-34, 1066],
  [0, 1050, 99.9],
];

/** The long way round to the east, winding up where the face lies back. */
export const climbBypass: Waypoint[] = [
  [0, 1262, 65.4],
  [70, 1250],
  [160, 1232],
  [230, 1206, 68],
  [276, 1160],
  [270, 1110],
  [222, 1078, 101],
  [150, 1058],
  [70, 1046],
  [0, 1050, 99.9],
];

/** Along the top of the range to the hotel site and on north. */
export const rangeTopSouth: Waypoint[] = [
  [0, 1050, 99.9],
  [-28, 982],
  [-12, 900],
  [28, 800],
  [20, 700],
  [-20, 600],
  [-48, 500],
  [-30, 400],
  [8, 300],
  [30, 205],
  [24, 130],
  [-6, 60],
  [-20, -20, 102.2],
];

/** Down into a sandy gully and out of it over the big rock step. */
export const bigStepLine: Waypoint[] = [
  [-20, -20, 102.2],
  [-24, -70, 102.3],
  [-22, -116, 97.4],
  [-17, -150, 100.6],
  [-10, -200, 100.8],
];

/** The eastern track round the big rock step. */
export const eastBypass: Waypoint[] = [
  [-20, -20, 102.2],
  [32, -48],
  [84, -104],
  [76, -170],
  [32, -210],
  [-10, -200, 100.8],
];

/** On along the range to the top of the descent. */
export const rangeTopNorth: Waypoint[] = [
  [-10, -200, 100.8],
  [16, -300],
  [30, -420],
  [4, -560],
  [-8, -700, 103.9],
];

/** Down the range's north face through the sandstone the coach wheels cut into. */
export const rangeDescent: Waypoint[] = [
  [-8, -700, 103.9],
  [-6, -748, 101.5],
  [0, -800],
  [6, -852, 60.5],
  [10, -900, 60.3],
];

/** North through the woodland to the Little Laura River. */
export const coachRoadNorth: Waypoint[] = [
  [10, -900, 60.3],
  [40, -1000],
  [20, -1150],
  [-30, -1300],
  [-60, -1450],
  [-30, -1600],
  [20, -1750],
  [50, -1900],
  [30, -2050],
  [-20, -2200],
  [-50, -2350],
  [-30, -2500],
  [0, -2650],
  [10, -2800, 52.1],
];

/** Across the Little Laura River. */
export const littleLauraCrossing: Waypoint[] = [
  [10, -2800, 52.1],
  [12, -2838, 49.1],
  [10, -2860, 47.3],
  [8, -2882, 49.1],
  [10, -2920, 53],
];

/** The last of the road into Laura. */
export const lauraRoad: Waypoint[] = [
  [10, -2920, 53],
  [0, -3000],
  [-20, -3100],
  [-10, -3200],
  [10, -3290],
  [22, -3336],
];
