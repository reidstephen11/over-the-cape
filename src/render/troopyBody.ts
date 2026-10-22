import * as THREE from 'three';
import type { VehicleTuning } from '../data/vehicle';
import { plankTuning } from '../data/tools';
import { BodyZone as Z, VehicleBuilder, VehicleMaterial as M } from './vehicleGeometry';
import { addTroopyInterior } from './troopyInterior';
import { troopyColors } from './troopyPaint';

/**
 * Toyota LandCruiser 75 Series Troop Carrier (1990s) in plain white: a short, square
 * bonnet between flat-topped wings, round headlamps at the ends of a slatted grille, an
 * upright windscreen, two front doors, then a long, tall steel body with a sliding window
 * and a small fixed one in each side, and barn doors at the back, the wider one carrying
 * a spare wheel. Black bumpers and a black bull bar with a winch behind it. A full-length
 * roof rack carries the second spare, a jerry can and the two recovery boards. Ground is
 * about 0.52 m below the origin when parked.
 */
const { paint, bar, bumper, chrome } = troopyColors;
const black = new THREE.Color('#1E2120'),
  rubber = new THREE.Color('#262928'),
  steel = new THREE.Color('#8F938D');
const red = new THREE.Color('#B3271F'),
  amber = new THREE.Color('#E5992F'),
  lens = new THREE.Color('#E6E4D2');
const glass = new THREE.Color('#9FB6B3'),
  plateWhite = new THREE.Color('#E9E7DD'),
  plateInk = new THREE.Color('#1F3D6B');

/** Body sides, wheel openings and the main heights and stations (vehicle frame). */
const SIDE = 0.845;
const SILL = 0.04;
const WAIST = 0.84;
const ARCH = { radius: 0.5, cy: -0.1 };
const FRONT_FACE = -2.2;
const BONNET = 0.8;
const COWL = { y: 0.84, z: -0.98 };
const SCREEN_TOP = { y: 1.48, z: -0.8 };
const DOOR = { front: -0.95, back: 0.08 };
const ROOF = 1.54;
const TAIL = 2.58;
const FRONT_AXLE = -1.49;
const REAR_AXLE = 1.49;
/** Roof rack: the height of its top rails and its front and back ends. */
const RACK = { y: 1.66, front: -0.72, back: 2.42 };

/**
 * A side panel from `start` to `end`, up to `top`, with a round wheel opening cut around
 * `axle`: a skin with a return edge, so the well can be looked into, a body-colour lip
 * round the opening and a dark inner well.
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
    inner = side * (SIDE - 0.045);
  const steps = 32;
  const low = (z: number) =>
    Math.max(SILL, Math.sqrt(Math.max(0, ARCH.radius ** 2 - (z - axle) ** 2)) + ARCH.cy);
  b.slot = M.Paint;
  b.tag = zone;
  for (let i = 0; i < steps; i++) {
    const za = start + ((end - start) * i) / steps,
      zb = start + ((end - start) * (i + 1)) / steps;
    const a = { x: outer, y: low(za), z: za },
      bb = { x: outer, y: low(zb), z: zb },
      c = { x: outer, y: top, z: zb },
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
  }
  // A black flare round the opening, as the 75 Series wore.
  b.slot = M.Rubber;
  b.tag = zone;
  b.push()
    .translate(side * (SIDE + 0.012), ARCH.cy, axle)
    .rotate(0, Math.PI / 2, 0)
    .scale(1, 1, 0.5);
  b.geometry(new THREE.TorusGeometry(ARCH.radius + 0.02, 0.032, 5, 36, Math.PI), bumper);
  b.pop();
  b.block(side * wellX, ARCH.cy + 0.24, axle, 0.03, 0.6, ARCH.radius * 2, black, M.Rubber, Z.Trim);
  // The well's roof stops at the inner skin, so it never shows through the outer one.
  b.block(
    (side * (wellX + SIDE - 0.05)) / 2,
    ARCH.cy + ARCH.radius + 0.012,
    axle,
    SIDE - 0.05 - wellX,
    0.03,
    ARCH.radius * 1.6,
    black,
    M.Rubber,
    Z.Trim,
  );
}

/** Stroke characters for the number plates, in a unit box (x right, y up). */
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
  '7': [
    [0, 1, 1, 1],
    [1, 1, 0.3, 0],
  ],
  '5': [
    [1, 1, 0, 1],
    [0, 1, 0, 0.5],
    [0, 0.5, 1, 0.5],
    [1, 0.5, 1, 0],
    [1, 0, 0, 0],
  ],
  '-': [[0.15, 0.5, 0.85, 0.5]],
};

/** White plate with blue "HZJ-75" (the plate faces -z before `facing` turns it). */
function plate(b: VehicleBuilder, x: number, y: number, z: number, facing: 1 | -1): void {
  b.push()
    .translate(x, y, z)
    .rotate(0, facing > 0 ? Math.PI : 0, 0);
  b.block(0, 0, 0, 0.36, 0.12, 0.012, plateWhite, M.Lamp, Z.Trim, 0.006);
  const text = 'HZJ-75';
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
  const F = FRONT_FACE;
  // Square bonnet with a raised centre, between flat-topped wings, and the cowl vent.
  b.block(0, BONNET, -1.6, 1.36, 0.04, 1.2, paint, M.Paint, Z.Front, 0.018);
  b.block(0, BONNET + 0.025, -1.6, 0.8, 0.02, 1.14, paint, M.Paint, Z.Front, 0.01);
  b.block(0, BONNET - 0.03, F + 0.03, 1.38, 0.06, 0.06, paint, M.Paint, Z.Front, 0.012);
  b.block(0, COWL.y - 0.01, COWL.z - 0.03, 1.6, 0.03, 0.1, paint, M.Paint, Z.Front, 0.01);
  for (let i = 0; i < 10; i++)
    b.block(-0.45 + i * 0.1, COWL.y + 0.006, COWL.z - 0.03, 0.06, 0.006, 0.06, black, M.Rubber, Z.Front);
  for (const side of [-1, 1]) {
    // Wing tops, a little below the bonnet, and the wing sides with their wheel openings.
    b.block(side * 0.77, BONNET - 0.02, -1.58, 0.15, 0.03, 1.24, paint, M.Paint, Z.Front, 0.012);
    archPanel(b, side, F + 0.02, DOOR.front - 0.01, FRONT_AXLE, BONNET - 0.02, Z.Front, 0.5);
    // Round headlamp in a square bezel at each end of the grille.
    const hx = side * 0.63;
    b.block(hx, 0.56, F + 0.005, 0.27, 0.25, 0.03, bumper, M.Rubber, Z.Front, 0.012);
    b.slot = M.Rubber;
    b.tag = Z.Front;
    b.push()
      .translate(hx, 0.56, F - 0.012)
      .rotate(Math.PI / 2, 0, 0);
    b.geometry(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 28), black);
    b.pop();
    b.ring(hx, 0.56, F - 0.02, 0.092, 0.009, chrome, M.Metal, 'z', Z.Front);
    b.slot = M.Headlamp;
    b.push()
      .translate(hx, 0.56, F - 0.02)
      .scale(1, 1, 0.3);
    b.geometry(new THREE.SphereGeometry(0.088, 24, 12), lens);
    b.pop();
    // Indicator and park lamp wrapped round the front corner of the wing.
    b.block(side * 0.79, 0.4, F + 0.01, 0.1, 0.07, 0.04, amber, M.Amber, Z.Front, 0.01);
    b.block(side * (SIDE + 0.002), 0.4, F + 0.08, 0.012, 0.06, 0.1, amber, M.Amber, Z.Front, 0.006);
    // Side indicator on the wing ahead of the door.
    b.block(
      side * (SIDE + 0.006),
      0.6,
      DOOR.front - 0.12,
      0.012,
      0.035,
      0.08,
      amber,
      M.Amber,
      Z.Front,
      0.006,
    );
  }
  // Grille between the headlamps: a dark surround and five horizontal slats.
  b.block(0, 0.56, F + 0.02, 0.98, 0.3, 0.03, black, M.Rubber, Z.Front, 0.01);
  for (let i = 0; i < 5; i++)
    b.block(0, 0.45 + i * 0.054, F - 0.005, 0.92, 0.022, 0.02, paint, M.Paint, Z.Front, 0.004);
  // Valance under the grille and lamps, the black steel bumper and its brackets.
  b.block(0, 0.33, F + 0.04, 1.66, 0.16, 0.05, paint, M.Paint, Z.Front, 0.01);
  b.block(0, 0.18, F - 0.04, 1.72, 0.16, 0.1, bumper, M.Metal, Z.Front, 0.02);
  for (const x of [-0.43, 0.43]) b.block(x, 0.1, F + 0.06, 0.07, 0.07, 0.16, black, M.Metal, Z.Trim);
  // Sump, steering box and front crossmember.
  b.block(0, -0.04, -1.75, 0.44, 0.16, 0.5, black, M.Metal, Z.Trim, 0.02);
  b.block(0.38, 0.02, -2.0, 0.14, 0.16, 0.16, black, M.Metal, Z.Trim, 0.02);
  // The air cleaner's intake behind the left headlamp, under the wing.
  b.rod({ x: -0.62, y: 0.47, z: -1.92 }, { x: -0.62, y: 0.47, z: -1.62 }, 0.05, black, M.Rubber, Z.Trim);
}

function windscreen(b: VehicleBuilder): void {
  const dy = SCREEN_TOP.y - COWL.y,
    dz = SCREEN_TOP.z - COWL.z;
  const lean = Math.atan2(dz, dy),
    L = Math.hypot(dy, dz);
  b.push().translate(0, COWL.y, COWL.z).rotate(lean, 0, 0);
  b.block(0, L / 2, 0, 1.46, L - 0.05, 0.008, glass, M.Glass, Z.Glass);
  for (const y of [0.015, L - 0.015]) b.block(0, y, 0.002, 1.5, 0.026, 0.02, rubber, M.Rubber, Z.Front);
  for (const x of [-0.74, 0.74]) b.block(x, L / 2, 0.002, 0.026, L, 0.02, rubber, M.Rubber, Z.Front);
  for (const x of [-0.79, 0.79])
    b.block(x, L / 2, 0.01, 0.08, L + 0.02, 0.05, paint, M.Paint, Z.Front, 0.012);
  // Wipers parked along the bottom of the screen.
  for (const x of [0.55, -0.1]) {
    b.rod({ x, y: 0.05, z: -0.02 }, { x: x - 0.46, y: 0.08, z: -0.02 }, 0.006, black, M.Rubber, Z.Front);
    b.rod({ x, y: 0.055, z: -0.026 }, { x: x - 0.42, y: 0.085, z: -0.026 }, 0.004, black, M.Rubber, Z.Front);
  }
  // Rear-view mirror inside the top of the screen.
  b.block(0, L - 0.1, 0.05, 0.22, 0.065, 0.02, black, M.Rubber, Z.Trim, 0.01);
  b.pop();
}

/** A pane of side glass between `z0` and `z1`, in a black rubber surround. */
function sideWindow(b: VehicleBuilder, side: number, z0: number, z1: number, y0: number, y1: number): void {
  const x = side * (SIDE - 0.012);
  b.block(x, (y0 + y1) / 2, (z0 + z1) / 2, 0.008, y1 - y0, z1 - z0, glass, M.Glass, Z.Glass);
  for (const y of [y0, y1])
    b.block(side * SIDE, y, (z0 + z1) / 2, 0.012, 0.022, z1 - z0 + 0.02, rubber, M.Rubber, Z.Sides);
  for (const z of [z0, z1])
    b.block(side * SIDE, (y0 + y1) / 2, z, 0.012, y1 - y0, 0.022, rubber, M.Rubber, Z.Sides);
}

function cabAndBody(b: VehicleBuilder): void {
  // The roof from the screen to the back, with drip rails along it.
  b.block(
    0,
    ROOF - 0.025,
    (SCREEN_TOP.z + TAIL) / 2,
    1.66,
    0.05,
    TAIL - SCREEN_TOP.z,
    paint,
    M.Paint,
    Z.Roof,
    0.02,
  );
  for (let i = 0; i < 6; i++)
    b.block(
      0,
      ROOF + 0.004,
      -0.4 + i * 0.5,
      1.5,
      0.012,
      0.06,
      paint.clone().multiplyScalar(0.94),
      M.Paint,
      Z.Roof,
      0.005,
    );
  const pillarZ = (y: number) => COWL.z + ((y - COWL.y) * (SCREEN_TOP.z - COWL.z)) / (SCREEN_TOP.y - COWL.y);
  const winTop = ROOF - 0.08,
    winLow = WAIST + 0.04;
  for (const side of [-1, 1]) {
    const x = side * (SIDE - 0.015);
    b.rod(
      { x: side * (SIDE - 0.01), y: ROOF - 0.04, z: SCREEN_TOP.z + 0.02 },
      { x: side * (SIDE - 0.01), y: ROOF - 0.04, z: TAIL - 0.02 },
      0.009,
      paint,
      M.Paint,
      Z.Roof,
    );
    // Front door below the waist, its seams, handle and lock; the door glass above it.
    b.block(
      x,
      (SILL + WAIST) / 2,
      (DOOR.front + DOOR.back) / 2,
      0.03,
      WAIST - SILL,
      DOOR.back - DOOR.front,
      paint,
      M.Paint,
      Z.Sides,
      0.01,
    );
    for (const z of [DOOR.front - 0.006, DOOR.back + 0.006])
      b.block(
        side * (SIDE + 0.002),
        (SILL + ROOF) / 2 - 0.04,
        z,
        0.006,
        ROOF - SILL - 0.1,
        0.007,
        black,
        M.Rubber,
        Z.Sides,
      );
    b.block(
      side * (SIDE + 0.012),
      WAIST - 0.1,
      DOOR.back - 0.16,
      0.02,
      0.035,
      0.15,
      black,
      M.Rubber,
      Z.Sides,
      0.01,
    );
    b.slot = M.Metal;
    b.tag = Z.Sides;
    b.push()
      .translate(side * (SIDE + 0.006), WAIST - 0.1, DOOR.back - 0.05)
      .rotate(0, 0, Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12), chrome);
    b.pop();
    b.slot = M.Glass;
    b.tag = Z.Glass;
    const gx = side * (SIDE - 0.02);
    const g0 = { x: gx, y: winLow, z: pillarZ(winLow) + 0.05 },
      g1 = { x: gx, y: winLow, z: DOOR.back - 0.04 },
      g2 = { x: gx, y: winTop, z: DOOR.back - 0.04 },
      g3 = { x: gx, y: winTop, z: pillarZ(winTop) + 0.05 };
    if (side > 0) b.quad(g0, g1, g2, g3, glass);
    else b.quad(g3, g2, g1, g0, glass);
    // Door frame: the top rail and the back post of the window.
    b.rod(
      { x: side * (SIDE - 0.01), y: winTop + 0.02, z: pillarZ(winTop) + 0.04 },
      { x: side * (SIDE - 0.01), y: winTop + 0.02, z: DOOR.back - 0.02 },
      0.02,
      paint,
      M.Paint,
      Z.Sides,
    );
    b.block(
      side * (SIDE - 0.015),
      (WAIST + ROOF) / 2,
      DOOR.back - 0.025,
      0.03,
      ROOF - WAIST,
      0.05,
      paint,
      M.Paint,
      Z.Sides,
    );
    // Black door mirror on an arm from the front corner of the door.
    b.rod(
      { x: side * SIDE, y: WAIST + 0.04, z: DOOR.front + 0.12 },
      { x: side * 1.0, y: WAIST + 0.18, z: DOOR.front + 0.1 },
      0.01,
      black,
      M.Metal,
      Z.Sides,
    );
    b.block(side * 1.02, WAIST + 0.24, DOOR.front + 0.1, 0.14, 0.2, 0.04, black, M.Rubber, Z.Trim, 0.015);
    b.block(
      side * 1.02,
      WAIST + 0.24,
      DOOR.front + 0.122,
      0.12,
      0.18,
      0.004,
      glass.clone().multiplyScalar(1.15),
      M.Glass,
      Z.Trim,
    );

    // The rear body: lower panel with the rear wheel opening, then glass and pillars.
    archPanel(b, side, DOOR.back + 0.01, TAIL - 0.02, REAR_AXLE, WAIST, Z.Sides, 0.52);
    const slideEnd = 1.16,
      fixedStart = 1.32,
      fixedEnd = 2.3;
    sideWindow(b, side, DOOR.back + 0.1, slideEnd, winLow, winTop);
    sideWindow(b, side, fixedStart, fixedEnd, winLow, winTop);
    // The sliding pane's centre rail.
    b.block(
      side * (SIDE - 0.004),
      (winLow + winTop) / 2,
      (DOOR.back + 0.1 + slideEnd) / 2,
      0.01,
      winTop - winLow,
      0.024,
      rubber,
      M.Rubber,
      Z.Sides,
    );
    for (const [z0, z1] of [
      [DOOR.back + 0.02, DOOR.back + 0.1],
      [slideEnd, fixedStart],
      [fixedEnd, TAIL - 0.01],
    ])
      b.block(x, (WAIST + ROOF) / 2, (z0 + z1) / 2, 0.03, ROOF - WAIST, z1 - z0, paint, M.Paint, Z.Sides);
    b.block(
      x,
      (winTop + ROOF) / 2,
      (DOOR.back + TAIL) / 2,
      0.03,
      ROOF - winTop,
      TAIL - DOOR.back,
      paint,
      M.Paint,
      Z.Sides,
    );
    b.block(
      x,
      (WAIST + winLow) / 2,
      (DOOR.back + TAIL) / 2,
      0.03,
      winLow - WAIST,
      TAIL - DOOR.back,
      paint,
      M.Paint,
      Z.Sides,
    );
    // A pressed swage line along the side at the waist.
    b.block(
      side * (SIDE + 0.004),
      WAIST - 0.03,
      (DOOR.front + TAIL) / 2,
      0.008,
      0.014,
      TAIL - DOOR.front - 0.06,
      paint.clone().multiplyScalar(0.85),
      M.Paint,
      Z.Sides,
    );
    // Black rubbing strip low on the sides.
    b.block(
      side * (SIDE + 0.008),
      0.3,
      (DOOR.front + TAIL) / 2 + 0.2,
      0.012,
      0.04,
      1.0,
      black,
      M.Rubber,
      Z.Sides,
    );
  }
  // Fuel fillers: the main tank's on the left behind the rear wheel, the sub-tank's on the right.
  for (const side of [-1, 1]) {
    b.slot = M.Metal;
    b.tag = Z.Sides;
    b.push()
      .translate(side * (SIDE + 0.006), 0.6, 2.18)
      .rotate(0, 0, Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.06, 0.06, 0.014, 18), paint.clone().multiplyScalar(0.92));
    b.pop();
  }
}

function rearEnd(b: VehicleBuilder, wheel: THREE.BufferGeometry): void {
  const T = TAIL;
  // Barn doors: the wide one on the left carries the spare, the narrow one on the right.
  const split = 0.18;
  const doors = [
    [-SIDE + 0.02, split - 0.006],
    [split + 0.006, SIDE - 0.02],
  ];
  for (const [x0, x1] of doors) {
    const cx = (x0 + x1) / 2,
      w = x1 - x0;
    b.block(cx, (SILL + ROOF - 0.05) / 2 + 0.02, T, w, ROOF - SILL - 0.1, 0.04, paint, M.Paint, Z.Rear, 0.01);
    b.block(cx, 1.17, T + 0.022, w - 0.16, 0.42, 0.008, glass, M.Glass, Z.Glass);
    b.block(cx, 1.17, T + 0.024, w - 0.13, 0.45, 0.004, rubber, M.Rubber, Z.Rear);
  }
  b.block(split, (SILL + ROOF) / 2, T + 0.024, 0.012, ROOF - SILL - 0.12, 0.008, black, M.Rubber, Z.Rear);
  // Handle on the narrow door, and the hinges on both outer edges.
  b.block(split + 0.08, 0.72, T + 0.03, 0.03, 0.12, 0.02, black, M.Rubber, Z.Rear, 0.008);
  for (const side of [-1, 1])
    for (const y of [0.3, 1.2])
      b.block(side * (SIDE - 0.03), y, T + 0.026, 0.05, 0.1, 0.03, black, M.Metal, Z.Rear, 0.006);
  // Tail lamps low in the rear corners.
  for (const side of [-1, 1]) {
    const lx = side * 0.76;
    b.block(lx, 0.32, T + 0.012, 0.13, 0.28, 0.02, black, M.Rubber, Z.Rear, 0.008);
    b.block(lx, 0.4, T + 0.024, 0.11, 0.1, 0.012, red, M.Red, Z.Rear, 0.006);
    b.block(lx, 0.3, T + 0.024, 0.11, 0.07, 0.012, amber, M.Amber, Z.Rear, 0.006);
    b.block(lx, 0.22, T + 0.024, 0.11, 0.06, 0.012, lens, M.Metal, Z.Rear, 0.006);
  }
  // The spare on the wide door, in a black cover, on a swing-down carrier.
  b.tag = Z.Rear;
  b.push()
    .translate(-0.35, 0.72, T + 0.17)
    .rotate(0, Math.PI / 2, 0);
  b.geometry(wheel.clone(), black);
  b.pop();
  b.slot = M.Fabric;
  b.push()
    .translate(-0.35, 0.72, T + 0.17)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.405, 0.405, 0.2, 32), black.clone().multiplyScalar(1.3));
  b.pop();
  for (const x of [-0.6, -0.1]) b.block(x, 0.72, T + 0.05, 0.05, 0.6, 0.06, black, M.Metal, Z.Rear);
  // Black rear bar with a tow hitch, its brackets and the rear plate.
  b.block(0, 0.08, T + 0.06, 1.68, 0.14, 0.12, bumper, M.Metal, Z.Rear, 0.02);
  b.block(0, 0.0, T + 0.16, 0.08, 0.06, 0.16, black, M.Metal, Z.Rear, 0.01);
  b.slot = M.Metal;
  b.push().translate(0, 0.05, T + 0.24);
  b.geometry(new THREE.SphereGeometry(0.03, 12, 8), steel);
  b.pop();
  for (const x of [-0.43, 0.43]) b.block(x, 0.04, T - 0.05, 0.06, 0.08, 0.16, black, M.Metal, Z.Trim);
  plate(b, 0.48, 0.5, T + 0.026, 1);
}

/** Pressed-steel jerry can lying on its side, with its handles and cap. */
function jerryCan(b: VehicleBuilder, x: number, y: number, z: number): void {
  const can = new THREE.Color('#5E6A43');
  b.block(x, y, z, 0.34, 0.17, 0.47, can, M.Paint, Z.Roof, 0.02);
  b.block(x - 0.08, y, z - 0.26, 0.12, 0.03, 0.05, can, M.Paint, Z.Roof, 0.01);
  b.block(x + 0.1, y, z - 0.25, 0.06, 0.06, 0.04, can, M.Paint, Z.Roof, 0.01);
  for (const dz of [-0.12, 0.12]) b.block(x, y + 0.09, z + dz, 0.38, 0.012, 0.035, black, M.Rubber, Z.Roof);
}

function roofRack(b: VehicleBuilder, wheel: THREE.BufferGeometry): void {
  const r = 0.02,
    x = 0.8;
  const { y, front, back } = RACK;
  // Side rails, a front bar and crossbars, on feet clamped to the gutters.
  for (const side of [-1, 1]) {
    b.rod({ x: side * x, y, z: front }, { x: side * x, y, z: back }, r, bar, M.Metal, Z.Roof);
    b.rod(
      { x: side * x, y: y - 0.06, z: front },
      { x: side * x, y: y - 0.06, z: back },
      0.014,
      bar,
      M.Metal,
      Z.Roof,
    );
    for (let i = 0; i <= 6; i++) {
      const z = front + ((back - front) * i) / 6;
      b.block(side * x, (ROOF + y) / 2 - 0.02, z, 0.05, y - ROOF - 0.02, 0.05, bar, M.Metal, Z.Roof);
    }
  }
  for (let i = 0; i <= 8; i++) {
    const z = front + ((back - front) * i) / 8;
    b.rod({ x: -x, y: y - 0.06, z }, { x, y: y - 0.06, z }, 0.014, bar, M.Metal, Z.Roof);
  }
  // A wind deflector across the front.
  b.block(0, y - 0.02, front - 0.04, 1.6, 0.1, 0.02, bar, M.Metal, Z.Roof, 0.006);
  // The second spare lying flat at the back, strapped down, and a jerry can ahead of it.
  b.tag = Z.Roof;
  b.push()
    .translate(0, y + 0.06, 1.98)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(wheel.clone(), black);
  b.pop();
  for (const dz of [-0.2, 0.2])
    b.block(0, y + 0.17, 1.98 + dz, 0.86, 0.008, 0.04, new THREE.Color('#C2862F'), M.Fabric, Z.Roof);
  jerryCan(b, 0, y + 0.04, -0.35);
}

function chassisAndRecovery(b: VehicleBuilder, tuning: VehicleTuning): void {
  // Ladder frame, crossmembers, gearbox and transfer case, propshafts, tanks and exhaust.
  for (const x of [-0.43, 0.43]) b.block(x, -0.02, 0.12, 0.09, 0.16, 4.72, black, M.Metal, Z.Trim);
  for (const z of [-2.05, -0.95, 0.5, 1.9, 2.45])
    b.block(0, -0.02, z, 0.86, 0.08, 0.08, black, M.Metal, Z.Trim);
  b.block(0.04, -0.04, -0.4, 0.4, 0.17, 0.7, black, M.Metal, Z.Trim, 0.03);
  const shaft = steel.clone().multiplyScalar(0.6);
  b.rod({ x: 0.1, y: -0.08, z: -0.7 }, { x: 0.08, y: -0.12, z: -1.36 }, 0.032, shaft);
  b.rod({ x: 0.0, y: -0.07, z: -0.05 }, { x: 0.05, y: -0.1, z: 1.38 }, 0.036, shaft);
  // The main tank behind the rear axle on the left, the sub-tank inside the right rail.
  b.block(-0.6, 0.08, 2.1, 0.3, 0.26, 0.6, black, M.Metal, Z.Trim, 0.03);
  b.block(0.62, 0.06, 0.62, 0.26, 0.24, 0.7, black, M.Metal, Z.Trim, 0.03);
  b.rod({ x: 0.28, y: -0.06, z: -1.4 }, { x: 0.28, y: -0.08, z: 0.4 }, 0.028, steel);
  b.slot = M.Metal;
  b.tag = Z.Trim;
  b.push()
    .translate(0.28, -0.07, 0.75)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 12), shaft);
  b.pop();
  b.rod({ x: 0.28, y: -0.08, z: 1.03 }, { x: 0.3, y: -0.04, z: 1.85 }, 0.026, steel);
  b.rod({ x: 0.3, y: -0.04, z: 1.85 }, { x: 0.62, y: -0.05, z: 2.55 }, 0.026, steel);

  // Black tubular bull bar ahead of the bumper, with lamp guards and braces to the chassis.
  const bz = -2.36;
  b.block(0, 0.12, bz, 1.66, 0.12, 0.06, bar, M.Metal, Z.Front, 0.012);
  for (const x of [-0.84, -0.44, -0.13, 0.13, 0.44, 0.84])
    b.rod({ x, y: 0.16, z: bz }, { x, y: 0.64, z: bz + 0.03 }, 0.026, bar, M.Metal, Z.Front);
  b.rod(
    { x: -0.86, y: 0.64, z: bz + 0.03 },
    { x: 0.86, y: 0.64, z: bz + 0.03 },
    0.028,
    bar,
    M.Metal,
    Z.Front,
  );
  for (const side of [-1, 1]) {
    for (const y of [0.44, 0.56])
      b.rod(
        { x: side * 0.44, y, z: bz + 0.015 },
        { x: side * 0.84, y, z: bz + 0.015 },
        0.016,
        bar,
        M.Metal,
        Z.Front,
      );
    b.rod(
      { x: side * 0.84, y: 0.64, z: bz + 0.03 },
      { x: side * 0.86, y: 0.42, z: FRONT_FACE + 0.08 },
      0.022,
      bar,
      M.Metal,
      Z.Front,
    );
    b.rod(
      { x: side * 0.43, y: 0.12, z: bz },
      { x: side * 0.43, y: 0.02, z: -2.05 },
      0.03,
      bar,
      M.Metal,
      Z.Trim,
    );
  }
  plate(b, -0.52, 0.12, bz - 0.035, -1);
  // Winch drum in its cradle behind the bar, its motor, and a roller fairlead.
  const mount = tuning.winchMount;
  const wz = bz + 0.07;
  b.rod({ x: -0.18, y: 0.2, z: wz }, { x: 0.18, y: 0.2, z: wz }, 0.065, black, M.Metal, Z.Front);
  for (let i = 0; i < 12; i++) b.ring(-0.15 + i * 0.027, 0.2, wz, 0.064, 0.005, steel, M.Metal, 'x', Z.Front);
  b.rod({ x: -0.36, y: 0.2, z: wz }, { x: -0.2, y: 0.2, z: wz }, 0.055, black, M.Metal, Z.Front);
  for (const x of [-0.2, 0.2]) b.block(x, 0.2, wz, 0.03, 0.17, 0.17, black, M.Rubber, Z.Front, 0.012);
  for (const y of [mount.y - 0.035, mount.y + 0.035])
    b.rod(
      { x: -0.12, y, z: mount.z + 0.02 },
      { x: 0.12, y, z: mount.z + 0.02 },
      0.014,
      steel,
      M.Metal,
      Z.Front,
    );
  for (const x of [-0.13, 0.13])
    b.rod(
      { x, y: mount.y - 0.04, z: mount.z + 0.02 },
      { x, y: mount.y + 0.04, z: mount.z + 0.02 },
      0.014,
      steel,
      M.Metal,
      Z.Front,
    );
  // Whip aerial on the right front wing.
  b.block(0.76, BONNET, -1.08, 0.05, 0.04, 0.05, black, M.Rubber, Z.Front);
  b.rod(
    { x: 0.76, y: BONNET + 0.02, z: -1.08 },
    { x: 0.78, y: BONNET + 1.0, z: -1.04 },
    0.004,
    black,
    M.Rubber,
    Z.Roof,
  );
}

export function buildTroopyBody(tuning: VehicleTuning, wheel: THREE.BufferGeometry): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  frontEnd(b);
  windscreen(b);
  cabAndBody(b);
  rearEnd(b, wheel);
  roofRack(b, wheel);
  chassisAndRecovery(b, tuning);
  addTroopyInterior(b, tuning.engine.redlineRpm);
  return b.build();
}

/** A 7.50R16 light-truck tyre with a chunky all-terrain tread, on a grey steel wheel. */
export function buildTroopyWheel(tuning: VehicleTuning): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const r = tuning.wheelRadius,
    w = tuning.wheelWidth;
  const tyre = new THREE.Color('#232624');
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
        .translate(side * w * 0.25, Math.cos(angle) * r * 0.965, Math.sin(angle) * r * 0.965)
        .rotate(angle, side * 0.15, 0);
      b.box(w * 0.44, 0.036, 0.058, tyre);
      b.pop();
    }
  }
  for (const side of [-1, 1]) {
    b.ring(side * w * 0.5, 0, 0, r * 0.74, 0.004, tyre.clone().multiplyScalar(1.4), M.Rubber, 'x');
    // Rim flange, the dished centre with round vents, the hub and six wheel nuts.
    b.ring(side * (w * 0.5 - 0.005), 0, 0, rimR, 0.013, rim, M.Paint, 'x');
    b.slot = M.Paint;
    b.push()
      .translate(side * (w * 0.5 - 0.03), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(rimR - 0.01, rimR - 0.01, 0.02, 40),
      rim.clone().multiplyScalar(0.88),
    );
    b.pop();
    b.push()
      .translate(side * (w * 0.5 - 0.012), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.12, 0.135, 0.03, 32), rim);
    b.pop();
    for (let i = 0; i < 6; i++) {
      const a = ((i + 0.5) / 6) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(side * (w * 0.5 - 0.016), Math.cos(a) * 0.168, Math.sin(a) * 0.168)
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 14), black);
      b.pop();
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.slot = M.Metal;
      b.push()
        .translate(side * (w * 0.5 + 0.008), Math.cos(a) * 0.0698, Math.sin(a) * 0.0698)
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.0125, 0.015, 0.02, 6), steel);
      b.pop();
    }
    // Free-wheeling hub cap in the middle.
    b.slot = M.Metal;
    b.push()
      .translate(side * (w * 0.5 + 0.022), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.05, 0.058, 0.05, 20), steel.clone().multiplyScalar(0.9));
    b.pop();
  }
  return b.build();
}

/** A recovery board strapped along the roof rack (index 0 on the left). */
export function buildTroopyPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const wood = new THREE.Color('#A9824F');
  const x = index === 0 ? -0.6 : 0.6,
    y = RACK.y + 0.045,
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
  for (const dz of [-0.85, 0.85]) {
    b.block(x, y + 0.03, z + dz, W + 0.01, 0.012, 0.045, black, M.Rubber, Z.Roof);
    for (const s of [-1, 1])
      b.block(x + (s * (W + 0.02)) / 2, y - 0.015, z + dz, 0.012, 0.075, 0.045, black, M.Rubber, Z.Roof);
  }
  return b.build();
}
