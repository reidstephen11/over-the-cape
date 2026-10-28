import { boulder } from '../courseKit';
import type {
  BogDef,
  CreekDef,
  GullyDef,
  HillDef,
  PoiDef,
  PropDef,
  TrackDef,
  TrackRoughDef,
} from '../../sim/world/mapTypes';

/**
 * Each stretch of the CREB asks something different of the driver, going north:
 *   the village road  – orientation over a spur, one control at a time
 *   the paddock road  – bogs in the hollows and creeks off the range, plus potholes
 *   the range         – Big Red's crown, the ridge washout, Roaring Meg's ledge, Bob's Hill,
 *                       the sideling
 *   the Bloomfield Track – creeks, bogs, a wet clay pinch and a granite pinch
 * The roads climb real hills (`stretchHills`) rather than embankments on the flat. Deep
 * bogs lie across the roads in the hollows. The ridge still keeps the hollow in the saddle
 * and the long wet stretch below Roaring Meg camp.
 */

/** Shared by the gravel roads: corrugated and potholed after the wet. */
const roadRough: TrackRoughDef = {
  bumps: 0.14,
  swells: 0.3,
  potholes: 7,
  potholeDepth: 0.3,
  washouts: 2,
  washoutDepth: 0.3,
  bogs: 1.2,
  bogDepth: 0.3,
  sumpDepth: 0.7,
  longBogs: 0.45,
  plainBogs: 0,
  longBogsKept: 0,
};

/** The range tracks: washed out, with mud only where it lies deep or long. */
const rangeRough: TrackRoughDef = {
  bumps: 0.14,
  swells: 0.18,
  potholes: 3,
  potholeDepth: 0.28,
  washouts: 6,
  washoutDepth: 0.38,
  bogs: 1.6,
  bogDepth: 0.3,
  sumpDepth: 0.7,
  longBogs: 0.35,
  plainBogs: 0,
  longBogsKept: 0,
};

/**
 * Ground under the climbs, so a road climbs a hill rather than an embankment built on the
 * flat. Each is shaped to the track's pinned profile over it.
 */
export const stretchHills: HillDef[] = [
  // Out of the village: a bench the low-range ramp climbs onto, then a knoll above the river.
  { id: 'village-bench', x: -60, z: 2490, radius: 45, height: 13, shape: 'dome', stretch: [1.8, 1, -63.4] },
  { id: 'village-knoll', x: -42, z: 2385, radius: 95, height: 19, shape: 'dome' },
  // Big Red's face lies back to the line of the climb, so the track is not cut in a trench.
  { id: 'big-red-face', x: 8, z: 1200, radius: 55, height: -5, shape: 'dome' },
  // North of the Bloomfield the road goes straight over two knolls rather than round them.
  { id: 'rossville-knoll', x: -121, z: -1530, radius: 90, height: 14, shape: 'dome' },
  { id: 'helenvale-knoll', x: 214, z: -1975, radius: 85, height: 18, shape: 'dome' },
];

/** Changes to the CREB's tracks, by track id, laid over crebMap's own definitions. */
/**
 * Big Red's crown is a mild rut the locked crawl walks. The left gutter is dug deep
 * enough that a line drifted left high-centres; high range still has no grip on the clay.
 */
const bigRedCrown = { bumps: 0.07, swells: 0.05, washouts: 2, washoutDepth: 0.16 } as const;

export const stretchTracks: Record<string, Partial<TrackDef>> = {
  'upper-daintree-road': {
    rough: { ...roadRough, bogs: 0, washouts: 1, washoutDepth: 0.16 },
    pinSmooth: 10,
    // A band of rock across the bench, with boulders either side.
    rockySteps: [{ at: 175, rise: 0.42 }],
    stones: [boulder(173, -3.6, 0.8, 1.5), boulder(178, 3.7, 0.7, 1.3)],
    routeHint: 'One control at a time: low range L, locks Z and X, crawl P, then the winch',
  },
  // Potholes still pinch a tyre taken fast. The bogs lie across the road in the hollows,
  // and two creeks come down off the range through the hollows.
  'paddock-road': {
    rough: { ...roadRough, potholes: 11, potholeDepth: 0.34, bogs: 0 },
    routeHint: 'Bogs in the hollows and creeks off the range. Keep moving in the water',
  },
  // The ridge keeps its deep bog and the long wet stretch below Roaring Meg camp.
  'creb-ridge': {
    rough: { ...rangeRough, longBogsKept: undefined },
  },
  // Out of Roaring Meg's gorge the track climbs a rock ledge.
  'roaring-meg-climb': { rough: rangeRough, rockySteps: [{ at: 207, rise: 1 }] },
  // Bob's Hill: boulders beside the steepest of the pinch.
  'bobs-hill': {
    stones: [boulder(56, -3.2, 0.7, 1.3), boulder(70, 3.3, 0.8, 1.4), boulder(84, -3.4, 0.6, 1.2)],
  },
  // Along the top the track sidles round the hill, leaning out towards the drop.
  'range-top': {
    rough: rangeRough,
    cant: [
      [160, 0],
      [175, -21],
      [205, -21],
      [220, 0],
    ],
  },
  'donovans-creek': { rough: rangeRough },
  'roaring-meg-falls': { rough: rangeRough },
  'wujal-falls': { rough: rangeRough },
  // Two climbs: the gravel has washed off the pinch over the Rossville knoll, leaving wet
  // clay at about 21°; on the Helenvale knoll granite ledges stand out of the road.
  'bloomfield-track': {
    rough: { ...roadRough, potholes: 4, bogs: 0 },
    clay: [[855, 925]],
    rockySteps: [
      { at: 1452, rise: 0.4 },
      { at: 1464, rise: 0.5 },
      { at: 1477, rise: 0.45 },
      { at: 1490, rise: 0.55 },
      { at: 1502, rise: 0.4 },
    ],
    stones: [
      // Granite either side of the ledges, and on the treads under one wheel then the other.
      boulder(1449, -3.1, 0.8, 1.5),
      boulder(1460, 3.2, 0.9, 1.6),
      boulder(1471, -3.3, 0.7, 1.3),
      boulder(1484, 3.0, 0.85, 1.5),
      boulder(1497, -3.0, 0.75, 1.4),
      boulder(1469, 0.8, 0.42, 0.9, 1.1),
      boulder(1482, -0.8, 0.42, 0.9, 1.1),
      boulder(1495, 0.8, 0.4, 0.9, 1.1),
    ],
    routeHint: 'A creek, a bog or a climb every few hundred metres. Keep moving in the water',
  },
  'big-red-bypass': { rockySteps: [{ at: 190, rise: 0.6 }] },
  'chicken-track': { rockySteps: [{ at: 165, rise: 0.65 }] },
  'big-red': {
    ruts: 0.04,
    rough: bigRedCrown,
    routeHint: 'Low range, both lockers, crawl the crown. The left gutter is dug out',
    // Metres along, metres right of the centreline.
    // The shallow rut sits under the crown's left wheel only: an open diff spins it,
    // a locker lets the right wheel pull. The two deeper gutters sit under the wheels
    // of a line drifted about 1.1 m left, and clear of the crown.
    erosion: [
      {
        path: [
          [16, -0.86],
          [60, -0.88],
          [110, -0.84],
          [158, -0.86],
        ],
        width: 0.5,
        depth: 0.27,
      },
      {
        path: [
          [18, -1.78],
          [75, -1.85],
          [130, -1.75],
          [160, -1.72],
        ],
        width: 0.55,
        depth: 0.52,
      },
      {
        path: [
          [22, -0.35],
          [80, -0.38],
          [134, -0.34],
          [158, -0.36],
        ],
        width: 0.3,
        depth: 0.48,
      },
    ],
  },
};

/**
 * A washout across the ridge, too wide to drive across without the planks. Half a metre deep
 * with sheer sides: deeper than the wheels' radius for every vehicle but the Unimog, whose big
 * wheels climb out of it (and whose weight shoves a plank aside).
 */
export const crebWashout: GullyDef = {
  id: 'ridge-washout',
  x: -23.85,
  z: 791.18,
  headingDeg: 55.2,
  length: 26,
  gap: 1.3,
  depth: 0.5,
};

/**
 * A deep bog centred on the road. radiusX is across the track and wider than the
 * shoulders, so the line cannot slip round it.
 */
function roadBog(id: string, x: number, z: number, headingDeg: number, radiusX: number, radiusZ = 8): BogDef {
  return { id, x, z, radiusX, radiusZ, rotationDeg: headingDeg, depth: 0.72, deep: true, winchTrees: true };
}

/** On-road bogs, in the hollows where the water lies. Ids keep the `-mud-` shape the track surveys already use. */
export const crebRoadBogs: BogDef[] = [
  roadBog('upper-daintree-road-mud-0', -73.55, 2327.02, 11.8, 6.2, 7),
  roadBog('paddock-road-mud-0', 125.54, 2012.66, 52.7, 7, 8),
  roadBog('paddock-road-mud-1', -52.39, 1731.12, -73.6, 7, 8),
  roadBog('big-red-bypass-mud-0', -106.66, 1271.54, -19, 5.2, 7),
  roadBog('bloomfield-track-mud-0', 140.13, -908.51, 36.4, 7.2, 8),
  roadBog('bloomfield-track-mud-1', -46.05, -1677.72, 48.9, 7.2, 8),
  roadBog('bloomfield-track-mud-2', -4.53, -2202.42, -49.6, 7.2, 8),
];

/**
 * A small creek straight across a road at a crossing (x, z, the track's
 * heading), laid from `levels`: [metres right of the track, water height] from upstream
 * down, the water kept below the ground beside it all the way.
 */
function creekAcross(
  id: string,
  [x, z, headingDeg]: readonly [number, number, number],
  levels: ReadonlyArray<readonly [number, number]>,
  {
    halfWidth = 3,
    depth = 0.45,
    flow = 1.6,
    hole,
  }: { halfWidth?: number; depth?: number; flow?: number; hole?: number } = {},
): CreekDef {
  const h = (headingDeg * Math.PI) / 180;
  const at = (l: number) => [x + Math.cos(h) * l, z + Math.sin(h) * l].map((v) => Math.round(v * 10) / 10);
  return {
    id,
    name: 'Creek',
    valley: 24,
    flow,
    // A scour hole `hole` metres downstream of the ford.
    holes: hole === undefined ? undefined : [{ x: at(-hole)[0], z: at(-hole)[1], radius: 2.2, depth: 0.6 }],
    points: levels.map(([l, water]) => ({
      x: at(l)[0],
      z: at(l)[1],
      water,
      halfWidth,
      depth,
      bed: 'gravel' as const,
      bankSlope: 0.35,
    })),
  };
}

/** Where the creeks cross the roads (x, z, the track's heading). */
const fords = {
  paddockSouth: [125.49, 1797.42, -61.9],
  paddockNorth: [-232.5, 1634.35, -18.1],
  south: [148.22, -1229.24, -61.4],
  middle: [-82.83, -1399.01, -35.1],
  north: [175.88, -1846.9, 40.7],
} as const;

/** North of the Bloomfield the track crosses a run of small creeks coming off the hills. */
export const stretchCreeks: CreekDef[] = [
  // Off the range across the paddocks: the road drops into each and climbs a steep bank out.
  creekAcross('paddock-creek-south', fords.paddockSouth, [
    [70, 12.5],
    [60, 11.8],
    [50, 10.2],
    [40, 8.5],
    [30, 7.6],
    [20, 7.4],
    [10, 7.4],
    [0, 7.3],
    [-10, 7.2],
    [-20, 7.0],
    [-30, 5.6],
    [-40, 4.6],
    [-50, 4.6],
    [-60, 4.6],
    [-70, 4.5],
  ]),
  creekAcross('paddock-creek-north', fords.paddockNorth, [
    [20, 7.0],
    [10, 6.6],
    [0, 5.4],
    [-10, 4.0],
    [-20, 3.3],
    [-30, 3.3],
    [-40, 3.2],
    [-50, 2.4],
    [-60, 1.4],
    [-70, 1.3],
  ]),
  creekAcross('bloomfield-creek-south', fords.south, [
    [10, 8.35],
    [0, 7.95],
    [-10, 7.45],
    [-30, 7.45],
    [-50, 7.4],
    [-60, 6.55],
    [-70, 6.15],
    [-80, 4.85],
    [-90, 3.55],
    [-100, 2.95],
  ]),
  creekAcross(
    'bloomfield-creek-middle',
    fords.middle,
    [
      [20, 8.9],
      [10, 8.2],
      [0, 7.4],
      [-10, 7.0],
      [-20, 6.6],
      [-30, 6.1],
      [-40, 6.05],
      [-50, 5.7],
      [-60, 4.7],
      [-70, 4.1],
    ],
    { halfWidth: 4, depth: 0.55, flow: 2.4, hole: 5.5 },
  ),
  creekAcross('bloomfield-creek-north', fords.north, [
    [-40, 7.5],
    [-30, 6.7],
    [-20, 5.3],
    [-10, 4.4],
    [0, 4.15],
    [10, 3.3],
    [20, 2.0],
  ]),
];

/**
 * Stretches of road to take slowly in low range, by track id: [from, to] metres along it.
 * The route drive (scripts/creb-drive.ts) and the tests crawl through them, as a driver would.
 */
export const crawlStretches: Record<string, ReadonlyArray<readonly [number, number]>> = {
  'upper-daintree-road': [
    [80, 160],
    [200, 270],
    [160, 200],
    [310, 360],
  ],
  'paddock-road': [
    [210, 280],
    [480, 530],
    [660, 730],
    [880, 930],
  ],
  'big-red-bypass': [
    [110, 160],
    [165, 230],
  ],
  'bloomfield-track': [
    [80, 150],
    [480, 520],
    [770, 810],
    [850, 935],
    [1065, 1140],
    [1360, 1400],
    [1440, 1515],
    [1815, 1890],
    // The Little Annan's ford.
    [2150, 2215],
  ],
};

export const stretchPois: PoiDef[] = [
  {
    id: 'orient-low-range',
    name: 'Low range ramp',
    kind: 'feature',
    x: -79.05,
    z: 2529.24,
    radius: 18,
    note: 'First lesson: low range',
  },
  {
    id: 'orient-lockers',
    name: 'Locker pinch',
    kind: 'feature',
    x: -30.34,
    z: 2420.45,
    radius: 16,
    note: 'Second lesson: both diff locks',
  },
  {
    id: 'orient-crawl',
    name: 'Crawl step',
    kind: 'feature',
    x: -46.79,
    z: 2472.89,
    radius: 14,
    note: 'Third lesson: precision crawl',
  },
  {
    id: 'orient-winch',
    name: 'Winch bog',
    kind: 'feature',
    x: -73.55,
    z: 2327.02,
    radius: 16,
    note: 'Fourth lesson: the winch',
  },
  {
    id: 'paddock-creeks',
    name: 'Paddock creeks',
    kind: 'feature',
    x: fords.paddockSouth[0],
    z: fords.paddockSouth[1],
    radius: 20,
    note: 'Creeks off the range, with wet banks to climb out of',
  },
  {
    id: 'ridge-washout',
    name: 'Washout',
    kind: 'feature',
    x: crebWashout.x,
    z: crebWashout.z,
    radius: 22,
    note: 'Cut across the track by the wet; bridge it with the planks',
  },
  {
    id: 'roaring-meg-ledge',
    name: 'Rock ledge',
    kind: 'feature',
    x: -9,
    z: 331,
    radius: 18,
    note: 'A metre-high step of rock across the climb',
  },
  {
    id: 'range-sideling',
    name: 'Sideling',
    kind: 'feature',
    x: 22,
    z: -100,
    radius: 26,
    note: 'The track leans out over the drop',
  },
  {
    id: 'bloomfield-creeks',
    name: 'Creek crossings',
    kind: 'feature',
    x: fords.middle[0],
    z: fords.middle[1],
    radius: 24,
    note: 'Fast creeks off the hills; a scour hole below the ford',
  },
  {
    id: 'rossville-pinch',
    name: 'Rossville pinch',
    kind: 'feature',
    x: -119.58,
    z: -1490.85,
    radius: 22,
    note: 'The gravel has washed off: wet red clay straight up the knoll',
  },
  {
    id: 'helenvale-granite',
    name: 'Granite pinch',
    kind: 'feature',
    x: 219.37,
    z: -1930.16,
    radius: 22,
    note: 'Granite ledges standing out of the climb',
  },
];

/** Signs ahead of the obstacles, facing the traffic coming north. */
export const stretchProps: PropDef[] = [
  { kind: 'signpost', x: -83.53, z: 2573.4, headingDeg: 163, text: 'Low range — L' },
  { kind: 'signpost', x: -52.36, z: 2492.83, headingDeg: 211, text: 'Crawl — P' },
  { kind: 'signpost', x: -38.33, z: 2461.97, headingDeg: 198, text: 'Diff locks — Z X' },
  { kind: 'signpost', x: -67.23, z: 2350.4, headingDeg: 151, text: 'Winch — E R F' },
  { kind: 'signpost', x: 163.3, z: 1979.1, headingDeg: 215, text: 'Potholes' },
  { kind: 'signpost', x: 103.49, z: 2033.62, headingDeg: 236, text: 'Bog — winch' },
  { kind: 'signpost', x: 152.97, z: 1811.61, headingDeg: 134, text: 'Creek' },
  { kind: 'signpost', x: -22.44, z: 1736.05, headingDeg: 108, text: 'Bog — winch' },
  { kind: 'signpost', x: -211.88, z: 1654.97, headingDeg: 133, text: 'Creek' },
  { kind: 'signpost', x: -93.52, z: 1296.4, headingDeg: 158, text: 'Bog, then pinch' },
  { kind: 'signpost', x: -12.5, z: 802, headingDeg: 150, text: 'Washout' },
  { kind: 'signpost', x: -101.76, z: 923.41, headingDeg: 198, text: 'Ledge — low range' },
  { kind: 'signpost', x: 128.74, z: -881.05, headingDeg: 205, text: 'Bog — winch' },
  { kind: 'signpost', x: -99.07, z: -1435.33, headingDeg: 155, text: 'Steep clay — low range' },
  { kind: 'signpost', x: -64.55, z: -1653.92, headingDeg: 224, text: 'Bog — winch' },
  { kind: 'signpost', x: 203.29, z: -1876.87, headingDeg: 211, text: 'Granite — crawl' },
  { kind: 'signpost', x: 21.18, z: -2186.47, headingDeg: 129, text: 'Bog — winch' },
];
