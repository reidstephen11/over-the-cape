import type {
  BogDef,
  CreekDef,
  GullyDef,
  PoiDef,
  PropDef,
  TrackDef,
  TrackRoughDef,
} from '../../sim/world/mapTypes';

/**
 * Each stretch of the CREB asks something different of the driver, going north:
 *   the village road  – orientation, one control at a time
 *   the paddock road  – a bog, a step or a plank gap every few hundred metres, plus potholes
 *   the range         – Big Red's crown, the ridge washout, Roaring Meg's ledge, the sideling
 *   the Bloomfield Track – creeks, bogs and steps rather than empty gravel
 * Deep bogs on the roads are authored across the wheel lines. The ridge still keeps the
 * hollow in the saddle and the long wet stretch below Roaring Meg camp.
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
    rockySteps: [{ at: 175, rise: 0.42 }],
    routeHint: 'One control at a time: low range L, locks Z and X, crawl P, then the winch',
  },
  // Potholes still pinch a tyre taken fast. The bogs are authored across the road, not
  // scattered in the hollows where a driver can miss them.
  'paddock-road': {
    rough: { ...roadRough, potholes: 11, potholeDepth: 0.34, bogs: 0 },
    rockySteps: [
      { at: 560, rise: 0.58 },
      { at: 960, rise: 0.55 },
    ],
    routeHint: 'The holes are on the road. Low range for the step; winch or planks for the gaps',
  },
  // The ridge keeps its deep bog and the long wet stretch below Roaring Meg camp.
  'creb-ridge': {
    rough: { ...rangeRough, longBogsKept: undefined },
  },
  // Out of Roaring Meg's gorge the track climbs a rock ledge.
  'roaring-meg-climb': { rough: rangeRough, rockySteps: [{ at: 207, rise: 1 }] },
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
  'bloomfield-track': {
    rough: { ...roadRough, potholes: 4, bogs: 0 },
    rockySteps: [
      { at: 680, rise: 0.65 },
      { at: 1620, rise: 0.7 },
    ],
    routeHint: 'A creek, a bog or a step every few hundred metres. Keep moving in the water',
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
          [55, -0.88],
          [100, -0.84],
          [145, -0.86],
        ],
        width: 0.5,
        depth: 0.24,
      },
      {
        path: [
          [18, -1.78],
          [70, -1.85],
          [120, -1.75],
          [148, -1.72],
        ],
        width: 0.55,
        depth: 0.52,
      },
      {
        path: [
          [22, -0.35],
          [74, -0.38],
          [124, -0.34],
          [146, -0.36],
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

/** A plank gap across a road: same lip and depth as the ridge washout, so it is not optional. */
function plankGap(id: string, x: number, z: number, headingDeg: number): GullyDef {
  return { id, x, z, headingDeg, length: 18, gap: 1.3, depth: 0.5 };
}

/**
 * A deep bog centred on the road. radiusX is across the track and wider than the
 * shoulders, so the line cannot slip round it.
 */
function roadBog(id: string, x: number, z: number, headingDeg: number, radiusX: number, radiusZ = 8): BogDef {
  return { id, x, z, radiusX, radiusZ, rotationDeg: headingDeg, depth: 0.72, deep: true, winchTrees: true };
}

/** On-road bogs. Ids keep the `-mud-` shape the track surveys already use. */
export const crebRoadBogs: BogDef[] = [
  roadBog('upper-daintree-road-mud-0', -73.55, 2327.02, 11.8, 6.2, 7),
  roadBog('paddock-road-mud-0', 125.54, 2012.66, 52.7, 7, 8),
  roadBog('paddock-road-mud-1', -81.3, 1723.12, -75, 7, 8),
  roadBog('big-red-bypass-mud-0', -106.66, 1271.54, -19, 5.2, 7),
  roadBog('bloomfield-track-mud-0', 195.59, -979.36, 40.1, 7.2, 8),
  roadBog('bloomfield-track-mud-1', -46.05, -1677.72, 48.9, 7.2, 8),
];

/** Plank gaps on the two long roads, in addition to the ridge washout. */
export const crebRoadGaps: GullyDef[] = [
  plankGap('paddock-gap', -126.98, 1449.91, 128.4),
  plankGap('bloomfield-gap', -27.08, -2222.2, 42.7),
];

/**
 * A small creek straight across the Bloomfield Track at a crossing (x, z, the track's
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

/** Where the Bloomfield Track's creeks cross it (x, z, the track's heading). */
const fords = {
  south: [148.22, -1229.24, -61.4],
  middle: [-82.83, -1399.01, -35.1],
  north: [175.88, -1846.9, 40.7],
} as const;

/** North of the Bloomfield the track crosses a run of small creeks coming off the hills. */
export const stretchCreeks: CreekDef[] = [
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
    [520, 600],
    [690, 760],
    [920, 1000],
    [1085, 1160],
  ],
  'big-red-bypass': [
    [110, 160],
    [165, 230],
  ],
  'bloomfield-track': [
    [170, 240],
    [480, 520],
    [640, 720],
    [770, 810],
    [1065, 1140],
    [1360, 1400],
    [1575, 1660],
    [1845, 1920],
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
    id: 'paddock-gap',
    name: 'Paddock gap',
    kind: 'feature',
    x: -126.98,
    z: 1449.91,
    radius: 16,
    note: 'A plank gap across the paddock road',
  },
  {
    id: 'bloomfield-gap',
    name: 'Bloomfield gap',
    kind: 'feature',
    x: -27.08,
    z: -2222.2,
    radius: 16,
    note: 'A plank gap on the Bloomfield Track',
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
];

/** Signs ahead of the obstacles, facing the traffic coming north. */
export const stretchProps: PropDef[] = [
  { kind: 'signpost', x: -83.53, z: 2573.4, headingDeg: 163, text: 'Low range — L' },
  { kind: 'signpost', x: -52.36, z: 2492.83, headingDeg: 211, text: 'Crawl — P' },
  { kind: 'signpost', x: -38.33, z: 2461.97, headingDeg: 198, text: 'Diff locks — Z X' },
  { kind: 'signpost', x: -67.23, z: 2350.4, headingDeg: 151, text: 'Winch — E R F' },
  { kind: 'signpost', x: 163.3, z: 1979.1, headingDeg: 215, text: 'Potholes' },
  { kind: 'signpost', x: 103.49, z: 2033.62, headingDeg: 236, text: 'Bog — winch' },
  { kind: 'signpost', x: 99.91, z: 1780.72, headingDeg: 112, text: 'Rock step' },
  { kind: 'signpost', x: -51.08, z: 1726.71, headingDeg: 107, text: 'Bog — winch' },
  { kind: 'signpost', x: -228.78, z: 1605.73, headingDeg: 192, text: 'Rock step' },
  { kind: 'signpost', x: -139.7, z: 1477.21, headingDeg: 211, text: 'Plank gap' },
  { kind: 'signpost', x: -93.52, z: 1296.4, headingDeg: 158, text: 'Bog, then pinch' },
  { kind: 'signpost', x: -12.5, z: 802, headingDeg: 150, text: 'Washout' },
  { kind: 'signpost', x: -101.76, z: 923.41, headingDeg: 198, text: 'Ledge — low range' },
  { kind: 'signpost', x: 180.36, z: -953.25, headingDeg: 218, text: 'Bog — winch' },
  { kind: 'signpost', x: 19.96, z: -1305.92, headingDeg: 126, text: 'Rock step' },
  { kind: 'signpost', x: -64.55, z: -1653.92, headingDeg: 224, text: 'Bog — winch' },
  { kind: 'signpost', x: 202.75, z: -2037.32, headingDeg: 146, text: 'Rock step' },
  { kind: 'signpost', x: 0.11, z: -2204.78, headingDeg: 130, text: 'Plank gap' },
];
