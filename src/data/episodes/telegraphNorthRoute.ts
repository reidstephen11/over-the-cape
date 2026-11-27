import type { BogDef, CreekDef, ErosionRutDef, TrackBridgeDef } from '../../sim/world/mapTypes';
import type { Waypoint } from './crebRoute';
import { PLAIN, arcAtPoint, sideOf } from './telegraphRoute';

/**
 * Waypoints and creeks of the northern Telegraph Track, from the Bamaga Road turn-off north
 * to Nolans Brook (docs/PLAN-telegraph-north.md). Coordinates in metres: x = east, z = south
 * (north is -z). The plain stands about 40 m, as on the southern map; each creek is cut into
 * it with its own water level. The creeks run east to west, so their current pushes a car
 * going north to its left.
 */
export const northLevels = {
  canal: 36.6,
  sam: 38.6,
  mistake: 35.6,
  cannibal: 38.7,
  cypress: 36.4,
  nolans: 38,
  /** The creek above Fruit Bat Falls, and the pool below them (stage 2, v2.21). */
  fruitBatTop: 39,
  fruitBatPool: 36.8,
} as const;
const W = northLevels;

const r1 = (v: number) => Math.round(v * 100) / 100;

// --- The turn-off to Canal Creek ----------------------------------------------------------

/** From the Bamaga Road the track runs nearly straight to the first creek. */
export const turnoffRoad: Waypoint[] = [
  [20, 945, PLAIN],
  [15, 900],
  [7, 840],
  [2, 770],
  [0, 700],
  [0, 652, PLAIN],
];

// --- The falls (stage 2, v2.21) -------------------------------------------------------------

/** Metres along `turnoffRoad` to the fork to Fruit Bat Falls, and to the Eliot and Twin Falls turn-off. */
export const FRUIT_BAT_FORK = 56;
export const ELIOT_TURNOFF = 277;
const forkAt = (s: number): Waypoint => {
  const p = sideOf(turnoffRoad, s);
  return [r1(p.x), r1(p.z), PLAIN];
};

/**
 * The fork to Fruit Bat Falls: right off the track soon after the turn-off, east over the
 * heath to a day-use area on the bank above the pool, with the cascade to the right.
 */
export const fruitBatTrack: Waypoint[] = [
  forkAt(FRUIT_BAT_FORK),
  [34, 884],
  [75, 880],
  [130, 886],
  [185, 893],
  [222, 894, PLAIN],
];
/** Where the car stops above the pool at Fruit Bat Falls. */
export const FRUIT_BAT_STOP: readonly [number, number] = [222, 894];

/**
 * The turn-off to Eliot and Twin Falls: right off the track just before Canal Creek, east
 * along its south bank to the camping area between the two falls.
 */
export const eliotTrack: Waypoint[] = [
  forkAt(ELIOT_TURNOFF),
  [24, 668],
  [62, 660],
  [114, 654],
  [164, 650, PLAIN],
];
/** Where the car stops at the camping area between Eliot Falls and Twin Falls. */
export const ELIOT_STOP: readonly [number, number] = [164, 650];
/** Along Canal Creek (x): Eliot Falls drop between the first pair, Twin Falls between the second. */
export const ELIOT_FALLS_X: readonly [number, number] = [193, 189];
export const TWIN_FALLS_X: readonly [number, number] = [146, 142];

/**
 * Canal Creek: a ramp down into deep, clear water, across on a shelf, then the winding
 * left-hand exit: left along the foot of the far bank and up it in an S.
 */
export const canalCreek: Waypoint[] = [
  [0, 652, PLAIN],
  [0, 634, PLAIN],
  [0, 619.3, W.canal],
  [0, 612],
  [-1, 604.7, W.canal],
  [-6, 601.6, W.canal + 0.25],
  [-12, 600.4, W.canal + 0.5],
  [-17, 596.6, W.canal + 1],
  [-19, 590.6, W.canal + 2.9],
  [-17, 585],
  [-11.5, 581.4, PLAIN],
  [-5, 577],
  [-1, 570],
  [0, 562, PLAIN],
];
/**
 * Marker rocks at the near water's edge, one either side of the shelf's line (v2.19): drive
 * in between them. [x, z].
 */
export const CANAL_MARKERS: readonly (readonly [number, number])[] = [
  [-3.3, 620.6],
  [2.3, 620.6],
];
/** A sign on the far bank straight across the shelf, between the two exits, to aim at (v2.19). */
export const CANAL_AIM_SIGN: readonly [number, number] = [-1.6, 596.6];
/** Metres along `canalCreek` to the far water's edge, where the two exits part. */
export const canalFarEdge = arcAtPoint(canalCreek, 4);

/**
 * The old exit, to the right of the far bank: straight up the clay, where the rain has cut
 * gullies across it.
 */
export const canalOldExit: Waypoint[] = [
  [-1, 604.7, W.canal],
  [2.6, 600.2, W.canal + 0.5],
  [5.6, 593.4, PLAIN + 0.1],
  [6, 586, PLAIN],
  [4, 575],
  [0, 562, PLAIN],
];
/** The washed-out gullies across the old exit: sheer-sided, deep enough to hold a wheel. */
export const canalGullies: ErosionRutDef[] = [
  {
    path: [
      [6.6, -1.9],
      [9.6, 1.9],
    ],
    width: 1,
    depth: 0.95,
    wall: 0.15,
    ramp: 0,
  },
  {
    path: [
      [10.4, 1.9],
      [12.6, -1.9],
    ],
    width: 0.9,
    depth: 0.9,
    wall: 0.15,
    ramp: 0,
  },
];

// --- Canal Creek to Mistake Creek ----------------------------------------------------------

export const canalToSam: Waypoint[] = [
  [0, 562, PLAIN],
  [-6, 520],
  [-10, 470],
  [-2, 420],
  [4, 380],
  [2, 352, PLAIN],
];

/** Sam Creek: an easy crossing, ankle deep over gravel. */
export const samCrossing: Waypoint[] = [
  [2, 352, PLAIN],
  [2, 346.5, PLAIN],
  [2, 340.2, W.sam],
  [2, 335],
  [2, 329.8, W.sam],
  [1.6, 322, PLAIN],
  [1, 312, PLAIN],
];

export const samToMistake: Waypoint[] = [
  [1, 312, PLAIN],
  [8, 270],
  [12, 220],
  [4, 170],
  [0, 140],
  [0, 122, PLAIN],
];

/**
 * Mistake Creek: a steep, eroded way in (about 30° of clay for 7 m, rutted and twisting),
 * a shallow creek over sand, and an easy climb out.
 */
export const mistakeCreek: Waypoint[] = [
  [0, 122, PLAIN],
  [0, 110, PLAIN],
  [0, 103, W.mistake + 0.4],
  [0, 95.7, W.mistake],
  [0, 92],
  [0, 88.3, W.mistake],
  [1, 72, PLAIN + 0.2],
  [2, 62, PLAIN],
  [2, 56, PLAIN],
];
/** Metres along `mistakeCreek` to the lip of the way in. */
export const mistakeLip = 12;
/** The rut down the way in: under the left wheels at the lip, wandering to the middle. */
export const mistakeRut: ErosionRutDef = {
  path: [
    [mistakeLip - 1.5, -0.8],
    [mistakeLip + 2, -0.65],
    [mistakeLip + 4.5, -0.25],
    [mistakeLip + 7, 0.3],
  ],
  width: 0.55,
  depth: 0.45,
};
/** Where the bank has washed away on the right of the way in: a sheer hole that holds a wheel. */
export const mistakeWashout: ErosionRutDef = {
  path: [
    [mistakeLip + 1.2, 2.1],
    [mistakeLip + 4.6, 1.75],
  ],
  width: 1.3,
  depth: 0.95,
  wall: 0.15,
  ramp: 0,
};

// --- Mistake Creek to Cypress Creek --------------------------------------------------------

export const mistakeToCannibal: Waypoint[] = [
  [2, 56, PLAIN],
  [-4, 10],
  [-10, -40],
  [-6, -90],
  [-2, -130, PLAIN],
];

/** Cannibal Creek: an easy crossing, with the camp on its north bank. */
export const cannibalCrossing: Waypoint[] = [
  [-2, -130, PLAIN],
  [-2, -137, PLAIN],
  [-2, -143.3, W.cannibal],
  [-2, -148],
  [-2, -152.7, W.cannibal],
  [0, -160.5, PLAIN],
  [4, -172, PLAIN],
];

/** On to Cypress Creek, coming round a bend onto the bridge. */
export const cannibalToCypress: Waypoint[] = [
  [4, -172, PLAIN],
  [10, -220],
  [4, -280],
  [-10, -330],
  [-16, -360],
  [-14.5, -378],
  [-8, -392, PLAIN],
];

/** Over Cypress Creek on the log bridge: straight for 7 m before it, and 26 m of deck. */
export const cypressBridge: Waypoint[] = [
  [-8, -392, PLAIN],
  [-3, -398.5],
  [0, -404, PLAIN],
  [0, -411, PLAIN],
  [0, -437, PLAIN],
  [0, -444, PLAIN],
  [2, -452, PLAIN],
];
/** Metres along `cypressBridge` to the bridge's two ends. */
export const CYPRESS_SPAN: readonly [number, number] = [
  r1(arcAtPoint(cypressBridge, 3)),
  r1(arcAtPoint(cypressBridge, 4)),
];
/** Where the logs are missing, in metres from the bridge's near end: right, left, middle. */
export const CYPRESS_HOLES: readonly (readonly [number, number])[] = [
  [3, 5.5],
  [13, 15.5],
  [21, 23],
];
/**
 * The log bridge: a deck 4 m wide with no kerb and logs missing. A hole on the right from
 * 0.45 m off the middle to the edge, leaving 2.45 m to drive on (the Unimog is 2.18 m over
 * its tyres); a narrower one on the left, leaving 2.9 m; then one down the middle to straddle. Seven metres and more of whole
 * deck between them, so a long wheelbase is clear of one before the next.
 */
export const cypressDeck: TrackBridgeDef = {
  from: CYPRESS_SPAN[0],
  to: CYPRESS_SPAN[1],
  kind: 'deck',
  width: 4,
  kerb: 0,
  gaps: [
    {
      from: CYPRESS_SPAN[0] + CYPRESS_HOLES[0][0],
      to: CYPRESS_SPAN[0] + CYPRESS_HOLES[0][1],
      left: 0.45,
      right: 2,
    },
    {
      from: CYPRESS_SPAN[0] + CYPRESS_HOLES[1][0],
      to: CYPRESS_SPAN[0] + CYPRESS_HOLES[1][1],
      left: -2,
      right: -0.9,
    },
    {
      from: CYPRESS_SPAN[0] + CYPRESS_HOLES[2][0],
      to: CYPRESS_SPAN[0] + CYPRESS_HOLES[2][1],
      left: -0.32,
      right: 0.32,
    },
  ],
};

// --- The long drive to Nolans Brook -------------------------------------------------------

/** The long drive: 380 m of sand with whoops, and a bog across the track two thirds along. */
export const longDrive: Waypoint[] = [
  [2, -452, PLAIN],
  [8, -520],
  [-6, -600],
  [-12, -680],
  [-4, -760],
  [0, -822, PLAIN],
];
/** Metres along `longDrive` to the middle of the bog. */
export const LONG_DRIVE_BOG = 250;
/**
 * The bog: a mud hole lying across the right two thirds of the track, so the left wheels
 * can stay on firm ground along its edge.
 */
export const longDriveBog: BogDef = (() => {
  const p = sideOf(longDrive, LONG_DRIVE_BOG, 1.5);
  return {
    id: 'long-drive-bog',
    x: r1(p.x),
    z: r1(p.z),
    rotationDeg: Math.round(p.headingDeg),
    radiusX: 2,
    radiusZ: 10,
    depth: 0.6,
    deep: true,
  };
})();
/**
 * Metres along `longDrive` to the two rocks to winch to, one before the bog and one past it,
 * and how far left of the centreline they sit (the firm side). The engine plants winch trees
 * only at the mud holes it makes itself in rough tracks, not at an authored bog, and there
 * is no tree within the cable's 29 m of this one (v2.20).
 */
export const LONG_DRIVE_BOG_ANCHORS = [LONG_DRIVE_BOG - 17, LONG_DRIVE_BOG + 17] as const;
export const LONG_DRIVE_BOG_ANCHOR_SIDE = -3.6;

/**
 * Nolans Brook, 40 m wide over sand and deep in the middle. The line goes in, hard right
 * (upstream) onto a shoal, then straight across on it to a way out at its upstream end, so the car never drives downstream in deep water: the current only pushes
 * it sideways, towards the deep.
 */
export const nolansBrook: Waypoint[] = [
  [0, -822, PLAIN],
  [0, -838],
  [0, -849],
  [3, -855],
  [8.5, -860],
  [13.5, -864.5],
  [16.6, -869.5],
  [17.8, -875.5],
  [18, -883],
  [18, -890.6, W.nolans],
  [18, -897.4, PLAIN + 0.3],
  [17, -905, PLAIN + 0.3],
  [13.5, -918, PLAIN],
  [10, -940, PLAIN],
];
/**
 * Nolans Brook's rock (v2.20): on the near bank at the water's edge, on the shoal's line
 * across (x = 18). Two signs marked that line with it until v2.32, when the brook's water was
 * made clear enough to read: the shoal shows pale and broken, the deep dark. The rock stays,
 * as something a driver would steer by once the afternoon's rise has muddied the water.
 */
export const NOLANS_MARKER: readonly [number, number] = [18, -849.2];
/** A big rock, to be picked out from the way in 18 m off (v2.23; it was 0.7 m). */
export const NOLANS_MARKER_RADIUS = 1.3;
// --- Creeks --------------------------------------------------------------------------------

export const northCreeks: CreekDef[] = [
  {
    // The creek Fruit Bat Falls are on (stage 2, v2.21): it comes in from the south, east of
    // the track, drops 2.2 m over a wide lip into a pool, and leaves the map to the east. It
    // never crosses the track. Hema does not name it, so the game does not either.
    id: 'fruit-bat-creek',
    name: 'Fruit Bat Falls',
    points: [
      {
        x: 268,
        z: 1040,
        water: W.fruitBatTop + 0.1,
        halfWidth: 6,
        depth: 0.4,
        bankSlope: 0.5,
        bed: 'gravel',
      },
      {
        x: 258,
        z: 960,
        water: W.fruitBatTop + 0.05,
        halfWidth: 7,
        depth: 0.4,
        bankSlope: 0.5,
        bed: 'gravel',
      },
      { x: 252, z: 908, water: W.fruitBatTop, halfWidth: 12, depth: 0.5, bankSlope: 0.5, bed: 'gravel' },
      { x: 252, z: 902.5, water: W.fruitBatPool, halfWidth: 13, depth: 1.5, bankSlope: 0.5, bed: 'sand' },
      {
        x: 254,
        z: 880,
        water: W.fruitBatPool - 0.02,
        halfWidth: 13,
        depth: 1.5,
        bankSlope: 0.5,
        bed: 'sand',
      },
      {
        x: 275,
        z: 850,
        water: W.fruitBatPool - 0.1,
        halfWidth: 7,
        depth: 0.7,
        bankSlope: 0.5,
        bed: 'gravel',
      },
      {
        x: 360,
        z: 800,
        water: W.fruitBatPool - 0.3,
        halfWidth: 6,
        depth: 0.6,
        bankSlope: 0.5,
        bed: 'gravel',
      },
      {
        x: 520,
        z: 770,
        water: W.fruitBatPool - 0.5,
        halfWidth: 6,
        depth: 0.6,
        bankSlope: 0.5,
        bed: 'gravel',
      },
    ],
    valley: 16,
    flow: 0.4,
    bankRough: 0.1,
  },
  {
    id: 'canal-creek',
    name: 'Canal Creek',
    points: [
      { x: 520, z: 640, water: W.canal + 2.6, halfWidth: 7, depth: 0.6, bankSlope: 0.6, bed: 'gravel' },
      // Eliot Falls (v2.21): the creek drops 1.1 m over a lip of rock into a pool.
      {
        x: ELIOT_FALLS_X[0],
        z: 624,
        water: W.canal + 2.5,
        halfWidth: 8,
        depth: 0.5,
        bankSlope: 0.6,
        bed: 'gravel',
      },
      {
        x: ELIOT_FALLS_X[1],
        z: 623,
        water: W.canal + 1.4,
        halfWidth: 9,
        depth: 1.2,
        bankSlope: 0.6,
        bed: 'gravel',
      },
      // Twin Falls: the pool spills another 1.15 m to the creek's level at the crossing.
      {
        x: TWIN_FALLS_X[0],
        z: 620.5,
        water: W.canal + 1.35,
        halfWidth: 9,
        depth: 1,
        bankSlope: 0.6,
        bed: 'gravel',
      },
      {
        x: TWIN_FALLS_X[1],
        z: 620,
        water: W.canal + 0.2,
        halfWidth: 10,
        depth: 1.4,
        bankSlope: 0.6,
        bed: 'gravel',
      },
      { x: 90, z: 616.5, water: W.canal + 0.1, halfWidth: 7, depth: 1.1, bankSlope: 0.6, bed: 'gravel' },
      { x: 0, z: 612, water: W.canal, halfWidth: 7, depth: 1.1, bankSlope: 0.6, bed: 'gravel' },
      { x: -180, z: 600, water: W.canal - 0.15, halfWidth: 7, depth: 1.1, bankSlope: 0.6, bed: 'gravel' },
      { x: -520, z: 584, water: W.canal - 0.5, halfWidth: 7.5, depth: 1.1, bankSlope: 0.6, bed: 'gravel' },
    ],
    valley: 16,
    flow: 0.5,
    bankRough: 0.12,
    // Clear blue water (Hema): the gravel shelf shows through it and its surface is broken,
    // and the deep water either side is dark and smooth (v2.25).
    clear: true,
    // The shelf the line takes across, and the shallows along the foot of the far bank
    // where the winding exit starts.
    bars: [
      { x: -0.5, z: 612, radiusX: 3.2, radiusZ: 9, rotationDeg: 0, depth: 0.6 },
      { x: -8, z: 603.5, radiusX: 9, radiusZ: 3, rotationDeg: 8, depth: 0.3 },
    ],
    // Either side of the shelf the bed drops away, right from the shelf's edges, so the
    // water is dark beside it and the paler shelf shows from the ramp (v2.19).
    holes: [
      { x: 6.4, z: 612.5, radius: 4.2, depth: 0.6 },
      { x: -7.6, z: 613.5, radius: 4.2, depth: 0.6 },
    ],
  },
  {
    id: 'sam-creek',
    name: 'Sam Creek',
    points: [
      { x: 520, z: 318, water: W.sam + 0.4, halfWidth: 5, depth: 0.3, bankSlope: 0.3, bed: 'gravel' },
      { x: 150, z: 338, water: W.sam + 0.1, halfWidth: 5, depth: 0.3, bankSlope: 0.3, bed: 'gravel' },
      { x: 2, z: 335, water: W.sam, halfWidth: 5, depth: 0.3, bankSlope: 0.3, bed: 'gravel' },
      { x: -200, z: 330, water: W.sam - 0.15, halfWidth: 5.5, depth: 0.35, bankSlope: 0.3, bed: 'gravel' },
      { x: -520, z: 346, water: W.sam - 0.4, halfWidth: 6, depth: 0.4, bankSlope: 0.3, bed: 'gravel' },
    ],
    valley: 22,
    flow: 0.4,
    bankRough: 0.08,
    // The clear swimming holes downstream of the crossing.
    holes: [
      { x: -24, z: 334.5, radius: 4.5, depth: 1.2 },
      { x: -41, z: 334, radius: 3.5, depth: 0.9 },
    ],
  },
  {
    id: 'mistake-creek',
    name: 'Mistake Creek',
    points: [
      { x: 520, z: 70, water: W.mistake + 0.5, halfWidth: 3.5, depth: 0.4, bankSlope: 1, bed: 'sand' },
      { x: 150, z: 86, water: W.mistake + 0.15, halfWidth: 3.5, depth: 0.4, bankSlope: 1, bed: 'sand' },
      { x: 0, z: 92, water: W.mistake, halfWidth: 3.5, depth: 0.4, bankSlope: 1, bed: 'sand' },
      { x: -180, z: 100, water: W.mistake - 0.15, halfWidth: 3.5, depth: 0.4, bankSlope: 1, bed: 'sand' },
      { x: -520, z: 84, water: W.mistake - 0.5, halfWidth: 4, depth: 0.45, bankSlope: 1, bed: 'sand' },
    ],
    valley: 16,
    flow: 0.4,
    sandBank: 1,
    bankRough: 0.15,
  },
  {
    id: 'cannibal-creek',
    name: 'Cannibal Creek',
    points: [
      { x: 520, z: -166, water: W.cannibal + 0.4, halfWidth: 4.5, depth: 0.3, bankSlope: 0.3, bed: 'gravel' },
      { x: 150, z: -152, water: W.cannibal + 0.1, halfWidth: 4.5, depth: 0.3, bankSlope: 0.3, bed: 'gravel' },
      { x: -2, z: -148, water: W.cannibal, halfWidth: 4.5, depth: 0.3, bankSlope: 0.3, bed: 'gravel' },
      {
        x: -200,
        z: -140,
        water: W.cannibal - 0.15,
        halfWidth: 4.5,
        depth: 0.3,
        bankSlope: 0.3,
        bed: 'gravel',
      },
      { x: -520, z: -156, water: W.cannibal - 0.4, halfWidth: 5, depth: 0.35, bankSlope: 0.3, bed: 'gravel' },
    ],
    valley: 22,
    flow: 0.4,
    bankRough: 0.08,
  },
  {
    id: 'cypress-creek',
    name: 'Cypress Creek',
    points: [
      { x: 520, z: -406, water: W.cypress + 0.5, halfWidth: 4, depth: 1.1, bankSlope: 0.6, bed: 'water' },
      { x: 150, z: -418, water: W.cypress + 0.15, halfWidth: 4, depth: 1.1, bankSlope: 0.6, bed: 'water' },
      { x: 0, z: -424, water: W.cypress, halfWidth: 4, depth: 1.1, bankSlope: 0.6, bed: 'water' },
      { x: -180, z: -430, water: W.cypress - 0.15, halfWidth: 4, depth: 1.1, bankSlope: 0.6, bed: 'water' },
      { x: -520, z: -416, water: W.cypress - 0.5, halfWidth: 4.5, depth: 1.1, bankSlope: 0.6, bed: 'water' },
    ],
    valley: 9,
    flow: 0.5,
    bankRough: 0,
  },
  {
    id: 'nolans-brook',
    name: 'Nolans Brook',
    points: [
      { x: 520, z: -892, water: W.nolans + 0.4, halfWidth: 19, depth: 1.4, bankSlope: 0.26, bed: 'sand' },
      { x: 150, z: -876, water: W.nolans + 0.1, halfWidth: 20, depth: 1.4, bankSlope: 0.26, bed: 'sand' },
      { x: 5, z: -870, water: W.nolans, halfWidth: 20, depth: 1.4, bankSlope: 0.26, bed: 'sand' },
      { x: -180, z: -864, water: W.nolans - 0.12, halfWidth: 20, depth: 1.4, bankSlope: 0.26, bed: 'sand' },
      { x: -520, z: -880, water: W.nolans - 0.4, halfWidth: 21, depth: 1.45, bankSlope: 0.26, bed: 'sand' },
    ],
    valley: 30,
    flow: 1.4,
    sandBank: 3,
    bankRough: 0.08,
    // A soft sandy bottom everywhere but on the shoal (v2.22): Hema's "firmer bottom" on the
    // hard right line.
    softBed: true,
    // Clear water (v2.32): the shoal shows pale and broken, the dug-out straight line dark.
    // The afternoon's rise muddies it: faint by five on the commonest day, gone soon after.
    clear: true,
    // The shoal on the upstream side that the hard right line follows.
    bars: [
      { x: 5, z: -857, radiusX: 8, radiusZ: 8, rotationDeg: 0, depth: 0.55 },
      { x: 16, z: -872, radiusX: 7, radiusZ: 20, rotationDeg: 0, depth: 0.55 },
    ],
    // The straight line: deeper still where the old crossing has been dug out by wheels.
    holes: [
      { x: -1, z: -873, radius: 6, depth: 1 },
      { x: -1, z: -882, radius: 5, depth: 0.9 },
    ],
  },
];
