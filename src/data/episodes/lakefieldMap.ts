import type { BogDef, HorizonDef, MapDef, PropDef, TrackDef, TrackRoughDef } from '../../sim/world/mapTypes';
import {
  hannCrossing,
  lakefieldRoad,
  lauraRiverCrossing,
  lauraRoad,
  musgraveRoad,
  oldLauraRoad,
  plainsRoad,
} from './lakefieldRoute';

/**
 * Episode 3, Lakefield: from Laura out to the Laura River at Old Laura homestead, north
 * through the woodland and over the black soil plains to Lakefield, past a stockman bogged
 * beside the road, over Hann Crossing on the North Kennedy River and on to Musgrave.
 * Distances are shortened; the crossings and the bog are full size. Coordinates in
 * metres: x = east, z = south.
 *
 * The map is a long strip, 1.3 km wide and 7.2 km from south to north:
 *   south  – Laura, the Laura River's sand and Old Laura homestead, then open woodland
 *   middle – the black soil plains round Lakefield, where the stockman is bogged
 *   north  – the North Kennedy River at Hann Crossing, and woodland on to Musgrave
 * It is the end of the dry: the ground is low and flat, and off the road it is black soil
 * that turns to grease in the rain.
 */
const BATTER = 0.5;

/** The park's roads at the end of the dry: corrugated and potholed. */
const roadRough: TrackRoughDef = {
  bumps: 0.1,
  swells: 0.2,
  potholes: 3,
  potholeDepth: 0.24,
  washouts: 1,
  washoutDepth: 0.26,
};
/** Across the plains the road is black soil too: holes that fill with water once it rains. */
const plainsRough: TrackRoughDef = {
  bumps: 0.08,
  swells: 0.16,
  potholes: 3,
  potholeDepth: 0.24,
  bogs: 1,
  bogDepth: 0.26,
  longBogs: 0.3,
  longBogsKept: 3,
};
const road = {
  shoulder: 3,
  batter: BATTER,
  smooth: 10,
  ruts: 0.08,
  camber: 0.3,
  pinMode: 'follow',
  surface: 'dirt',
  rough: roadRough,
} as const;
const crossing = {
  shoulder: 3,
  batter: BATTER,
  smooth: 8,
  ruts: 0.06,
  camber: 0.2,
  pinMode: 'follow',
} as const;

const tracks: TrackDef[] = [
  { id: 'laura-road', name: 'Road to Old Laura', points: lauraRoad, width: 4.4, ...road },
  {
    id: 'laura-river-crossing',
    name: 'Laura River crossing',
    points: lauraRiverCrossing,
    width: 4.2,
    surface: 'sand',
    ...crossing,
  },
  { id: 'old-laura-road', name: 'Lakefield road', points: oldLauraRoad, width: 4, ...road },
  { id: 'plains-road', name: 'Lakefield road', points: plainsRoad, width: 4, ...road, rough: plainsRough },
  {
    id: 'lakefield-road',
    name: 'Hann Crossing road',
    points: lakefieldRoad,
    width: 3.8,
    ...road,
    rough: plainsRough,
  },
  {
    id: 'hann-crossing',
    name: 'Hann Crossing',
    points: hannCrossing,
    width: 4,
    surface: 'gravel',
    ...crossing,
  },
  { id: 'musgrave-road', name: 'Road to Musgrave', points: musgraveRoad, width: 4, ...road },
];

/** Where the stockman's Land Cruiser is bogged: off the road's east side, nose to it. */
export const STOCKMAN_BOG = { x: 22, z: -1132 };

const bogs: BogDef[] = [
  {
    id: 'stockman-bog',
    x: STOCKMAN_BOG.x,
    z: STOCKMAN_BOG.z,
    radiusX: 6.5,
    radiusZ: 4.5,
    rotationDeg: 0,
    depth: 0.45,
    deep: true,
  },
];

/**
 * The country round Lakefield, out to the horizon: flat, the plains and the woodland
 * running on, with the sandstone of Quinkan country standing up to the south behind Laura
 * and low ranges far off to the east.
 */
const horizon: HorizonDef = {
  base: 12,
  relief: 10,
  hills: [
    {
      id: 'quinkan-south-west',
      x: -2600,
      z: 5600,
      radius: 1600,
      height: 110,
      shape: 'mesa',
      stretch: [1.4, 0.7, -10],
    },
    { id: 'quinkan-south-east', x: 2400, z: 6200, radius: 1500, height: 90, shape: 'mesa' },
    { id: 'east-range-south', x: 5200, z: 1200, radius: 1800, height: 120, shape: 'dome' },
    { id: 'east-range-north', x: 5600, z: -2600, radius: 1700, height: 100, shape: 'dome' },
  ],
  ridges: [],
  valleys: [],
  woodland: [{ x: 0, z: 0, radius: 40000 }],
};

const props: PropDef[] = [
  // Laura, where the run starts.
  { kind: 'hut', x: -78, z: 3404, headingDeg: 110, flatten: 8 },
  { kind: 'waterTank', x: -66, z: 3420, headingDeg: 0 },
  { kind: 'signpost', x: -18, z: 3360, headingDeg: 190, text: 'Old Laura' },
  // Old Laura homestead, above the river on the north bank: the house, a shed and the tank.
  { kind: 'hut', x: -62, z: 2552, headingDeg: 80, flatten: 9 },
  { kind: 'hut', x: -84, z: 2578, headingDeg: 170, flatten: 7 },
  { kind: 'waterTank', x: -52, z: 2572, headingDeg: 0 },
  { kind: 'signpost', x: -6, z: 2600, headingDeg: 190, text: 'Old Laura' },
  { kind: 'signpost', x: -16, z: 2530, headingDeg: 190, text: 'Lakefield' },
  // Lakefield: the old homestead and its tank.
  { kind: 'hut', x: 52, z: -246, headingDeg: 260, flatten: 9 },
  { kind: 'waterTank', x: 60, z: -226, headingDeg: 0 },
  { kind: 'signpost', x: 10, z: -214, headingDeg: 190, text: 'Lakefield' },
  { kind: 'signpost', x: -18, z: -300, headingDeg: 190, text: 'Hann Crossing' },
  // The camp on the north bank at Hann Crossing.
  { kind: 'fireRing', x: 34, z: -2128, headingDeg: 0, flatten: 3 },
  { kind: 'logSeat', x: 36, z: -2136, headingDeg: 60 },
  { kind: 'signpost', x: 10, z: -2110, headingDeg: 190, text: 'Musgrave' },
  // Musgrave: the old telegraph station and its tank.
  { kind: 'hut', x: 44, z: -3372, headingDeg: 250, flatten: 9 },
  { kind: 'waterTank', x: 56, z: -3356, headingDeg: 0 },
  { kind: 'signpost', x: 8, z: -3300, headingDeg: 190, text: 'Musgrave' },
];

export const lakefieldMap: MapDef = {
  id: 'lakefield',
  name: 'Lakefield',
  seed: 1986,
  width: 1280,
  length: 7168,
  wall: [534, 3478],
  floor: [
    [-3584, 15],
    [-2000, 17],
    [0, 22],
    [1500, 28],
    [2700, 35],
    [3584, 40],
  ],
  floorAlong: 'z',
  noise: {
    macroAmplitude: 2.5,
    macroScale: 420,
    midAmplitude: 1.2,
    midScale: 120,
    detailAmplitude: 0.12,
    detailScale: 6,
    creekCalm: 90,
  },
  border: {
    width: 230,
    height: 40,
    forested: true,
    gaps: [
      { x: 640, z: 2704, radius: 100 },
      { x: -640, z: 2704, radius: 100 },
      { x: 640, z: -1990, radius: 110 },
      { x: -640, z: -1990, radius: 110 },
      // North of Musgrave, where the road runs on.
      { x: 0, z: -3584, radius: 200 },
    ],
  },
  horizon,
  scarps: [],
  hills: [
    // Low rises in the woodland.
    { id: 'laura-rise', x: 260, z: 3000, radius: 260, height: 8, shape: 'dome' },
    { id: 'woodland-rise-west', x: -330, z: 1700, radius: 300, height: 9, shape: 'dome' },
    { id: 'woodland-rise-east', x: 320, z: 1200, radius: 280, height: 8, shape: 'dome' },
    { id: 'musgrave-rise', x: 300, z: -2900, radius: 300, height: 7, shape: 'dome' },
  ],
  ridges: [],
  flats: [
    { id: 'laura', x: -50, z: 3400, radius: 18, blend: 16 },
    { id: 'old-laura', x: -60, z: 2570, radius: 22, blend: 16 },
    { id: 'lakefield', x: 40, z: -240, radius: 20, blend: 16 },
    { id: 'hann-camp', x: 30, z: -2124, radius: 16, blend: 14 },
    { id: 'musgrave', x: 36, z: -3360, radius: 20, blend: 16 },
  ],
  creeks: [
    {
      id: 'laura-river',
      name: 'Laura River',
      // The end of the dry: a shallow run of water across a wide bed of sand.
      valley: 110,
      flow: 0.4,
      sandBank: 22,
      points: [
        { x: 640, z: 2690, water: 32.6, halfWidth: 6, depth: 0.35, bankSlope: 0.06, bed: 'sand' },
        { x: 300, z: 2712, water: 32.3, halfWidth: 7, depth: 0.35, bankSlope: 0.06, bed: 'sand' },
        { x: 0, z: 2704, water: 32.0, halfWidth: 6, depth: 0.35, bankSlope: 0.06, bed: 'sand' },
        { x: -320, z: 2690, water: 31.7, halfWidth: 7, depth: 0.35, bankSlope: 0.06, bed: 'sand' },
        { x: -640, z: 2708, water: 31.4, halfWidth: 6, depth: 0.35, bankSlope: 0.06, bed: 'sand' },
      ],
    },
    {
      id: 'north-kennedy',
      name: 'North Kennedy River',
      // A deep river, crossed where a bar of rock and gravel runs across its bed.
      valley: 90,
      flow: 0.6,
      bars: [{ x: 3, z: -1982, radiusX: 9, radiusZ: 26, rotationDeg: 0, depth: 0.4 }],
      points: [
        { x: -640, z: -1996, water: 14.6, halfWidth: 14, depth: 1.6, bankSlope: 0.14, bed: 'water' },
        { x: -300, z: -1974, water: 14.4, halfWidth: 15, depth: 1.6, bankSlope: 0.14, bed: 'water' },
        { x: 0, z: -1982, water: 14.2, halfWidth: 14, depth: 1.5, bankSlope: 0.14, bed: 'gravel' },
        { x: 320, z: -2000, water: 14.0, halfWidth: 15, depth: 1.6, bankSlope: 0.14, bed: 'water' },
        { x: 640, z: -1984, water: 13.8, halfWidth: 14, depth: 1.6, bankSlope: 0.14, bed: 'water' },
      ],
    },
  ],
  tracks,
  patches: [],
  bogs,
  gullies: [],
  pois: [
    {
      id: 'laura',
      name: 'Laura',
      kind: 'campsite',
      x: -50,
      z: 3400,
      radius: 26,
      reset: { x: -40, z: 3392, headingDeg: 10 },
      note: 'The start: the road north into the park',
    },
    {
      id: 'laura-river',
      name: 'Laura River',
      kind: 'feature',
      x: 4,
      z: 2704,
      radius: 40,
      note: 'Sand and a shallow run of water',
    },
    {
      id: 'old-laura',
      name: 'Old Laura homestead',
      kind: 'campsite',
      x: -60,
      z: 2570,
      radius: 30,
      reset: { x: -44, z: 2566, headingDeg: 350 },
      note: 'The old station house above the river',
    },
    {
      id: 'black-soil',
      name: 'The plains',
      kind: 'feature',
      x: -20,
      z: 680,
      radius: 40,
      note: 'Black soil: keep to the road',
    },
    {
      id: 'lakefield',
      name: 'Lakefield',
      kind: 'campsite',
      x: 40,
      z: -240,
      radius: 28,
      reset: { x: 28, z: -232, headingDeg: 350 },
      note: 'The old homestead on the plains',
    },
    {
      id: 'stockman',
      name: 'The stockman',
      kind: 'feature',
      x: 8,
      z: -1120,
      radius: 40,
      note: 'Bogged off the road: winch him out',
    },
    {
      id: 'hann-south',
      name: 'Hann Crossing',
      kind: 'feature',
      x: 6,
      z: -1900,
      radius: 34,
      note: 'Over the bar on the North Kennedy',
    },
    {
      id: 'hann-camp',
      name: 'Hann Crossing camp',
      kind: 'campsite',
      x: 30,
      z: -2124,
      radius: 24,
      reset: { x: 20, z: -2118, headingDeg: 350 },
      note: 'On the north bank',
    },
    {
      id: 'musgrave',
      name: 'Musgrave',
      kind: 'campsite',
      x: 36,
      z: -3360,
      radius: 28,
      reset: { x: 28, z: -3350, headingDeg: 0 },
      note: 'The old telegraph station',
    },
  ],
  props,
  boulders: [],
  tors: [],
  fallenTrees: [],
  vegetation: {
    flora: 'tropical',
    woodland: [{ x: 0, z: 0, radius: 6000 }],
    maxTreeDensity: 0.55,
    ashBelow: 0,
    snowGumAbove: 1000,
    patchScale: 220,
    trackClearance: 2,
    boulderDensity: 0.004,
    termiteMounds: 8,
    clearings: [
      { x: -50, z: 3400, radius: 50 },
      { x: -60, z: 2570, radius: 70 },
      // The plains: open grass with only the odd tree, either side of Lakefield.
      { x: -10, z: 420, radius: 430 },
      { x: 20, z: -260, radius: 120 },
      { x: -10, z: -900, radius: 520 },
      { x: 30, z: -2124, radius: 34 },
      { x: 36, z: -3360, radius: 60 },
    ],
  },
  palette: {
    // Grey-brown road, dark soil, and grass dried to straw at the end of the dry.
    dirtTrack: '#8A7058',
    dirtDark: '#5E4C3C',
    grassDry: '#C4B072',
    grassSage: '#A0A26A',
    rock: '#A89880',
    rockDark: '#7E705E',
    sand: '#D8C8A2',
  },
  blackSoil: { margin: 4, maxSlopeDeg: 10, firmAbove: 0.6 },
  muddyEdges: true,
  spawnCampsite: 'laura',
};
