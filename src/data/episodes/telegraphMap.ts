import type { MapDef, PoiDef, PropDef, TrackDef } from '../../sim/world/mapTypes';
import { boulder, rockStep } from '../courseKit';
import { anchor, bank, descendingLedge, sand, survivingPoles, woodlandGrid } from './telegraphKit';
import {
  BERTIE_BED,
  DULHUNTY_LEDGE,
  DULHUNTY_LEDGES_FROM,
  PLAIN,
  bertieBed,
  bertiePits,
  bertieToFork,
  bramwellRoad,
  dulhuntyCrossing,
  dulhuntyLedges,
  dulhuntyToBertie,
  ducieCrossing,
  ducieToSand,
  gunshotApproach,
  gunshotBypass,
  gunshotChute,
  gunshotLip,
  gunshotSlot,
  gaugingTrack,
  GAUGING_ROCKS,
  gunshotStaircase,
  arcAtPoint,
  levels,
  palmChuteLip,
  palmCreek,
  palmExitLip,
  palmRut,
  palmToDucie,
  palmWestExit,
  sandToDulhunty,
  sandWashout,
  sideOf,
  telegraphCreeks,
  theSand,
} from './telegraphRoute';
import type { Waypoint } from './crebRoute';

/**
 * Episode 2, the Telegraph Track: the southern Old Telegraph Track on Cape York, Bramwell
 * Junction north to Gunshot Creek. A sandy track across nearly flat heath and woodland,
 * where the difficulty is the creeks, each cut several metres into the plain. About 2 km of
 * route on a 1 × 2 km map; the plan is docs/PLAN-telegraph.md. Coordinates in metres:
 * x = east, z = south (north is -z).
 */
const staircaseTop = arcAtPoint(gunshotStaircase, 4);
const slotTop = arcAtPoint(gunshotSlot, 4);

const tracks: TrackDef[] = [
  {
    id: 'bramwell-road',
    name: 'Telegraph Track',
    points: bramwellRoad,
    width: 3.6,
    ...sand,
    surface: 'dirt',
    // Corrugated, with swells that pitch a car taken fast.
    rough: { bumps: 0.06, swells: 0.3, potholes: 2, potholeDepth: 0.18, washouts: 1.5, washoutDepth: 0.22 },
    sand: [[170, 300]],
  },
  {
    id: 'palm-creek',
    name: 'Palm Creek',
    points: palmCreek,
    width: 3.1,
    ...bank,
    erosion: [palmRut],
    stones: [
      // A step of rock at the lip of the climb out.
      rockStep(palmExitLip - 0.9, 0, 0.38, 4.2, 1.8),
      boulder(palmExitLip + 1.5, 3, 0.8, 1.4),
      boulder(palmChuteLip - 1, -2.9, 0.7, 1.3),
    ],
    routeHint: 'Low range, both lockers, wheels straddling the rut. Crawl down; crawl out',
  },
  {
    id: 'palm-west-exit',
    name: 'Palm Creek west exit',
    points: palmWestExit,
    width: 3.1,
    ...bank,
    camber: 0,
    // Leaning towards the creek (the left, going up) by about 18°.
    cant: [
      [0, 0],
      [6, -6],
      [12, -15],
      [28, -16],
      [36, -8],
      [42, 0],
    ],
    routeHint: 'Less steep, but it leans you towards the creek on the clay',
  },
  { id: 'palm-ducie', name: 'Telegraph Track', points: palmToDucie, width: 3.4, ...sand },
  {
    id: 'ducie-crossing',
    name: 'Ducie Creek',
    points: ducieCrossing,
    width: 3.4,
    shoulder: 3,
    batter: 0.6,
    smooth: 5,
    ruts: 0.03,
    camber: 0.2,
    pinMode: 'follow',
    surface: 'sand',
  },
  { id: 'ducie-sand', name: 'Telegraph Track', points: ducieToSand, width: 3.4, ...sand },
  {
    id: 'the-sand',
    name: 'The sand',
    points: theSand,
    width: 3.4,
    ...sand,
    // Whoops: swells a few metres apart that pitch the car, in soft white sand.
    rough: { bumps: 0.12, swells: 0.38, potholes: 0.5, potholeDepth: 0.15 },
    routeHint: 'Soft sand: let the tyres down to 18 psi and keep it moving',
  },
  { id: 'sand-dulhunty', name: 'Telegraph Track', points: sandToDulhunty, width: 3.4, ...sand },
  {
    id: 'dulhunty-ledges',
    name: 'Dulhunty shelf',
    points: dulhuntyLedges,
    width: 3.6,
    shoulder: 2,
    batter: 1.2,
    smooth: 2,
    ruts: 0,
    camber: 0.1,
    pinMode: 'linear',
    pinSmooth: 1,
    surface: 'rock',
    steps: [
      { from: DULHUNTY_LEDGES_FROM + 0.1, to: DULHUNTY_LEDGES_FROM + 4.1, spacing: 2, rise: DULHUNTY_LEDGE },
    ],
  },
  {
    id: 'dulhunty-crossing',
    name: 'Dulhunty River',
    points: dulhuntyCrossing,
    width: 3.4,
    ...bank,
    // A last ledge up out of the water onto the clay.
    stones: [rockStep(21.4, 0, 0.42, 4.2, 1.6)],
    routeHint: 'Keep to the shelf: the current pushes you towards the falls',
  },
  { id: 'dulhunty-bertie', name: 'Telegraph Track', points: dulhuntyToBertie, width: 3.4, ...sand },
  {
    id: 'bertie-bed',
    name: 'Bertie Creek',
    points: bertieBed,
    width: 3,
    ...bank,
    surface: 'rock',
    erosion: bertiePits,
    // A step of rock at the foot of the dogleg out.
    stones: [rockStep(BERTIE_BED[1] + 14, 0, 0.5, 4, 1.6)],
    routeHint: 'Weave between the dark holes in the bed; crawl',
  },
  { id: 'bertie-fork', name: 'Telegraph Track', points: bertieToFork, width: 3.4, ...sand },
  { id: 'gunshot-approach', name: 'Gunshot Creek', points: gunshotApproach, width: 3.4, ...sand },
  {
    id: 'gunshot-chute',
    name: 'The Chute',
    points: gunshotChute,
    width: 3.4,
    ...bank,
    smooth: 1,
    pinSmooth: 1,
    stones: [
      // The lip: a band of rock across the bank, its riser on the creek side.
      {
        shape: 'ridge',
        at: gunshotLip - 0.6,
        lateral: 0,
        width: 4.6,
        length: 1.6,
        height: 0.55,
        profile: [
          [-0.8, 0.04],
          [0.6, 0.55],
          [0.8, 0.4],
        ],
      },
      boulder(gunshotLip - 1, -3.1, 0.9, 1.6),
      boulder(gunshotLip + 0.4, 3.2, 1, 1.7),
    ],
    routeHint: 'The Chute: low range, wheels dead straight, crawl over the lip and let the nose drop',
  },
  {
    id: 'gunshot-staircase',
    name: 'The Staircase',
    points: gunshotStaircase,
    width: 3.3,
    ...bank,
    smooth: 1,
    pinSmooth: 1,
    camber: 0,
    // Leaning towards the creek's downstream side as it goes down.
    cant: [
      [staircaseTop - 2, 0],
      [staircaseTop + 0.5, -8],
      [staircaseTop + 4.5, -8],
      [staircaseTop + 6.5, 0],
    ],
    erosion: [
      {
        path: [
          [staircaseTop - 1.5, 0.8],
          [staircaseTop + 2, 0.5],
          [staircaseTop + 5, 0.9],
        ],
        width: 0.45,
        depth: 0.3,
      },
    ],
    stones: [
      // Two ledges of rock across the bank, their risers on the creek side.
      descendingLedge(staircaseTop + 1.4, 0.45),
      descendingLedge(staircaseTop + 3.2, 0.45),
      boulder(staircaseTop, -2.9, 0.8, 1.4),
      boulder(staircaseTop + 2.2, 2.9, 0.9, 1.5),
    ],
    routeHint: 'The Staircase: two ledges down steep clay, leaning you off. Crawl, one ledge at a time',
  },
  {
    id: 'gunshot-slot',
    name: 'The Slot',
    points: gunshotSlot,
    width: 2.8,
    ...bank,
    batter: 2.4,
    smooth: 1,
    pinSmooth: 1,
    // A hole under the left wheels and a hump under the right, so the car twists: a front
    // wheel and the opposite rear lift as it crawls through.
    erosion: [
      {
        path: [
          [slotTop + 1.6, -0.75],
          [slotTop + 2.6, -0.75],
        ],
        width: 0.9,
        depth: 0.45,
      },
      {
        path: [
          [slotTop + 1.6, 0.75],
          [slotTop + 2.6, 0.75],
        ],
        width: 0.9,
        depth: -0.35,
      },
    ],
    routeHint: 'The Slot: a narrow twisting rut. Let the wheels lift, keep crawling',
  },
  {
    id: 'gauging-track',
    name: 'Gauging station track',
    points: gaugingTrack,
    width: 3,
    ...sand,
    faint: true,
    // Over the rock beside the falls: ledges and boulders to crawl.
    stones: [
      rockStep(GAUGING_ROCKS[0] + 4, 0, 0.35, 3.6, 1.4),
      rockStep(GAUGING_ROCKS[0] + 9, 0.3, 0.4, 3.6, 1.4, 6),
      boulder(GAUGING_ROCKS[0] + 13, -0.9, 0.45, 0.9),
      boulder(GAUGING_ROCKS[0] + 15.5, 0.9, 0.4, 0.8),
      boulder(GAUGING_ROCKS[0] + 6, 2.3, 0.8, 1.4),
      boulder(GAUGING_ROCKS[0] + 12, -2.4, 0.9, 1.5),
    ],
    routeHint: 'A faint track to the old gauging station: crawl the rocks beside the falls',
  },
  {
    id: 'gunshot-bypass',
    name: 'Gunshot bypass',
    points: gunshotBypass,
    width: 3.6,
    ...sand,
    routeHint: 'The long way round: easy sand, but it costs you',
  },
];

const at = (points: readonly Waypoint[], s: number, lateral: number) => {
  const p = sideOf(points, s, lateral);
  return [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10] as const;
};

const pois: PoiDef[] = [
  {
    id: 'bramwell-junction',
    name: 'Bramwell Junction',
    kind: 'campsite',
    x: 20,
    z: 955,
    radius: 26,
    reset: { x: 20, z: 948, headingDeg: 0 },
    note: 'Where the Telegraph Track leaves the road',
  },
  {
    id: 'palm-creek',
    name: 'Palm Creek',
    kind: 'feature',
    x: 0,
    z: 628,
    radius: 22,
    note: 'A steep chute in, a steeper climb out',
  },
  {
    id: 'ducie-creek',
    name: 'Ducie Creek',
    kind: 'feature',
    x: 3,
    z: 282,
    radius: 22,
    note: 'Deep in the middle: follow the near bank, then back across',
  },
  {
    id: 'the-sand',
    name: 'The sand',
    kind: 'feature',
    x: -8,
    z: 125,
    radius: 22,
    note: 'Soft white sand, whoops and a washout',
  },
  {
    id: 'dulhunty-camp',
    name: 'Dulhunty River camp',
    kind: 'campsite',
    x: 26,
    z: -292,
    radius: 20,
    reset: { x: 14, z: -292, headingDeg: 270 },
    note: 'The only camp on the track',
  },
  {
    id: 'dulhunty-river',
    name: 'Dulhunty River',
    kind: 'feature',
    x: 3,
    z: -306,
    radius: 16,
    note: 'Ledges down to a rock shelf above the falls',
  },
  {
    id: 'gauging-station',
    name: 'Old gauging station',
    kind: 'landmark',
    x: -110,
    z: -293,
    radius: 14,
    note: 'A hut on the bank downstream of the falls',
  },
  {
    id: 'bertie-creek',
    name: 'Bertie Creek',
    kind: 'feature',
    x: 1,
    z: -640,
    radius: 18,
    note: 'Up the rock bed between the holes',
  },
  {
    id: 'gunshot-fork',
    name: 'Gunshot turn-off',
    kind: 'landmark',
    x: -8,
    z: -856,
    radius: 16,
    note: 'Right: the bypass. Straight on: Gunshot',
  },
  {
    id: 'gunshot-bypass',
    name: 'Gunshot bypass',
    kind: 'feature',
    x: 190,
    z: -930,
    radius: 24,
    note: 'The long way round Gunshot',
  },
  {
    id: 'gunshot-creek',
    name: 'Gunshot Creek',
    kind: 'feature',
    x: -3.5,
    z: -900,
    radius: 14,
    note: 'The Chute ahead, the Staircase right, the Slot left',
  },
  {
    id: 'gunshot-camp',
    name: 'Gunshot camp',
    kind: 'campsite',
    x: 8,
    z: -975,
    radius: 18,
    reset: { x: 8, z: -975, headingDeg: 90 },
    note: 'On the north bank: the end of the track',
  },
];

const props: PropDef[] = [
  { kind: 'signpost', x: 27, z: 940, headingDeg: 180, text: 'Telegraph Track — 4WD only' },
  { kind: 'fireRing', x: 32, z: 962, headingDeg: 0 },
  { kind: 'waterTank', x: 40, z: 950, headingDeg: 0 },
  { kind: 'hut', x: 46, z: 972, headingDeg: 270, flatten: 7 },
  { kind: 'signpost', x: 5, z: 640, headingDeg: 180, text: 'Palm Creek' },
  { kind: 'signpost', x: 9, z: 292, headingDeg: 180, text: 'Ducie Creek' },
  { kind: 'signpost', x: 34, z: -282, headingDeg: 180, text: 'Dulhunty River camp' },
  { kind: 'fireRing', x: 28, z: -298, headingDeg: 0 },
  { kind: 'logSeat', x: 33, z: -299, headingDeg: 0 },
  { kind: 'signpost', x: 7, z: -636, headingDeg: 180, text: 'Bertie Creek' },
  { kind: 'signpost', x: -4, z: -280, headingDeg: 90, text: 'Gauging station' },
  { kind: 'hut', x: -116, z: -290, headingDeg: 90, flatten: 6 },
  { kind: 'waterTank', x: -114, z: -283, headingDeg: 0 },
  { kind: 'noticeBox', x: -110, z: -301, headingDeg: 0, text: 'Gauge board' },
  { kind: 'signpost', x: 0, z: -852, headingDeg: 200, text: 'Gunshot — bypass right' },
  { kind: 'signpost', x: 2, z: -894, headingDeg: 180, text: 'Gunshot Creek — the Chute' },
  { kind: 'signpost', x: 6, z: -896, headingDeg: 200, text: 'Staircase →' },
  { kind: 'signpost', x: -10, z: -895, headingDeg: 160, text: '← Slot' },
  { kind: 'fireRing', x: 14, z: -980, headingDeg: 0 },
  { kind: 'logSeat', x: 19, z: -979, headingDeg: 0 },
];

/**
 * The surviving telegraph poles: a straight line up the map that the track wanders either
 * side of, most of them gone, the rest leaning. The wire was taken down when the line closed.
 */
const telegraphPoles = survivingPoles(tracks, telegraphCreeks, [26, 900, -30, -940]);

/**
 * Open eucalypt woodland everywhere except a strip along each creek, which keeps its
 * gallery forest: circles of woodland on a grid, each shrunk to stop short of the creeks.
 */
const woodland = woodlandGrid(telegraphCreeks);

export const telegraphMap: MapDef = {
  id: 'telegraph',
  name: 'The Telegraph Track',
  seed: 18870517,
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
      ...telegraphCreeks.flatMap((c) => {
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
    { id: 'bramwell-junction', x: 20, z: 958, radius: 26, blend: 18, height: PLAIN },
    { id: 'dulhunty-camp', x: 26, z: -292, radius: 14, blend: 10, height: PLAIN - 0.2 },
    { id: 'gunshot-camp', x: 10, z: -976, radius: 16, blend: 12, height: PLAIN },
  ],
  creeks: telegraphCreeks,
  tracks,
  patches: [
    // The old Dulhunty exit: a slide of pale grey clay, greasy whatever the day.
    { id: 'dulhunty-slide', kind: 'mud', x: 2.5, z: -343.5, radius: 3.2, ragged: 0.3 },
  ],
  bogs: [
    {
      // Along the bed below the Chute.
      id: 'gunshot-bog',
      ...(() => {
        const p = sideOf(gunshotChute, gunshotLip + 16);
        return {
          x: Math.round(p.x * 10) / 10,
          z: Math.round(p.z * 10) / 10,
          rotationDeg: Math.round(p.headingDeg),
        };
      })(),
      radiusX: 2.8,
      radiusZ: 11,
      depth: 0.45,
    },
  ],
  gullies: [sandWashout],
  finds: [
    {
      id: 'gauging-can',
      name: 'Jerry can',
      x: -110,
      z: -293.5,
      radius: 4,
      gives: { jerryCans: 1 },
      taken: 'A full 20 L jerry can, left at the old gauging station. Loaded.',
    },
  ],
  pois,
  props: [...props, ...telegraphPoles],
  boulders: [
    // Marked rocks at the top of each hard climb out, to winch to.
    anchor(...at(palmCreek, palmExitLip + 7, -1.8)),
    anchor(...at(palmCreek, palmExitLip + 7, 2.2)),
    anchor(...at(dulhuntyCrossing, 30, 2.4)),
    anchor(...at(bertieBed, BERTIE_BED[1] + 12, 2.6)),
    anchor(...at(gunshotChute, gunshotLip + 34, -2.4)),
    anchor(...at(gunshotChute, gunshotLip + 36, 2.6)),
    // Boulders on the Dulhunty shelf's banks.
    { x: -6, z: -316, radius: 0.9, sink: 0.3 },
    { x: 10, z: -317, radius: 1, sink: 0.4 },
  ],
  tors: [],
  fallenTrees: [],
  vegetation: {
    flora: 'tropical',
    woodland,
    maxTreeDensity: 0.28,
    // The gallery forest along the creeks, thick enough that a fallen tree can't be driven round.
    rainforestScale: 3,
    ashBelow: 0,
    snowGumAbove: 1000,
    patchScale: 160,
    trackClearance: 3,
    boulderDensity: 0.001,
    termiteMounds: 7,
    clearings: [
      { x: 20, z: 958, radius: 44 },
      { x: 26, z: -292, radius: 30 },
      { x: -112, z: -292, radius: 14 },
      { x: 8, z: -975, radius: 34 },
    ],
  },
  palette: {
    // Pale grey clay on the creek banks (and the dirt from the junction); pale sand.
    dirtTrack: '#B4AC9C',
    dirtDark: '#8A8273',
    grassDry: '#B9A96E',
    grassSage: '#8C9A6B',
    sand: '#E4DAC2',
    mud: '#6E6455',
    // Clear water over pale sand and rock, dark over a hole: Bertie's holes show from the seat.
    waterShallow: '#8DB0A2',
    waterDeep: '#183A3E',
  },
  clayBanks: true,
  muddyEdges: true,
  spawnCampsite: 'bramwell-junction',
};

/** Heights the obstacle tests check against. */
export const telegraphLevels = { plain: PLAIN, ...levels };
