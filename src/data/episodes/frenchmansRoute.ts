import type { Waypoint } from './crebRoute';

/** Authored driving lines, west to east. Camp IDs are retained; the empty road stretches have been shortened. */
export const westernApproach: Waypoint[] = [
  [-3240, -135],
  [-3180, -165],
  [-3110, -100],
  [-3090, -10],
  [-3020, 75],
  [-2930, 100],
  [-2870, 50],
  [-2830, -35],
  [-2750, -60],
  [-2690, -20],
  [-2640, -55],
  [-2590, -25],
  [-2550, 20, 39.7],
];
export const wenlockCrossing: Waypoint[] = [
  [-2550, 20, 39.7],
  [-2510, 65, 39],
  [-2475, 80, 37],
  [-2440, 65, 35.5],
  [-2418, 49, 33.6],
  [-2400, 38, 32.7],
  [-2384, 27, 33.5],
  [-2360, 10, 35.5],
  [-2330, -30, 37.8],
  [-2290, -32, 40.2],
  [-2250, 20, 39.7],
];
export const heathApproach: Waypoint[] = [
  [-2250, 20, 39.7],
  [-2210, 24],
  [-2140, -35],
  [-2090, -110],
  [-2020, -140],
  [-1960, -85],
  [-1930, 10],
  [-1860, -85],
  [-1810, -45],
  [-1770, 10, 49],
];
/** The short line crosses a deep bog; the firm loop takes time and careful trailer tracking. */
export const heathBog: Waypoint[] = [
  [-1770, 10, 49],
  [-1710, 10, 48],
  [-1650, 10, 49],
];
export const heathFirmLoop: Waypoint[] = [
  [-1770, 10, 49],
  [-1765, 65, 50],
  [-1730, 110, 52],
  [-1685, 110, 52],
  [-1650, 65, 50],
  [-1650, 10, 49],
];
export const heathRidge: Waypoint[] = [
  [-1650, 10, 49],
  [-1590, -35, 52],
  [-1550, -90, 61],
  [-1510, -110, 73],
  [-1460, -85, 76],
  [-1435, -25, 70],
  [-1380, 10, 59],
  [-1330, 30, 54],
];
export const heathSideling: Waypoint[] = [
  [-1330, 30, 54],
  [-1280, 50, 56],
  [-1240, 100, 60],
  [-1220, 155, 62],
  [-1170, 180, 62],
  [-1120, 150, 59],
  [-1100, 85, 55],
  [-1050, 45, 52],
  [-1000, 40, 51],
];
export const heathGullies: Waypoint[] = [
  [-1000, 40, 51],
  [-940, -5, 52],
  [-900, -70, 51],
  [-840, -85, 46],
  [-800, -40, 40],
  [-750, 0, 42],
  [-710, 60, 51],
  [-660, 85, 57],
  [-610, 45, 56],
  [-580, -25, 52],
  [-530, -55, 50],
  [-480, -20, 50],
];
export const heathEast: Waypoint[] = [
  [-480, -20, 50],
  [-420, 20, 48],
  [-360, 70, 47],
  [-300, 90, 45],
  [-250, 40, 43],
  [-200, 0, 43],
  [-140, 0, 43],
];
/** A rocky descent, a curved shallow line round a scour hole, then a steep eastern climb. */
export const pascoeCrossing: Waypoint[] = [
  [-140, 0, 43],
  [-95, 25, 41],
  [-70, 70, 38],
  [-85, 115, 35],
  [-50, 145, 32],
  [-10, 130, 28],
  [10, 80, 25],
  [30, 30, 24],
  [60, 5, 23.5],
  [82, 5, 21.8],
  [95, 8, 21.5],
  [105, 8, 21.5],
  [120, 6, 22.8],
  [140, 0, 23.5],
  [170, -25, 26],
  [190, -70, 33],
  [235, -90, 38],
  [275, -50, 39],
  [310, 0, 36],
];
export const easternApproach: Waypoint[] = [
  [310, 0, 36],
  [370, 30],
  [410, 100],
  [470, 130],
  [530, 80],
  [550, 10],
  [610, -55],
  [680, -60],
  [740, -15],
  [800, 0],
];

/** The firm loop is the careful towing line. The short bog line remains a winching option. */
export const frenchmansLegs = [
  ['western-approach', 4],
  ['wenlock-crossing', 2.8],
  ['heath-approach', 4],
  ['heath-firm-loop', 1.6],
  ['heath-ridge', 2],
  ['heath-sideling', 1.8],
  ['heath-gullies', 2.8],
  ['heath-east', 4.5],
  ['pascoe-crossing', 1.8],
  ['eastern-approach', 4],
] as const;
