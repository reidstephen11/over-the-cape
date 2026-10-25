import * as THREE from "three";
import type { VehicleTuning } from "../data/vehicle";
import { plankTuning } from "../data/tools";
import {
  BodyZone as Z,
  VehicleBuilder,
  VehicleMaterial as M,
} from "./vehicleGeometry";
import { addPerentieInterior } from "./perentieReviewInterior";
import { perentieColors } from "./perentiePaint";
import { cleanGeometry, continuousTube } from "./perentieRefinement";
import {
  addCanvasTilt,
  addTiltRack,
  addCanvasHoops,
  TILT_BOARD_Y,
  TILT_BOARD_Z,
  TILT_RACK_Z,
} from "./perentieCanvas";
import { mirrorHead, stalk } from "./mirrors";
import {
  extrudeX,
  extrudeZ,
  sideShape,
  rounded,
  type Vtx,
} from "./perentieShapes";

/**
 * Land Rover 110 "Perentie" General Service soft top in Australian Army green, with an
 * Army registration plate (48-001). Flat panels and flat-topped wings, a black slatted
 * grille between the headlamp panels, a heavy bull bar, vent flaps under an upright
 * windscreen, a canvas tilt over the cab and rear tub, a galvanised chassis and the
 * Perentie's spare wheel slung under the rear floor, a
 * pick, shovel and axe in brackets across the bonnet. Ground is
 * about 0.52 m below the origin when parked.
 */
const { paint, canvas, bar, galv } = perentieColors;
const black = new THREE.Color("#1F2320"),
  rubber = new THREE.Color("#252926"),
  steel = new THREE.Color("#9A9E97");
const red = new THREE.Color("#AE3029"),
  amber = new THREE.Color("#E39B37"),
  lens = new THREE.Color("#E3E4CD");
const glass = new THREE.Color("#A9BDB6"),
  white = new THREE.Color("#E8E6DC");

/** Body sides, wheel openings and the main heights (vehicle frame). */
const reviewRanges: { start: number; end: number; part: number }[] = [];
const SIDE = 0.845;
const WAIST = 0.78;
const SILL = 0.07;
const ARCH = { radius: 0.51, cy: -0.05 };
const FRONT_FACE = -2.02;
const SCUTTLE = -0.8;
const B_PILLAR = 0.21;
const TAIL = 2.3;
const SCREEN_TOP = 1.36;
/** The bonnet: flush with the wing tops at its edges and crowned a little in the middle. */
const BONNET = { half: 0.58, low: 0.56, edge: 0.61, crown: 0.645 };
const crownAt = (x: number) =>
  BONNET.crown - (BONNET.crown - BONNET.edge) * (x / BONNET.half) ** 2;

/**
 * A side panel from `start` to `end` with a round wheel opening cut around `axle`; the
 * panel is a skin with a visible return edge, so a wheel well can be looked into.
 */
function archPanel(
  b: VehicleBuilder,
  side: number,
  start: number,
  end: number,
  axle: number,
  top: number,
  zone: number,
  wellX: number,
): void {
  const outer = side * SIDE,
    inner = side * (SIDE - 0.05);
  const steps = 30;
  const low = (z: number) =>
    Math.max(
      SILL,
      Math.sqrt(Math.max(0, ARCH.radius ** 2 - (z - axle) ** 2)) + ARCH.cy,
    );
  b.slot = M.Paint;
  b.tag = zone;
  for (let i = 0; i < steps; i++) {
    const za = start + ((end - start) * i) / steps,
      zb = start + ((end - start) * (i + 1)) / steps;
    const ya = low(za),
      yb = low(zb);
    const a = { x: outer, y: ya, z: za },
      c = { x: outer, y: top, z: zb };
    const bb = { x: outer, y: yb, z: zb },
      d = { x: outer, y: top, z: za };
    if (side < 0) b.quad(a, bb, c, d, paint);
    else b.quad(d, c, bb, a, paint);
    const ai = { ...a, x: inner },
      bi = { ...bb, x: inner },
      ci = { ...c, x: inner },
      di = { ...d, x: inner };
    if (side > 0) b.quad(ai, bi, ci, di, paint);
    else b.quad(di, ci, bi, ai, paint);
    if (side > 0) b.quad(a, ai, bi, bb, paint);
    else b.quad(bb, bi, ai, a, paint);
    if (side > 0) b.quad(d, c, ci, di, paint);
    else b.quad(di, ci, c, d, paint);
  }
  // A shallow rubber lip follows the opening and terminates at the sill.
  const arc = (radius: number) =>
    Array.from({ length: 33 }, (_, i) => {
      const a = Math.asin((SILL - ARCH.cy) / radius),
        theta = a + ((Math.PI - 2 * a) * i) / 32;
      return [
        axle + radius * Math.cos(theta),
        ARCH.cy + radius * Math.sin(theta),
      ] as Vtx;
    });
  extrudeX(
    b,
    sideShape([
      ...arc(ARCH.radius + 0.045),
      ...arc(ARCH.radius - 0.005).reverse(),
    ]),
    side > 0 ? SIDE - 0.006 : -SIDE - 0.038,
    side > 0 ? SIDE + 0.038 : -SIDE + 0.006,
    black,
    M.Rubber,
    zone,
    0.006,
  );
  // Inner wheel box, so the opening shows a dark well rather than the far side; the front
  // ones sit further in, clear of the wheels at full lock.
  b.block(
    side * wellX,
    ARCH.cy + 0.2,
    axle,
    0.03,
    0.62,
    ARCH.radius * 2,
    black,
    M.Rubber,
    Z.Trim,
  );
  b.block(
    (side * (wellX + SIDE - 0.025)) / 2,
    ARCH.cy + ARCH.radius + 0.015,
    axle,
    SIDE - wellX - 0.025,
    0.03,
    ARCH.radius * 1.6,
    black,
    M.Rubber,
    Z.Trim,
  );
}

/** Five-segment stroke digits for the Army number plates. */
const GLYPHS: Record<string, number[][]> = {
  "0": [
    [0, 0, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 0, 0],
  ],
  "1": [
    [0.55, 0, 0.55, 1],
    [0.2, 0.75, 0.55, 1],
  ],
  "4": [
    [0.75, 0, 0.75, 1],
    [0.75, 1, 0, 0.35],
    [0, 0.35, 1, 0.35],
  ],
  "8": [
    [0, 0, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 0, 0],
    [0, 0.5, 1, 0.5],
  ],
  "-": [[0.15, 0.5, 0.85, 0.5]],
};

/**
 * Black Army plate with white digits, "48-001" unless told otherwise (the plate faces -z
 * before `facing` turns it). Draws 0, 1, 4, 8 and the dash.
 */
export function armyPlate(
  b: VehicleBuilder,
  x: number,
  y: number,
  z: number,
  facing: 1 | -1,
  text = "48-001",
): void {
  b.push()
    .translate(x, y, z)
    .rotate(0, facing > 0 ? Math.PI : 0, 0);
  b.block(0, 0, 0, 0.34, 0.11, 0.012, black, M.Rubber, Z.Trim, 0.006);
  const w = 0.03,
    h = 0.055,
    pitch = 0.047;
  for (let i = 0; i < text.length; i++) {
    const x0 = (i - (text.length - 1) / 2) * pitch;
    for (const [ax, ay, bx, by] of GLYPHS[text[i]])
      b.rod(
        { x: -(x0 + (ax - 0.5) * w), y: (ay - 0.5) * h, z: -0.009 },
        { x: -(x0 + (bx - 0.5) * w), y: (by - 0.5) * h, z: -0.009 },
        0.0032,
        white,
        M.Lamp,
        Z.Trim,
      );
  }
  b.pop();
}

function frontEnd(b: VehicleBuilder): void {
  const F = FRONT_FACE;
  // Bonnet between flat-topped wings: crowned across, its front and back edges rolled
  // round, with hinges at the back and catches on the front.
  const { half, low, edge } = BONNET;
  const outline: Vtx[] = [
    [-half, low],
    [half, low],
    [half, edge, 0.015],
  ];
  for (let i = 1; i < 8; i++) {
    const x = half - (2 * half * i) / 8;
    outline.push([x, crownAt(x)]);
  }
  outline.push([-half, edge, 0.015]);
  extrudeZ(
    b,
    new THREE.Shape(rounded(outline)),
    F + 0.005,
    SCUTTLE - 0.01,
    paint,
    M.Paint,
    Z.Front,
    0.025,
  );
  for (const side of [-1, 1]) {
    b.block(
      side * 0.33,
      crownAt(0.33) + 0.004,
      -0.86,
      0.12,
      0.016,
      0.06,
      steel,
      M.Metal,
      Z.Front,
    );
    b.block(
      side * 0.5,
      0.59,
      F - 0.002,
      0.05,
      0.05,
      0.02,
      black,
      M.Rubber,
      Z.Front,
    );
    // Wing top, the outer wing around the wheel and the inner wing beside the engine.
    b.block(
      side * 0.727,
      0.59,
      -1.41,
      0.24,
      0.04,
      1.22,
      paint,
      M.Paint,
      Z.Front,
      0.012,
    );
    archPanel(b, side, F, SCUTTLE, -1.397, 0.585, Z.Front, 0.39);
    // Headlamp panel: round lamp in a black bezel, side lamp and indicator beneath, and
    // the convoy lamp above it.
    b.block(
      side * 0.63,
      0.33,
      F + 0.02,
      0.42,
      0.52,
      0.04,
      paint,
      M.Paint,
      Z.Front,
      0.01,
    );
    b.slot = M.Rubber;
    b.tag = Z.Front;
    b.push()
      .translate(side * 0.625, 0.39, F - 0.005)
      .rotate(Math.PI / 2, 0, 0);
    b.geometry(new THREE.CylinderGeometry(0.115, 0.115, 0.03, 28), black);
    b.pop();
    b.ring(
      side * 0.625,
      0.39,
      F - 0.022,
      0.093,
      0.012,
      steel,
      M.Metal,
      "z",
      Z.Front,
    );
    b.slot = M.Metal;
    b.push()
      .translate(side * 0.625, 0.39, F - 0.025)
      .scale(1, 1, 0.22);
    b.geometry(new THREE.SphereGeometry(0.088, 32, 12), steel);
    b.pop();
    b.slot = M.Headlamp;
    b.push()
      .translate(side * 0.625, 0.39, F - 0.036)
      .scale(1, 1, 0.12);
    b.geometry(
      new THREE.SphereGeometry(0.079, 32, 12),
      lens.clone().multiplyScalar(0.78),
    );
    b.pop();
    // Fine vertical flute ribs on the convex sealed-beam cover.
    for (const dx of [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06]) {
      const h = Math.sqrt(0.079 ** 2 - dx ** 2);
      b.rod(
        { x: side * 0.625 + dx, y: 0.39 - h, z: F - 0.047 },
        { x: side * 0.625 + dx, y: 0.39 + h, z: F - 0.047 },
        0.0012,
        glass,
        M.Glass,
        Z.Front,
      );
    }
    // Army convoy lamp above the headlamp: a small hooded box with a narrow slit lens.
    b.block(
      side * 0.625,
      0.548,
      F - 0.018,
      0.1,
      0.05,
      0.05,
      black,
      M.Rubber,
      Z.Front,
      0.008,
    );
    b.block(
      side * 0.625,
      0.578,
      F - 0.03,
      0.11,
      0.008,
      0.07,
      black,
      M.Rubber,
      Z.Front,
      0.003,
    );
    b.block(
      side * 0.625,
      0.545,
      F - 0.044,
      0.06,
      0.012,
      0.004,
      lens,
      M.Rubber,
      Z.Front,
    );
    for (const [offset, col, slot] of [
      [0.72, amber, M.Amber],
      [0.535, lens, M.Headlamp],
    ] as const) {
      b.slot = M.Rubber;
      b.tag = Z.Front;
      b.push()
        .translate(side * offset, 0.18, F - 0.012)
        .rotate(Math.PI / 2, 0, 0);
      b.geometry(new THREE.CylinderGeometry(0.041, 0.041, 0.027, 24), black);
      b.pop();
      b.ring(
        side * offset,
        0.18,
        F - 0.029,
        0.034,
        0.004,
        steel,
        M.Metal,
        "z",
        Z.Front,
      );
      b.slot = slot;
      b.push()
        .translate(side * offset, 0.18, F - 0.031)
        .scale(1, 1, 0.32);
      b.geometry(new THREE.SphereGeometry(0.032, 24, 10), col);
      b.pop();
    }
    // Air intake grille on the left wing; the right wing is plain.
    if (side < 0) {
      b.block(
        -SIDE - 0.004,
        0.45,
        -1.02,
        0.012,
        0.13,
        0.26,
        black,
        M.Rubber,
        Z.Front,
        0.006,
      );
      for (let i = 0; i < 5; i++)
        b.block(
          -SIDE - 0.011,
          0.4 + i * 0.024,
          -1.02,
          0.006,
          0.006,
          0.23,
          rubber,
          M.Rubber,
          Z.Front,
        );
    }
  }
  // Recessed horizontal grille louvers, with a small two-line oval identity badge.
  b.block(
    0,
    0.33,
    F + 0.008,
    0.84,
    0.46,
    0.028,
    black,
    M.Rubber,
    Z.Front,
    0.009,
  );
  for (let i = 0; i < 14; i++)
    b.block(
      0,
      0.137 + i * 0.0295,
      F - 0.012,
      0.797,
      0.012,
      0.018,
      rubber,
      M.Rubber,
      Z.Front,
      0.002,
    );
  for (const x of [-0.29, 0.29])
    b.block(x, 0.33, F - 0.003, 0.009, 0.43, 0.012, black, M.Rubber, Z.Front);
  const oval = new THREE.Shape();
  oval.absellipse(0, 0, 0.078, 0.038, 0, Math.PI * 2, false, 0);
  b.push().translate(0, 0.496, F - 0.025);
  extrudeZ(b, oval, -0.007, 0, steel, M.Metal, Z.Front, 0.001);
  const inner = new THREE.Shape();
  inner.absellipse(0, 0, 0.072, 0.032, 0, Math.PI * 2, false, 0);
  extrudeZ(
    b,
    inner,
    -0.009,
    -0.007,
    paint.clone().multiplyScalar(0.55),
    M.Paint,
    Z.Front,
    0,
  );
  const glyph: Record<string, number[][]> = {
    L: [
      [0, 1, 0, 0],
      [0, 0, 1, 0],
    ],
    A: [
      [0, 0, 0.5, 1],
      [0.5, 1, 1, 0],
      [0.2, 0.4, 0.8, 0.4],
    ],
    N: [
      [0, 0, 0, 1],
      [0, 1, 1, 0],
      [1, 0, 1, 1],
    ],
    D: [
      [0, 0, 0, 1],
      [0, 1, 0.7, 1],
      [0.7, 1, 1, 0.7],
      [1, 0.7, 1, 0.3],
      [1, 0.3, 0.7, 0],
      [0.7, 0, 0, 0],
    ],
    R: [
      [0, 0, 0, 1],
      [0, 1, 1, 1],
      [1, 1, 1, 0.5],
      [1, 0.5, 0, 0.5],
      [0.4, 0.5, 1, 0],
    ],
    O: [
      [0, 0, 0, 1],
      [0, 1, 1, 1],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
    ],
    V: [
      [0, 1, 0.5, 0],
      [0.5, 0, 1, 1],
    ],
    E: [
      [0, 0, 0, 1],
      [0, 1, 1, 1],
      [0, 0.5, 0.8, 0.5],
      [0, 0, 1, 0],
    ],
  };
  ["LAND", "ROVER"].forEach((word, row) =>
    [...word].forEach((ch, i) => {
      const start = ((word.length - 1) * 0.012) / 2 - i * 0.012;
      for (const [x0, y0, x1, y1] of glyph[ch])
        b.rod(
          {
            x: start - (x0 - 0.5) * 0.008,
            y: 0.006 - row * 0.019 + y0 * 0.012,
            z: -0.01,
          },
          {
            x: start - (x1 - 0.5) * 0.008,
            y: 0.006 - row * 0.019 + y1 * 0.012,
            z: -0.01,
          },
          0.00085,
          white,
          M.Metal,
          Z.Front,
        );
    }),
  );
  b.pop();
  // Sump, steering box and the front crossmember below the grille.
  b.block(0, -0.04, -1.62, 0.36, 0.16, 0.5, black, M.Metal, Z.Trim, 0.02);
  b.block(0.36, 0.02, -1.86, 0.14, 0.16, 0.16, black, M.Metal, Z.Trim, 0.02);
}

function windscreen(b: VehicleBuilder): void {
  // Scuttle with its two vent flaps, then the upright frame and its wipers.
  b.block(0, 0.7, SCUTTLE, 1.7, 0.16, 0.1, paint, M.Paint, Z.Front, 0.012);
  for (const x of [-0.38, 0.38]) {
    b.block(
      x,
      0.7,
      SCUTTLE - 0.058,
      0.44,
      0.1,
      0.02,
      paint,
      M.Paint,
      Z.Front,
      0.008,
    );
    b.block(
      x,
      0.752,
      SCUTTLE - 0.062,
      0.44,
      0.008,
      0.016,
      black,
      M.Rubber,
      Z.Front,
    );
  }
  const lean = Math.atan2(0.07, SCREEN_TOP - WAIST);
  b.push()
    .translate(0, WAIST, SCUTTLE + 0.01)
    .rotate(lean, 0, 0);
  const h = SCREEN_TOP - WAIST;
  b.block(0, 0.03, 0, 1.66, 0.06, 0.07, paint, M.Paint, Z.Front, 0.01);
  b.block(0, h - 0.03, 0, 1.66, 0.07, 0.08, paint, M.Paint, Z.Front, 0.01);
  for (const x of [-0.8, 0.8])
    b.block(x, h / 2, 0, 0.07, h, 0.07, paint, M.Paint, Z.Front, 0.01);
  b.block(0, h / 2 + 0.005, 0, 1.53, h - 0.11, 0.012, glass, M.Glass, Z.Glass);
  for (const y of [0.065, h - 0.07])
    b.block(0, y, -0.012, 1.54, 0.012, 0.01, rubber, M.Rubber, Z.Front);
  for (const x of [0.5, -0.18]) {
    b.rod(
      { x, y: 0.07, z: -0.03 },
      { x: x - 0.42, y: 0.1, z: -0.03 },
      0.007,
      black,
      M.Rubber,
      Z.Front,
    );
    b.rod(
      { x, y: 0.07, z: -0.034 },
      { x: x - 0.38, y: 0.1, z: -0.034 },
      0.004,
      black,
      M.Rubber,
      Z.Front,
    );
  }
  // Fold-down screen clamps either side.
  for (const x of [-0.79, 0.79])
    b.block(x, 0.1, -0.05, 0.05, 0.05, 0.05, steel, M.Metal, Z.Front);
  b.pop();
}

function doors(b: VehicleBuilder): void {
  const front = SCUTTLE + 0.03,
    back = B_PILLAR;
  const mid = (front + back) / 2,
    len = back - front;
  for (const side of [-1, 1]) {
    // Steel lower door with external hinges, push-button handle and a sill below.
    b.block(
      side * (SIDE - 0.01),
      (SILL + WAIST) / 2,
      mid,
      0.04,
      WAIST - SILL,
      len,
      paint,
      M.Paint,
      Z.Sides,
      0.01,
    );
    for (const z of [front - 0.004, back + 0.004])
      b.block(
        side * (SIDE + 0.008),
        (SILL + WAIST) / 2,
        z,
        0.008,
        WAIST - SILL,
        0.008,
        black,
        M.Rubber,
        Z.Sides,
      );
    for (const y of [0.24, 0.62]) {
      b.block(
        side * (SIDE + 0.016),
        y,
        front + 0.04,
        0.03,
        0.08,
        0.11,
        paint,
        M.Paint,
        Z.Sides,
        0.006,
      );
      b.rod(
        { x: side * (SIDE + 0.03), y: y - 0.05, z: front + 0.0 },
        { x: side * (SIDE + 0.03), y: y + 0.05, z: front + 0.0 },
        0.011,
        steel,
        M.Metal,
        Z.Sides,
      );
    }
    b.block(
      side * (SIDE + 0.016),
      0.68,
      back - 0.1,
      0.022,
      0.045,
      0.13,
      rubber,
      M.Rubber,
      Z.Sides,
      0.006,
    );
    b.block(
      side * (SIDE + 0.03),
      0.68,
      back - 0.06,
      0.012,
      0.022,
      0.028,
      steel,
      M.Metal,
      Z.Sides,
      0.004,
    );
    b.block(
      side * (SIDE - 0.025),
      0.02,
      mid,
      0.05,
      0.1,
      len + 0.12,
      paint,
      M.Paint,
      Z.Sides,
      0.008,
    );
    // Canvas door top: a frame round a clear window (the glass hides in the driver's view).
    const x = side * (SIDE - 0.02);
    const y0 = WAIST - 0.01,
      y1 = SCREEN_TOP + 0.05;
    const z0 = front + 0.01,
      z1 = back - 0.01;
    const wy0 = 0.93,
      wy1 = 1.29,
      wz0 = front + 0.17,
      wz1 = back - 0.1;
    const frame = (ya: number, yb: number, za: number, zb: number) =>
      b.block(
        x,
        (ya + yb) / 2,
        (za + zb) / 2,
        0.024,
        yb - ya,
        zb - za,
        canvas,
        M.Fabric,
        Z.Sides,
        0.008,
      );
    frame(y0, wy0, z0, z1);
    frame(wy1, y1, z0, z1);
    frame(wy0, wy1, z0, wz0);
    frame(wy0, wy1, wz1, z1);
    b.block(
      x + side * 0.01,
      (wy0 + wy1) / 2,
      (wz0 + wz1) / 2,
      0.006,
      wy1 - wy0,
      wz1 - wz0,
      glass,
      M.Glass,
      Z.Glass,
    );
    // Door mirror: an arm bolted to the upper hinge, cranked out and up, and a square black
    // head on a ball joint.
    b.block(
      side * (SIDE + 0.012),
      0.74,
      front + 0.04,
      0.025,
      0.07,
      0.08,
      black,
      M.Metal,
      Z.Sides,
      0.008,
    );
    stalk(
      b,
      [
        { x: side * (SIDE + 0.02), y: 0.74, z: front + 0.04 },
        { x: side * (SIDE + 0.11), y: 0.76, z: front + 0.02 },
        { x: side * (SIDE + 0.15), y: 0.96, z: front },
      ],
      0.012,
      black,
    );
    mirrorHead(
      b,
      side,
      { x: side * (SIDE + 0.17), y: 1.04, z: front + 0.03 },
      0.17,
      0.15,
      0.06,
      black,
    );
  }
}

function rearBody(b: VehicleBuilder): void {
  for (const side of [-1, 1]) {
    archPanel(b, side, B_PILLAR + 0.01, TAIL, 1.397, WAIST, Z.Rear, 0.56);
    // Capping rail and the rope cleats the tilt is lashed to.
    b.block(
      side * (SIDE - 0.02),
      WAIST + 0.012,
      (B_PILLAR + TAIL) / 2,
      0.06,
      0.025,
      TAIL - B_PILLAR,
      paint,
      M.Paint,
      Z.Sides,
      0.008,
    );
    for (let z = B_PILLAR + 0.16; z < TAIL - 0.05; z += 0.32) {
      b.block(
        side * (SIDE + 0.012),
        0.66,
        z,
        0.016,
        0.03,
        0.05,
        steel,
        M.Metal,
        Z.Sides,
      );
      b.rod(
        { x: side * (SIDE + 0.02), y: 0.67, z: z - 0.02 },
        { x: side * (SIDE + 0.03), y: 0.71, z },
        0.006,
        steel,
        M.Metal,
        Z.Sides,
      );
    }
    // Rear corner panels beside the tailgate, with Army-pattern lamp clusters low down.
    b.block(
      side * 0.79,
      (SILL + WAIST) / 2,
      TAIL,
      0.11,
      WAIST - SILL,
      0.05,
      paint,
      M.Paint,
      Z.Rear,
      0.01,
    );
    b.block(
      side * 0.76,
      0.2,
      TAIL + 0.035,
      0.13,
      0.18,
      0.04,
      black,
      M.Rubber,
      Z.Rear,
      0.01,
    );
    b.block(
      side * 0.76,
      0.24,
      TAIL + 0.058,
      0.1,
      0.06,
      0.012,
      red,
      M.Red,
      Z.Rear,
      0.005,
    );
    b.block(
      side * 0.76,
      0.17,
      TAIL + 0.058,
      0.1,
      0.05,
      0.012,
      amber,
      M.Amber,
      Z.Rear,
      0.005,
    );
    b.ring(side * 0.76, 0.36, TAIL + 0.03, 0.03, 0.01, red, M.Red, "z", Z.Rear);
    // Jerry can in its holder behind each rear wheel.
    jerryCan(b, side * (SIDE + 0.1), 0.41, 2.08);
  }
  // Fuel filler on the right, behind the door.
  b.slot = M.Metal;
  b.tag = Z.Sides;
  b.push()
    .translate(SIDE + 0.008, 0.6, 0.5)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 18), black);
  b.pop();
  // Drop-down tailgate on two bottom hinges, held by chains, with pressed ribs.
  b.block(
    0,
    0.44,
    TAIL + 0.005,
    1.46,
    0.62,
    0.05,
    paint,
    M.Paint,
    Z.Rear,
    0.01,
  );
  for (const y of [0.3, 0.58])
    b.block(
      0,
      y,
      TAIL + 0.034,
      1.3,
      0.04,
      0.012,
      paint,
      M.Paint,
      Z.Rear,
      0.006,
    );
  for (const x of [-0.5, 0.5]) {
    b.rod(
      { x, y: 0.14, z: TAIL + 0.04 },
      { x: x + 0.12, y: 0.14, z: TAIL + 0.04 },
      0.014,
      steel,
      M.Metal,
      Z.Rear,
    );
    b.rod(
      { x: x * 1.4, y: 0.74, z: TAIL + 0.03 },
      { x: x * 1.5, y: 0.77, z: TAIL - 0.04 },
      0.006,
      steel,
      M.Metal,
      Z.Rear,
    );
  }
  armyPlate(b, -0.38, 0.22, TAIL + 0.04, 1);
  // Load floor between the wheel boxes, full width ahead of and behind them, and
  // inward-facing bench seats, seen from the cab under the tilt.
  b.block(
    0,
    0.2,
    (B_PILLAR + TAIL) / 2,
    1.12,
    0.03,
    TAIL - B_PILLAR,
    black,
    M.Rubber,
    Z.Trim,
  );
  const archFront = 1.397 - ARCH.radius,
    archBack = 1.397 + ARCH.radius;
  for (const side of [-1, 1])
    for (const [z0, z1] of [
      [B_PILLAR, archFront],
      [archBack, TAIL],
    ])
      b.block(
        side * 0.68,
        0.2,
        (z0 + z1) / 2,
        0.24,
        0.03,
        z1 - z0,
        black,
        M.Rubber,
        Z.Trim,
      );
  // The benches run along the tops of the wheel boxes.
  const bench = paint.clone().multiplyScalar(0.75);
  for (const side of [-1, 1])
    b.block(
      side * 0.68,
      0.54,
      1.35,
      0.3,
      0.05,
      1.8,
      bench,
      M.Paint,
      Z.Trim,
      0.01,
    );
  // Bench legs land on the load floor ahead of and behind the wheel boxes.
  for (const side of [-1, 1]) {
    for (const z of [0.55, 2.15])
      b.block(side * 0.68, 0.355, z, 0.025, 0.31, 0.04, paint, M.Paint, Z.Trim);
    b.block(side * 0.68, 0.503, 1.35, 0.08, 0.03, 0.55, paint, M.Paint, Z.Trim);
  }
  // A rolled swag and a tucker box.
  b.slot = M.Fabric;
  b.tag = Z.Trim;
  b.push()
    .translate(-0.1, 0.33, 2.0)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(
    new THREE.CylinderGeometry(0.13, 0.13, 0.95, 16),
    canvas.clone().multiplyScalar(0.85),
  );
  b.pop();
  b.block(
    0.25,
    0.36,
    1.45,
    0.5,
    0.3,
    0.36,
    new THREE.Color("#6A4A30"),
    M.Fabric,
    Z.Trim,
    0.01,
  );
}

/** Bush Tucker Man / early GS pioneer kit on bonnet brackets, with the spare underfloor. */
function bonnetTools(b: VehicleBuilder): void {
  const wood = new THREE.Color("#8A6A44"),
    head = new THREE.Color("#41463F"),
    y = 0.676;
  const clamp = (x: number, z: number) => {
    const foot = crownAt(x) + 0.009;
    b.block(x, foot, z, 0.065, 0.018, 0.09, paint, M.Paint, Z.Front, 0.003);
    for (const dx of [-0.024, 0.024])
      b.rod(
        { x: x + dx, y: foot, z },
        { x: x + dx, y: y + 0.025, z },
        0.005,
        bar,
        M.Metal,
        Z.Front,
      );
    b.rod(
      { x: x - 0.024, y: y + 0.025, z },
      { x: x + 0.024, y: y + 0.025, z },
      0.006,
      black,
      M.Rubber,
      Z.Front,
    );
    b.block(
      x,
      y + 0.026,
      z,
      0.035,
      0.012,
      0.04,
      steel,
      M.Metal,
      Z.Front,
      0.002,
    );
  };
  // Shovel lies across the forward bonnet: a pointed blade, shaft and D grip.
  let z = -1.73;
  const blade = new THREE.Shape(
    rounded([
      [-0.11, 0.08],
      [0.11, 0.08],
      [0.1, -0.04, 0.02],
      [0.04, -0.12, 0.02],
      [-0.04, -0.12, 0.02],
      [-0.1, -0.04, 0.02],
    ]),
  );
  b.push()
    .translate(0.41, y, z)
    .rotate(-Math.PI / 2, 0, 0);
  extrudeZ(b, blade, -0.006, 0.006, head, M.Metal, Z.Front, 0.002);
  b.pop();
  b.rod({ x: 0.29, y, z }, { x: 0.2, y, z }, 0.019, head, M.Metal, Z.Front);
  b.rod({ x: 0.2, y, z }, { x: -0.39, y, z }, 0.015, wood, M.Fabric, Z.Front);
  b.ring(-0.435, y, z, 0.043, 0.009, black, M.Metal, "y", Z.Front);
  clamp(0.38, z);
  clamp(-0.22, z);
  // Pick and axe have shaped, tapered heads rather than square end blocks.
  z = -1.4;
  b.rod({ x: -0.46, y, z }, { x: 0.35, y, z }, 0.018, wood, M.Fabric, Z.Front);
  continuousTube(
    b,
    [
      new THREE.Vector3(-0.46, y - 0.012, z - 0.15),
      new THREE.Vector3(-0.46, y + 0.012, z),
      new THREE.Vector3(-0.46, y - 0.015, z + 0.15),
    ],
    0.014,
    head,
    Z.Front,
  );
  b.block(-0.46, y, z, 0.055, 0.045, 0.055, head, M.Metal, Z.Front, 0.006);
  clamp(-0.28, z);
  clamp(0.2, z);
  z = -1.08;
  b.rod({ x: -0.36, y, z }, { x: 0.37, y, z }, 0.016, wood, M.Fabric, Z.Front);
  const axe = new THREE.Shape(
    rounded([
      [-0.025, 0.065],
      [0.035, 0.055],
      [0.065, -0.1],
      [0.045, -0.13],
      [-0.035, -0.12],
    ]),
  );
  b.push()
    .translate(0.39, y, z)
    .rotate(-Math.PI / 2, 0, 0);
  extrudeZ(b, axe, -0.015, 0.015, head, M.Metal, Z.Front, 0.003);
  b.pop();
  clamp(-0.22, z);
  clamp(0.26, z);
}

function jerryCan(b: VehicleBuilder, x: number, y: number, z: number): void {
  const can = new THREE.Color("#5B6640");
  const s = Math.sign(x);
  b.block(x, y, z, 0.165, 0.47, 0.34, can, M.Paint, Z.Rear, 0.02);
  for (const k of [-1, 1])
    b.rod(
      { x: x + s * 0.085, y: y - 0.18, z: z - 0.12 * k },
      { x: x + s * 0.085, y: y + 0.18, z: z + 0.12 * k },
      0.008,
      can,
      M.Paint,
      Z.Rear,
    );
  b.block(x, y + 0.26, z - 0.08, 0.03, 0.05, 0.12, can, M.Paint, Z.Rear, 0.01);
  b.block(x, y + 0.255, z + 0.1, 0.06, 0.04, 0.06, can, M.Paint, Z.Rear, 0.01);
  b.block(x - s * 0.06, y - 0.25, z, 0.25, 0.03, 0.38, bar, M.Metal, Z.Rear);
  b.block(
    x + s * 0.09,
    y + 0.05,
    z,
    0.012,
    0.04,
    0.38,
    black,
    M.Rubber,
    Z.Rear,
  );
  for (const dz of [-0.185, 0.185])
    b.block(x, y + 0.05, z + dz, 0.19, 0.04, 0.012, black, M.Rubber, Z.Rear);
  b.block(
    x - s * 0.09,
    y + 0.05,
    z,
    0.012,
    0.04,
    0.38,
    black,
    M.Rubber,
    Z.Rear,
  );
  b.block(
    x + s * 0.098,
    y + 0.05,
    z,
    0.012,
    0.06,
    0.05,
    steel,
    M.Metal,
    Z.Rear,
    0.003,
  );
}

function tilt(b: VehicleBuilder): void {
  addCanvasTilt(b);
}

function chassisAndRecovery(
  b: VehicleBuilder,
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
): void {
  // Galvanised ladder frame, crossmembers, outriggers and the rear crossmember.
  for (const side of [-1, 1]) {
    b.block(side * 0.355, 0.03, -1.51, 0.1, 0.18, 0.9, galv, M.Paint, Z.Trim);
    b.rod(
      { x: side * 0.355, y: 0.03, z: -1.08 },
      { x: side * 0.43, y: 0.03, z: -0.86 },
      0.05,
      galv,
      M.Paint,
      Z.Trim,
    );
    b.block(side * 0.43, 0.03, 0.22, 0.1, 0.18, 2.16, galv, M.Paint, Z.Trim);
    b.rod(
      { x: side * 0.43, y: 0.03, z: 1.28 },
      { x: side * 0.495, y: 0.03, z: 1.72 },
      0.05,
      galv,
      M.Paint,
      Z.Trim,
    );
    b.block(side * 0.495, 0.03, 2.01, 0.1, 0.18, 0.6, galv, M.Paint, Z.Trim);
  }
  for (const z of [-1.96, -0.62, 0.62])
    b.block(0, 0.02, z, 0.86, 0.1, 0.1, galv, M.Paint, Z.Trim);
  b.block(0, 0.02, 2.36, 1.48, 0.14, 0.1, galv, M.Paint, Z.Trim);
  // Gearbox and transfer case, propshafts, fuel tank and the exhaust out the back.
  b.block(0.08, -0.02, -0.28, 0.4, 0.2, 0.6, black, M.Metal, Z.Trim, 0.03);
  b.rod(
    { x: 0.08, y: -0.08, z: -0.6 },
    { x: 0.1, y: -0.12, z: -1.27 },
    0.032,
    steel.clone().multiplyScalar(0.6),
  );
  b.rod(
    { x: 0.08, y: -0.08, z: 0.05 },
    { x: 0.05, y: -0.12, z: 1.27 },
    0.032,
    steel.clone().multiplyScalar(0.6),
  );
  b.block(0.64, 0.06, 0.15, 0.22, 0.24, 0.72, black, M.Metal, Z.Trim, 0.03);
  b.rod(
    { x: -0.3, y: -0.06, z: -0.75 },
    { x: -0.3, y: -0.08, z: 1.0 },
    0.028,
    steel,
  );
  b.rod(
    { x: -0.3, y: -0.08, z: 1.0 },
    { x: -0.6, y: -0.06, z: 2.25 },
    0.028,
    steel,
  );
  b.slot = M.Metal;
  b.tag = Z.Trim;
  b.push()
    .translate(-0.3, -0.07, 0.2)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(
    new THREE.CylinderGeometry(0.085, 0.085, 0.5, 12),
    steel.clone().multiplyScalar(0.6),
  );
  b.pop();
  // The Perentie's own spare wheel, slung flat in a cradle under the rear floor.
  const underslungStart = b.vertexCount;
  b.tag = Z.Rear;
  b.push()
    .translate(0, 0.03, 1.85)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(wheel.clone(), black);
  b.pop();
  reviewRanges.push({ start: underslungStart, end: b.vertexCount, part: 64 });
  const cradleStart = b.vertexCount;
  for (const x of [-0.2, 0.2])
    b.block(x, -0.09, 1.85, 0.05, 0.03, 0.84, galv, M.Paint, Z.Trim);
  for (const z of [1.43, 2.27])
    b.block(0, -0.075, z, 0.99, 0.04, 0.035, galv, M.Paint, Z.Trim);
  reviewRanges.push({ start: cradleStart, end: b.vertexCount, part: 128 });
  // Pintle hook and trailer socket for the No. 5 trailer, and the rear plate.
  b.block(0, -0.02, 2.43, 0.14, 0.12, 0.08, black, M.Metal, Z.Rear, 0.01);
  b.ring(0, -0.04, 2.5, 0.045, 0.014, black, M.Metal, "y", Z.Rear);
  b.slot = M.Rubber;
  b.push()
    .translate(0.3, 0.02, 2.42)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), black);
  b.pop();

  const barStart = b.vertexCount;
  // The Army brushguard: a heavy beam that serves as the bumper, with towing eyes under it,
  // and three hoops over the grille and headlamps.
  const face = -2.22;
  const pan = new THREE.Shape();
  pan.moveTo(-0.78, -face);
  pan.lineTo(0.78, -face);
  pan.lineTo(0.97, -face - 0.1);
  pan.lineTo(0.93, -face - 0.22);
  pan.lineTo(0.76, -face - 0.12);
  pan.lineTo(-0.76, -face - 0.12);
  pan.lineTo(-0.93, -face - 0.22);
  pan.lineTo(-0.97, -face - 0.1);
  pan.closePath();
  const beam = new THREE.ExtrudeGeometry(pan, {
    depth: 0.146,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
    steps: 1,
  });
  beam.rotateX(-Math.PI / 2);
  beam.translate(0, -0.013, 0);
  b.slot = M.Metal;
  b.tag = Z.Front;
  b.geometry(beam, bar);
  const beamTop = 0.145,
    zb = face + 0.05,
    zAt = (y: number) => zb + ((y - beamTop) * 0.06) / (0.67 - beamTop);
  const tube = (pts: number[][]) =>
    continuousTube(
      b,
      pts.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
      0.03,
      bar,
    );
  tube([
    [-0.4, beamTop - 0.012, zb],
    [-0.4, 0.67, zAt(0.67)],
    [0.4, 0.67, zAt(0.67)],
    [0.4, beamTop - 0.012, zb],
  ]);
  const mid = 0.4275;
  b.rod(
    { x: -0.4, y: mid, z: zAt(mid) },
    { x: 0.4, y: mid, z: zAt(mid) },
    0.024,
    bar,
    M.Metal,
    Z.Front,
  );
  for (const side of [-1, 1]) {
    const x = side * 0.86,
      footZ = face + 0.14;
    tube([
      [side * 0.4, 0.6, zAt(0.6)],
      [x, 0.6, zAt(0.6) + 0.025],
      [x, beamTop - 0.01, footZ],
    ]);
    b.block(x, beamTop, footZ, 0.09, 0.025, 0.09, bar, M.Metal, Z.Front, 0.005);
    b.block(
      side * 0.4,
      beamTop,
      zb,
      0.09,
      0.025,
      0.09,
      bar,
      M.Metal,
      Z.Front,
      0.005,
    );
    b.rod(
      { x: side * 0.36, y: 0.055, z: face + 0.1 },
      { x: side * 0.36, y: 0.015, z: -1.91 },
      0.028,
      bar,
      M.Metal,
      Z.Trim,
    );
  }
  for (const side of [-1, 1])
    b.ring(
      side * 0.55,
      -0.06,
      face + 0.06,
      0.04,
      0.012,
      bar,
      M.Metal,
      "x",
      Z.Front,
    );
  armyPlate(b, -0.55, 0.06, face - 0.01, -1);
  // Winch drum tucked behind the bar, with a roller fairlead at the cable exit.
  b.rod(
    { x: -0.2, y: 0.14, z: -2.16 },
    { x: 0.2, y: 0.14, z: -2.16 },
    0.065,
    black,
    M.Metal,
    Z.Front,
  );
  const mount = tuning.winchMount;
  for (const y of [mount.y - 0.035, mount.y + 0.035])
    b.rod(
      { x: -0.12, y, z: mount.z },
      { x: 0.12, y, z: mount.z },
      0.014,
      steel,
      M.Metal,
      Z.Front,
    );
  for (const x of [-0.13, 0.13])
    b.rod(
      { x, y: mount.y - 0.04, z: mount.z },
      { x, y: mount.y + 0.04, z: mount.z },
      0.014,
      steel,
      M.Metal,
      Z.Front,
    );
  reviewRanges.push({ start: barStart, end: b.vertexCount, part: 1 });
  // HF radio whip on the rear corner of the tub.
  b.block(
    0.8,
    WAIST + 0.06,
    2.22,
    0.07,
    0.08,
    0.07,
    black,
    M.Rubber,
    Z.Rear,
    0.01,
  );
  b.rod(
    { x: 0.8, y: WAIST + 0.1, z: 2.22 },
    { x: 0.82, y: 2.45, z: 2.3 },
    0.005,
    black,
    M.Rubber,
    Z.Roof,
  );
}

export function buildPerentieBody(
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
): THREE.BufferGeometry {
  reviewRanges.length = 0;
  const b = new VehicleBuilder();
  frontEnd(b);
  const gearStart = b.vertexCount;
  bonnetTools(b);
  reviewRanges.push({ start: gearStart, end: b.vertexCount, part: 4 });
  windscreen(b);
  doors(b);
  rearBody(b);
  const tiltStart = b.vertexCount;
  tilt(b);
  reviewRanges.push({ start: tiltStart, end: b.vertexCount, part: 8 });
  chassisAndRecovery(b, tuning, wheel);
  addPerentieInterior(b, tuning.engine.redlineRpm);
  addCanvasHoops(b);
  const rackStart = b.vertexCount;
  addTiltRack(b);
  reviewRanges.push({ start: rackStart, end: b.vertexCount, part: 2 });
  const g = b.build();
  g.setAttribute(
    "reviewPart",
    new THREE.Float32BufferAttribute(
      Array.from(
        { length: b.vertexCount },
        (_, i) =>
          reviewRanges.find((r) => i >= r.start && i < r.end)?.part ?? 0,
      ),
      1,
    ),
  );
  return cleanGeometry(g);
}

/** 7.50R16 bar-and-block tread on a tall sidewall, a green steel wheel and five studs. */
export function buildPerentieWheel(
  tuning: VehicleTuning,
): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const r = tuning.wheelRadius,
    w = tuning.wheelWidth;
  const tyre = new THREE.Color("#232624");
  const rimR = 0.205;
  b.slot = M.Rubber;
  b.tag = Z.Trim;
  b.push().rotate(0, 0, -Math.PI / 2);
  const profile = [
    [rimR - 0.01, -w * 0.47],
    [r * 0.7, -w * 0.52],
    [r * 0.9, -w * 0.48],
    [r * 0.965, -w * 0.38],
    [r * 0.965, w * 0.38],
    [r * 0.9, w * 0.48],
    [r * 0.7, w * 0.52],
    [rimR - 0.01, w * 0.47],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  b.geometry(new THREE.LatheGeometry(profile, 48), tyre);
  b.pop();
  // Staggered shoulder lugs and centre blocks, deep like a military cross-country tyre.
  const lugs = 26;
  for (let i = 0; i < lugs; i++) {
    for (const side of [-1, 1]) {
      const angle = ((i + (side > 0 ? 0.5 : 0)) / lugs) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(
          side * w * 0.26,
          Math.cos(angle) * r * 0.965,
          Math.sin(angle) * r * 0.965,
        )
        .rotate(angle, side * 0.18, 0);
      b.box(w * 0.42, 0.04, 0.05, tyre);
      b.pop();
    }
    const angle = ((i + 0.25) / lugs) * Math.PI * 2;
    b.push()
      .translate(0, Math.cos(angle) * r * 0.97, Math.sin(angle) * r * 0.97)
      .rotate(angle, 0, 0);
    b.box(w * 0.18, 0.04, 0.035, tyre);
    b.pop();
  }
  for (const side of [-1, 1]) {
    b.ring(
      side * w * 0.5,
      0,
      0,
      r * 0.72,
      0.004,
      tyre.clone().multiplyScalar(1.4),
      M.Rubber,
      "x",
    );
    // Rim flange, a dished centre in Army green with cooling slots, drive flange and studs.
    b.ring(side * (w * 0.5 - 0.005), 0, 0, rimR, 0.014, paint, M.Paint, "x");
    b.slot = M.Paint;
    b.push()
      .translate(side * (w * 0.5 - 0.03), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(rimR - 0.01, rimR - 0.01, 0.02, 40),
      paint.clone().multiplyScalar(0.9),
    );
    b.pop();
    b.push()
      .translate(side * (w * 0.5 - 0.012), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.12, 0.135, 0.03, 32), paint);
    b.pop();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      b.block(
        side * (w * 0.5 - 0.018),
        Math.cos(a) * 0.16,
        Math.sin(a) * 0.16,
        0.012,
        0.035,
        0.035,
        black,
        M.Rubber,
        Z.Trim,
        0.012,
      );
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      b.slot = M.Metal;
      b.push()
        .translate(
          side * (w * 0.5 + 0.008),
          Math.cos(a) * 0.083,
          Math.sin(a) * 0.083,
        )
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.014, 0.017, 0.022, 6), steel);
      b.pop();
    }
    b.slot = M.Metal;
    b.push()
      .translate(side * (w * 0.5 + 0.02), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(0.048, 0.055, 0.05, 20),
      galv.clone().multiplyScalar(0.8),
    );
    b.pop();
  }
  return cleanGeometry(b.build());
}

/** Recovery board resting on the two external support bows, with closed straps. */
export function buildPerentiePlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder(),
    wood = new THREE.Color("#A9824F"),
    x = index === 0 ? -0.36 : 0.36,
    y = TILT_BOARD_Y,
    z = TILT_BOARD_Z,
    L = plankTuning.length,
    W = plankTuning.width;
  b.block(x, y, z, W, 0.05, L, wood, M.Fabric, Z.Roof);
  for (let i = 0; i < 4; i++)
    b.block(
      x - 0.12 + i * 0.08,
      y + 0.026,
      z,
      0.004,
      0.003,
      L - 0.06,
      wood.clone().multiplyScalar(0.74),
      M.Fabric,
      Z.Roof,
    );
  for (const zz of TILT_RACK_Z) {
    b.block(x, y + 0.03, zz, W + 0.02, 0.012, 0.045, black, M.Rubber, Z.Roof);
    for (const side of [-1, 1])
      b.block(
        x + (side * (W + 0.02)) / 2,
        y - 0.018,
        zz,
        0.012,
        0.1,
        0.045,
        black,
        M.Rubber,
        Z.Roof,
      );
    b.block(x, y - 0.06, zz, W + 0.03, 0.012, 0.045, black, M.Rubber, Z.Roof);
  }
  return cleanGeometry(b.build());
}
