import type { XZ } from '../../sim/world/mapTypes';

/**
 * Waypoints of the CREB Track episode, south to north as on the real track. Coordinates
 * in metres: x = east, z = south (north is -z). Heights are pinned where tracks meet, at
 * creek crossings and on the designed climbs; elsewhere the track follows the ground.
 */
export type Waypoint = readonly [number, number] | readonly [number, number, number];

/**
 * Daintree Village north to the south bank of the Daintree River.
 * The heights are the orientation: a low-range ramp, then a steeper locker pinch,
 * easing down to the crawl step and the winch bog before the river.
 */
export const upperDaintreeRoad: Waypoint[] = [
  [-60, 2630, 8],
  [-80, 2594, 9],
  [-90, 2557, 7],
  [-74, 2520, 19],
  [-50, 2480, 19.5],
  [-38, 2446, 14],
  [-30, 2410, 27],
  [-48, 2378, 28],
  [-72, 2350, 16],
  [-70, 2318, 10],
  [-40, 2300, 6],
];

/**
 * Across the Daintree River downstream of the straight line, over the gravel bar, weaving
 * between the boulders and scour holes on it.
 */
export const daintreeCrossing: Waypoint[] = [
  [-40, 2300, 6],
  [-10, 2282],
  [8, 2266],
  [13.5, 2252],
  [1.5, 2242],
  [8, 2231],
  [-4.5, 2221],
  [-4, 2210],
  [-10, 2194, 6],
];

/** The gravel road north through the Upper Daintree paddocks to the foot of the range. */
export const paddockRoad: Waypoint[] = [
  [-10, 2194, 6],
  [-2, 2130],
  [60, 2060],
  [150, 1990],
  [190, 1900],
  [150, 1815],
  [60, 1770],
  [-40, 1735],
  [-150, 1700],
  [-230, 1640],
  [-220, 1570],
  [-167, 1511],
  [-118, 1440],
  [-56, 1407],
  [-9, 1358, 21.9],
  [11, 1298, 34],
];

/** Big Red: straight up the red clay face of the spur. */
export const bigRed: Waypoint[] = [
  [11, 1298, 34],
  [7, 1262, 45.5],
  [2, 1226, 57.5],
  [-2, 1194, 71],
  [-6, 1166, 82],
  [-11, 1138, 90],
];

/**
 * The west line round Big Red. It is longer than the face, levels off for a bog,
 * then climbs a pinch as steep as the face itself.
 */
export const bigRedBypass: Waypoint[] = [
  [-9, 1358, 21.9],
  [-55, 1345, 28],
  [-91, 1309, 34],
  [-102, 1284, 36],
  [-110, 1260, 36],
  [-114, 1232, 48],
  [-108, 1204, 58],
  [-90, 1172, 68],
  [-60, 1148, 80],
  [-32, 1126, 88],
  [-11, 1138, 90],
];

/** North along the crest of the range through the rainforest to Roaring Meg Creek. */
export const crebRidge: Waypoint[] = [
  [-11, 1138, 90],
  [5, 1076],
  [-36, 1028],
  [-8, 960],
  [-40, 890],
  [-12, 820],
  [-34, 770],
  [-16, 727],
  [-5, 670],
  [-44, 620],
  [-21, 565],
  [4, 530],
  [35, 508, 122.3],
];

/** Out of Roaring Meg's gorge and up the spur to the foot of Bob's Hill. */
export const roaringMegClimb: Waypoint[] = [
  [35, 508, 122.3],
  [32, 473],
  [-6, 443],
  [-31, 392],
  [-9, 331],
  [2, 273],
  [-24, 230, 129],
];

/** Bob's Hill: the steep, rutted, rocky pinch near halfway. */
export const bobsHill: Waypoint[] = [
  [-24, 230, 129],
  [-21, 186, 130],
  [-20, 143, 147],
  [-18, 100, 151],
  [-9, 62, 146],
];

/** Along the top of the range to the lookout. */
export const rangeTop: Waypoint[] = [
  [-9, 62, 146],
  [18, 19],
  [-12, -40],
  [22, -100],
  [-19, -159],
  [-9, -214],
  [-4, -263, 130],
];

/** The long steep descent towards Wujal Wujal, concreted on its steepest pinches. */
export const concreteDescent: Waypoint[] = [
  [-4, -263, 130],
  [29, -304, 116],
  [48, -349, 99],
  [16, -385, 86],
  [-35, -396, 81],
  [-72, -416, 70],
  [-63, -455, 55],
  [-21, -486, 47],
  [10, -517, 35],
];

/** Through Donovan's Creek and down to the Bloomfield River bridge. */
export const donovansCreek: Waypoint[] = [
  [10, -517, 35],
  [32, -544],
  [52, -566],
  [61, -577],
  [65, -613, 12],
  [76, -670, 7.6],
  [92, -708, 7.5],
];

/** Over the Bloomfield River. */
export const bloomfieldBridge: Waypoint[] = [
  [92, -708, 7.5],
  [105, -755],
  [115, -804, 7.5],
];

/** The Bloomfield Track north through Rossville and across the Little Annan to the Lions Den. */
export const bloomfieldTrack: Waypoint[] = [
  [115, -804, 7.5],
  [123, -879],
  [172, -950],
  [230, -1030],
  [240, -1120],
  [190, -1200],
  [110, -1250],
  [20, -1300],
  [-60, -1370],
  [-110, -1450],
  [-120, -1540],
  [-90, -1630],
  [-20, -1700],
  [60, -1760],
  [150, -1820],
  [210, -1900],
  [220, -1990],
  [170, -2070],
  [90, -2130],
  [10, -2190],
  [-60, -2260],
  [-80, -2340],
  [-40, -2410],
  [40, -2458],
  [80, -2505],
  [96, -2548],
];

/** Side tracks to the waterfalls. */
export const roaringMegFallsTrack: Waypoint[] = [
  [32, 473],
  [62, 479],
  [84, 486],
];

export const wujalFallsTrack: Waypoint[] = [
  [76, -670],
  [23, -668],
  [-32, -663],
  [-79, -658],
  [-102, -657],
];

/** Strip the pinned heights: the 2D line. */
export const flat = (w: readonly Waypoint[]): XZ[] => w.map((p) => [p[0], p[1]] as const);
