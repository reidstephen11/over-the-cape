import type { MapDef, PoiDef, PropDef, TrackDef } from '../../sim/world/mapTypes';
import { boulder } from '../courseKit';
import type { Waypoint } from './crebRoute';
import { anchor, bank, descendingLedge, sand, survivingPoles, woodlandGrid } from './telegraphKit';
import {
  CANAL_AIM_SIGN,
  CANAL_MARKERS,
  LONG_DRIVE_BOG_ANCHORS,
  LONG_DRIVE_BOG_ANCHOR_SIDE,
  NOLANS_AIM_SIGN,
  NOLANS_MARKER,
  NOLANS_TURN_SIGN,
  canalCreek,
  canalFarEdge,
  canalGullies,
  canalOldExit,
  canalToSam,
  cannibalCrossing,
  cannibalToCypress,
  cypressBridge,
  cypressDeck,
  longDrive,
  longDriveBog,
  mistakeCreek,
  mistakeLip,
  mistakeRut,
  mistakeToCannibal,
  mistakeWashout,
  nolansBrook,
  northCreeks,
  northLevels,
  samCrossing,
  samToMistake,
  turnoffRoad,
} from './telegraphNorthRoute';
import { PLAIN, sideOf } from './telegraphRoute';

/**
 * Episode 3, the northern Telegraph Track: from the Bamaga Road turn-off north to Nolans
 * Brook. The same sandy plain as the southern map, and the difficulty is water: a deep
 * crossing with two ways out, a log bridge with logs missing, and Nolans Brook, wide and
 * deep over soft sand. About 2.2 km of route on a 1 × 2 km map; the plan is
 * docs/PLAN-telegraph-north.md. Coordinates in metres: x = east, z = south (north is -z).
 */

/** An easy ford: a gentle ramp either side, firm underfoot. */
const ford = {
  shoulder: 2.5,
  batter: 0.6,
  smooth: 3,
  ruts: 0.04,
  camber: 0.2,
  pinMode: 'linear',
  pinSmooth: 3,
  surface: 'sand',
} as const;

const tracks: TrackDef[] = [
  {
    id: 'turnoff-road',
    name: 'Telegraph Track',
    points: turnoffRoad,
    width: 3.6,
    ...sand,
    // Corrugated, with swells that pitch a car taken fast.
    rough: { bumps: 0.06, swells: 0.26, potholes: 2, potholeDepth: 0.18, washouts: 1.5, washoutDepth: 0.22 },
  },
  {
    id: 'canal-creek',
    name: 'Canal Creek',
    points: canalCreek,
    width: 3.2,
    ...bank,
    camber: 0,
    // The winding exit leans the car towards the creek on its first bend.
    cant: [
      [canalFarEdge + 9, 0],
      [canalFarEdge + 14, 7],
      [canalFarEdge + 22, 7],
      [canalFarEdge + 27, 0],
    ],
    routeHint: 'In between the two rocks, straight across at the sign, then left along the far bank and up',
  },
  {
    id: 'canal-old-exit',
    name: 'Canal Creek old exit',
    points: canalOldExit,
    width: 3.2,
    ...bank,
    smooth: 1,
    pinSmooth: 1,
    erosion: canalGullies,
    routeHint: 'The old exit: washed out. Gullies across it will hold a wheel',
  },
  { id: 'canal-sam', name: 'Telegraph Track', points: canalToSam, width: 3.4, ...sand },
  { id: 'sam-crossing', name: 'Sam Creek', points: samCrossing, width: 3.6, ...ford },
  { id: 'sam-mistake', name: 'Telegraph Track', points: samToMistake, width: 3.4, ...sand },
  {
    id: 'mistake-creek',
    name: 'Mistake Creek',
    points: mistakeCreek,
    width: 3.2,
    ...bank,
    smooth: 1,
    pinSmooth: 1,
    camber: 0,
    // The way in twists the car: leaning one way at the lip, the other below it.
    cant: [
      [mistakeLip - 1.5, 0],
      [mistakeLip + 1.5, 7],
      [mistakeLip + 4.5, -8],
      [mistakeLip + 7.5, 0],
    ],
    erosion: [mistakeRut, mistakeWashout],
    stones: [
      // A ledge of rock half-way down, its riser on the creek side.
      descendingLedge(mistakeLip + 3.6, 0.35),
      boulder(mistakeLip - 0.5, -2.9, 0.8, 1.4),
      boulder(mistakeLip + 6.5, 3, 0.9, 1.5),
    ],
    routeHint: 'Low range, crawl. Keep left of the washed-out hole; one ledge half-way down',
  },
  { id: 'mistake-cannibal', name: 'Telegraph Track', points: mistakeToCannibal, width: 3.4, ...sand },
  { id: 'cannibal-crossing', name: 'Cannibal Creek', points: cannibalCrossing, width: 3.6, ...ford },
  { id: 'cannibal-cypress', name: 'Telegraph Track', points: cannibalToCypress, width: 3.4, ...sand },
  {
    id: 'cypress-bridge',
    name: 'Cypress Creek bridge',
    points: cypressBridge,
    width: 4,
    shoulder: 1.5,
    batter: 1.6,
    smooth: 3,
    ruts: 0,
    camber: 0,
    pinMode: 'linear',
    pinSmooth: 2,
    surface: 'sand',
    bridges: [cypressDeck],
    routeHint: 'Line up before the bridge. Logs are missing: right, then left, then down the middle',
  },
  {
    id: 'long-drive',
    name: 'The long drive',
    points: longDrive,
    width: 3.4,
    ...sand,
    // Whoops in soft sand.
    rough: { bumps: 0.1, swells: 0.34, potholes: 0.5, potholeDepth: 0.15 },
    routeHint:
      'Soft sand: 18 psi. At the bog, keep the left wheels on the firm edge; a rock to winch to at each end',
  },
  {
    id: 'nolans-brook',
    name: 'Nolans Brook',
    points: nolansBrook,
    width: 3.4,
    shoulder: 3,
    batter: 0.6,
    smooth: 5,
    ruts: 0.03,
    camber: 0.2,
    pinMode: 'follow',
    surface: 'sand',
    routeHint: 'Right along the bank to the rock, then straight across to the sign. Crawl: no bow wave',
  },
];

const at = (points: readonly Waypoint[], s: number, lateral: number) => {
  const p = sideOf(points, s, lateral);
  return [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10] as const;
};

const pois: PoiDef[] = [
  {
    id: 'bamaga-turnoff',
    name: 'Bamaga Road turn-off',
    kind: 'campsite',
    x: 20,
    z: 955,
    radius: 26,
    reset: { x: 20, z: 948, headingDeg: 0 },
    note: 'Where the northern Telegraph Track leaves the road',
  },
  {
    id: 'canal-creek',
    name: 'Canal Creek',
    kind: 'feature',
    x: 0,
    z: 630,
    radius: 22,
    note: 'Deep, clear water: the winding exit is to the left',
  },
  {
    id: 'sam-creek',
    name: 'Sam Creek',
    kind: 'feature',
    x: 2,
    z: 346,
    radius: 16,
    note: 'An easy crossing, swimming holes downstream',
  },
  {
    id: 'mistake-creek',
    name: 'Mistake Creek',
    kind: 'feature',
    x: 0,
    z: 120,
    radius: 16,
    note: 'A steep, eroded way in',
  },
  {
    id: 'cannibal-camp',
    name: 'Cannibal Creek camp',
    kind: 'campsite',
    x: 24,
    z: -180,
    radius: 20,
    reset: { x: 12, z: -178, headingDeg: 270 },
    note: 'The only camp on the track',
  },
  {
    id: 'cypress-creek',
    name: 'Cypress Creek',
    kind: 'feature',
    x: -6,
    z: -394,
    radius: 14,
    note: 'The old log bridge',
  },
  {
    id: 'long-drive',
    name: 'The long drive',
    kind: 'feature',
    x: 6,
    z: -500,
    radius: 22,
    note: 'Soft sand, whoops and a bog',
  },
  {
    id: 'nolans-brook',
    name: 'Nolans Brook',
    kind: 'feature',
    x: 0,
    z: -834,
    radius: 16,
    note: 'Wide and deep: the hard right line',
  },
  {
    id: 'nolans-camp',
    name: 'Nolans Brook camp',
    kind: 'campsite',
    x: 10,
    z: -946,
    radius: 18,
    reset: { x: 10, z: -946, headingDeg: 90 },
    note: 'On the north bank: the end of the track',
  },
];

const props: PropDef[] = [
  { kind: 'signpost', x: 27, z: 940, headingDeg: 180, text: 'Old Telegraph Track north — 4WD only' },
  { kind: 'fireRing', x: 32, z: 962, headingDeg: 0 },
  { kind: 'logSeat', x: 37, z: 963, headingDeg: 0 },
  { kind: 'signpost', x: 5, z: 642, headingDeg: 180, text: 'Canal Creek — between the rocks, exit left' },
  // On the far bank straight across the shelf: something to aim at from the water's edge.
  {
    kind: 'signpost',
    x: CANAL_AIM_SIGN[0],
    z: CANAL_AIM_SIGN[1],
    headingDeg: 180,
    text: 'Aim here — then exit left',
  },
  { kind: 'signpost', x: 7, z: 356, headingDeg: 180, text: 'Sam Creek' },
  { kind: 'signpost', x: 5, z: 126, headingDeg: 180, text: 'Mistake Creek' },
  { kind: 'signpost', x: 12, z: -166, headingDeg: 180, text: 'Cannibal Creek camp' },
  { kind: 'fireRing', x: 27, z: -186, headingDeg: 0 },
  { kind: 'logSeat', x: 32, z: -187, headingDeg: 0 },
  { kind: 'signpost', x: -11, z: -390, headingDeg: 150, text: 'Cypress Creek — log bridge' },
  { kind: 'signpost', x: 5, z: -826, headingDeg: 180, text: 'Nolans Brook — right to the rock, then across' },
  {
    kind: 'signpost',
    x: NOLANS_TURN_SIGN[0],
    z: NOLANS_TURN_SIGN[1],
    headingDeg: 270,
    text: 'Turn across here',
  },
  {
    kind: 'signpost',
    x: NOLANS_AIM_SIGN[0],
    z: NOLANS_AIM_SIGN[1],
    headingDeg: 180,
    text: 'Aim here from the rock',
  },
  { kind: 'fireRing', x: 16, z: -951, headingDeg: 0 },
  { kind: 'logSeat', x: 21, z: -950, headingDeg: 0 },
];

/** The surviving telegraph poles, as on the southern map: a straight line the track wanders beside. */
const telegraphPoles = survivingPoles(tracks, northCreeks, [-24, 900, 28, -940]);

/** Open woodland, with the gallery forest kept along each creek. */
const woodland = woodlandGrid(northCreeks);

export const telegraphNorthMap: MapDef = {
  id: 'telegraphNorth',
  name: 'The Telegraph Track North',
  seed: 19870901,
  width: 1024,
  length: 2048,
  wall: [500, 1012],
  floor: [
    [-1024, PLAIN],
    [1024, PLAIN],
  ],
  floorAlong: 'z',
  noise: {
    macroAmplitude: 1.1,
    macroScale: 420,
    midAmplitude: 0.45,
    midScale: 120,
    detailAmplitude: 0.06,
    detailScale: 6,
    creekCalm: 30,
  },
  border: {
    width: 70,
    height: 10,
    forested: true,
    gaps: [
      { x: 20, z: 1024, radius: 90 },
      { x: 0, z: -1024, radius: 90 },
      ...northCreeks.flatMap((c) => {
        const a = c.points[0];
        const b = c.points[c.points.length - 1];
        return [
          { x: a.x, z: a.z, radius: 60 },
          { x: b.x, z: b.z, radius: 60 },
        ];
      }),
    ],
  },
  horizon: {
    base: 38,
    relief: 4,
    hills: [],
    ridges: [],
    valleys: [],
    woodland: [{ x: 0, z: 0, radius: 6000 }],
  },
  scarps: [],
  hills: [],
  ridges: [],
  flats: [
    { id: 'bamaga-turnoff', x: 20, z: 958, radius: 26, blend: 18, height: PLAIN },
    { id: 'cannibal-camp', x: 24, z: -182, radius: 14, blend: 10, height: PLAIN },
    { id: 'nolans-camp', x: 12, z: -948, radius: 16, blend: 12, height: PLAIN },
  ],
  creeks: northCreeks,
  tracks,
  patches: [],
  bogs: [longDriveBog],
  gullies: [],
  finds: [],
  pois,
  props: [...props, ...telegraphPoles],
  boulders: [
    // Marked rocks to winch to: above each exit at Canal Creek, above Mistake Creek's way
    // in (to be lowered down it, or pulled back up) and on Nolans Brook's north bank.
    // Two rocks at Canal Creek's near edge, one either side of the shelf: drive in between them.
    ...CANAL_MARKERS.map(([x, z]) => ({ x, z, radius: 0.55, sink: 0.25 })),
    anchor(...at(canalCreek, canalFarEdge + 38, -2.6)),
    anchor(...at(canalOldExit, 22, 2.6)),
    anchor(...at(mistakeCreek, mistakeLip - 5, 2.6)),
    anchor(...at(nolansBrook, 88, 2.6)),
    anchor(...at(nolansBrook, 90, -2.4)),
    // A rock before the bog and one past it, on the firm side (v2.20).
    ...LONG_DRIVE_BOG_ANCHORS.map((s) => anchor(...at(longDrive, s, LONG_DRIVE_BOG_ANCHOR_SIDE))),
    // The rock on Nolans Brook's near bank that the line across starts from (v2.20).
    { x: NOLANS_MARKER[0], z: NOLANS_MARKER[1], radius: 0.7, sink: 0.25 },
  ],
  tors: [],
  fallenTrees: [],
  vegetation: {
    flora: 'tropical',
    woodland,
    maxTreeDensity: 0.28,
    rainforestScale: 3,
    ashBelow: 0,
    snowGumAbove: 1000,
    patchScale: 160,
    trackClearance: 3,
    boulderDensity: 0.001,
    termiteMounds: 7,
    clearings: [
      { x: 20, z: 958, radius: 44 },
      { x: 24, z: -182, radius: 30 },
      { x: 10, z: -946, radius: 34 },
    ],
  },
  palette: {
    dirtTrack: '#B4AC9C',
    dirtDark: '#8A8273',
    grassDry: '#B9A96E',
    grassSage: '#8C9A6B',
    sand: '#E4DAC2',
    mud: '#6E6455',
    // Clear water over pale sand, dark where it is deep: the shoal at Nolans shows paler.
    waterShallow: '#8DB0A2',
    waterDeep: '#183A3E',
  },
  clayBanks: true,
  muddyEdges: true,
  spawnCampsite: 'bamaga-turnoff',
};

/** Heights the obstacle tests check against. */
export const telegraphNorthLevels = { plain: PLAIN, ...northLevels };
