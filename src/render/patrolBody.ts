import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import type { VehicleTuning } from '../data/vehicle';
import { plankTuning } from '../data/tools';
import { BodyZone as Z, VehicleBuilder, VehicleMaterial as M } from './vehicleGeometry';
import { addPatrolInterior } from './patrolInterior';
import { patrolColors } from './patrolPaint';
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
} from './bodyShapes';
import { mirrorHead } from './mirrors';

/**
 * GQ Patrol wagon body: a front clip with rounded shoulders and front corners and a bonnet
 * sloping gently to the nose, square GQ wheel openings under flat-topped flares, panels
 * with rounded edges, a glasshouse with its pillars and window rubbers, door mirrors on
 * black sails, and a wide ARB-style bar with driving lamps under its top rail (x across,
 * y up, z back; the ground 0.51 m below the origin when parked).
 * Photographs and dimensions: reference/vehicles/nissan-gq-patrol/SOURCES.md.
 */
const { paint, lower, flare, bar, trim } = patrolColors;
const black = new THREE.Color('#1B1E1F'),
  rubber = new THREE.Color('#202325'),
  steel = new THREE.Color('#A2A6A6'),
  chrome = new THREE.Color('#C9CDCD'),
  well = new THREE.Color('#25282A');
const red = new THREE.Color('#B12F27'),
  amber = new THREE.Color('#E59A33'),
  lens = new THREE.Color('#E6E6D8');
const glass = new THREE.Color('#9FB6B7');

const SIDE = 0.87;
const WAIST = 0.76;
const SILL = 0.02;
const TWO_TONE = 0.3;
const AXLE = 1.485;
/** Square wheel openings: half-widths at the sill and at the flat top, and the top height. */
const ARCH = { bottom: 0.56, top: 0.38, y: 0.41 };
const F = -2.27;
const BONNET_FRONT = 0.675;
const BONNET_BACK = 0.72;
const SCUTTLE = -0.8;
const SCREEN_BASE = 0.775;
const SCREEN_TOP = { y: 1.24, z: -0.5 };
const B_PILLAR = 0.3;
const C_PILLAR = 1.08;
const TAIL = 2.45;
const ROOF = 1.29;
const TUMBLE = 0.05;
const DOOR_SPLIT = 0.16;
/** The front clip: where it meets the front doors, its top there, and the radius its
 * shoulders and front corners are rounded to (across the car, and `ratio` of it along). */
const CLIP = { back: SCUTTLE, backTop: 0.745, round: 0.11, ratio: 0.6 };

/** Half-width of a wheel opening at height y. */
function archHalf(y: number): number {
  const t = (y - SILL) / (ARCH.y - SILL);
  return ARCH.bottom + (ARCH.top - ARCH.bottom) * t;
}

/** The opening's outline from height y on its back side, over the top and down to y on its front side. */
function archPath(axle: number, y: number, grow = 0, r = 0.1): Vtx[] {
  const w = archHalf(y) + grow;
  return [
    [axle + w, y],
    [axle + ARCH.top + grow, ARCH.y + grow, r + grow],
    [axle - ARCH.top - grow, ARCH.y + grow, r + grow],
    [axle - w, y],
  ];
}

const v = (x: number, y: number, z: number) => ({ x, y, z });

function lowerBody(b: VehicleBuilder): void {
  const wells: [number, number][] = [
    [-AXLE, -0.05],
    [AXLE, -0.05],
  ];
  const t = TWO_TONE;
  // White upper body from the front doors to the tail, with the top of the rear opening cut in.
  const upper = sideShape([
    [CLIP.back + 0.005, t],
    [CLIP.back + 0.005, CLIP.backTop - 0.01],
    [SCUTTLE + 0.02, WAIST, 0.05],
    [TAIL, WAIST, 0.03],
    [TAIL, t],
    ...archPath(AXLE, t),
  ]);
  // Charcoal lower body below the two-tone line, between and behind the openings.
  const lowerParts: Vtx[][] = [
    [
      [-AXLE + archHalf(SILL), SILL],
      [-AXLE + archHalf(t), t],
      [AXLE - archHalf(t), t],
      [AXLE - archHalf(SILL), SILL],
    ],
    [
      [AXLE + archHalf(SILL), SILL],
      [AXLE + archHalf(t), t],
      [TAIL, t],
      [TAIL, SILL + 0.03, 0.03],
      [TAIL - 0.03, SILL],
    ],
  ];
  for (const side of [-1, 1]) {
    const x0 = side > 0 ? SIDE - 0.05 : -SIDE,
      x1 = x0 + 0.05;
    extrudeX(b, upper, x0, x1, paint, M.Paint, Z.Sides, 0.018, wells);
    for (const p of lowerParts) extrudeX(b, sideShape(p), x0, x1, lower, M.Paint, Z.Sides, 0.018, wells);
    // Flat-topped flares round the openings, standing out from the body.
    for (const axle of [-AXLE, AXLE]) {
      const foot = SILL - 0.03;
      const shape = sideShape([
        ...archPath(axle, foot, 0.09, 0.08).reverse(),
        ...archPath(axle, foot, 0, 0.08),
      ]);
      // archPath runs back-to-front; the reversed outer run and the inner run close the band.
      extrudeX(
        b,
        shape,
        side > 0 ? SIDE - 0.03 : -SIDE - 0.065,
        side > 0 ? SIDE + 0.065 : -SIDE + 0.03,
        flare,
        M.Rubber,
        axle < 0 ? Z.Front : Z.Rear,
        0.025,
      );
      // Dark wheelhouse: an inner wall and a roof over the tyre.
      const wellX = axle < 0 ? 0.42 : 0.6;
      b.block(side * wellX, 0.17, axle, 0.03, 0.5, ARCH.bottom * 2, well, M.Rubber, Z.Trim);
      b.block(
        (side * (wellX + SIDE - 0.05)) / 2,
        ARCH.y + 0.01,
        axle,
        SIDE - 0.05 - wellX,
        0.02,
        ARCH.top * 2 + 0.1,
        well,
        M.Rubber,
        Z.Trim,
      );
      for (const dz of [-1, 1])
        b.block(
          (side * (wellX + SIDE - 0.05)) / 2,
          0.2,
          axle + dz * (archHalf(0.2) + 0.01),
          SIDE - 0.05 - wellX,
          0.4,
          0.02,
          well,
          M.Rubber,
          Z.Trim,
        );
    }
  }
}

function bonnetAndFace(b: VehicleBuilder): void {
  // The front clip in two pieces split at the two-tone line: white above, with the bonnet
  // and guard tops sloping down to the nose, charcoal below; both with the front wheel
  // opening cut in and their shoulders and front corners well rounded.
  const t = TWO_TONE,
    R = CLIP.round;
  const clip = (shape: Vtx[], color: THREE.Color) =>
    extrudeX(b, sideShape(shape), -SIDE, SIDE, color, M.Paint, Z.Front, R, [[-AXLE, -0.05]], 6, CLIP.ratio);
  clip(
    [
      [F, t],
      [F, BONNET_FRONT, 0.045],
      [SCUTTLE - 0.12, BONNET_BACK],
      [CLIP.back, CLIP.backTop, 0.02],
      [CLIP.back, t],
      ...archPath(-AXLE, t),
    ],
    paint,
  );
  clip(
    [
      [F, SILL + 0.04, 0.04],
      [F, t],
      [-AXLE - archHalf(t), t],
      [-AXLE - archHalf(SILL), SILL],
      [F + 0.1, SILL],
    ],
    lower,
  );
  const top = (z: number) => BONNET_FRONT + ((z - F) / (SCUTTLE - 0.12 - F)) * (BONNET_BACK - BONNET_FRONT);
  extrudeX(
    b,
    sideShape([
      [F + 0.16, top(F + 0.16) - 0.01],
      [F + 0.16, top(F + 0.16) + 0.014, 0.012],
      [SCUTTLE - 0.2, top(SCUTTLE - 0.2) + 0.014, 0.012],
      [SCUTTLE - 0.2, top(SCUTTLE - 0.2) - 0.01],
    ]),
    -0.4,
    0.4,
    paint,
    M.Paint,
    Z.Front,
    0.012,
  );
  // Shut lines between the bonnet and the guard tops.
  for (const side of [-1, 1])
    b.rod(
      v(side * 0.74, top(F + 0.06) + 0.002, F + 0.06),
      v(side * 0.74, top(SCUTTLE - 0.13) + 0.002, SCUTTLE - 0.13),
      0.004,
      black,
      M.Rubber,
      Z.Front,
    );
  // Cowl panel under the windscreen with its vent slots.
  b.block(0, 0.715, SCUTTLE - 0.06, 1.72, 0.12, 0.14, paint, M.Paint, Z.Front, 0.02);
  for (let i = 0; i < 14; i++)
    b.block(-0.52 + i * 0.08, 0.777, SCUTTLE - 0.07, 0.05, 0.004, 0.06, black, M.Rubber, Z.Front);

  // Front panel (Series 1): one black grille panel across the front with horizontal slats,
  // a round 7 inch headlamp in a square surround at each end, and the park lamp and
  // indicator wrapped round each guard corner outboard of the headlamps.
  const gy = 0.48;
  b.block(0, gy, F - 0.002, 1.56, 0.235, 0.02, black, M.Rubber, Z.Front, 0.014);
  for (let i = 0; i < 5; i++)
    b.block(
      0,
      gy - 0.084 + i * 0.042,
      F - 0.016,
      0.96,
      0.02,
      0.014,
      trim.clone().multiplyScalar(1.35),
      M.Rubber,
      Z.Front,
      0.005,
    );
  for (const x of [-0.5, 0.5])
    b.block(x, gy, F - 0.016, 0.024, 0.2, 0.014, trim.clone().multiplyScalar(1.35), M.Rubber, Z.Front, 0.005);
  b.block(0, gy, F - 0.03, 0.17, 0.05, 0.012, chrome, M.Metal, Z.Front, 0.014);
  b.block(0, gy, F - 0.036, 0.14, 0.026, 0.006, black, M.Rubber, Z.Front, 0.006);
  for (const side of [-1, 1]) {
    const x = side * 0.645;
    // Square surround round the lamp, then the lamp itself.
    b.block(x, gy, F - 0.012, 0.25, 0.225, 0.012, black.clone().multiplyScalar(0.8), M.Rubber, Z.Front, 0.02);
    roundHeadlamp(b, x, gy, F - 0.018, 0.089, lens, chrome, black);
    // Corner lamp wrapped round the guard corner: clear park lamp on top, amber indicator
    // below, in a black housing.
    const cx = side * (SIDE - R),
      cz = F + CLIP.ratio * R,
      rz = CLIP.ratio * R;
    cornerWrap(b, side, cx, cz, R + 0.003, rz + 0.003, gy, 0.225, black, M.Rubber, Z.Front);
    cornerWrap(b, side, cx, cz, R + 0.008, rz + 0.008, gy + 0.055, 0.09, lens, M.Lamp, Z.Front, 0.03, 0.97);
    cornerWrap(b, side, cx, cz, R + 0.008, rz + 0.008, gy - 0.05, 0.1, amber, M.Amber, Z.Front, 0.03, 0.97);
    // Side repeater on the guard behind the wheel.
    b.block(side * (SIDE + 0.004), 0.48, -0.88, 0.012, 0.03, 0.07, amber, M.Amber, Z.Front, 0.006);
  }
  // The steering damper and the sump guard.
  b.block(0, -0.12, -1.72, 0.7, 0.03, 0.6, bar, M.Metal, Z.Trim);
  b.rod({ x: -0.5, y: -0.08, z: -1.62 }, { x: 0.35, y: -0.06, z: -1.62 }, 0.022, black);
}

function tubePath(b: VehicleBuilder, pts: ReturnType<typeof v>[], r: number, color: THREE.Color): void {
  for (let i = 0; i + 1 < pts.length; i++) b.rod(pts[i], pts[i + 1], r, color, M.Metal, Z.Front);
  b.slot = M.Metal;
  b.tag = Z.Front;
  for (const p of pts.slice(1, -1)) {
    b.push().translate(p.x, p.y, p.z);
    b.geometry(new THREE.SphereGeometry(r, 12, 8), color);
    b.pop();
  }
}

/**
 * Wide steel bar: a deep pan with its wings swept back past the guard corners, a centre
 * hoop over the grille and loops over the headlamps, the winch fairlead in the pan, the
 * indicators in the wings and two driving lamps under its top rail.
 */
function bullBar(b: VehicleBuilder, tuning: VehicleTuning): void {
  const face = tuning.winchMount.z;
  const back = F - 0.03;
  const zc = (face + back) / 2,
    depth = back - face;
  const panY = 0.12,
    panH = 0.3;
  b.block(0, panY, zc, 1.3, panH, depth, bar, M.Metal, Z.Front, 0.025);
  for (const side of [-1, 1]) {
    b.push()
      .translate(side * 0.79, panY, zc + 0.05)
      .rotate(0, -side * 0.42, 0);
    b.block(0, 0, 0, 0.36, panH, depth, bar, M.Metal, Z.Front, 0.025);
    // Indicator in the wing face.
    b.block(0.0, 0.05, -depth / 2 - 0.004, 0.14, 0.06, 0.012, amber, M.Amber, Z.Front, 0.008);
    b.pop();
  }
  // Top of the pan: a flat ledge the hoops stand on.
  b.block(0, panY + panH / 2, zc + 0.01, 1.32, 0.03, depth + 0.03, bar, M.Metal, Z.Front, 0.012);
  for (const x of [-0.47, 0.47]) b.block(x, 0.1, back + 0.1, 0.08, 0.12, 0.24, bar, M.Metal, Z.Trim);
  const top = panY + panH / 2;
  const zt = F - 0.09;
  // Centre hoop over the grille, with a mid rail.
  for (const side of [-1, 1])
    tubePath(
      b,
      [v(side * 0.4, top, zc + 0.01), v(side * 0.4, 0.7, zt), v(side * 0.34, 0.76, zt)],
      0.032,
      bar,
    );
  b.rod(v(-0.34, 0.76, zt), v(0.34, 0.76, zt), 0.032, bar, M.Metal, Z.Front);
  b.rod(v(-0.4, 0.52, (zc + zt) / 2), v(0.4, 0.52, (zc + zt) / 2), 0.022, bar, M.Metal, Z.Front);
  // Loops: up from the wing ends, over the headlamps and back in to the hoop.
  for (const side of [-1, 1])
    tubePath(
      b,
      [
        v(side * 0.9, top, zc + 0.14),
        v(side * 0.9, 0.57, zt + 0.08),
        v(side * 0.84, 0.65, zt + 0.04),
        v(side * 0.4, 0.67, zt),
      ],
      0.028,
      bar,
    );
  for (const x of [-0.9, -0.4, 0.4, 0.9])
    b.block(x, top + 0.03, x * x > 0.5 ? zc + 0.12 : zc, 0.07, 0.04, 0.1, bar, M.Metal, Z.Front);
  // Winch drum behind the pan, between the hoop's legs.
  b.rod(v(-0.24, top + 0.06, back - 0.02), v(0.24, top + 0.06, back - 0.02), 0.07, trim);
  for (let i = 0; i < 15; i++)
    b.ring(-0.18 + i * 0.026, top + 0.06, back - 0.02, 0.07, 0.005, steel, M.Metal, 'x', Z.Front);
  // Fairlead, plate and shackles on the pan face.
  const m = tuning.winchMount;
  b.block(m.x, m.y, face - 0.005, 0.34, 0.12, 0.02, steel, M.Metal, Z.Front, 0.006);
  b.block(m.x, m.y, face - 0.012, 0.2, 0.05, 0.015, black, M.Rubber, Z.Front);
  for (const y of [m.y - 0.032, m.y + 0.032])
    b.rod(v(m.x - 0.1, y, face - 0.03), v(m.x + 0.1, y, face - 0.03), 0.015, steel, M.Metal, Z.Front);
  for (const x of [m.x - 0.11, m.x + 0.11])
    b.rod(v(x, m.y - 0.045, face - 0.03), v(x, m.y + 0.045, face - 0.03), 0.015, steel, M.Metal, Z.Front);
  b.block(0.44, 0.12, face - 0.012, 0.37, 0.12, 0.01, new THREE.Color('#F0EEE6'), M.Lamp, Z.Front, 0.006);
  b.block(0.44, 0.12, face - 0.018, 0.34, 0.012, 0.004, black, M.Rubber, Z.Front);
  for (const side of [-1, 1]) {
    const x = side * 0.62;
    b.block(x, -0.04, face + 0.02, 0.07, 0.08, 0.06, steel, M.Metal, Z.Trim);
    b.ring(x, -0.08, face - 0.01, 0.045, 0.011, red, M.Red, 'x', Z.Trim);
  }
  // Driving lamps hung from tabs under the top rail, inside the hoop (lit on high beam).
  for (const side of [-1, 1]) {
    const lx = side * 0.19,
      ly = 0.645,
      lz = zt - 0.01;
    b.block(lx, 0.745, zt, 0.04, 0.04, 0.05, black, M.Metal, Z.Front);
    b.slot = M.Metal;
    b.tag = Z.Front;
    b.push()
      .translate(lx, ly, lz)
      .rotate(Math.PI / 2, 0, 0);
    b.geometry(new THREE.CylinderGeometry(0.085, 0.07, 0.09, 24), black);
    b.pop();
    b.ring(lx, ly, lz - 0.045, 0.08, 0.009, chrome, M.Metal, 'z', Z.Front);
    b.slot = M.DrivingLamp;
    b.push()
      .translate(lx, ly, lz - 0.047)
      .scale(1, 1, 0.3);
    b.geometry(new THREE.SphereGeometry(0.074, 20, 10), lens);
    b.pop();
  }
}

function windscreen(b: VehicleBuilder): void {
  const lean = Math.atan2(SCREEN_TOP.z - SCUTTLE, SCREEN_TOP.y - SCREEN_BASE);
  const h = Math.hypot(SCREEN_TOP.z - SCUTTLE, SCREEN_TOP.y - SCREEN_BASE);
  const wb = SIDE - 0.01,
    wt = SIDE - TUMBLE - 0.025;
  const outer: Vtx[] = [
    [-wb, 0, 0.02],
    [wb, 0, 0.02],
    [wt, h, 0.05],
    [-wt, h, 0.05],
  ];
  const hole: Vtx[] = [
    [-wb + 0.075, 0.05, 0.05],
    [wb - 0.075, 0.05, 0.05],
    [wt - 0.07, h - 0.045, 0.06],
    [-wt + 0.07, h - 0.045, 0.06],
  ];
  b.push().translate(0, SCREEN_BASE, SCUTTLE).rotate(lean, 0, 0);
  const s = new THREE.Shape(rounded(outer));
  s.holes.push(new THREE.Path(rounded(hole)));
  extrudeZ(b, s, -0.02, 0.025, paint, M.Paint, Z.Front, 0.012);
  frontPane(b, hole, -0.004, -1, rubber, M.Rubber, Z.Glass, inset(hole, 0.022));
  frontPane(b, inset(hole, 0.02), -0.006, -1, glass, M.Glass, Z.Glass);
  // Wipers parked along the bottom of the glass.
  for (const x of [0.42, -0.24]) {
    b.rod({ x, y: 0.07, z: -0.03 }, { x: x - 0.46, y: 0.12, z: -0.03 }, 0.007, black, M.Rubber, Z.Front);
    b.rod({ x, y: 0.07, z: -0.036 }, { x: x - 0.42, y: 0.11, z: -0.036 }, 0.004, black, M.Rubber, Z.Front);
  }
  b.pop();
}

/** Side glasshouse: one panel from the A pillar to the tail with its three windows, leaning in. */
function glasshouse(b: VehicleBuilder, side: number): void {
  const h = ROOF - WAIST;
  const lean = Math.atan2(TUMBLE, h);
  const aSlope = (SCREEN_TOP.z - SCUTTLE) / h;
  const aAt = (y: number, inset: number) => SCUTTLE + inset + y * aSlope;
  const outline: Vtx[] = [
    [SCUTTLE, 0],
    [SCREEN_TOP.z, h, 0.05],
    [TAIL, h, 0.05],
    [TAIL, 0],
  ];
  const lo = 0.045,
    hi = h - 0.05;
  const windows: Vtx[][] = [
    [
      [aAt(lo, 0.09), lo, 0.03],
      [B_PILLAR - 0.045, lo, 0.03],
      [B_PILLAR - 0.045, hi, 0.03],
      [aAt(hi, 0.09), hi, 0.05],
    ],
    [
      [B_PILLAR + 0.055, lo, 0.03],
      [C_PILLAR - 0.045, lo, 0.03],
      [C_PILLAR - 0.045, hi, 0.03],
      [B_PILLAR + 0.055, hi, 0.03],
    ],
    [
      [C_PILLAR + 0.055, lo, 0.03],
      [TAIL - 0.13, lo, 0.04],
      [TAIL - 0.13, hi, 0.04],
      [C_PILLAR + 0.055, hi, 0.03],
    ],
  ];
  b.push()
    .translate(side * SIDE, WAIST - 0.005, 0)
    .rotate(0, 0, side * lean);
  const x0 = side > 0 ? -0.04 : 0;
  extrudeX(b, sideShape(outline, windows), x0, x0 + 0.04, paint, M.Paint, Z.Sides, 0.01);
  for (const w of windows) {
    sidePane(b, w, side, -side * 0.014, rubber, M.Rubber, Z.Glass, inset(w, 0.022));
    sidePane(b, inset(w, 0.018), side, -side * 0.012, glass, M.Glass, Z.Glass);
  }
  // Black mirror sail filling the front window's lower front corner.
  const sail: Vtx[] = [
    [aAt(0.02, 0.07), 0.02, 0.012],
    [aAt(0.02, 0.07) + 0.19, 0.02, 0.012],
    [aAt(0.2, 0.07), 0.2, 0.012],
  ];
  extrudeX(
    b,
    sideShape(sail),
    side > 0 ? -0.022 : -0.008,
    side > 0 ? 0.008 : 0.022,
    black,
    M.Rubber,
    Z.Sides,
    0.004,
  );
  // Shut lines down the B and C pillars.
  for (const z of [B_PILLAR + 0.005, C_PILLAR + 0.005])
    b.block(side * 0.001, h / 2, z, 0.004, h - 0.02, 0.006, black, M.Rubber, Z.Sides);
  b.pop();
  // Rain gutter along the roof edge.
  b.rod(
    v(side * (SIDE - TUMBLE + 0.002), ROOF - 0.02, SCREEN_TOP.z + 0.02),
    v(side * (SIDE - TUMBLE + 0.002), ROOF - 0.02, TAIL - 0.02),
    0.012,
    paint,
    M.Paint,
    Z.Roof,
  );
}

function sides(b: VehicleBuilder): void {
  for (const side of [-1, 1]) {
    const x = side * (SIDE + 0.002);
    // Door shut lines on the lower body: front door, rear door (stopping at the flare).
    for (const [z, y0] of [
      [SCUTTLE + 0.005, 0.03],
      [B_PILLAR + 0.005, 0.03],
      [C_PILLAR - 0.04, 0.53],
    ] as const)
      b.block(x, (y0 + WAIST) / 2, z, 0.006, WAIST - y0, 0.006, black, M.Rubber, Z.Sides);
    b.block(
      x,
      0.03,
      (SCUTTLE + C_PILLAR) / 2 - 0.1,
      0.006,
      0.006,
      C_PILLAR - SCUTTLE - 0.4,
      black,
      M.Rubber,
      Z.Sides,
    );
    // Body-side moulding on the two-tone line, between the flares.
    b.block(
      side * (SIDE + 0.012),
      TWO_TONE,
      0,
      0.024,
      0.05,
      2 * (AXLE - ARCH.bottom - 0.1),
      trim,
      M.Rubber,
      Z.Sides,
      0.01,
    );
    b.block(
      side * (SIDE + 0.012),
      TWO_TONE,
      (AXLE + ARCH.bottom + 0.1 + TAIL) / 2,
      0.024,
      0.05,
      TAIL - AXLE - ARCH.bottom - 0.12,
      trim,
      M.Rubber,
      Z.Sides,
      0.01,
    );
    // Pull handles near each door's back edge.
    for (const z of [B_PILLAR - 0.16, C_PILLAR - 0.2]) {
      b.block(side * (SIDE + 0.004), 0.64, z, 0.012, 0.05, 0.15, black, M.Rubber, Z.Sides, 0.008);
      b.block(side * (SIDE + 0.012), 0.64, z, 0.01, 0.022, 0.11, chrome, M.Metal, Z.Sides, 0.006);
    }
    // Rock sliders on the chassis.
    b.rod(v(side * 0.86, -0.04, -0.92), v(side * 0.86, -0.04, 0.92), 0.032, bar, M.Metal, Z.Sides);
    for (const z of [-0.7, 0, 0.7])
      b.rod(v(side * 0.86, -0.04, z), v(side * 0.5, 0.0, z), 0.022, bar, M.Metal, Z.Trim);
    // Door mirror: a short neck out of the sail, and a black head with the glass facing back.
    const mz = SCUTTLE + 0.2;
    b.block(side * (SIDE + 0.03), 0.885, mz - 0.015, 0.09, 0.06, 0.05, black, M.Rubber, Z.Sides, 0.015);
    mirrorHead(b, side, v(side * (SIDE + 0.15), 0.95, mz), 0.2, 0.15, 0.075, black);
    glasshouse(b, side);
  }
  // Fuel filler flap on the right rear quarter.
  b.block(SIDE + 0.004, 0.56, 2.05, 0.012, 0.15, 0.15, paint, M.Paint, Z.Rear, 0.02);
  b.block(SIDE + 0.002, 0.56, 2.05, 0.006, 0.16, 0.16, black, M.Rubber, Z.Rear, 0.02);
}

function roofAndRack(b: VehicleBuilder, tuning: VehicleTuning, wheel: THREE.BufferGeometry): void {
  const half = SIDE - TUMBLE;
  const front = SCREEN_TOP.z - 0.03,
    rear = TAIL;
  const s = new THREE.Shape(
    rounded([
      [-half, -front, 0.06],
      [half, -front, 0.06],
      [half, -rear, 0.04],
      [-half, -rear, 0.04],
    ]),
  );
  const raw = new THREE.ExtrudeGeometry(s, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.024,
    bevelOffset: -0.024,
    bevelSegments: 3,
    curveSegments: 8,
  });
  const g = toCreasedNormals(raw, Math.PI / 5);
  g.rotateX(-Math.PI / 2);
  b.slot = M.Paint;
  b.tag = Z.Roof;
  b.push().translate(0, ROOF - 0.05, 0);
  b.geometry(g, paint);
  b.pop();
  for (const x of [-0.5, -0.17, 0.17, 0.5])
    b.block(x, ROOF + 0.001, 1.0, 0.03, 0.008, 2.6, paint, M.Paint, Z.Roof, 0.004);
  // Steel tradesman rack: feet on the gutters, side rails, cross bars and a wind deflector.
  const y = ROOF + 0.11,
    z0 = -0.36,
    z1 = 2.3;
  for (const side of [-1, 1]) {
    b.block(side * 0.79, y, (z0 + z1) / 2, 0.04, 0.04, z1 - z0, bar, M.Metal, Z.Roof, 0.01);
    for (let z = z0 + 0.1; z <= z1 - 0.05; z += (z1 - z0 - 0.15) / 4) {
      b.rod(
        v(side * 0.79, y - 0.02, z),
        v(side * (half - 0.01), ROOF - 0.01, z),
        0.016,
        bar,
        M.Metal,
        Z.Roof,
      );
      b.block(side * (half - 0.01), ROOF - 0.015, z, 0.05, 0.03, 0.08, bar, M.Metal, Z.Roof, 0.008);
    }
  }
  for (let z = z0 + 0.05; z <= z1; z += 0.33)
    b.rod(v(-0.79, y, z), v(0.79, y, z), 0.014, bar, M.Metal, Z.Roof);
  b.push()
    .translate(0, y + 0.02, z0 - 0.02)
    .rotate(-0.6, 0, 0);
  b.block(0, 0, 0, 1.6, 0.012, 0.16, bar, M.Metal, Z.Roof);
  b.pop();
  // A rolled swag and a jerry can tied to the back of the rack.
  b.slot = M.Fabric;
  b.tag = Z.Roof;
  b.push()
    .translate(0, y + 0.12, 2.05)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16), new THREE.Color('#5E6B4A'));
  b.pop();
  for (const x of [-0.35, 0.35])
    b.block(x, y + 0.12, 2.05, 0.04, 0.245, 0.245, black, M.Rubber, Z.Roof, 0.02);
  b.block(0, y + 0.2, 1.3, 0.16, 0.36, 0.34, new THREE.Color('#2F5E37'), M.Paint, Z.Roof, 0.02);
  // The second spare lies flat at the front of the rack, between the boards, strapped down.
  const sy = y + 0.014 + tuning.wheelWidth * 0.53,
    sz = 0.32,
    strapY = sy + tuning.wheelWidth * 0.53 + 0.006;
  b.tag = Z.Roof;
  b.push()
    .translate(0, sy, sz)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(wheel.clone(), black);
  b.pop();
  b.block(0, strapY, sz, 0.8, 0.008, 0.05, black, M.Rubber, Z.Roof);
  for (const side of [-1, 1])
    b.rod(v(side * 0.4, strapY, sz), v(side * 0.43, y, sz), 0.012, black, M.Rubber, Z.Roof);
}

function snorkel(b: VehicleBuilder, tuning: VehicleTuning): void {
  const x = -(SIDE + 0.045);
  const black2 = new THREE.Color('#202325');
  // Out of the guard, up the A pillar to above the roof, and the ram head on top.
  b.block(x + 0.015, 0.5, -0.98, 0.09, 0.2, 0.16, black2, M.Rubber, Z.Front, 0.035);
  tubePath(
    b,
    [v(x, 0.5, -0.94), v(x, 0.72, -0.86), v(x + 0.01, 0.84, -0.8), v(x + 0.03, 1.38, -0.55)],
    0.055,
    black2,
  );
  for (const t of [0.3, 0.7]) {
    const y = 0.84 + (1.38 - 0.84) * t,
      z = -0.8 + 0.25 * t;
    b.rod(v(x + 0.03, y, z), v(-(SIDE - 0.04), y + 0.02, z + 0.04), 0.012, steel, M.Metal, Z.Front);
  }
  const head = tuning.intake;
  b.block(head.x, head.y, head.z + 0.02, 0.15, 0.13, 0.22, black2, M.Rubber, Z.Roof, 0.045);
  b.block(head.x, head.y, head.z - 0.095, 0.12, 0.1, 0.012, black, M.Rubber, Z.Roof, 0.02);
  for (let i = 0; i < 4; i++)
    b.block(head.x, head.y - 0.03 + i * 0.02, head.z - 0.103, 0.11, 0.005, 0.006, trim, M.Rubber, Z.Roof);
}

function rearEnd(b: VehicleBuilder, wheel: THREE.BufferGeometry): void {
  const z = TAIL;
  const topHalf = SIDE - TUMBLE;
  // The rear face as one panel with the two door windows, white over a charcoal band.
  const e = SIDE - 0.004;
  const outer: Vtx[] = [
    [-e, TWO_TONE],
    [e, TWO_TONE],
    [e, WAIST],
    [topHalf - 0.004, ROOF - 0.02, 0.04],
    [-topHalf + 0.004, ROOF - 0.02, 0.04],
    [-e, WAIST],
  ];
  const winLo = 0.87,
    winHi = 1.2;
  const halfAt = (y: number) => SIDE - (TUMBLE * Math.max(0, y - WAIST)) / (ROOF - WAIST);
  const windows: Vtx[][] = [
    [
      [-halfAt(winLo) + 0.075, winLo, 0.03],
      [DOOR_SPLIT - 0.07, winLo, 0.03],
      [DOOR_SPLIT - 0.07, winHi, 0.03],
      [-halfAt(winHi) + 0.075, winHi, 0.03],
    ],
    [
      [DOOR_SPLIT + 0.07, winLo, 0.03],
      [halfAt(winLo) - 0.075, winLo, 0.03],
      [halfAt(winHi) - 0.075, winHi, 0.03],
      [DOOR_SPLIT + 0.07, winHi, 0.03],
    ],
  ];
  const s = new THREE.Shape(rounded(outer));
  for (const w of windows) s.holes.push(new THREE.Path(rounded(w)));
  extrudeZ(b, s, z - 0.05, z, paint, M.Paint, Z.Rear, 0.016);
  const band = new THREE.Shape(
    rounded([
      [-e, SILL, 0.03],
      [e, SILL, 0.03],
      [e, TWO_TONE],
      [-e, TWO_TONE],
    ]),
  );
  extrudeZ(b, band, z - 0.05, z, lower, M.Paint, Z.Rear, 0.016);
  for (const w of windows) {
    frontPane(b, w, z - 0.014, 1, rubber, M.Rubber, Z.Glass, inset(w, 0.022));
    frontPane(b, inset(w, 0.018), z - 0.012, 1, glass, M.Glass, Z.Glass);
  }
  // Door split, hinges and handle.
  b.block(
    DOOR_SPLIT,
    (SILL + ROOF - 0.04) / 2,
    z + 0.002,
    0.008,
    ROOF - 0.08 - SILL,
    0.006,
    black,
    M.Rubber,
    Z.Rear,
  );
  b.block(0, ROOF - 0.07, z + 0.002, 2 * topHalf - 0.08, 0.006, 0.006, black, M.Rubber, Z.Rear);
  for (const side of [-1, 1])
    for (const y of [0.72, 1.06])
      b.block(side * (SIDE - 0.035), y, z + 0.02, 0.035, 0.1, 0.03, black, M.Metal, Z.Rear, 0.008);
  b.block(DOOR_SPLIT + 0.1, 0.66, z + 0.015, 0.1, 0.03, 0.02, chrome, M.Metal, Z.Rear, 0.006);
  // Tall tail lamps in the corners: stop and tail, indicator and reverse, wrapping onto the sides.
  for (const side of [-1, 1]) {
    const x = side * (SIDE - 0.075);
    b.block(x, 0.43, z + 0.008, 0.15, 0.38, 0.02, black, M.Rubber, Z.Rear, 0.01);
    b.block(x, 0.53, z + 0.016, 0.13, 0.15, 0.01, red, M.Red, Z.Rear, 0.008);
    b.block(x, 0.39, z + 0.016, 0.13, 0.1, 0.01, amber, M.Amber, Z.Rear, 0.008);
    b.block(x, 0.295, z + 0.016, 0.13, 0.07, 0.01, lens, M.Lamp, Z.Rear, 0.008);
    b.block(side * (SIDE + 0.001), 0.53, z - 0.022, 0.012, 0.15, 0.04, red, M.Red, Z.Rear, 0.005);
    b.block(side * (SIDE + 0.001), 0.39, z - 0.022, 0.012, 0.1, 0.04, amber, M.Amber, Z.Rear, 0.005);
  }
  // Steel rear bar with recovery points, a tow hitch and the plate.
  b.block(0, 0.04, z + 0.08, 1.8, 0.17, 0.13, bar, M.Metal, Z.Rear, 0.025);
  for (const x of [-0.47, 0.47]) b.block(x, 0.04, z + 0.01, 0.08, 0.1, 0.14, bar, M.Metal, Z.Trim);
  b.block(0, -0.04, z + 0.17, 0.08, 0.06, 0.16, bar, M.Metal, Z.Rear, 0.01);
  b.ring(0, -0.02, z + 0.23, 0.035, 0.012, steel, M.Metal, 'y', Z.Rear);
  for (const side of [-1, 1]) b.ring(side * 0.66, -0.07, z + 0.12, 0.045, 0.011, red, M.Red, 'x', Z.Trim);
  b.block(0.42, 0.24, z + 0.006, 0.36, 0.12, 0.01, new THREE.Color('#F0EEE6'), M.Lamp, Z.Rear, 0.006);
  b.block(0.42, 0.24, z + 0.012, 0.33, 0.012, 0.004, black, M.Rubber, Z.Rear);
  // The spare on its carrier on the wider door, with a black cover plate over the hub.
  b.tag = Z.Rear;
  b.push()
    .translate(-0.27, 0.5, z + 0.16)
    .rotate(0, Math.PI / 2, 0);
  b.geometry(wheel.clone(), black);
  b.pop();
  b.block(-0.27, 0.5, z + 0.04, 0.3, 0.3, 0.06, bar, M.Metal, Z.Rear, 0.02);
}

function chassis(b: VehicleBuilder): void {
  for (const x of [-0.47, 0.47]) b.block(x, 0.02, 0.04, 0.1, 0.18, 4.4, black, M.Metal, Z.Trim);
  for (const z of [-2.1, -0.75, 0.6, 2.2]) b.block(0, 0.0, z, 0.9, 0.08, 0.08, black, M.Metal, Z.Trim);
  b.block(0.06, -0.03, -0.25, 0.42, 0.2, 0.62, black, M.Metal, Z.Trim, 0.03);
  const shaft = steel.clone().multiplyScalar(0.55);
  b.rod({ x: 0.06, y: -0.08, z: -0.55 }, { x: 0.08, y: -0.12, z: -AXLE + 0.12 }, 0.032, shaft);
  b.rod({ x: 0.06, y: -0.08, z: 0.08 }, { x: 0.05, y: -0.12, z: AXLE - 0.12 }, 0.035, shaft);
  b.block(0, 0.1, 2.0, 0.84, 0.2, 0.6, black, M.Metal, Z.Trim, 0.03);
  b.rod({ x: -0.3, y: -0.06, z: -0.8 }, { x: -0.3, y: -0.08, z: 0.9 }, 0.028, steel);
  b.rod({ x: -0.3, y: -0.08, z: 0.9 }, { x: -0.72, y: -0.1, z: 1.05 }, 0.028, steel);
  b.slot = M.Metal;
  b.tag = Z.Trim;
  b.push()
    .translate(-0.3, -0.07, 0.25)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 12), steel.clone().multiplyScalar(0.6));
  b.pop();
  // Floor pan under the cabin and the cargo floor behind the seats.
  b.block(0, 0.14, 0.15, 1.66, 0.03, 4.4, black, M.Rubber, Z.Trim);
}

export function buildPatrolBody(tuning: VehicleTuning, wheel: THREE.BufferGeometry): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  lowerBody(b);
  bonnetAndFace(b);
  bullBar(b, tuning);
  windscreen(b);
  sides(b);
  roofAndRack(b, tuning, wheel);
  snorkel(b, tuning);
  rearEnd(b, wheel);
  chassis(b);
  addPatrolInterior(b, tuning.engine.redlineRpm);
  return b.build();
}

/**
 * 31×10.5R15 all-terrain tyre on a white steel wheel with a ring of round holes and six
 * studs, the classic Australian touring wheel.
 */
export function buildPatrolWheel(tuning: VehicleTuning): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const r = tuning.wheelRadius,
    w = tuning.wheelWidth;
  const tyre = new THREE.Color('#222524');
  const rimColor = new THREE.Color('#ECEBE4');
  const rimR = 0.19;
  b.slot = M.Rubber;
  b.tag = Z.Trim;
  b.push().rotate(0, 0, -Math.PI / 2);
  const profile = [
    [rimR - 0.01, -w * 0.46],
    [r * 0.72, -w * 0.52],
    [r * 0.92, -w * 0.5],
    [r * 0.965, -w * 0.4],
    [r * 0.965, w * 0.4],
    [r * 0.92, w * 0.5],
    [r * 0.72, w * 0.52],
    [rimR - 0.01, w * 0.46],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  b.geometry(new THREE.LatheGeometry(profile, 48), tyre);
  b.pop();
  // Two rows of staggered tread blocks and shoulder lugs down the sidewall.
  const blocks = 30;
  for (let i = 0; i < blocks; i++) {
    for (const side of [-1, 1]) {
      const angle = ((i + (side > 0 ? 0.5 : 0)) / blocks) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(side * w * 0.2, Math.cos(angle) * r * 0.968, Math.sin(angle) * r * 0.968)
        .rotate(angle, side * 0.12, 0);
      b.box(w * 0.34, 0.03, 0.055, tyre);
      b.pop();
      b.push()
        .translate(side * w * 0.47, Math.cos(angle) * r * 0.9, Math.sin(angle) * r * 0.9)
        .rotate(angle, 0, 0);
      b.box(0.03, 0.05, 0.04, tyre);
      b.pop();
    }
  }
  for (const side of [-1, 1]) {
    b.ring(side * w * 0.5, 0, 0, r * 0.74, 0.004, tyre.clone().multiplyScalar(1.4), M.Rubber, 'x');
    // Rim flange, the dished centre with its ring of holes, hub cap and studs.
    b.ring(side * (w * 0.5 - 0.005), 0, 0, rimR, 0.014, rimColor, M.Paint, 'x');
    b.slot = M.Paint;
    b.push()
      .translate(side * (w * 0.5 - 0.035), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(rimR - 0.01, rimR - 0.01, 0.02, 40),
      rimColor.clone().multiplyScalar(0.92),
    );
    b.pop();
    b.push()
      .translate(side * (w * 0.5 - 0.015), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.11, 0.125, 0.03, 32), rimColor);
    b.pop();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(side * (w * 0.5 - 0.02), Math.cos(a) * 0.15, Math.sin(a) * 0.15)
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.019, 0.019, 0.012, 12), black);
      b.pop();
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.slot = M.Metal;
      b.push()
        .translate(side * (w * 0.5 + 0.005), Math.cos(a) * 0.075, Math.sin(a) * 0.075)
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.013, 0.016, 0.022, 6), steel);
      b.pop();
    }
    b.slot = M.Metal;
    b.push()
      .translate(side * (w * 0.5 + 0.015), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.042, 0.05, 0.045, 20), chrome);
    b.pop();
  }
  return b.build();
}

/** A recovery board strapped to the roof rack (index 0 on the left). */
export function buildPatrolPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const wood = new THREE.Color('#A9824F');
  const x = index === 0 ? -0.6 : 0.6,
    y = ROOF + 0.155,
    z = 0.75;
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
  for (const dz of [-0.8, 0.8]) {
    b.block(x, y + 0.03, z + dz, W + 0.01, 0.012, 0.045, black, M.Rubber, Z.Roof);
    for (const s of [-1, 1])
      b.block(x + (s * (W + 0.02)) / 2, y - 0.01, z + dz, 0.012, 0.07, 0.045, black, M.Rubber, Z.Roof);
  }
  return b.build();
}
