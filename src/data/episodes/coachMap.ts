import type { HorizonDef, MapDef, PropDef, TrackDef, TrackRoughDef } from '../../sim/world/mapTypes';
import { boulder } from '../courseKit';
import {
  bigStepLine,
  climbBypass,
  climbMiddle,
  climbOldCoach,
  coachRoadNorth,
  coachRoadSouth,
  eastBypass,
  lauraRoad,
  littleLauraCrossing,
  maytownRoad,
  northPalmerRocky,
  northPalmerSand,
  palmerCampRoad,
  palmerCrossing,
  rangeDescent,
  rangeFoot,
  rangeTopNorth,
  rangeTopSouth,
} from './coachRoute';

/**
 * Episode 2, the Old Coach Road: from a camp on the Palmer River across to the ruins of
 * Maytown, then north on the coach road over the North Palmer River and the Conglomerate
 * Range, and down through the woodland to the Little Laura River and Laura. Distances are
 * shortened; the obstacles are full size. Coordinates in metres: x = east, z = south.
 *
 * The map is a long strip, 1.3 km wide and 7.2 km from south to north:
 *   south  – the Palmer River's sand, Maytown, the coach road to the North Palmer
 *   middle – the Conglomerate Range: its south face (three ways up), the sandstone top with
 *            the hotel site and the big rock step, and the descent of its north face
 *   north  – open woodland and termite mounds to the Little Laura River and Laura
 * It is the dry season: the rivers are low over wide sand, and the road is dust and rock.
 */
// Cuttings and fill laid back to an average 1 in 2, as on the CREB.
const BATTER = 0.5;

/** The coach road in the dry: corrugated, rutted, cut across by last wet's washouts. */
const roadRough: TrackRoughDef = {
  bumps: 0.12,
  swells: 0.22,
  potholes: 3,
  potholeDepth: 0.26,
  washouts: 4,
  washoutDepth: 0.34,
};
/** On the range top the road crosses bare sandstone, worn into steps and holes. */
const rockRough: TrackRoughDef = {
  bumps: 0.16,
  swells: 0.3,
  potholes: 4,
  potholeDepth: 0.3,
  washouts: 6,
  washoutDepth: 0.4,
};
const road = {
  shoulder: 3,
  batter: BATTER,
  smooth: 10,
  ruts: 0.08,
  camber: 0.3,
  pinMode: 'follow',
  rough: roadRough,
} as const;
const sand = {
  shoulder: 3,
  batter: BATTER,
  smooth: 10,
  surface: 'sand',
  ruts: 0.1,
  camber: 0.3,
  pinMode: 'follow',
} as const;

const tracks: TrackDef[] = [
  {
    id: 'palmer-camp-road',
    name: 'Track to the river',
    points: palmerCampRoad,
    width: 3.8,
    surface: 'dirt',
    ...road,
  },
  { id: 'palmer-crossing', name: 'Palmer River crossing', points: palmerCrossing, width: 4.2, ...sand },
  { id: 'maytown-road', name: 'Leslie Street', points: maytownRoad, width: 4.6, surface: 'dirt', ...road },
  {
    id: 'coach-road-south',
    name: 'Old Coach Road',
    points: coachRoadSouth,
    width: 3.8,
    surface: 'dirt',
    ...road,
  },
  { id: 'north-palmer-sand', name: 'North Palmer crossing', points: northPalmerSand, width: 3.8, ...sand },
  {
    id: 'north-palmer-rocky',
    name: 'Rocky crossing',
    points: northPalmerRocky,
    width: 3.6,
    surface: 'gravel',
    ...road,
    rough: undefined,
  },
  { id: 'range-foot', name: 'Old Coach Road', points: rangeFoot, width: 3.8, surface: 'dirt', ...road },
  {
    id: 'climb-middle',
    name: 'The middle line',
    points: climbMiddle,
    width: 3.6,
    shoulder: 3,
    batter: BATTER,
    smooth: 6,
    surface: 'rock',
    ruts: 0,
    camber: 0.3,
    pinSmooth: 12,
    // Bands of sandstone across the face: each a sharp step up, then a tread that lies back.
    rockySteps: [
      { at: 86, rise: 0.7 },
      { at: 104, rise: 0.75 },
      { at: 122, rise: 0.7 },
    ],
    stones: [
      boulder(76, -2.7, 0.75, 1.3),
      boulder(98, 2.8, 0.85, 1.4),
      boulder(118, -2.9, 0.7, 1.2),
      boulder(136, 2.6, 0.6, 1.1),
      // Rocks on the treads under one wheel and then the other, so an axle twists and an
      // open diff spins the light wheel.
      boulder(92, -0.75, 0.48, 0.9, 1.1),
      boulder(95, 0.75, 0.48, 0.9, 1.1),
      boulder(110, 0.75, 0.48, 0.9, 1.1),
      boulder(113, -0.75, 0.48, 0.9, 1.1),
      boulder(128, -0.75, 0.48, 0.9, 1.1),
      boulder(131, 0.75, 0.48, 0.9, 1.1),
    ],
  },
  {
    id: 'climb-old-coach',
    name: 'The old coach line',
    points: climbOldCoach,
    width: 3.2,
    shoulder: 3,
    batter: BATTER,
    smooth: 6,
    surface: 'dirt',
    ruts: 0.12,
    camber: 0.25,
    pinSmooth: 12,
    rough: { bumps: 0.12, washouts: 9, washoutDepth: 0.4 },
  },
  {
    id: 'climb-bypass',
    name: 'The bypass',
    points: climbBypass,
    width: 3.6,
    surface: 'gravel',
    ...road,
    pinMode: 'linear',
    pinSmooth: 12,
  },
  {
    id: 'range-top-south',
    name: 'Old Coach Road',
    points: rangeTopSouth,
    width: 3.6,
    surface: 'dirt',
    ...road,
    rough: rockRough,
  },
  {
    id: 'big-step-line',
    name: 'The big step',
    points: bigStepLine,
    width: 3.6,
    shoulder: 3,
    batter: BATTER,
    smooth: 6,
    surface: 'rock',
    ruts: 0,
    camber: 0.3,
    // Sand in the bottom of the gully, then a metre of bare sandstone to climb out over.
    sand: [[88, 108]],
    rockySteps: [{ at: 112, rise: 1.1 }],
    stones: [boulder(109, -2.9, 1.1, 1.6), boulder(111, 3.0, 1.2, 1.7)],
  },
  { id: 'east-bypass', name: 'Eastern track', points: eastBypass, width: 3.4, surface: 'dirt', ...road },
  {
    id: 'range-top-north',
    name: 'Old Coach Road',
    points: rangeTopNorth,
    width: 3.6,
    surface: 'dirt',
    ...road,
    rough: rockRough,
  },
  {
    id: 'range-descent',
    name: 'The descent',
    points: rangeDescent,
    width: 3.6,
    shoulder: 3,
    batter: BATTER,
    smooth: 6,
    surface: 'rock',
    ruts: 0,
    camber: 0.3,
    pinSmooth: 10,
    // Worn down into the soft sandstone, and dropping over its harder bands.
    cut: [
      [20, 0],
      [55, 1.1],
      [130, 1.5],
      [175, 0.6],
      [201, 0],
    ],
    rockySteps: [
      { at: 64, rise: -0.45 },
      { at: 96, rise: -0.5 },
      { at: 128, rise: -0.45 },
      { at: 158, rise: -0.4 },
    ],
  },
  {
    id: 'coach-road-north',
    name: 'Old Coach Road',
    points: coachRoadNorth,
    width: 3.8,
    surface: 'dirt',
    ...road,
    // Two dry creeks: dips with soft sand in the bottom.
    sand: [
      [690, 738],
      [1334, 1372],
    ],
    cut: [
      [672, 0],
      [698, 0.7],
      [730, 0.7],
      [756, 0],
      [1316, 0],
      [1342, 0.6],
      [1364, 0.6],
      [1390, 0],
    ],
  },
  {
    id: 'little-laura-crossing',
    name: 'Little Laura crossing',
    points: littleLauraCrossing,
    width: 4,
    ...sand,
    // Graded straight down each bank to the bed, pinned where it meets the water.
    pinMode: 'linear',
  },
  { id: 'laura-road', name: 'Road to Laura', points: lauraRoad, width: 5, surface: 'gravel', ...road },
];

/**
 * The country round the Old Coach Road, out to the horizon: no sea, only ridges and
 * woodland. South and west are the rugged hills of the Palmer goldfield; the Conglomerate
 * Range runs on east and west of the road; north-east of Laura stand the sandstone
 * escarpments of Quinkan country.
 */
const horizon: HorizonDef = {
  base: 40,
  relief: 30,
  hills: [
    { id: 'palmer-hills-south-west', x: -2400, z: 4800, radius: 1600, height: 120, shape: 'dome' },
    { id: 'palmer-hills-south-east', x: 2200, z: 5400, radius: 1800, height: 140, shape: 'dome' },
    { id: 'palmer-hills-west', x: -3200, z: 2400, radius: 1400, height: 90, shape: 'dome' },
    {
      id: 'quinkan-north-east',
      x: 2800,
      z: -4600,
      radius: 1700,
      height: 110,
      shape: 'mesa',
      stretch: [1.5, 0.7, 20],
    },
    { id: 'quinkan-north-west', x: -2600, z: -5600, radius: 1400, height: 90, shape: 'mesa' },
  ],
  ridges: [
    {
      id: 'conglomerate-west',
      points: [
        [-640, 150],
        [-2600, 300],
        [-5200, 0],
      ],
      height: 80,
      width: 1800,
    },
    {
      id: 'conglomerate-east',
      points: [
        [640, 150],
        [2600, 0],
        [5200, 300],
      ],
      height: 80,
      width: 1800,
    },
  ],
  valleys: [],
  woodland: [{ x: 0, z: 0, radius: 40000 }],
};

/** Headstones in Maytown's cemetery, east of the town, in two rows facing the street. */
const cemetery: PropDef[] = [
  [52, 2858],
  [56, 2858],
  [61, 2859],
  [66, 2860],
  [53, 2851],
  [59, 2852],
  [64, 2852],
].map(([x, z]) => ({ kind: 'headstone', x, z, headingDeg: 260 }));

const props: PropDef[] = [
  // The camp on the Palmer.
  { kind: 'fireRing', x: -56, z: 3404, headingDeg: 0, flatten: 3 },
  { kind: 'logSeat', x: -58, z: 3412, headingDeg: 20 },
  { kind: 'signpost', x: -30, z: 3384, headingDeg: 190, text: 'Maytown' },
  // Maytown: the baker's oven, chimneys where buildings stood, the kerbing along Leslie
  // Street, the replica hut in Duff Street and the cemetery.
  { kind: 'bakerOven', x: -100, z: 2896, headingDeg: 90, flatten: 3 },
  { kind: 'chimney', x: 16, z: 2930, headingDeg: 270, flatten: 2 },
  { kind: 'chimney', x: -122, z: 2842, headingDeg: 10, flatten: 2 },
  { kind: 'stoneKerb', x: -26.4, z: 2933, headingDeg: 258 },
  { kind: 'stoneKerb', x: -33.6, z: 2934.6, headingDeg: 258 },
  { kind: 'hut', x: -112, z: 2930, headingDeg: 90, flatten: 8 },
  { kind: 'signpost', x: -10, z: 2990, headingDeg: 190, text: 'Maytown' },
  { kind: 'signpost', x: -8, z: 2836, headingDeg: 190, text: 'Laura' },
  ...cemetery,
  // The forks: a sign at each split, facing the driver coming north.
  { kind: 'signpost', x: 12, z: 1968, headingDeg: 190, text: 'Rocky crossing' },
  { kind: 'signpost', x: -11, z: 1270, headingDeg: 200, text: 'Old coach road' },
  { kind: 'signpost', x: 10, z: 1270, headingDeg: 165, text: 'Bypass' },
  { kind: 'signpost', x: -8, z: -16, headingDeg: 160, text: 'Eastern track' },
  // The hotel site on the range.
  { kind: 'chimney', x: 60, z: 174, headingDeg: 250, flatten: 2 },
  { kind: 'fireRing', x: 38, z: 168, headingDeg: 0, flatten: 3 },
  { kind: 'logSeat', x: 34, z: 176, headingDeg: 70 },
  { kind: 'signpost', x: 20, z: 196, headingDeg: 190, text: 'Hotel site' },
  // Laura.
  { kind: 'hut', x: 58, z: -3380, headingDeg: 200, flatten: 8 },
  { kind: 'waterTank', x: 70, z: -3366, headingDeg: 0 },
  { kind: 'signpost', x: 6, z: -3300, headingDeg: 190, text: 'Laura' },
];

export const coachMap: MapDef = {
  id: 'coach',
  name: 'The Old Coach Road',
  seed: 1877,
  width: 1280,
  length: 7168,
  wall: [534, 3478],
  floor: [
    [-3584, 9],
    [-2600, 13],
    [-900, 22],
    [1250, 22],
    [1850, 18],
    [2850, 14],
    [3584, 9],
  ],
  floorAlong: 'z',
  noise: {
    macroAmplitude: 8,
    macroScale: 380,
    midAmplitude: 3,
    midScale: 100,
    detailAmplitude: 0.16,
    detailScale: 6,
    creekCalm: 80,
  },
  border: {
    width: 230,
    height: 60,
    forested: true,
    gaps: [
      { x: 640, z: 3150, radius: 100 },
      { x: -640, z: 3150, radius: 100 },
      { x: 640, z: 1860, radius: 80 },
      { x: -640, z: 1860, radius: 80 },
      { x: 640, z: -2860, radius: 80 },
      { x: -640, z: -2860, radius: 80 },
      // North of Laura, where the road runs on.
      { x: 0, z: -3584, radius: 200 },
    ],
  },
  horizon,
  scarps: [
    // The Conglomerate Range: a sandstone plateau the road climbs onto and comes down off.
    {
      id: 'range-south-face',
      raise: 'north',
      wobble: 20,
      // Steep where the middle line goes straight up; laid back to the east, where the
      // bypass winds up it.
      points: [
        { x: -640, z: 1170, width: 70, height: 40 },
        { x: 0, z: 1150, width: 70, height: 40 },
        { x: 110, z: 1155, width: 80, height: 40 },
        { x: 260, z: 1165, width: 190, height: 40 },
        { x: 640, z: 1180, width: 190, height: 40 },
      ],
    },
    {
      id: 'range-north-face',
      raise: 'south',
      wobble: 20,
      points: [
        { x: -640, z: -820, width: 90, height: 42 },
        { x: 0, z: -800, width: 90, height: 42 },
        { x: 640, z: -780, width: 90, height: 42 },
      ],
    },
  ],
  hills: [
    // Maytown stands on a low rise north of the Palmer.
    { id: 'maytown-rise', x: -30, z: 2880, radius: 260, height: 6, shape: 'dome' },
    { id: 'goldfield-hill-west', x: -330, z: 2500, radius: 260, height: 26, shape: 'dome' },
    { id: 'goldfield-hill-east', x: 300, z: 2300, radius: 280, height: 30, shape: 'dome' },
    { id: 'laura-hill', x: 260, z: -2300, radius: 300, height: 18, shape: 'dome' },
  ],
  ridges: [],
  flats: [
    { id: 'palmer-camp', x: -44, z: 3400, radius: 16, blend: 14 },
    { id: 'maytown', x: -70, z: 2872, radius: 18, blend: 16 },
    { id: 'hotel-site', x: 46, z: 160, radius: 14, blend: 12 },
    { id: 'laura', x: 40, z: -3360, radius: 20, blend: 16 },
  ],
  creeks: [
    {
      id: 'palmer',
      name: 'Palmer River',
      // Low in the dry: a shallow channel wandering across a wide bed of soft sand.
      valley: 120,
      flow: 0.4,
      sandBank: 26,
      points: [
        { x: 640, z: 3170, water: 50.6, halfWidth: 7, depth: 0.35, bankSlope: 0.05, bed: 'sand' },
        { x: 320, z: 3140, water: 50.3, halfWidth: 8, depth: 0.35, bankSlope: 0.05, bed: 'sand' },
        { x: 30, z: 3150, water: 50.0, halfWidth: 7, depth: 0.35, bankSlope: 0.05, bed: 'sand' },
        { x: -300, z: 3165, water: 49.7, halfWidth: 8, depth: 0.35, bankSlope: 0.05, bed: 'sand' },
        { x: -640, z: 3150, water: 49.4, halfWidth: 7, depth: 0.35, bankSlope: 0.05, bed: 'sand' },
      ],
    },
    {
      id: 'north-palmer',
      name: 'North Palmer River',
      valley: 80,
      flow: 0.3,
      sandBank: 14,
      points: [
        { x: 640, z: 1850, water: 56.4, halfWidth: 4.5, depth: 0.3, bankSlope: 0.12, bed: 'sand' },
        { x: 300, z: 1870, water: 56.1, halfWidth: 4.5, depth: 0.3, bankSlope: 0.12, bed: 'sand' },
        // Upstream of the main crossing the bed narrows over a bar of rock and gravel.
        { x: 140, z: 1866, water: 55.9, halfWidth: 3.4, depth: 0.25, bankSlope: 0.3, bed: 'gravel' },
        { x: 0, z: 1860, water: 55.6, halfWidth: 4.5, depth: 0.3, bankSlope: 0.12, bed: 'sand' },
        { x: -300, z: 1850, water: 55.2, halfWidth: 4.5, depth: 0.3, bankSlope: 0.12, bed: 'sand' },
        { x: -640, z: 1860, water: 54.8, halfWidth: 4.5, depth: 0.3, bankSlope: 0.12, bed: 'sand' },
      ],
    },
    {
      id: 'little-laura',
      name: 'Little Laura River',
      valley: 80,
      flow: 0.4,
      sandBank: 14,
      points: [
        { x: -640, z: -2850, water: 49.2, halfWidth: 5, depth: 0.4, bankSlope: 0.1, bed: 'sand' },
        { x: -300, z: -2870, water: 48.4, halfWidth: 5, depth: 0.4, bankSlope: 0.1, bed: 'sand' },
        { x: 10, z: -2860, water: 47.6, halfWidth: 5, depth: 0.4, bankSlope: 0.1, bed: 'sand' },
        { x: 320, z: -2850, water: 46.6, halfWidth: 5, depth: 0.4, bankSlope: 0.1, bed: 'sand' },
        { x: 640, z: -2870, water: 45.4, halfWidth: 5, depth: 0.4, bankSlope: 0.1, bed: 'sand' },
      ],
    },
  ],
  tracks,
  patches: [],
  bogs: [],
  gullies: [],
  pois: [
    {
      id: 'palmer-camp',
      name: 'Palmer River camp',
      kind: 'campsite',
      x: -44,
      z: 3400,
      radius: 26,
      reset: { x: -44, z: 3392, headingDeg: 10 },
      note: 'Beside the Palmer River, across from Maytown',
    },
    {
      id: 'maytown',
      name: 'Maytown',
      kind: 'campsite',
      x: -70,
      z: 2872,
      radius: 30,
      reset: { x: -58, z: 2866, headingDeg: 10 },
      note: 'The ruins of the goldfield’s town',
    },
    {
      id: 'hotel-site',
      name: 'Hotel site',
      kind: 'campsite',
      x: 46,
      z: 160,
      radius: 22,
      reset: { x: 40, z: 150, headingDeg: 340 },
      note: 'A coaching stop on the range',
    },
    {
      id: 'palmer-crossing',
      name: 'Palmer River',
      kind: 'feature',
      x: 28,
      z: 3150,
      radius: 40,
      note: 'Wide and sandy: keep moving',
    },
    {
      id: 'north-palmer',
      name: 'North Palmer River',
      kind: 'feature',
      x: 0,
      z: 1862,
      radius: 30,
      note: 'Soft sand straight across; a rocky bar upstream',
    },
    {
      id: 'range-face',
      name: 'Conglomerate Range',
      kind: 'feature',
      x: 0,
      z: 1170,
      radius: 40,
      note: 'Three ways up: the middle, the old coach road, the bypass',
    },
    {
      id: 'big-step',
      name: 'The big step',
      kind: 'feature',
      x: -22,
      z: -100,
      radius: 26,
      note: 'A metre of rock; the eastern track goes round',
    },
    {
      id: 'range-descent',
      name: 'The descent',
      kind: 'feature',
      x: 0,
      z: -800,
      radius: 34,
      note: 'Down the north face through the sandstone',
    },
    {
      id: 'little-laura',
      name: 'Little Laura River',
      kind: 'feature',
      x: 10,
      z: -2860,
      radius: 30,
      note: 'Sand and a little water',
    },
    {
      id: 'laura',
      name: 'Laura',
      kind: 'campsite',
      x: 40,
      z: -3360,
      radius: 28,
      reset: { x: 34, z: -3350, headingDeg: 0 },
      note: 'The end of the coach road',
    },
  ],
  props,
  boulders: [],
  tors: [],
  fallenTrees: [],
  vegetation: {
    flora: 'tropical',
    // Open eucalypt woodland everywhere: no rainforest this far inland.
    woodland: [{ x: 0, z: 0, radius: 6000 }],
    maxTreeDensity: 0.7,
    ashBelow: 0,
    snowGumAbove: 1000,
    patchScale: 200,
    trackClearance: 2,
    boulderDensity: 0.01,
    termiteMounds: 6,
    clearings: [
      { x: -44, z: 3400, radius: 40 },
      { x: -50, z: 2890, radius: 120 },
      { x: 46, z: 160, radius: 30 },
      { x: 40, z: -3360, radius: 60 },
    ],
  },
  palette: {
    // Orange gravelly soil, sandstone, and grass dried to straw.
    dirtTrack: '#B37448',
    dirtDark: '#86573A',
    grassDry: '#C8B377',
    grassSage: '#A3A26B',
    rock: '#B19C82',
    rockDark: '#86735E',
    sand: '#D8C7A0',
  },
  spawnCampsite: 'palmer-camp',
};
