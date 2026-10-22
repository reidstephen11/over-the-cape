import type { CreekDef, GullyDef, PoiDef, PropDef, TrackDef, TrackRoughDef } from '../../sim/world/mapTypes';

/**
 * Each stretch of the CREB asks something different of the driver, going north (v0.09):
 *   the paddock road  – fast gravel, potholed: the risk is pinching a tyre at speed
 *   the range         – a washout across the ridge that needs the planks, rocky ledges out
 *                       of Roaring Meg's gorge, and an off-camber sideling on the range top
 *   the concrete      – the long braking descent, as before
 *   the Bloomfield Track – creek crossings rather than mud
 * The deep bogs (the winch's job) stay where the ground drains into them, and a few long
 * boggy stretches where the track runs flat and wet; the scattered mud holes are gone.
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
export const stretchTracks: Record<string, Partial<TrackDef>> = {
  'upper-daintree-road': { rough: roadRough },
  // Fast, open gravel through the paddocks, pocked with potholes that pinch a tyre taken at
  // speed. Only its deep bog, in a hollow on the river flats, is mud.
  'paddock-road': { rough: { ...roadRough, potholes: 11, potholeDepth: 0.34, sumps: 1 } },
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
  'bloomfield-track': { rough: { ...roadRough, potholes: 4, longBogsKept: 1 } },
};

/** A washout across the ridge, too wide to drive across without the planks. */
export const crebWashout: GullyDef = {
  id: 'ridge-washout',
  x: -23.85,
  z: 791.18,
  headingDeg: 55.2,
  length: 26,
  gap: 1.3,
  depth: 1.5,
};

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
  'bloomfield-track': [
    [480, 520],
    [770, 810],
    [1360, 1400],
  ],
};

export const stretchPois: PoiDef[] = [
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
  { kind: 'signpost', x: 163.3, z: 1979.1, headingDeg: 215, text: 'Potholes' },
  { kind: 'signpost', x: -12.5, z: 802, headingDeg: 150, text: 'Washout' },
];
