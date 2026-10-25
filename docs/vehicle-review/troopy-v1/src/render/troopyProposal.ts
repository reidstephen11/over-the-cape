import * as THREE from "three";
import type { VehicleTuning } from "../data/vehicle";
import { plankTuning } from "../data/tools";
import {
  BodyZone as Z,
  VehicleBuilder,
  VehicleMaterial as M,
} from "./vehicleGeometry";
import { addTroopyInterior } from "./troopyReviewInterior";
import { troopyColors } from "./troopyPaint";
import {
  cornerWrap,
  extrudeX,
  extrudeZ,
  frontPane,
  inset,
  rounded,
  roundHeadlamp,
  sidePane,
  sideShape,
  type Vtx,
} from "./troopyShapes";
import { mirrorHead } from "./mirrors";
import {
  cleanGeometry,
  continuousTube,
  subdivideSurface,
} from "./troopyRefinement";

/**
 * 75 Series Troop Carrier body: a front clip with round-shouldered guards, rounded front
 * corners and a bonnet sloping down to the nose; behind it, each side one pressed panel
 * from the door to the tail with its window openings; round wheel openings with black
 * flare lips, rounded rear corners and roof edges, round headlamps in square surrounds,
 * door mirrors on black sails and an ARB-style bar (ground about 0.52 m below the origin
 * when parked).
 */
const { paint, bar, bumper, chrome } = troopyColors;
const black = new THREE.Color("#1E2120"),
  rubber = new THREE.Color("#222524"),
  steel = new THREE.Color("#8F938D"),
  well = new THREE.Color("#262928"),
  trim = new THREE.Color("#2B2E2D");
const red = new THREE.Color("#B3271F"),
  amber = new THREE.Color("#E5992F"),
  lens = new THREE.Color("#E6E4D2");
const glass = new THREE.Color("#9FB6B3"),
  plateWhite = new THREE.Color("#E9E7DD"),
  plateInk = new THREE.Color("#1F3D6B");

const reviewRanges: { start: number; end: number; part: number }[] = [];
const SIDE = 0.845;
const SILL = 0.04;
const WAIST = 0.84;
const ARCH = { r: 0.515, cy: -0.08 };
const F = -2.2;
const COWL = { y: 0.84, z: -0.98 };
const SCREEN_TOP = { y: 1.48, z: -0.8 };
const DOOR = { front: -0.95, back: 0.08 };
const ROOF = 1.54;
const TAIL = 2.58;
const AXLE = 1.49;
/** Radius of the rear corners and the roof's back corners. */
const CORNER = 0.07;
const RACK = { y: 1.66, front: -0.72, back: 2.42 };
const GUARD_LOW = 0.25;
/** The front clip: where it meets the doors, its top at the nose and at the back, and the
 * radius its shoulders and front corners are rounded to (across the car, and `ratio` of it
 * along). Below `low` the side panel takes over behind the front wheel opening. */
const CLIP = {
  back: DOOR.front - 0.02,
  noseTop: 0.745,
  backTop: WAIST - 0.005,
  round: 0.15,
  ratio: 0.55,
  low: 0.3,
};
const clipTop = (z: number) =>
  CLIP.noseTop + ((z - F) / (CLIP.back - F)) * (CLIP.backTop - CLIP.noseTop);

const v = (x: number, y: number, z: number) => ({ x, y, z });

/** A round opening's outline from height yBack on its back side, over the top, to yFront on its front side. */
function archPath(
  axle: number,
  yBack: number,
  yFront: number,
  grow = 0,
  steps = 24,
): Vtx[] {
  const r = ARCH.r + grow;
  const a0 = Math.asin(Math.max(-1, Math.min(1, (yBack - ARCH.cy) / r))),
    a1 = Math.PI - Math.asin(Math.max(-1, Math.min(1, (yFront - ARCH.cy) / r)));
  const out: Vtx[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([axle + r * Math.cos(a), ARCH.cy + r * Math.sin(a)]);
  }
  return out;
}

/** Where the A pillar's front edge is at height y. */
const pillarZ = (y: number) =>
  COWL.z + ((y - COWL.y) * (SCREEN_TOP.z - COWL.z)) / (SCREEN_TOP.y - COWL.y);

const WIN = { low: WAIST + 0.045, top: ROOF - 0.085 };
const SLIDE = { z0: DOOR.back + 0.1, z1: 1.16 };
const FIXED = { z0: 1.32, z1: 2.3 };

function windows(): Vtx[][] {
  const { low, top } = WIN;
  return [
    [
      [pillarZ(low) + 0.085, low, 0.03],
      [DOOR.back - 0.045, low, 0.03],
      [DOOR.back - 0.045, top, 0.03],
      [pillarZ(top) + 0.085, top, 0.04],
    ],
    [
      [SLIDE.z0, low, 0.035],
      [SLIDE.z1, low, 0.035],
      [SLIDE.z1, top, 0.035],
      [SLIDE.z0, top, 0.035],
    ],
    [
      [FIXED.z0, low, 0.035],
      [FIXED.z1, low, 0.035],
      [FIXED.z1, top, 0.035],
      [FIXED.z0, top, 0.035],
    ],
  ];
}

/** Each side: one panel from the nose to the rear corner, with the openings and windows. */
function sidePanels(b: VehicleBuilder): void {
  const wins = windows();
  const end = TAIL - CORNER;
  const archBack = (y: number) =>
    -AXLE + Math.sqrt(ARCH.r ** 2 - (y - ARCH.cy) ** 2);
  const outline: Vtx[] = [
    ...[SILL, 0.1, 0.2, CLIP.low].map((y): Vtx => [archBack(y), y]),
    [archBack(CLIP.low + 0.03), CLIP.low + 0.03],
    [CLIP.back + 0.005, CLIP.low + 0.03],
    [CLIP.back + 0.005, WAIST - 0.02],
    [pillarZ(WAIST) - 0.01, WAIST],
    [pillarZ(ROOF), ROOF],
    [end, ROOF],
    [end, SILL],
    ...archPath(AXLE, SILL, SILL),
  ];
  const shape = sideShape(outline, wins);
  for (const side of [-1, 1]) {
    const x0 = side > 0 ? SIDE - 0.04 : -SIDE;
    extrudeX(b, shape, x0, x0 + 0.04, paint, M.Paint, Z.Sides, 0.012, [
      [-AXLE, ARCH.cy],
      [AXLE, ARCH.cy],
    ]);
    // Glass in black rubbers, and the sliding window's centre rail.
    for (const w of wins) {
      sidePane(
        b,
        w,
        side,
        side * (SIDE - 0.022),
        rubber,
        M.Rubber,
        Z.Glass,
        inset(w, 0.022),
      );
      sidePane(
        b,
        inset(w, 0.018),
        side,
        side * (SIDE - 0.02),
        glass,
        M.Glass,
        Z.Glass,
      );
    }
    const mid = (SLIDE.z0 + SLIDE.z1) / 2;
    b.block(
      side * (SIDE - 0.016),
      (WIN.low + WIN.top) / 2,
      mid,
      0.012,
      WIN.top - WIN.low - 0.02,
      0.026,
      rubber,
      M.Rubber,
      Z.Sides,
    );
    // Black flare lips round the openings, standing off the body.
    for (const axle of [-AXLE, AXLE]) {
      const yf = axle < 0 ? GUARD_LOW : SILL;
      const lip = sideShape([
        ...archPath(axle, SILL - 0.02, yf - 0.02, 0.06).reverse(),
        ...archPath(axle, SILL - 0.02, yf - 0.02, -0.005),
      ]);
      extrudeX(
        b,
        lip,
        side > 0 ? SIDE - 0.02 : -SIDE - 0.035,
        side > 0 ? SIDE + 0.035 : -SIDE + 0.02,
        trim,
        M.Rubber,
        axle < 0 ? Z.Front : Z.Rear,
        0.015,
      );
      // Dark wheelhouse: an inner wall and a roof over the tyre.
      const wellX = axle < 0 ? 0.34 : 0.52;
      b.block(
        side * wellX,
        0.12,
        axle,
        0.03,
        0.56,
        ARCH.r * 2,
        well,
        M.Rubber,
        Z.Trim,
      );
      b.block(
        (side * (wellX + SIDE - 0.05)) / 2,
        ARCH.cy + ARCH.r + 0.005,
        axle,
        SIDE - 0.05 - wellX,
        0.02,
        ARCH.r * 1.5,
        well,
        M.Rubber,
        Z.Trim,
      );
    }
    // Door shut lines, the B pillar's, and the door's lower edge.
    const x = side * (SIDE + 0.001);
    b.block(
      x,
      (SILL + ROOF) / 2 - 0.02,
      DOOR.back + 0.004,
      0.006,
      ROOF - SILL - 0.08,
      0.006,
      black,
      M.Rubber,
      Z.Sides,
    );
    b.block(
      x,
      (SILL + WAIST) / 2 + 0.01,
      DOOR.front + 0.004,
      0.006,
      WAIST - SILL - 0.02,
      0.006,
      black,
      M.Rubber,
      Z.Sides,
    );
    b.block(
      x,
      SILL + 0.03,
      (DOOR.front + DOOR.back) / 2,
      0.006,
      0.006,
      DOOR.back - DOOR.front,
      black,
      M.Rubber,
      Z.Sides,
    );
    // Pressed swage line below the windows, and a lower one along the body.
    for (const [y, z0, z1] of [
      [WAIST - 0.04, DOOR.front + 0.03, end - 0.02],
      [0.5, AXLE - ARCH.r - 0.1, end - 0.02],
      [0.5, DOOR.back + 0.03, AXLE - ARCH.r - 0.14],
    ])
      b.block(
        side * (SIDE + 0.004),
        y,
        (z0 + z1) / 2,
        0.01,
        0.02,
        z1 - z0,
        paint,
        M.Paint,
        Z.Sides,
        0.008,
      );
    // Handle and lock on the door.
    b.block(
      side * (SIDE + 0.008),
      WAIST - 0.1,
      DOOR.back - 0.16,
      0.016,
      0.035,
      0.15,
      black,
      M.Rubber,
      Z.Sides,
      0.01,
    );
    b.ring(
      side * (SIDE + 0.006),
      WAIST - 0.1,
      DOOR.back - 0.05,
      0.012,
      0.004,
      chrome,
      M.Metal,
      "x",
      Z.Sides,
    );
    // Side indicator on the wing ahead of the door.
    b.block(
      side * (SIDE + 0.004),
      0.62,
      DOOR.front - 0.14,
      0.012,
      0.035,
      0.08,
      amber,
      M.Amber,
      Z.Front,
      0.006,
    );
    // Door mirror: a black sail in the window's front lower corner, a short neck out of it,
    // and the head with its glass facing back.
    const lo = WIN.low - 0.02,
      hi = WIN.low + 0.16;
    const sail: Vtx[] = [
      [pillarZ(lo) + 0.065, lo, 0.012],
      [pillarZ(lo) + 0.255, lo, 0.012],
      [pillarZ(hi) + 0.065, hi, 0.012],
    ];
    extrudeX(
      b,
      sideShape(sail),
      side > 0 ? SIDE - 0.03 : -SIDE - 0.006,
      side > 0 ? SIDE + 0.006 : -SIDE + 0.03,
      black,
      M.Rubber,
      Z.Sides,
      0.004,
    );
    const mz = pillarZ(lo) + 0.17;
    b.block(
      side * (SIDE + 0.03),
      WIN.low + 0.05,
      mz - 0.015,
      0.09,
      0.06,
      0.05,
      black,
      M.Rubber,
      Z.Sides,
      0.015,
    );
    mirrorHead(
      b,
      side,
      v(side * (SIDE + 0.15), WIN.low + 0.12, mz),
      0.2,
      0.16,
      0.075,
      black,
    );
    // Rain gutter along the roof edge.
    b.rod(
      v(side * (SIDE + 0.004), ROOF - 0.03, pillarZ(ROOF) + 0.03),
      v(side * (SIDE + 0.004), ROOF - 0.03, end),
      0.01,
      paint,
      M.Paint,
      Z.Roof,
    );
    // Fuel filler behind the rear wheel.
    b.slot = M.Metal;
    b.tag = Z.Sides;
    b.push()
      .translate(side * (SIDE + 0.004), 0.62, 2.18)
      .rotate(0, 0, Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(0.06, 0.06, 0.012, 18),
      paint.clone().multiplyScalar(0.92),
    );
    b.pop();
    // Rounded rear corner, full height.
    const g = new THREE.CylinderGeometry(
      CORNER,
      CORNER,
      ROOF - SILL - 0.02,
      16,
      1,
      true,
      side > 0 ? 0 : -Math.PI / 2,
      Math.PI / 2,
    );
    b.slot = M.Paint;
    b.tag = Z.Rear;
    b.push().translate(
      side * (SIDE - CORNER),
      (SILL + ROOF) / 2 - 0.01,
      TAIL - CORNER,
    );
    b.geometry(g, paint);
    b.pop();
  }
}

/** White plate with blue "HZJ-75" (the plate faces -z before `facing` turns it). */
const GLYPHS: Record<string, number[][]> = {
  H: [
    [0, 0, 0, 1],
    [1, 0, 1, 1],
    [0, 0.5, 1, 0.5],
  ],
  Z: [
    [0, 1, 1, 1],
    [1, 1, 0, 0],
    [0, 0, 1, 0],
  ],
  J: [
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [0, 0, 0, 0.3],
  ],
  "7": [
    [0, 1, 1, 1],
    [1, 1, 0.3, 0],
  ],
  "5": [
    [1, 1, 0, 1],
    [0, 1, 0, 0.5],
    [0, 0.5, 1, 0.5],
    [1, 0.5, 1, 0],
    [1, 0, 0, 0],
  ],
  "-": [[0.15, 0.5, 0.85, 0.5]],
};

function plate(
  b: VehicleBuilder,
  x: number,
  y: number,
  z: number,
  facing: 1 | -1,
): void {
  b.push()
    .translate(x, y, z)
    .rotate(0, facing > 0 ? Math.PI : 0, 0);
  b.block(0, 0, 0, 0.36, 0.12, 0.012, plateWhite, M.Lamp, Z.Trim, 0.006);
  const text = "HZJ-75";
  const w = 0.032,
    h = 0.058,
    pitch = 0.05;
  for (let i = 0; i < text.length; i++) {
    const x0 = (i - (text.length - 1) / 2) * pitch;
    for (const [ax, ay, bx, by] of GLYPHS[text[i]])
      b.rod(
        { x: -(x0 + (ax - 0.5) * w), y: (ay - 0.5) * h, z: -0.009 },
        { x: -(x0 + (bx - 0.5) * w), y: (by - 0.5) * h, z: -0.009 },
        0.0034,
        plateInk,
        M.Rubber,
        Z.Trim,
      );
  }
  b.pop();
}

function frontEnd(b: VehicleBuilder): void {
  // The front clip in one piece: the face, the bonnet and guard tops sloping down to the
  // nose, the front wheel openings, and its shoulders and front corners well rounded.
  const R = CLIP.round;
  extrudeX(
    b,
    sideShape([
      [F, GUARD_LOW, 0.03],
      [F, CLIP.noseTop, 0.05],
      [CLIP.back, CLIP.backTop, 0.02],
      [CLIP.back, CLIP.low],
      ...archPath(-AXLE, CLIP.low, GUARD_LOW),
    ]),
    -SIDE,
    SIDE,
    paint,
    M.Paint,
    Z.Front,
    R,
    [[-AXLE, ARCH.cy]],
    6,
    CLIP.ratio,
  );
  // Bonnet shut lines over its continuous crowned skin.
  for (const side of [-1, 1])
    b.rod(
      v(side * 0.69, clipTop(F + 0.06) + 0.002, F + 0.06),
      v(side * 0.69, clipTop(COWL.z - 0.08) + 0.002, COWL.z - 0.08),
      0.004,
      black,
      M.Rubber,
      Z.Front,
    );
  // Cowl under the screen, with its vent slots.
  b.block(
    0,
    COWL.y - 0.02,
    COWL.z - 0.03,
    1.66,
    0.05,
    0.1,
    paint,
    M.Paint,
    Z.Front,
    0.015,
  );
  for (let i = 0; i < 10; i++)
    b.block(
      -0.45 + i * 0.1,
      COWL.y + 0.006,
      COWL.z - 0.04,
      0.06,
      0.004,
      0.05,
      black,
      M.Rubber,
      Z.Front,
    );

  // Front panel: a black grille with horizontal bars and a centre badge between round 7 inch
  // headlamps in square black surrounds; the indicators sit on the outer corners of the
  // front clip, outboard of the lamps, wrapping round them.
  const gy = 0.56;
  const grille = new THREE.Color("#525856");
  b.block(
    0,
    gy,
    F - 0.004,
    0.97,
    0.29,
    0.026,
    grille,
    M.Rubber,
    Z.Front,
    0.014,
  );
  b.block(0, gy, F - 0.02, 0.9, 0.235, 0.014, black, M.Rubber, Z.Front, 0.008);
  for (let i = 0; i < 27; i++)
    b.block(
      -0.426 + i * 0.0328,
      gy,
      F - 0.03,
      0.009,
      0.21,
      0.012,
      grille,
      M.Rubber,
      Z.Front,
    );
  for (const y of [gy - 0.056, gy + 0.056])
    b.block(
      0,
      y,
      F - 0.038,
      0.9,
      0.016,
      0.016,
      grille,
      M.Rubber,
      Z.Front,
      0.003,
    );
  b.block(0, gy, F - 0.04, 0.43, 0.068, 0.016, black, M.Rubber, Z.Front, 0.004);
  const letters: Record<string, number[][]> = {
    T: [
      [0, 1, 1, 1],
      [0.5, 1, 0.5, 0],
    ],
    O: [
      [0, 0, 0, 1],
      [0, 1, 1, 1],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
    ],
    Y: [
      [0, 1, 0.5, 0.5],
      [1, 1, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0],
    ],
    A: [
      [0, 0, 0.5, 1],
      [0.5, 1, 1, 0],
      [0.2, 0.42, 0.8, 0.42],
    ],
  };
  [..."TOYOTA"].forEach((ch, i) => {
    for (const [x0, y0, x1, y1] of letters[ch])
      b.rod(
        v(0.211 - i * 0.075 - x0 * 0.049, gy - 0.023 + y0 * 0.046, F - 0.051),
        v(0.211 - i * 0.075 - x1 * 0.049, gy - 0.023 + y1 * 0.046, F - 0.051),
        0.0032,
        plateWhite,
        M.Metal,
        Z.Front,
      );
  });
  for (const side of [-1, 1]) {
    const hx = side * 0.6;
    b.block(
      hx,
      gy,
      F - 0.002,
      0.27,
      0.27,
      0.02,
      new THREE.Color("#525856"),
      M.Rubber,
      Z.Front,
      0.02,
    );
    roundHeadlamp(b, hx, gy, F - 0.012, 0.089, lens, chrome, black);
    // Indicator wrapped round the corner, in a black housing, with the white triangle
    // under it on the face.
    const cx = side * (SIDE - R),
      cz = F + CLIP.ratio * R;
    cornerWrap(
      b,
      side,
      cx,
      cz,
      R + 0.003,
      CLIP.ratio * R + 0.003,
      gy - 0.01,
      0.2,
      black,
      M.Rubber,
      Z.Front,
      0,
      0.8,
    );
    cornerWrap(
      b,
      side,
      cx,
      cz,
      R + 0.008,
      CLIP.ratio * R + 0.008,
      gy + 0.035,
      0.085,
      amber,
      M.Amber,
      Z.Front,
      0,
      0.8,
    );
    cornerWrap(
      b,
      side,
      cx,
      cz,
      R + 0.008,
      CLIP.ratio * R + 0.008,
      gy - 0.06,
      0.075,
      lens,
      M.Headlamp,
      Z.Front,
      0,
      0.8,
    );
    cornerWrap(
      b,
      side,
      cx,
      cz,
      R + 0.01,
      CLIP.ratio * R + 0.01,
      gy - 0.014,
      0.012,
      trim,
      M.Rubber,
      Z.Front,
      0,
      0.8,
    );
  }
  // The black bumper with its brackets.
  b.block(0, 0.18, F - 0.03, 1.72, 0.15, 0.1, bumper, M.Metal, Z.Front, 0.025);
  for (const x of [-0.43, 0.43])
    b.block(x, 0.1, F + 0.06, 0.07, 0.07, 0.16, black, M.Metal, Z.Trim);
  // Sump, steering box and the air cleaner's intake behind the left headlamp.
  b.block(0, -0.04, -1.75, 0.44, 0.16, 0.5, black, M.Metal, Z.Trim, 0.02);
  b.block(0.38, 0.02, -2.0, 0.14, 0.16, 0.16, black, M.Metal, Z.Trim, 0.02);
}

function windscreen(b: VehicleBuilder): void {
  const lean = Math.atan2(SCREEN_TOP.z - COWL.z, SCREEN_TOP.y - COWL.y);
  const L = (ROOF - 0.01 - COWL.y) / Math.cos(lean);
  const w = SIDE - 0.005;
  const outer: Vtx[] = [
    [-w, 0, 0.02],
    [w, 0, 0.02],
    [w, L, 0.04],
    [-w, L, 0.04],
  ];
  const hole: Vtx[] = [
    [-w + 0.085, 0.045, 0.04],
    [w - 0.085, 0.045, 0.04],
    [w - 0.085, L - 0.1, 0.04],
    [-w + 0.085, L - 0.1, 0.04],
  ];
  b.push().translate(0, COWL.y, COWL.z).rotate(lean, 0, 0);
  const s = new THREE.Shape(rounded(outer));
  s.holes.push(new THREE.Path(rounded(hole)));
  extrudeZ(b, s, -0.02, 0.025, paint, M.Paint, Z.Front, 0.012);
  frontPane(b, hole, -0.004, -1, rubber, M.Rubber, Z.Glass, inset(hole, 0.022));
  frontPane(b, inset(hole, 0.018), -0.006, -1, glass, M.Glass, Z.Glass);
  for (const x of [0.55, -0.1]) {
    b.rod(
      { x, y: 0.06, z: -0.03 },
      { x: x - 0.46, y: 0.09, z: -0.03 },
      0.006,
      black,
      M.Rubber,
      Z.Front,
    );
    b.rod(
      { x, y: 0.065, z: -0.036 },
      { x: x - 0.42, y: 0.095, z: -0.036 },
      0.004,
      black,
      M.Rubber,
      Z.Front,
    );
  }
  b.block(0, L - 0.16, 0.05, 0.22, 0.065, 0.02, black, M.Rubber, Z.Trim, 0.01);
  b.pop();
}

function roof(b: VehicleBuilder): void {
  const front = pillarZ(ROOF) - 0.01;
  const s = new THREE.Shape(
    rounded([
      [-SIDE, -front, 0.04],
      [SIDE, -front, 0.04],
      [SIDE, -TAIL, CORNER * 1.6],
      [-SIDE, -TAIL, CORNER * 1.6],
    ]),
  );
  // Plan shape in (x, -z); extruded upwards with a rounded edge.
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(s, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.024,
    bevelOffset: -0.024,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g = subdivideSurface(g, (_p, n) => Math.abs(n.y) > 0.7, 2);
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i),
      a = Math.max(0, 1 - (x / SIDE) ** 2),
      t = THREE.MathUtils.clamp((z - front) / (TAIL - front), 0, 1),
      q = Math.sin(Math.PI * t) ** 2;
    const h = 0.028 * a * a * q,
      dx = ((-0.112 * x) / (SIDE * SIDE)) * a * q,
      dz =
        (0.028 * a * a * Math.PI * Math.sin(2 * Math.PI * t)) / (TAIL - front);
    p.setY(i, p.getY(i) + h);
    const normal = new THREE.Vector3(
      n.getX(i) - dx * n.getY(i),
      n.getY(i),
      n.getZ(i) - dz * n.getY(i),
    ).normalize();
    n.setXYZ(i, normal.x, normal.y, normal.z);
  }
  b.slot = M.Paint;
  b.tag = Z.Roof;
  b.push().translate(0, ROOF - 0.04, 0);
  b.geometry(g, paint);
  b.pop();
  // Conforming transverse pressed ribs, sharing the roof crown.
  for (let j = 0; j < 7; j++) {
    const z = -0.45 + j * 0.45,
      q = Math.sin((Math.PI * (z - front)) / (TAIL - front)) ** 2;
    const point = (x: number) =>
      v(x, ROOF + 0.004 + 0.028 * (1 - (x / SIDE) ** 2) ** 2 * q, z);
    for (let i = 0; i < 20; i++)
      b.rod(
        point(-0.75 + i * 0.075),
        point(-0.75 + (i + 1) * 0.075),
        0.006,
        paint,
        M.Paint,
        Z.Roof,
      );
  }
}

function rearEnd(b: VehicleBuilder, wheel: THREE.BufferGeometry): void {
  const T = TAIL;
  const e = SIDE - CORNER;
  const split = -0.18;
  const winLo = 0.95,
    winHi = 1.4;
  const wins: Vtx[][] = [
    [
      [-e + 0.07, winLo, 0.03],
      [split - 0.08, winLo, 0.03],
      [split - 0.08, winHi, 0.03],
      [-e + 0.07, winHi, 0.03],
    ],
    [
      [split + 0.08, winLo, 0.03],
      [e - 0.07, winLo, 0.03],
      [e - 0.07, winHi, 0.03],
      [split + 0.08, winHi, 0.03],
    ],
  ];
  const s = new THREE.Shape(
    rounded([
      [-e - 0.002, SILL],
      [e + 0.002, SILL],
      [e + 0.002, ROOF - 0.03],
      [-e - 0.002, ROOF - 0.03],
    ]),
  );
  for (const w of wins) s.holes.push(new THREE.Path(rounded(w)));
  extrudeZ(b, s, T - 0.04, T, paint, M.Paint, Z.Rear, 0.012);
  for (const w of wins) {
    frontPane(b, w, T - 0.016, 1, rubber, M.Rubber, Z.Glass, inset(w, 0.022));
    frontPane(b, inset(w, 0.018), T - 0.014, 1, glass, M.Glass, Z.Glass);
  }
  // Door split, the top shut line, hinges and the handle on the narrow door.
  b.block(
    split,
    (SILL + ROOF) / 2,
    T + 0.002,
    0.008,
    ROOF - SILL - 0.12,
    0.006,
    black,
    M.Rubber,
    Z.Rear,
  );
  b.block(
    0,
    ROOF - 0.07,
    T + 0.002,
    2 * e - 0.04,
    0.006,
    0.006,
    black,
    M.Rubber,
    Z.Rear,
  );
  b.block(
    split + 0.06,
    0.72,
    T + 0.015,
    0.03,
    0.12,
    0.02,
    black,
    M.Rubber,
    Z.Rear,
    0.008,
  );
  for (const side of [-1, 1])
    for (const y of [0.62, 1.2]) {
      b.block(
        side * (e - 0.03),
        y,
        T + 0.018,
        0.05,
        0.1,
        0.03,
        paint,
        M.Paint,
        Z.Rear,
        0.006,
      );
      b.rod(
        v(side * (e - 0.03), y - 0.05, T + 0.04),
        v(side * (e - 0.03), y + 0.05, T + 0.04),
        0.009,
        steel,
        M.Metal,
        Z.Rear,
      );
    }
  // Body lamps low in the rear corners: a black cap, the red tail and stop lens and the
  // clear reverse lens. The indicators and a second red lamp are in the rear bar.
  for (const side of [-1, 1]) {
    const lx = side * 0.71;
    b.block(
      lx,
      0.33,
      T + 0.008,
      0.14,
      0.3,
      0.02,
      black,
      M.Rubber,
      Z.Rear,
      0.01,
    );
    b.block(
      lx,
      0.455,
      T + 0.012,
      0.15,
      0.05,
      0.026,
      black,
      M.Rubber,
      Z.Rear,
      0.01,
    );
    b.block(lx, 0.36, T + 0.016, 0.12, 0.12, 0.01, red, M.Red, Z.Rear, 0.008);
    b.block(
      lx,
      0.235,
      T + 0.016,
      0.12,
      0.09,
      0.01,
      lens,
      M.Lamp,
      Z.Rear,
      0.008,
    );
    b.block(lx, 0.29, T + 0.023, 0.12, 0.012, 0.006, black, M.Rubber, Z.Rear);
  }
  // Covered spare on the wide right door, carried off the painted skin.
  const rearSpareStart = b.vertexCount;
  b.tag = Z.Rear;
  b.push()
    .translate(0.33, 0.72, T + 0.215)
    .rotate(0, Math.PI / 2, 0);
  b.geometry(wheel.clone(), black);
  b.pop();
  reviewRanges.push({ start: rearSpareStart, end: b.vertexCount, part: 64 });
  const coverStart = b.vertexCount;
  const profile = [
    [0, -0.15],
    [0.36, -0.15],
    [0.402, -0.14],
    [0.418, -0.1],
    [0.418, 0.09],
    [0.407, 0.14],
    [0.36, 0.16],
    [0, 0.16],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  b.slot = M.Fabric;
  b.tag = Z.Rear;
  b.push()
    .translate(0.33, 0.72, T + 0.215)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(
    new THREE.LatheGeometry(profile, 48),
    black.clone().multiplyScalar(1.18),
  );
  b.pop();
  b.ring(0.33, 0.72, T + 0.356, 0.397, 0.003, trim, M.Fabric, "z", Z.Rear);
  reviewRanges.push({ start: coverStart, end: b.vertexCount, part: 4 | 128 });
  const carrierStart = b.vertexCount;
  for (const x of [0.08, 0.58])
    b.block(
      x,
      0.72,
      T + 0.055,
      0.055,
      0.6,
      0.09,
      black,
      M.Metal,
      Z.Rear,
      0.004,
    );
  b.block(
    0.33,
    0.72,
    T + 0.09,
    0.55,
    0.055,
    0.055,
    black,
    M.Metal,
    Z.Rear,
    0.004,
  );
  reviewRanges.push({ start: carrierStart, end: b.vertexCount, part: 128 });
  // Black rear bar with recovery points, a tow hitch, its brackets and the plate.
  b.block(0, 0.08, T + 0.07, 1.7, 0.15, 0.13, bumper, M.Metal, Z.Rear, 0.025);
  // Bar lamps in each end: amber indicator outboard, red stop and tail inboard.
  for (const side of [-1, 1]) {
    b.block(
      side * 0.66,
      0.08,
      T + 0.137,
      0.26,
      0.085,
      0.006,
      black,
      M.Rubber,
      Z.Rear,
      0.004,
    );
    b.block(
      side * 0.72,
      0.08,
      T + 0.141,
      0.11,
      0.065,
      0.006,
      amber,
      M.Amber,
      Z.Rear,
      0.004,
    );
    b.block(
      side * 0.6,
      0.08,
      T + 0.141,
      0.11,
      0.065,
      0.006,
      red,
      M.Red,
      Z.Rear,
      0.004,
    );
  }
  b.block(0, 0.0, T + 0.16, 0.08, 0.06, 0.16, black, M.Metal, Z.Rear, 0.01);
  b.slot = M.Metal;
  b.push().translate(0, 0.05, T + 0.24);
  b.geometry(new THREE.SphereGeometry(0.03, 12, 8), steel);
  b.pop();
  for (const x of [-0.43, 0.43])
    b.block(x, 0.04, T - 0.05, 0.06, 0.08, 0.16, black, M.Metal, Z.Trim);
  for (const side of [-1, 1])
    b.ring(side * 0.62, -0.03, T + 0.12, 0.045, 0.011, red, M.Red, "x", Z.Trim);
  plate(b, -0.46, 0.5, T + 0.008, 1);
}

function jerryCan(b: VehicleBuilder, x: number, y: number, z: number): void {
  const can = new THREE.Color("#5E6A43");
  b.block(x, y, z, 0.34, 0.17, 0.47, can, M.Paint, Z.Roof, 0.02);
  b.block(x - 0.08, y, z - 0.26, 0.12, 0.03, 0.05, can, M.Paint, Z.Roof, 0.01);
  b.block(x + 0.1, y, z - 0.25, 0.06, 0.06, 0.04, can, M.Paint, Z.Roof, 0.01);
  b.block(x, y - 0.092, z, 0.4, 0.014, 0.53, bar, M.Metal, Z.Roof, 0.004);
  for (const dz of [-0.12, 0.12]) {
    b.block(x, y + 0.092, z + dz, 0.38, 0.012, 0.035, black, M.Rubber, Z.Roof);
    for (const side of [-1, 1])
      b.block(
        x + side * 0.176,
        y,
        z + dz,
        0.012,
        0.19,
        0.035,
        black,
        M.Rubber,
        Z.Roof,
      );
    b.block(x, y - 0.092, z + dz, 0.38, 0.012, 0.035, black, M.Rubber, Z.Roof);
  }
}
/** A flat webbing strip with mitred bends, rather than rectangular hoops above the load. */
function webbing(
  b: VehicleBuilder,
  points: THREE.Vector2[],
  z: number,
  width: number,
  color: THREE.Color,
): void {
  const normals = points.slice(0, -1).map((p, i) => {
    const d = points[i + 1].clone().sub(p).normalize();
    return new THREE.Vector2(-d.y, d.x);
  });
  const edges = [1, -1].map((side) =>
    points.map((p, i) => {
      const n =
        i === 0
          ? normals[0].clone()
          : i === points.length - 1
            ? normals[normals.length - 1].clone()
            : normals[i - 1].clone().add(normals[i]).normalize();
      return p
        .clone()
        .addScaledVector(
          n,
          (side * 0.004) / n.dot(normals[Math.min(i, normals.length - 1)]),
        );
    }),
  );
  const shape = new THREE.Shape([...edges[0], ...edges[1].reverse()]);
  extrudeZ(b, shape, z - width / 2, z + width / 2, color, M.Fabric, Z.Roof, 0);
}
function roofRack(b: VehicleBuilder, wheel: THREE.BufferGeometry): void {
  const { y, front, back } = RACK;
  for (const side of [-1, 1]) {
    b.rod(
      v(side * 0.8, y, front),
      v(side * 0.8, y, back),
      0.02,
      bar,
      M.Metal,
      Z.Roof,
    );
    b.rod(
      v(side * 0.8, y - 0.06, front),
      v(side * 0.8, y - 0.06, back),
      0.014,
      bar,
      M.Metal,
      Z.Roof,
    );
    for (let i = 0; i <= 6; i++) {
      const z = front + ((back - front) * i) / 6;
      b.block(
        side * (SIDE + 0.004),
        ROOF - 0.026,
        z,
        0.052,
        0.022,
        0.12,
        bar,
        M.Metal,
        Z.Roof,
        0.003,
      );
      b.rod(
        v(side * (SIDE + 0.004), ROOF - 0.023, z),
        v(side * 0.8, y, z),
        0.017,
        bar,
        M.Metal,
        Z.Roof,
      );
    }
  }
  for (let i = 0; i <= 8; i++) {
    const z = front + ((back - front) * i) / 8;
    b.rod(v(-0.8, y, z), v(0.8, y, z), 0.014, bar, M.Metal, Z.Roof);
  }
  const deflector = sideShape([
    [front - 0.08, y - 0.08],
    [front + 0.015, y + 0.035],
    [front + 0.027, y + 0.027],
    [front - 0.068, y - 0.088],
  ]);
  extrudeX(b, deflector, -0.8, 0.8, bar, M.Metal, Z.Roof, 0);
  const cradleStart = b.vertexCount;
  for (const x of [-0.29, 0.29])
    b.block(x, y + 0.045, 1.98, 0.055, 0.03, 0.65, bar, M.Metal, Z.Roof, 0.004);
  for (const z of [1.78, 2.18])
    b.rod(v(-0.8, y, z), v(0.8, y, z), 0.014, bar, M.Metal, Z.Roof);
  reviewRanges.push({ start: cradleStart, end: b.vertexCount, part: 512 });
  const spareStart = b.vertexCount,
    sy = y + 0.174;
  b.tag = Z.Roof;
  b.push()
    .translate(0, sy, 1.98)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(wheel.clone(), black);
  b.pop();
  reviewRanges.push({ start: spareStart, end: b.vertexCount, part: 256 });
  const strapsStart = b.vertexCount;
  for (const z of [1.78, 2.18]) {
    const strap = new THREE.Color("#C2862F");
    webbing(
      b,
      [
        [-0.386, y - 0.018],
        [-0.37, sy + 0.105],
        [-0.2, sy + 0.118],
        [0.2, sy + 0.118],
        [0.37, sy + 0.105],
        [0.386, y - 0.018],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      z,
      0.04,
      strap,
    );
    b.block(0, y - 0.018, z, 0.78, 0.008, 0.04, strap, M.Fabric, Z.Roof);
  }
  reviewRanges.push({ start: strapsStart, end: b.vertexCount, part: 512 });
  jerryCan(b, 0, y + 0.113, -0.35);
}

/** Steel bar: a deep pan with swept wings, a centre hoop over the grille and loops over the lamps. */
function bullBar(b: VehicleBuilder, tuning: VehicleTuning): void {
  const face = tuning.winchMount.z;
  const back = F - 0.09;
  const zc = (face + back) / 2,
    depth = back - face;
  const panY = 0.16,
    panH = 0.3;
  const panShape = new THREE.Shape();
  panShape.moveTo(-0.59, -face);
  panShape.lineTo(0.59, -face);
  panShape.lineTo(0.94, -face - 0.15);
  panShape.lineTo(0.91, -back - 0.13);
  panShape.lineTo(0.56, -back);
  panShape.lineTo(-0.56, -back);
  panShape.lineTo(-0.91, -back - 0.13);
  panShape.lineTo(-0.94, -face - 0.15);
  panShape.closePath();
  const pan = new THREE.ExtrudeGeometry(panShape, {
    depth: panH - 0.03,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 3,
  });
  pan.rotateX(-Math.PI / 2);
  pan.translate(0, panY - panH / 2 + 0.015, 0);
  b.slot = M.Metal;
  b.tag = Z.Front;
  b.geometry(pan, bar);
  for (const side of [-1, 1]) {
    b.push()
      .translate(side * 0.76, panY + 0.05, face + 0.085)
      .rotate(0, -side * 0.42, 0);
    b.block(0, 0, -0.01, 0.14, 0.06, 0.025, black, M.Rubber, Z.Front, 0.006);
    b.block(0, 0, -0.027, 0.12, 0.04, 0.009, amber, M.Amber, Z.Front, 0.004);
    b.pop();
  }
  const top = panY + panH / 2;
  b.block(
    0,
    top,
    zc + 0.01,
    1.26,
    0.03,
    depth + 0.03,
    bar,
    M.Metal,
    Z.Front,
    0.012,
  );
  for (const x of [-0.43, 0.43])
    b.block(x, 0.1, back + 0.1, 0.08, 0.12, 0.24, bar, M.Metal, Z.Trim);
  const zt = F - 0.06;
  const tube = (pts: ReturnType<typeof v>[], r: number) =>
    continuousTube(
      b,
      pts.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      r,
      bar,
    );
  tube(
    [
      v(-0.4, top - 0.015, zc + 0.01),
      v(-0.4, 0.88, zt),
      v(0.4, 0.88, zt),
      v(0.4, top - 0.015, zc + 0.01),
    ],
    0.032,
  );
  b.rod(
    v(-0.4, 0.62, (zc + zt) / 2),
    v(0.4, 0.62, (zc + zt) / 2),
    0.022,
    bar,
    M.Metal,
    Z.Front,
  );
  for (const side of [-1, 1]) {
    tube(
      [
        v(side * 0.4, 0.75, zt - 0.012),
        v(side * 0.86, 0.73, zt + 0.04),
        v(side * 0.86, top - 0.01, zc + 0.105),
      ],
      0.028,
    );
    b.block(
      side * 0.86,
      top,
      zc + 0.105,
      0.09,
      0.025,
      0.1,
      bar,
      M.Metal,
      Z.Front,
      0.005,
    );
    b.block(
      side * 0.4,
      top,
      zc + 0.01,
      0.09,
      0.025,
      0.1,
      bar,
      M.Metal,
      Z.Front,
      0.005,
    );
  }
  // Winch drum behind the pan, between the hoop's legs.
  b.rod(
    v(-0.24, top + 0.06, back - 0.02),
    v(0.24, top + 0.06, back - 0.02),
    0.07,
    trim,
  );
  for (let i = 0; i < 15; i++)
    b.ring(
      -0.18 + i * 0.026,
      top + 0.06,
      back - 0.02,
      0.07,
      0.005,
      steel,
      M.Metal,
      "x",
      Z.Front,
    );
  const m = tuning.winchMount;
  b.block(
    m.x,
    m.y,
    face - 0.005,
    0.34,
    0.12,
    0.02,
    steel,
    M.Metal,
    Z.Front,
    0.006,
  );
  b.block(m.x, m.y, face - 0.012, 0.2, 0.05, 0.015, black, M.Rubber, Z.Front);
  for (const y of [m.y - 0.032, m.y + 0.032])
    b.rod(
      v(m.x - 0.1, y, face - 0.03),
      v(m.x + 0.1, y, face - 0.03),
      0.015,
      steel,
      M.Metal,
      Z.Front,
    );
  for (const x of [m.x - 0.11, m.x + 0.11])
    b.rod(
      v(x, m.y - 0.045, face - 0.03),
      v(x, m.y + 0.045, face - 0.03),
      0.015,
      steel,
      M.Metal,
      Z.Front,
    );
  for (const side of [-1, 1]) {
    const x = side * 0.6;
    b.block(x, 0.0, face + 0.02, 0.07, 0.08, 0.06, steel, M.Metal, Z.Trim);
    b.ring(x, -0.04, face - 0.01, 0.045, 0.011, red, M.Red, "x", Z.Trim);
  }
  b.block(
    0.42,
    0.17,
    face - 0.021,
    0.38,
    0.14,
    0.02,
    bar,
    M.Metal,
    Z.Front,
    0.004,
  );
  plate(b, 0.42, 0.17, face - 0.035, -1);
}

function chassis(b: VehicleBuilder): void {
  for (const side of [-1, 1]) {
    b.block(side * 0.31, -0.02, -1.7, 0.09, 0.16, 1.08, black, M.Metal, Z.Trim);
    b.rod(
      v(side * 0.31, -0.02, -1.18),
      v(side * 0.43, -0.02, -0.93),
      0.045,
      black,
      M.Metal,
      Z.Trim,
    );
    b.block(
      side * 0.43,
      -0.02,
      0.775,
      0.09,
      0.16,
      3.41,
      black,
      M.Metal,
      Z.Trim,
    );
  }
  for (const z of [-2.05, -0.95, 0.5, 1.9, 2.45])
    b.block(0, -0.02, z, 0.86, 0.08, 0.08, black, M.Metal, Z.Trim);
  b.block(0.04, -0.04, -0.4, 0.4, 0.17, 0.7, black, M.Metal, Z.Trim, 0.03);
  const shaft = steel.clone().multiplyScalar(0.6);
  b.rod(
    { x: 0.1, y: -0.08, z: -0.7 },
    { x: 0.08, y: -0.12, z: -1.36 },
    0.032,
    shaft,
  );
  b.rod(
    { x: 0.0, y: -0.07, z: -0.05 },
    { x: 0.05, y: -0.1, z: 1.38 },
    0.036,
    shaft,
  );
  b.block(-0.6, 0.08, 2.25, 0.3, 0.26, 0.4, black, M.Metal, Z.Trim, 0.03);
  b.block(0.62, 0.06, 0.62, 0.26, 0.24, 0.7, black, M.Metal, Z.Trim, 0.03);
  b.rod(
    { x: 0.28, y: -0.06, z: -1.4 },
    { x: 0.28, y: -0.08, z: 0.4 },
    0.028,
    steel,
  );
  b.slot = M.Metal;
  b.tag = Z.Trim;
  b.push()
    .translate(0.28, -0.07, 0.75)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 12), shaft);
  b.pop();
  b.rod(
    { x: 0.28, y: -0.08, z: 1.03 },
    { x: 0.3, y: -0.04, z: 1.85 },
    0.026,
    steel,
  );
  b.rod(
    { x: 0.3, y: -0.04, z: 1.85 },
    { x: 0.62, y: -0.05, z: 2.55 },
    0.026,
    steel,
  );
  // Floor under the cab and load space.
  for (const [start, end, width] of [
    [-2.05, -0.88, 0.7],
    [-0.88, 0.875, 1.6],
    [0.875, 2.105, 1.1],
    [2.105, 2.45, 1.6],
  ])
    b.block(
      0,
      0.1,
      (start + end) / 2,
      width,
      0.03,
      end - start,
      black,
      M.Rubber,
      Z.Trim,
    );
  // Whip aerial on the right front wing.
  b.block(
    0.68,
    clipTop(-1.08),
    -1.08,
    0.05,
    0.04,
    0.05,
    black,
    M.Rubber,
    Z.Front,
  );
  b.rod(
    v(0.68, clipTop(-1.08) + 0.02, -1.08),
    v(0.7, clipTop(-1.08) + 1.0, -1.04),
    0.004,
    black,
    M.Rubber,
    Z.Roof,
  );
}

export function buildTroopyBody(
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
): THREE.BufferGeometry {
  reviewRanges.length = 0;
  const b = new VehicleBuilder();
  sidePanels(b);
  frontEnd(b);
  windscreen(b);
  const roofStart = b.vertexCount;
  roof(b);
  reviewRanges.push({ start: roofStart, end: b.vertexCount, part: 8 });
  rearEnd(b, wheel);
  const rackStart = b.vertexCount;
  roofRack(b, wheel);
  reviewRanges.push({ start: rackStart, end: b.vertexCount, part: 2 });
  const barStart = b.vertexCount;
  bullBar(b, tuning);
  reviewRanges.push({ start: barStart, end: b.vertexCount, part: 1 });
  chassis(b);
  addTroopyInterior(
    b,
    tuning.engine.redlineRpm,
    paint,
    false,
    (start, end, part) => reviewRanges.push({ start, end, part }),
  );
  const g = b.build();
  g.setAttribute(
    "reviewPart",
    new THREE.Float32BufferAttribute(
      Array.from({ length: b.vertexCount }, (_, i) =>
        reviewRanges.reduce(
          (mask, r) => (i >= r.start && i < r.end ? mask | r.part : mask),
          0,
        ),
      ),
      1,
    ),
  );
  return cleanGeometry(g);
}

/** A 7.50R16 light-truck tyre with a chunky all-terrain tread, on a grey steel wheel. */
export function buildTroopyWheel(tuning: VehicleTuning): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const r = tuning.wheelRadius,
    w = tuning.wheelWidth;
  const tyre = new THREE.Color("#232624");
  const rim = troopyColors.wheel;
  const rimR = 0.215;
  b.slot = M.Rubber;
  b.tag = Z.Trim;
  b.push().rotate(0, 0, -Math.PI / 2);
  const profile = [
    [rimR - 0.01, -w * 0.47],
    [r * 0.7, -w * 0.54],
    [r * 0.9, -w * 0.5],
    [r * 0.965, -w * 0.4],
    [r * 0.965, w * 0.4],
    [r * 0.9, w * 0.5],
    [r * 0.7, w * 0.54],
    [rimR - 0.01, w * 0.47],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  b.geometry(new THREE.LatheGeometry(profile, 48), tyre);
  b.pop();
  // Two rows of big staggered blocks that wrap onto the shoulders.
  const blocks = 26;
  for (let i = 0; i < blocks; i++) {
    for (const side of [-1, 1]) {
      const angle = ((i + (side > 0 ? 0.5 : 0)) / blocks) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(
          side * w * 0.25,
          Math.cos(angle) * r * 0.965,
          Math.sin(angle) * r * 0.965,
        )
        .rotate(angle, side * 0.15, 0);
      b.box(w * 0.44, 0.036, 0.058, tyre);
      b.pop();
    }
  }
  for (const side of [-1, 1]) {
    b.ring(
      side * w * 0.5,
      0,
      0,
      r * 0.74,
      0.004,
      tyre.clone().multiplyScalar(1.4),
      M.Rubber,
      "x",
    );
    // Rim flange, the dished centre with round vents, the hub and six wheel nuts.
    b.ring(side * (w * 0.5 - 0.005), 0, 0, rimR, 0.013, rim, M.Paint, "x");
    const circle = (cx: number, cy: number, r: number, n: number) =>
      Array.from(
        { length: n },
        (_, i) =>
          new THREE.Vector2(
            cx + r * Math.cos((i * Math.PI * 2) / n),
            cy + r * Math.sin((i * Math.PI * 2) / n),
          ),
      );
    const disc = new THREE.Shape(circle(0, 0, rimR - 0.01, 48));
    for (let i = 0; i < 6; i++) {
      const a = ((i + 0.5) * Math.PI) / 3;
      disc.holes.push(
        new THREE.Path(
          circle(Math.cos(a) * 0.168, Math.sin(a) * 0.168, 0.022, 14).reverse(),
        ),
      );
    }
    disc.holes.push(new THREE.Path(circle(0, 0, 0.051, 24).reverse()));
    b.push()
      .translate(side * (w * 0.5 - 0.03), 0, 0)
      .rotate(0, Math.PI / 2, 0);
    extrudeZ(b, disc, -0.01, 0.01, rim, M.Paint, Z.Trim, 0);
    b.pop();
    b.slot = M.Paint;
    b.push()
      .translate(side * (w * 0.5 - 0.012), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.12, 0.135, 0.03, 32), rim);
    b.pop();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.slot = M.Metal;
      b.push()
        .translate(
          side * (w * 0.5 + 0.008),
          Math.cos(a) * 0.0698,
          Math.sin(a) * 0.0698,
        )
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.0125, 0.015, 0.02, 6), steel);
      b.pop();
    }
    // Free-wheeling hub cap in the middle.
    b.slot = M.Metal;
    b.push()
      .translate(side * (w * 0.5 + 0.022), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(0.05, 0.058, 0.05, 20),
      steel.clone().multiplyScalar(0.9),
    );
    b.pop();
  }
  return cleanGeometry(b.build());
}

/** A recovery board strapped along the roof rack (index 0 on the left). */
export function buildTroopyPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const wood = new THREE.Color("#A9824F");
  const x = index === 0 ? -0.6 : 0.6,
    y = RACK.y + 0.04,
    z = 0.48;
  const L = plankTuning.length,
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
  for (const dz of [-0.8075, 0.7625]) {
    b.block(
      x,
      y + 0.03,
      z + dz,
      W + 0.01,
      0.012,
      0.045,
      black,
      M.Rubber,
      Z.Roof,
    );
    for (const s of [-1, 1])
      b.block(
        x + s * (W / 2 + 0.006),
        y - 0.014,
        z + dz,
        0.012,
        0.1,
        0.045,
        black,
        M.Rubber,
        Z.Roof,
      );
    b.block(
      x,
      y - 0.058,
      z + dz,
      W + 0.03,
      0.012,
      0.045,
      black,
      M.Rubber,
      Z.Roof,
    );
  }
  return cleanGeometry(b.build());
}
