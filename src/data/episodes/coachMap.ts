import type { HorizonDef, MapDef, PropDef, TrackDef, TrackRoughDef } from '../../sim/world/mapTypes';
import { boulder } from '../courseKit';
import {
  bigStepLine,
  climbBypass,
  climbMiddle,
  climbOldCoach,
  eastBypass,
  rangeDescent,
  rangeExit,
  rangeFoot,
  rangeTopNorth,
  rangeTopSouth,
} from './coachRoute';

/**
 * A compact chapter on the Conglomerate Range, on the Old Coach Road between
 * Maytown and Laura. River crossings and connecting travel belong to the diary.
 * The full-size technical obstacles sit in a 1.3 by 2 km strip of dry woodland.
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

const tracks: TrackDef[] = [
  {
    id: 'range-foot',
    name: 'Track to the range',
    points: rangeFoot,
    width: 3.8,
    surface: 'dirt',
    ...road,
    pinMode: 'linear',
    rough: undefined,
  },
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
    surface: 'rock',
    ...road,
    rough: rockRough,
    // Low shelves under alternate wheels reward line choice on the short traverse.
    rockySteps: [
      { at: 110, rise: 0.3 },
      { at: 218, rise: 0.35 },
    ],
    stones: [boulder(132, -0.7, 0.32, 1), boulder(164, 0.7, 0.32, 1)],
    cant: [
      [0, 0],
      [160, 6],
      [220, 0],
    ],
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
    id: 'range-exit-road',
    name: 'Track to camp',
    points: rangeExit,
    width: 3.8,
    surface: 'dirt',
    ...road,
    pinMode: 'linear',
    rough: undefined,
  },
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

const props: PropDef[] = [
  { kind: 'fireRing', x: -42, z: 606, headingDeg: 0, flatten: 3 },
  { kind: 'logSeat', x: -44, z: 614, headingDeg: 20 },
  { kind: 'signpost', x: -9, z: 606, headingDeg: 190, text: 'Conglomerate Range' },
  { kind: 'signpost', x: -11, z: 520, headingDeg: 200, text: 'Old coach road' },
  { kind: 'signpost', x: 10, z: 520, headingDeg: 165, text: 'Bypass' },
  { kind: 'signpost', x: -8, z: 44, headingDeg: 160, text: 'Eastern track' },
  { kind: 'chimney', x: 28, z: 216, headingDeg: 250, flatten: 2 },
  { kind: 'fireRing', x: 12, z: 214, headingDeg: 0, flatten: 3 },
  { kind: 'logSeat', x: 16, z: 222, headingDeg: 70 },
  { kind: 'signpost', x: 2, z: 232, headingDeg: 190, text: 'Hotel site' },
  { kind: 'fireRing', x: 36, z: -548, headingDeg: 0, flatten: 3 },
  { kind: 'logSeat', x: 38, z: -540, headingDeg: 20 },
  { kind: 'signpost', x: 28, z: -526, headingDeg: 190, text: 'Camp below the range' },
];

export const coachMap: MapDef = {
  id: 'coach',
  name: 'The Old Coach Road',
  seed: 1877,
  width: 1280,
  length: 2048,
  wall: [534, 918],
  floor: [
    [-1024, 22],
    [1024, 22],
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
      { x: -22, z: 1024, radius: 140 },
      { x: 14, z: -1024, radius: 140 },
    ],
  },
  horizon,
  scarps: [
    {
      id: 'range-south-face',
      raise: 'north',
      wobble: 20,
      points: [
        { x: -640, z: 420, width: 70, height: 40 },
        { x: 0, z: 400, width: 70, height: 40 },
        { x: 110, z: 405, width: 80, height: 40 },
        { x: 260, z: 415, width: 190, height: 40 },
        { x: 640, z: 430, width: 190, height: 40 },
      ],
    },
    {
      id: 'range-north-face',
      raise: 'south',
      wobble: 20,
      points: [
        { x: -640, z: -380, width: 90, height: 42 },
        { x: 0, z: -360, width: 90, height: 42 },
        { x: 640, z: -340, width: 90, height: 42 },
      ],
    },
  ],
  hills: [],
  ridges: [],
  flats: [
    { id: 'range-camp', x: -22, z: 600, radius: 18, blend: 14, height: 65.4 },
    { id: 'hotel-site', x: 10, z: 200, radius: 14, blend: 10, height: 102.5 },
    { id: 'range-exit', x: 14, z: -544, radius: 20, blend: 14, height: 60.3 },
  ],
  creeks: [],
  tracks,
  patches: [],
  bogs: [],
  gullies: [],
  pois: [
    {
      id: 'range-camp',
      name: 'Camp below the south face',
      kind: 'campsite',
      x: -22,
      z: 600,
      radius: 26,
      reset: { x: -22, z: 600, headingDeg: 16 },
      note: 'Maytown behind you; the range ahead',
    },
    {
      id: 'range-face',
      name: 'Conglomerate Range',
      kind: 'feature',
      x: 0,
      z: 532,
      radius: 30,
      note: 'Choose the middle line, old coach road or bypass',
    },
    {
      id: 'hotel-site',
      name: 'Hotel site',
      kind: 'campsite',
      x: 0,
      z: 220,
      radius: 30,
      reset: { x: 10, z: 200, headingDeg: 270 },
      note: 'A breather on the ridge; progress saved',
    },
    {
      id: 'big-step',
      name: 'The big step',
      kind: 'feature',
      x: -20,
      z: 55,
      radius: 26,
      note: 'A metre of rock; the eastern track goes round',
    },
    {
      id: 'range-descent',
      name: 'The descent',
      kind: 'feature',
      x: -8,
      z: -244,
      radius: 30,
      note: 'Low range and engine braking down the north face',
    },
    {
      id: 'range-exit',
      name: 'Camp below the north face',
      kind: 'campsite',
      x: 14,
      z: -544,
      radius: 24,
      reset: { x: 14, z: -544, headingDeg: 0 },
      note: 'The range is behind you; Laura is the next diary entry',
    },
  ],
  props,
  boulders: [],
  tors: [],
  fallenTrees: [],
  vegetation: {
    flora: 'tropical',
    woodland: [{ x: 0, z: 0, radius: 6000 }],
    maxTreeDensity: 0.7,
    ashBelow: 0,
    snowGumAbove: 1000,
    patchScale: 200,
    trackClearance: 2,
    boulderDensity: 0.01,
    termiteMounds: 6,
    clearings: [
      { x: -22, z: 600, radius: 40 },
      { x: 0, z: 220, radius: 40 },
      { x: 14, z: -544, radius: 40 },
    ],
  },
  palette: {
    dirtTrack: '#B37448',
    dirtDark: '#86573A',
    grassDry: '#C8B377',
    grassSage: '#A3A26B',
    rock: '#B19C82',
    rockDark: '#86735E',
    sand: '#D8C7A0',
  },
  spawnCampsite: 'range-camp',
};
