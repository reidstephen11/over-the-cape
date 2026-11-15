import type { CreekDef, CreekHoleDef, ErosionRutDef, GullyDef, XZ } from '../../sim/world/mapTypes';
import { densify, pointAt } from '../../sim/world/polyline';
import { headingOf } from '../courseKit';
import type { Waypoint } from './crebRoute';

/**
 * Waypoints and creeks of the Telegraph Track, Bramwell Junction north to Gunshot Creek
 * (docs/PLAN-telegraph.md). Coordinates in metres: x = east, z = south (north is -z). The
 * plain stands about 40 m; each creek is cut into it with its own water level, and the
 * crossings pin the track's heights so the banks are the grades the plan asks for.
 */
export const PLAIN = 40;

/** Where a crossing's heights are set: the plain, and each creek's water. */
export const levels = {
  palm: 34.8,
  ducie: 37.6,
  dulhunty: 38.2,
  bertie: 37,
  gunshot: 36,
} as const;

/** A point `lateral` metres right of a polyline at `s` metres along it. */
export function sideOf(points: readonly Waypoint[], s: number, lateral = 0) {
  const poly = densify(
    points.map((p) => [p[0], p[1]] as XZ),
    0.5,
  );
  const p = pointAt(poly, s);
  return { x: p.x - p.dz * lateral, z: p.z + p.dx * lateral, headingDeg: headingOf(p), length: poly.length };
}

const r1 = (v: number) => Math.round(v * 100) / 100;

// --- Bramwell Junction to Palm Creek -------------------------------------------------

/** Corrugated red dirt from the junction, turning to sand, with swells that pitch a fast car. */
export const bramwellRoad: Waypoint[] = [
  [20, 945, PLAIN],
  [16, 900],
  [-4, 850],
  [-14, 800],
  [0, 750],
  [12, 705],
  [5, 668],
  [0, 650, PLAIN],
];

/**
 * Palm Creek: a chute between clay walls about 32° down to the water, the creek over soft
 * sand, and a wet clay climb of about 29° out with a rock step at the lip.
 */
export const palmCreek: Waypoint[] = [
  [0, 650, PLAIN],
  [0, 631, PLAIN],
  [0, 622.5, PLAIN],
  [0, 614.2, levels.palm],
  [0, 610],
  [0, 605.8, levels.palm],
  [0, 594.8, PLAIN + 0.4],
  [0, 590, PLAIN + 0.4],
  [-2, 580, PLAIN],
];
/** Metres along `palmCreek` to the chute's lip and the exit's lip. */
export const palmChuteLip = 650 - 622.5;
export const palmExitLip = 650 - 594.8;

/** The erosion rut down the chute: it starts under the left wheels and wanders across. */
export const palmRut: ErosionRutDef = {
  path: [
    [palmChuteLip - 3, -0.75],
    [palmChuteLip + 1, -0.45],
    [palmChuteLip + 4, 0],
    [palmChuteLip + 6.5, 0.4],
    [palmChuteLip + 8.5, 0.8],
  ],
  width: 0.55,
  depth: 0.5,
};

/** The second way out: up the bank to the west, less steep but leaning towards the creek. */
export const palmWestExit: Waypoint[] = [
  [-1.5, 606.2, levels.palm],
  [-5, 603.5],
  [-10, 599.5],
  [-18, 593.5],
  [-27, 586],
  [-33, 576, PLAIN],
  [-26, 565],
  [-12, 556, PLAIN],
];

// --- Palm Creek to Ducie Creek ----------------------------------------------------------

export const palmToDucie: Waypoint[] = [
  [-2, 580, PLAIN],
  [-8, 566],
  [-12, 556, PLAIN],
  [-18, 510],
  [-10, 460],
  [8, 410],
  [16, 360],
  [8, 315],
  [3, 290, PLAIN],
];

/**
 * Ducie Creek, about 30 m wide. Straight across it is over a metre deep with a current;
 * the line goes in, turns left along the shallow edge of the near bank, then back across
 * over a submerged bar to the exit.
 */
export const ducieCrossing: Waypoint[] = [
  [3, 290, PLAIN],
  [4, 278],
  [4, 271.5],
  [-2, 268.2],
  [-14, 267.3],
  [-24, 267],
  // Round the corner on an arc a long vehicle can turn on (6.5 m radius).
  [-27.3, 266.1],
  [-29.6, 263.8],
  [-30.5, 260.5],
  [-29.6, 257.3],
  [-27.4, 255],
  [-12, 245.4],
  [1.8, 236.8, levels.ducie],
  [3.6, 230.6, PLAIN + 0.3],
  [3.4, 224, PLAIN + 0.3],
  [2, 216, PLAIN],
];

const ducieBar2 = { from: [-27.4, 255] as XZ, to: [1.8, 236.8] as XZ };
const ducieAcross = (() => {
  const [ax, az] = ducieBar2.from;
  const [bx, bz] = ducieBar2.to;
  const len = Math.hypot(bx - ax, bz - az);
  const [ux, uz] = [(bx - ax) / len, (bz - az) / len];
  return { cx: (ax + bx) / 2, cz: (az + bz) / 2, len, ux, uz, rot: (Math.atan2(uz, ux) * 180) / Math.PI };
})();

// --- Ducie Creek to the Dulhunty ----------------------------------------------------------

export const ducieToSand: Waypoint[] = [
  [2, 216, PLAIN],
  [-6, 190],
  [-12, 160],
  [-10, 140, PLAIN],
];

/** 300 m of soft white sand with whoops, and one washout too wide to drive. */
export const theSand: Waypoint[] = [
  [-10, 140, PLAIN],
  [-2, 100],
  [12, 50],
  [10, 0],
  [-4, -50],
  [-12, -100],
  [-6, -160, PLAIN],
];

/** The washout across the sand, about halfway along, square across the track. */
export const sandWashout: GullyDef = (() => {
  const p = sideOf(theSand, 150);
  return {
    id: 'sand-washout',
    x: r1(p.x),
    z: r1(p.z),
    headingDeg: r1(p.headingDeg + 90),
    length: 22,
    gap: 1.3,
    depth: 0.6,
  };
})();

export const sandToDulhunty: Waypoint[] = [
  [-6, -160, PLAIN],
  [0, -200],
  [4, -250],
  [3, -290],
  [3, -302, PLAIN - 0.2],
];

/**
 * The Dulhunty's rock shelf, laid out from the water's edge back up to the south bank so
 * its three ledges face a car coming down them. A car driving north works down them.
 */
export const DULHUNTY_LEDGE = 0.42;
export const dulhuntyLedges: Waypoint[] = [
  [2.5, -319.6, levels.dulhunty],
  [2.6, -317.2, levels.dulhunty + 0.35],
  [2.8, -311.2, levels.dulhunty + 0.35 + 3 * DULHUNTY_LEDGE],
  [3, -302, PLAIN - 0.2],
];
/** Where the ledges start along `dulhuntyLedges` (its second control point, above the bank fill). */
export const DULHUNTY_LEDGES_FROM = 2.5;

/** Across the shelf, then up the slide of pale grey clay at about 25°. */
export const dulhuntyCrossing: Waypoint[] = [
  [2.5, -319.6, levels.dulhunty],
  [2.5, -330],
  [2.5, -340.4, levels.dulhunty],
  [2.5, -345.5, PLAIN + 0.6],
  [2, -352, PLAIN + 0.6],
  [0, -362, PLAIN],
];

// --- The Dulhunty to Bertie Creek -------------------------------------------------------

export const dulhuntyToBertie: Waypoint[] = [
  [0, -362, PLAIN],
  [-8, -400],
  [-18, -450],
  [-12, -500],
  [0, -550],
  [8, -600],
  [4, -626],
  [1, -640, PLAIN],
];

/**
 * Bertie Creek: down the bank into the creek, 70 m up its rock bed between the holes,
 * then a dogleg out to the left.
 */
export const bertieBed: Waypoint[] = [
  [1, -640, PLAIN],
  [1, -646, PLAIN],
  [0.7, -655.2, levels.bertie],
  [0.3, -660],
  [0, -664],
  [-1.2, -674],
  [0.8, -686],
  [-1.2, -698],
  [1.2, -710],
  [-0.6, -720],
  [0.6, -728],
  [-4, -735],
  [-9, -738, levels.bertie + 0.5],
  [-14, -740.6, PLAIN],
  [-20, -745, PLAIN],
  [-22, -749, PLAIN],
];
export const BERTIE_BED: readonly [number, number] = [18, 88];

// --- Bertie Creek to Gunshot -------------------------------------------------------------

export const bertieToFork: Waypoint[] = [
  [-22, -749, PLAIN],
  [-24, -780],
  [-16, -820],
  [-8, -858, PLAIN],
];

/** Straight on to Gunshot: a short run to the lip of the Chute. */
export const GUNSHOT_LIP = levels.gunshot + 2.3;
export const gunshotApproach: Waypoint[] = [
  [-8, -858, PLAIN],
  [-5, -880],
  [-3.5, -898, PLAIN],
];

/**
 * The Chute: over a band of rock and down a near-vertical face about 3 m high into the
 * creek, along 20 m of bog on the bed, and up a 25° clay climb out to the north bank.
 */
export const gunshotChute: Waypoint[] = [
  [-3.5, -898, PLAIN],
  [-3, -906],
  [-3, -914.8, GUNSHOT_LIP],
  [-3, -917.3, levels.gunshot - 0.45],
  [-3.2, -920.5],
  [-6.5, -925, levels.gunshot + 0.05],
  [-14, -926.4],
  [-24, -926.6],
  [-31, -927.6, levels.gunshot + 0.05],
  [-36, -930.6],
  [-38, -934.6, levels.gunshot + 0.5],
  [-38.6, -943.2, PLAIN + 0.4],
  [-36, -952, PLAIN + 0.4],
  [-22, -964],
  [-4, -970, PLAIN],
];
/** Metres along a track's points to its control point `i`. */
export function arcAtPoint(points: readonly Waypoint[], i: number): number {
  const poly = densify(
    points.map((p) => [p[0], p[1]] as XZ),
    0.25,
  );
  let k = 0;
  while (k + 1 < poly.count && poly.u[k + 1] <= i) k++;
  return poly.s[k];
}

/** Metres along `gunshotChute` to the lip. */
export const gunshotLip = (() => {
  const poly = densify(
    gunshotChute.map((p) => [p[0], p[1]] as XZ),
    0.5,
  );
  // The control point at the lip is the third: find its arc length.
  let best = 0;
  let bd = Infinity;
  for (let k = 0; k < poly.count; k++) {
    const d = Math.hypot(poly.xs[k] - -3, poly.zs[k] - -914.8);
    if (d < bd) {
      bd = d;
      best = poly.s[k];
    }
  }
  return best;
})();

/**
 * The Staircase, east of the Chute: about 40° of clay down the bank over two ledges of rock,
 * leaning towards the creek and rutted, into the creek and across it to the bed below the
 * Chute. Laid from the top of the approach.
 */
export const gunshotStaircase: Waypoint[] = [
  [-3.5, -898, PLAIN],
  [3, -901.5],
  [10, -905.5],
  [13, -909, PLAIN],
  [13.6, -913.6, PLAIN],
  [14, -918.6, levels.gunshot],
  [12.5, -922],
  [8, -925.6, levels.gunshot + 0.05],
  [0, -926],
  [-6.5, -925, levels.gunshot + 0.05],
];

/**
 * The Slot, west of the Chute: a narrow rut twisting down the bank between clay walls at
 * about 40°, with a hole under one front wheel and a hump under the other, then into the
 * creek and across to the bed.
 */
export const gunshotSlot: Waypoint[] = [
  [-3.5, -898, PLAIN],
  [-10, -901.5],
  [-16.5, -905.5],
  [-18.5, -909, PLAIN],
  [-19, -912.4, PLAIN],
  [-20.6, -915.2],
  [-19.2, -918.6, levels.gunshot],
  [-20.2, -922],
  [-22, -926.6, levels.gunshot + 0.05],
];

/** The bypass: right at the fork and round on easy sand to the north bank. */
export const gunshotBypass: Waypoint[] = [
  [-8, -858, PLAIN],
  [20, -852],
  [70, -856],
  [130, -878],
  [178, -908],
  [192, -935],
  [184, -962],
  [140, -982],
  [80, -985],
  [30, -976],
  [-4, -970, PLAIN],
];

// --- Creeks ------------------------------------------------------------------------------

/**
 * A creek running east to west across the map (the Cape's western rivers run to the Gulf),
 * through `at` with water level `water`, the rest of its line at a gentle fall.
 */
function acrossMap(
  id: string,
  name: string,
  points: CreekDef['points'],
  extra: Partial<CreekDef> = {},
): CreekDef {
  return { id, name, points, ...extra };
}

const W = levels;

export const telegraphCreeks: CreekDef[] = [
  acrossMap(
    'palm-creek',
    'Palm Creek',
    [
      { x: 520, z: 640, water: W.palm + 0.5, halfWidth: 4, depth: 0.5, bankSlope: 1.1, bed: 'sand' },
      { x: 160, z: 618, water: W.palm + 0.15, halfWidth: 4, depth: 0.5, bankSlope: 1.1, bed: 'sand' },
      { x: 0, z: 610, water: W.palm, halfWidth: 4, depth: 0.5, bankSlope: 1.15, bed: 'sand' },
      { x: -180, z: 598, water: W.palm - 0.15, halfWidth: 4, depth: 0.5, bankSlope: 1.1, bed: 'sand' },
      { x: -520, z: 580, water: W.palm - 0.5, halfWidth: 4.5, depth: 0.55, bankSlope: 1.1, bed: 'sand' },
    ],
    { valley: 16, flow: 0.5, sandBank: 0.5, bankRough: 0.18 },
  ),
  acrossMap(
    'ducie-creek',
    'Ducie Creek',
    [
      { x: 520, z: 230, water: W.ducie + 0.4, halfWidth: 15, depth: 1.25, bankSlope: 0.32, bed: 'sand' },
      { x: 150, z: 262, water: W.ducie + 0.1, halfWidth: 15, depth: 1.25, bankSlope: 0.32, bed: 'sand' },
      { x: -10, z: 255, water: W.ducie, halfWidth: 15, depth: 1.25, bankSlope: 0.32, bed: 'sand' },
      { x: -200, z: 244, water: W.ducie - 0.12, halfWidth: 15, depth: 1.25, bankSlope: 0.32, bed: 'sand' },
      { x: -520, z: 262, water: W.ducie - 0.4, halfWidth: 16, depth: 1.3, bankSlope: 0.32, bed: 'sand' },
    ],
    {
      valley: 30,
      flow: 1.1,
      sandBank: 3,
      bankRough: 0.1,
      bars: [
        // The way across: back over the middle from the near bank to the exit.
        {
          x: r1(ducieAcross.cx),
          z: r1(ducieAcross.cz),
          radiusX: r1(ducieAcross.len / 2 + 2),
          radiusZ: 4.4,
          rotationDeg: r1(ducieAcross.rot),
          depth: 0.55,
        },
        // The corner where the line turns back from the near bank.
        { x: -26.5, z: 261, radiusX: 5.5, radiusZ: 6.5, rotationDeg: 0, depth: 0.55 },
      ],
      holes: [
        // Either side of the bar's crossing, and in the straight line.
        {
          x: r1(ducieAcross.cx + 8.5 * -ducieAcross.uz),
          z: r1(ducieAcross.cz + 8.5 * ducieAcross.ux),
          radius: 3,
          depth: 0.6,
        },
        {
          x: r1(ducieAcross.cx - 8.5 * -ducieAcross.uz),
          z: r1(ducieAcross.cz - 8.5 * ducieAcross.ux),
          radius: 3,
          depth: 0.6,
        },
        { x: 7, z: 254, radius: 3.2, depth: 0.5 },
      ],
    },
  ),
  acrossMap(
    'dulhunty-river',
    'Dulhunty River',
    [
      { x: 520, z: -350, water: W.dulhunty + 0.4, halfWidth: 10, depth: 0.9, bankSlope: 0.7, bed: 'gravel' },
      { x: 140, z: -326, water: W.dulhunty + 0.12, halfWidth: 10, depth: 0.9, bankSlope: 0.7, bed: 'gravel' },
      { x: 30, z: -330, water: W.dulhunty + 0.03, halfWidth: 10, depth: 0.9, bankSlope: 0.7, bed: 'gravel' },
      // The shallow falls: the river drops over the lip of the shelf just downstream.
      { x: -12, z: -330, water: W.dulhunty, halfWidth: 10, depth: 0.9, bankSlope: 0.7, bed: 'gravel' },
      { x: -24, z: -330, water: W.dulhunty - 1.2, halfWidth: 11, depth: 1, bankSlope: 0.7, bed: 'gravel' },
      { x: -180, z: -318, water: W.dulhunty - 1.5, halfWidth: 11, depth: 1, bankSlope: 0.7 },
      { x: -520, z: -340, water: W.dulhunty - 1.9, halfWidth: 12, depth: 1.1, bankSlope: 0.7 },
    ],
    {
      valley: 18,
      flow: 1.3,
      bankRough: 0.12,
      // The shelf the line takes across, a hand's depth under the water.
      bars: [{ x: 2.5, z: -330, radiusX: 3, radiusZ: 14, rotationDeg: 0, depth: 0.3 }],
      rough: [{ x: 2.5, z: -330, radius: 9, height: 0.05 }],
      holes: [
        // Off the shelf's downstream edge the rock drops away towards the falls.
        { x: -2, z: -324.5, radius: 2.2, depth: 0.9 },
        { x: -2.2, z: -330, radius: 2.2, depth: 1 },
        { x: -2, z: -335.5, radius: 2.2, depth: 0.9 },
      ],
    },
  ),
  acrossMap(
    'bertie-creek',
    'Bertie Creek',
    [
      // Down from the north-east, south along the track for 70 m, then away to the west.
      { x: 520, z: -790, water: W.bertie + 1.4, halfWidth: 3.5, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: 120, z: -768, water: W.bertie + 0.85, halfWidth: 3.5, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: 12, z: -746, water: W.bertie + 0.62, halfWidth: 3.5, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: 0, z: -728, water: W.bertie + 0.5, halfWidth: 4.2, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: 0, z: -700, water: W.bertie + 0.32, halfWidth: 4.2, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: 0, z: -680, water: W.bertie + 0.14, halfWidth: 4.2, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: -1, z: -668, water: W.bertie + 0.05, halfWidth: 4.2, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: -8, z: -661, water: W.bertie, halfWidth: 4, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: -26, z: -656, water: W.bertie - 0.15, halfWidth: 3.5, depth: 0.3, bankSlope: 0.9, bed: 'gravel' },
      { x: -520, z: -618, water: W.bertie - 1.2, halfWidth: 4, depth: 0.35, bankSlope: 0.9, bed: 'gravel' },
    ],
    {
      valley: 14,
      flow: 0.5,
      bankRough: 0.15,
      rough: [{ x: 0, z: -692, radius: 40, height: 0.06 }],
      holes: bertieHoles(),
    },
  ),
  acrossMap(
    'gunshot-creek',
    'Gunshot Creek',
    [
      { x: 520, z: -948, water: W.gunshot + 0.5, halfWidth: 6, depth: 0.3, bankSlope: 0.13, bed: 'sand' },
      { x: 190, z: -934, water: W.gunshot + 0.25, halfWidth: 6, depth: 0.3, bankSlope: 0.14, bed: 'sand' },
      { x: 70, z: -924, water: W.gunshot + 0.08, halfWidth: 3, depth: 0.6, bankSlope: 2, bed: 'water' },
      { x: -3, z: -920.8, water: W.gunshot, halfWidth: 3, depth: 0.6, bankSlope: 2, bed: 'water' },
      { x: -60, z: -924, water: W.gunshot - 0.06, halfWidth: 3, depth: 0.6, bankSlope: 2, bed: 'water' },
      { x: -200, z: -935, water: W.gunshot - 0.25, halfWidth: 3.5, depth: 0.6, bankSlope: 1.2, bed: 'water' },
      { x: -520, z: -950, water: W.gunshot - 0.6, halfWidth: 4, depth: 0.6, bankSlope: 1.2, bed: 'water' },
    ],
    { valley: 34, flow: 0.3, sandBank: 4, bankRough: 0.12 },
  ),
];

/**
 * The holes in Bertie's bed, in track coordinates [metres along, metres right, radius,
 * depth]: off the line either side, so a wheel on the line clears them by about a third of a
 * metre, with one between the wheels where the line is centred on it.
 */
function bertieHoleSpec(): readonly (readonly [number, number, number, number])[] {
  // Wheels at ±0.8 m, tyres about 0.15 m either side of that.
  const clear = (radius: number) => 1.3 + radius;
  const spec: readonly [number, 1 | -1, number, number][] = [
    [24, 1, 1.1, 1],
    [30, -1, 0.9, 0.9],
    [36, 1, 1.25, 1.2],
    [42, -1, 1, 1.1],
    [49, 1, 0.8, 0.9],
    [55, -1, 1.2, 1],
    [61, 1, 1, 1.15],
    [68, -1, 1.1, 0.95],
    [74, 1, 0.9, 1.1],
    [81, -1, 1.15, 1],
  ];
  return [
    ...spec.map(([s, side, r, d]) => [s, side * clear(r), r, d] as const),
    // Between the wheels: small enough to straddle.
    [52, 0, 0.45, 0.9] as const,
  ];
}

/** The holes as the creek draws them: darker, deeper water over each. */
export function bertieHoles(): CreekHoleDef[] {
  return bertieHoleSpec().map(([s, lateral, radius]) => {
    const p = sideOf(bertieBed, s, lateral);
    return { x: r1(p.x), z: r1(p.z), radius: radius + 0.5, depth: 1 };
  });
}

/**
 * The holes as the wheels meet them: pits in the fine ground, steep sided, since a hole
 * two metres across is too small for the 1 m ground to hold.
 */
export const bertiePits: ErosionRutDef[] = bertieHoleSpec().map(([s, lateral, radius, depth]) => ({
  path: [
    [s - radius * 1.1, lateral],
    [s + radius * 1.1, lateral],
  ],
  width: radius * 2,
  depth,
}));
