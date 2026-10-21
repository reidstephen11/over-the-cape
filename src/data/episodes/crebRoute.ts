import type { XZ } from '../../sim/world/mapTypes';

/**
 * Waypoints of the CREB Track episode, south to north as on the real track. Coordinates
 * in metres: x = east, z = south (north is -z). Heights are pinned where tracks meet, at
 * creek crossings and on the designed climbs; elsewhere the track follows the ground.
 */
export type Waypoint = readonly [number, number] | readonly [number, number, number];

/** Daintree Village to the south bank of the Daintree River. */
export const upperDaintreeRoad: Waypoint[] = [
  [-1180, 1290],
  [-1210, 1220],
  [-1170, 1150],
  [-1095, 1110],
  [-1040, 1086, 9.6],
];

/** Across the Daintree River in a wide arc downstream, over the gravel bar. */
export const daintreeCrossing: Waypoint[] = [
  [-1040, 1086, 9.6],
  [-1010, 1068],
  [-990, 1046],
  [-992, 1022],
  [-1004, 1000],
  [-1010, 980, 8.8],
];

/** The sandy road east through the Upper Daintree paddocks to the foot of the range. */
export const paddockRoad: Waypoint[] = [
  [-1010, 980, 8.8],
  [-990, 920],
  [-930, 880],
  [-850, 880],
  [-770, 920],
  [-690, 940],
  [-610, 910],
  [-540, 860],
  [-470, 850],
  [-410, 820, 21.9],
  [-370, 770, 34],
];

/** Big Red: straight up the red clay face of the spur. */
export const bigRed: Waypoint[] = [
  [-370, 770, 34],
  [-362, 735, 45.5],
  [-354, 700, 57.5],
  [-347, 668, 71],
  [-341, 640, 82],
  [-336, 612, 90],
];

/** The bypass: leaves the paddock road before Big Red and winds up the spur's west side. */
export const bigRedBypass: Waypoint[] = [
  [-410, 820, 21.9],
  [-448, 792],
  [-470, 746],
  [-470, 702, 41],
  [-462, 652, 52],
  [-432, 612, 64],
  [-392, 598, 77],
  [-352, 594, 88],
  [-336, 612, 90],
];

/** North along the range through the rainforest to Roaring Meg Creek. */
export const crebRidge: Waypoint[] = [
  [-336, 612, 90],
  [-300, 560],
  [-322, 500],
  [-282, 450],
  [-252, 400],
  [-272, 340],
  [-232, 296],
  [-196, 272],
  [-160, 262, 122.3],
];

/** Out of Roaring Meg's gorge and up the spur to the foot of Bob's Hill. */
export const roaringMegClimb: Waypoint[] = [
  [-160, 262, 122.3],
  [-150, 228],
  [-176, 186],
  [-182, 130],
  [-140, 80],
  [-110, 30],
  [-120, -20, 129],
];

/** Bob's Hill: the steep, rutted, rocky pinch near halfway. */
export const bobsHill: Waypoint[] = [
  [-120, -20, 129],
  [-102, -60, 130],
  [-86, -100, 147],
  [-70, -140, 151],
  [-48, -172, 146],
];

/** Across the top of the range to the lookout. */
export const rangeTop: Waypoint[] = [
  [-48, -172, 146],
  [-8, -204],
  [-30, -252],
  [-2, -300],
  [20, -345, 130],
];

/** The long steep descent towards Wujal Wujal, concreted on its steepest pinches. */
export const concreteDescent: Waypoint[] = [
  [20, -345, 130],
  [65, -372, 116],
  [98, -408, 99],
  [80, -452, 86],
  [36, -480, 81],
  [8, -512, 70],
  [30, -545, 55],
  [80, -560, 47],
  [120, -578, 35],
];

/** Through Donovan's Creek and down to the Bloomfield River bridge. */
export const donovansCreek: Waypoint[] = [
  [120, -578, 35],
  [150, -596],
  [176, -610],
  [188, -618],
  [204, -650],
  [234, -700],
  [262, -730, 8.5],
];

/** Over the Bloomfield River. */
export const bloomfieldBridge: Waypoint[] = [
  [262, -730, 8.5],
  [290, -770],
  [316, -812, 8.5],
];

/** The Bloomfield Track north-east through Rossville to the Lions Den. */
export const bloomfieldTrack: Waypoint[] = [
  [316, -812, 8.5],
  [350, -880],
  [420, -930],
  [510, -950],
  [600, -930],
  [690, -950],
  [780, -1000],
  [880, -990],
  [980, -960],
  [1080, -980],
  [1170, -1040],
  [1215, -1120],
  [1180, -1190],
  [1110, -1215],
  [1060, -1235],
  [1074, -1262],
  [1100, -1296],
  [1150, -1316],
  [1200, -1320],
];

/** Side tracks to the waterfalls. */
export const roaringMegFallsTrack: Waypoint[] = [
  [-150, 228],
  [-124, 244],
  [-106, 258],
];

export const wujalFallsTrack: Waypoint[] = [
  [234, -700],
  [184, -716],
  [130, -730],
  [84, -742],
  [62, -748],
];

/** Strip the pinned heights: the 2D line. */
export const flat = (w: readonly Waypoint[]): XZ[] => w.map((p) => [p[0], p[1]] as const);
