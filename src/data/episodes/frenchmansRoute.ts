import type { Waypoint } from './crebRoute';

/** West to east, shortened distances; x = east, z = south. Shared endpoints keep the route joined. */
export const westernApproach: Waypoint[] = [
  [-3800, 0],
  [-3660, -10],
  [-3470, -45],
  [-3260, -18],
  [-3070, 26],
  [-2870, 50],
  [-2680, 40],
  [-2550, 20, 39.7],
];
export const wenlockCrossing: Waypoint[] = [
  [-2550, 20, 39.7],
  [-2490, 20, 37.5],
  [-2440, 20, 35.5],
  [-2400, 20, 32.82],
  [-2360, 20, 35.5],
  [-2310, 20, 37.5],
  [-2250, 20, 39.7],
];
export const wetHeath: Waypoint[] = [
  [-2250, 20, 39.7],
  [-2100, -6],
  [-1900, -40],
  [-1700, -20],
  [-1500, 26],
  [-1290, 62],
  [-1100, 35],
  [-900, -14],
  [-700, -54],
  [-500, -30],
  [-300, 20],
  [-100, 42],
  [120, 12],
  [330, -28],
  [540, -54],
  [750, -16],
  [960, 28],
  [1170, 54],
  [1370, 30],
  [1550, 0],
  [1660, 0, 43],
];
/** The western bank is the harder descent, with enough room to line up a trailer. */
export const pascoeCrossing: Waypoint[] = [
  [1660, 0, 43],
  [1720, 0, 40],
  [1780, 0, 30],
  [1830, 0, 24],
  [1860, 0, 23.5],
  [1900, 0, 21.5],
  [1940, 0, 23.5],
  [1990, 0, 27],
  [2050, 0, 34],
  [2110, 0, 36],
];
export const easternApproach: Waypoint[] = [
  [2110, 0, 36],
  [2280, -18],
  [2460, -52],
  [2650, -26],
  [2850, 26],
  [3070, 48],
  [3280, 20],
  [3490, -16],
  [3690, 0],
  [3800, 0],
];

export const frenchmansLegs = [
  ['western-approach', 6],
  ['wenlock-crossing', 3],
  ['wet-heath', 5],
  ['pascoe-crossing', 2.2],
  ['eastern-approach', 6],
] as const;
