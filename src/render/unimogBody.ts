import * as THREE from 'three';
import type { VehicleTuning } from '../data/vehicle';
import { plankTuning } from '../data/tools';
import { BodyZone as Z, VehicleBuilder, VehicleMaterial as M } from './vehicleGeometry';
import { armyPlate } from './perentieBody';
import { mirrorHead } from './mirrors';
import { addUnimogInterior } from './unimogInterior';
import { unimogColors } from './unimogPaint';
import { cleanGeometry, continuousTube, ROUND_BEND } from './bodyRefinement';
import { extrudeZ, rounded, frontPane, type Vtx } from './bodyShapes';
import { surface } from './unimogSurface';
import {
  addCargoCanvas,
  addCargoBows,
  addBoardSupports,
  BOARD_Z,
  BOARD_Y,
  BOARD_STRAPS,
} from './unimogCanvas';

/**
 * Unimog UL1700L cargo truck in Australian Army green, with an Army plate (41-108): a
 * short sloping bonnet with a black slotted grille, round headlamps low beside it under
 * guards, flat-topped front mudguards standing clear of the wheels, a square cab with a
 * big upright screen and a canvas roof, one spare standing behind the cab, the air
 * intake stack beside it, and a dropside steel tray under a canvas tilt. A winch sits
 * behind the front bumper, a pintle hook on the rear crossmember and the second spare on a
 * carrier on the left dropside. Ground is about
 * 0.68 m below the origin when parked.
 * Photographs and dimensions: reference/vehicles/unimog-ul1700l/SOURCES.md.
 */
const { paint, bar } = unimogColors;
const black = new THREE.Color('#1F2320'),
  rubber = new THREE.Color('#252926'),
  steel = new THREE.Color('#9A9E97');
const red = new THREE.Color('#AE3029'),
  amber = new THREE.Color('#E39B37'),
  lens = new THREE.Color('#E3E4CD');
const glass = new THREE.Color('#A9BDB6');

/** Main heights and stations (vehicle frame). */
const AXLE_Z = 1.925;
const NOSE = -2.94;
const BONNET = { front: 1.08, back: 1.3 };
const CAB = {
  front: -1.65,
  back: -0.1,
  side: 1.1,
  floor: 0.72,
  waist: 1.32,
  roof: 1.98,
};
const TRAY = { front: 0.43, back: 3.45, side: 1.15, floor: 0.72, top: 1.14 };
const SPARE_Z = 0.17;
/** The second spare on its carrier on the left dropside (its centre). */
export const UNIMOG_SIDE_SPARE = { x: -1.39, y: 0.95, z: 0.85 };

function chassis(b: VehicleBuilder): void {
  // Ladder frame and crossmembers, high over the portal axles.
  for (const side of [-1, 1]) {
    b.block(side * 0.36, 0.14, -2.175, 0.12, 0.22, 1.85, black, M.Metal, Z.Trim);
    b.rod(
      { x: side * 0.36, y: 0.14, z: -1.27 },
      { x: side * 0.45, y: 0.14, z: -1.0 },
      0.06,
      black,
      M.Metal,
      Z.Trim,
    );
    b.block(side * 0.45, 0.14, 1.2, 0.12, 0.22, 4.4, black, M.Metal, Z.Trim);
  }
  for (const z of [-2.9, -1.0, 0.4, 1.3, 2.6]) b.block(0, 0.14, z, 0.9, 0.12, 0.1, black, M.Metal, Z.Trim);
  // Engine block and sump behind the front axle, the gearbox under the cab.
  b.block(0, 0.42, -2.25, 0.66, 0.5, 1.0, black, M.Metal, Z.Trim, 0.03);
  b.block(0, 0.14, -2.05, 0.56, 0.18, 0.7, black, M.Metal, Z.Trim, 0.03);
  b.block(0, 0.08, -0.75, 0.5, 0.24, 0.86, black, M.Metal, Z.Trim, 0.04);
  // Cab mounts up from the frame to the cab floor, and the tray's subframe on top of the rails.
  for (const x of [-0.45, 0.45]) {
    for (const z of [-1.5, -0.3])
      b.block(z < -1 ? Math.sign(x) * 0.32 : x, 0.4725, z, 0.14, 0.445, 0.16, black, M.Metal, Z.Trim, 0.01);
    b.block(x, 0.41, 1.85, 0.1, 0.34, 3.1, black, M.Metal, Z.Trim);
  }
  // Propshafts down to the axles' centre housings.
  const shaft = steel.clone().multiplyScalar(0.6);
  b.rod({ x: 0.04, y: 0.0, z: -1.15 }, { x: 0.08, y: -0.06, z: -1.8 }, 0.04, shaft);
  b.rod({ x: 0.04, y: 0.0, z: -0.35 }, { x: 0.08, y: -0.06, z: 1.8 }, 0.04, shaft);
  // Fuel tank on the left, the battery box on the right, and the exhaust out to the right.
  b.block(-0.8, 0.3, -0.35, 0.34, 0.42, 0.9, black, M.Metal, Z.Sides, 0.04);
  b.block(0.8, 0.34, -0.55, 0.3, 0.32, 0.5, paint, M.Paint, Z.Sides, 0.02);
  // Brackets out from the rails under the tank and the battery box.
  for (const z of [-0.65, -0.05]) b.block(-0.6, 0.11, z, 0.32, 0.04, 0.06, black, M.Metal, Z.Trim);
  for (const z of [-0.7, -0.4]) b.block(0.6, 0.2, z, 0.3, 0.04, 0.06, black, M.Metal, Z.Trim);
  b.rod({ x: 0.3, y: 0.1, z: -1.7 }, { x: 0.3, y: 0.02, z: 0.7 }, 0.04, steel);
  b.slot = M.Metal;
  b.tag = Z.Trim;
  b.push()
    .translate(0.62, 0.15, 0.95)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 14), steel.clone().multiplyScalar(0.55));
  b.pop();
  b.rod({ x: 0.3, y: 0.02, z: 0.7 }, { x: 0.45, y: 0.12, z: 0.95 }, 0.04, steel);
  b.rod({ x: 0.87, y: 0.15, z: 0.95 }, { x: 1.0, y: 0.1, z: 1.15 }, 0.04, steel);
}

function frontEnd(b: VehicleBuilder, tuning: VehicleTuning): void {
  // The short 435 bonnet tapers to the nose, with rolled shoulders and a gentle crown.
  const top = (z: number) => BONNET.front + ((BONNET.back - BONNET.front) * (z - NOSE)) / (CAB.front - NOSE);
  const half = (z: number) => 0.6 + (0.07 * (z - NOSE)) / (CAB.front - NOSE);
  surface(
    b,
    24,
    16,
    (u, t) => {
      const z = NOSE + t * (CAB.front - NOSE),
        x = (u * 2 - 1) * half(z);
      return new THREE.Vector3(x, top(z) + 0.032 * (1 - (u * 2 - 1) ** 2), z);
    },
    new THREE.Vector3(0, 1, 0),
    paint,
    M.Paint,
    Z.Front,
    0.014,
  );
  for (const side of [-1, 1]) {
    surface(
      b,
      16,
      4,
      (t, u) => {
        const z = NOSE + t * (CAB.front - NOSE);
        const low = 0.5 + 0.2 * Math.sin((Math.PI * Math.min(1, (z - NOSE) / 0.5)) / 2) ** 2;
        return new THREE.Vector3(side * half(z), low + u * (top(z) - low), z);
      },
      new THREE.Vector3(side, 0, 0),
      paint,
      M.Paint,
      Z.Front,
      0.014,
    );
    for (let i = 0; i < 5; i++) {
      const z = -2.55 + i * 0.12,
        x = side * (half(z) + 0.006);
      b.block(x, 0.83, z, 0.015, 0.22, 0.041, black, M.Rubber, Z.Front, 0.004);
      b.block(x + side * 0.005, 0.83, z + 0.012, 0.012, 0.19, 0.01, paint, M.Paint, Z.Front, 0.002);
    }
    b.block(side * 0.47, 1.325, CAB.front - 0.055, 0.13, 0.014, 0.065, paint, M.Paint, Z.Front, 0.004);
    b.block(side * (half(-2.71) + 0.008), 0.96, -2.71, 0.018, 0.11, 0.033, bar, M.Metal, Z.Front, 0.003);
  }
  const lip: Vtx[] = [
    [-0.6, 1.06],
    [0.6, 1.06],
    [0.6, 1.08],
  ];
  for (let i = 1; i <= 16; i++) {
    const x = 0.6 - i * 0.075;
    lip.push([x, 1.08 + 0.032 * (1 - (x / 0.6) ** 2)]);
  }
  frontPane(b, lip, NOSE - 0.014, -1, paint, M.Paint, Z.Front);
  b.block(0, 0.79, NOSE + 0.012, 1.2, 0.58, 0.05, paint, M.Paint, Z.Front, 0.035);
  b.block(0, 0.8, NOSE - 0.023, 0.96, 0.44, 0.024, bar, M.Rubber, Z.Front, 0.018);
  b.block(0, 0.8, NOSE - 0.038, 0.91, 0.395, 0.012, black, M.Rubber, Z.Front, 0.009);
  for (let i = 0; i < 11; i++)
    b.block(0, 0.625 + i * 0.035, NOSE - 0.048, 0.865, 0.012, 0.016, rubber, M.Rubber, Z.Front, 0.003);
  // Three-point star in a circular grille badge, sitting above the recessed louvers.
  b.ring(0, 0.8, NOSE - 0.064, 0.14, 0.007, steel, M.Metal, 'z', Z.Front);
  const star = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 3,
      r = i % 2 ? 0.025 : 0.132;
    if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  star.closePath();
  b.push().translate(0, 0.8, 0);
  extrudeZ(b, star, NOSE - 0.068, NOSE - 0.06, steel, M.Metal, Z.Front, 0.001);
  b.pop();

  // Front bumper with its towing jaw, and the winch drum behind it with a roller fairlead.
  b.block(0, 0.38, -3.1, 2.2, 0.28, 0.16, paint, M.Paint, Z.Front, 0.012);
  b.block(0, 0.25, -3.12, 2.1, 0.04, 0.14, black, M.Metal, Z.Front);
  for (const side of [-1, 1]) {
    b.block(side * 0.6, 0.38, -3.19, 0.14, 0.2, 0.06, black, M.Metal, Z.Front, 0.01);
    b.rod(
      { x: side * 0.6, y: 0.31, z: -3.235 },
      { x: side * 0.6, y: 0.45, z: -3.235 },
      0.018,
      steel,
      M.Metal,
      Z.Front,
    );
  }
  b.rod({ x: -0.32, y: 0.5, z: -2.96 }, { x: 0.32, y: 0.5, z: -2.96 }, 0.11, black, M.Metal, Z.Front);
  b.block(0.42, 0.5, -2.96, 0.14, 0.22, 0.22, bar, M.Metal, Z.Front, 0.02);
  for (let i = 0; i < 19; i++)
    b.ring(-0.27 + i * 0.03, 0.5, -2.96, 0.111, 0.006, steel, M.Metal, 'x', Z.Front);
  const mount = tuning.winchMount;
  b.block(0, mount.y, mount.z + 0.025, 0.38, 0.16, 0.06, bar, M.Metal, Z.Front, 0.006);
  b.block(0, mount.y, mount.z - 0.008, 0.25, 0.065, 0.015, black, M.Rubber, Z.Front, 0.004);
  for (const y of [mount.y - 0.04, mount.y + 0.04])
    b.rod({ x: -0.13, y, z: mount.z }, { x: 0.13, y, z: mount.z }, 0.016, steel, M.Metal, Z.Front);
  for (const x of [-0.14, 0.14])
    b.rod(
      { x, y: mount.y - 0.05, z: mount.z },
      { x, y: mount.y + 0.05, z: mount.z },
      0.016,
      steel,
      M.Metal,
      Z.Front,
    );
  armyPlate(b, 0.33, 0.4, -3.19, -1, '41-108');

  for (const side of [-1, 1]) {
    // Round headlamps set in recesses at the ends of the front bumper, behind wire guards.
    const lx = side * 0.86,
      ly = 0.38,
      lz = -3.18;
    b.slot = M.Rubber;
    b.tag = Z.Front;
    b.push()
      .translate(lx, ly, lz - 0.003)
      .rotate(Math.PI / 2, 0, 0);
    b.geometry(new THREE.CylinderGeometry(0.112, 0.112, 0.008, 28), black);
    b.pop();
    b.ring(lx, ly, lz - 0.008, 0.094, 0.01, steel, M.Metal, 'z', Z.Front);
    b.slot = M.Headlamp;
    b.push()
      .translate(lx, ly, lz - 0.006)
      .scale(1, 1, 0.3);
    b.geometry(new THREE.SphereGeometry(0.088, 24, 12), lens);
    b.pop();
    for (const dx of [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06]) {
      const h = Math.sqrt(0.08 ** 2 - dx ** 2);
      b.rod(
        { x: lx + dx, y: ly - h, z: lz - 0.034 },
        { x: lx + dx, y: ly + h, z: lz - 0.034 },
        0.0013,
        glass,
        M.Glass,
        Z.Front,
      );
    }
    const gz = lz - 0.058;
    b.ring(lx, ly, gz, 0.119, 0.005, black, M.Metal, 'z', Z.Front);
    for (const dx of [-0.055, 0, 0.055]) {
      const h = Math.sqrt(0.119 ** 2 - dx ** 2);
      b.rod(
        { x: lx + dx, y: ly - h, z: gz },
        { x: lx + dx, y: ly + h, z: gz },
        0.0045,
        black,
        M.Metal,
        Z.Front,
      );
    }
    b.rod({ x: lx - 0.119, y: ly, z: gz }, { x: lx + 0.119, y: ly, z: gz }, 0.0045, black, M.Metal, Z.Front);
    for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
      const x = lx + 0.119 * Math.cos(a),
        y = ly + 0.119 * Math.sin(a);
      b.rod({ x, y, z: gz }, { x, y, z: lz + 0.004 }, 0.005, black, M.Metal, Z.Front);
      b.block(x, y, lz + 0.004, 0.024, 0.024, 0.016, black, M.Metal, Z.Front, 0.003);
    }
    // Indicator and side lamp standing on the mudguard's front edge.
    b.block(side * 0.98, 0.75, -2.53, 0.12, 0.06, 0.04, black, M.Rubber, Z.Front, 0.008);
    b.block(side * 1.02, 0.76, -2.555, 0.05, 0.04, 0.01, amber, M.Amber, Z.Front, 0.004);
    b.block(side * 0.94, 0.76, -2.555, 0.05, 0.04, 0.01, lens, M.Headlamp, Z.Front, 0.004);
    mudguard(b, side, -AXLE_Z, 0.72, Z.Front, true);
  }
}

/**
 * A flat-topped mudguard over a wheel: its ends slope down and away from the wheel, a lip
 * turns down along the outer edge, two struts hold it to the body, and a rubber flap
 * hangs behind it.
 */
function mudguard(
  b: VehicleBuilder,
  side: number,
  axle: number,
  top: number,
  zone: number,
  front: boolean,
): void {
  const x = side * 0.98;
  b.block(x, top - 0.02, axle, 0.46, 0.04, 1.24, paint, M.Paint, zone, 0.01);
  b.block(side * 1.205, top - 0.07, axle, 0.02, 0.1, 1.24, paint, M.Paint, zone, 0.006);
  for (const end of [-1, 1]) {
    // Hinged on the top's end edge and leaning out, so the guard opens downwards round the tyre.
    b.push()
      .translate(x, top - 0.152, axle + end * 0.692)
      .rotate(-end * 0.5, 0, 0);
    b.block(0, 0, 0, 0.46, 0.3, 0.035, paint, M.Paint, zone, 0.008);
    b.block(side * 0.225, 0, -end * 0.05, 0.02, 0.3, 0.1, paint, M.Paint, zone, 0.006);
    b.pop();
    // A front guard is held by struts to the bonnet side; a rear one is bolted under the tray.
    if (front)
      b.rod(
        { x: side * 0.86, y: top - 0.012, z: axle + end * 0.35 },
        { x: side * 0.63, y: top + 0.15, z: axle + end * 0.2 },
        0.018,
        black,
        M.Metal,
        Z.Trim,
      );
  }
  // Inner edge so the guard reads as a deep channel from the side.
  b.block(
    side * 0.76,
    top - 0.02,
    axle,
    0.02,
    0.035,
    1.2,
    paint.clone().multiplyScalar(0.8),
    M.Paint,
    Z.Trim,
  );
  const low = top - 0.28;
  b.block(x, (low + 0.06) / 2, axle + 0.775, 0.42, low - 0.06, 0.02, black, M.Rubber, Z.Trim);
}

function cab(b: VehicleBuilder): void {
  const { front, back, side: S, floor, waist, roof } = CAB;
  const mid = (front + back) / 2,
    len = back - front;
  // Front wall above the bonnet, the floor pan, the rear wall and its small window.
  b.block(0, (floor + waist) / 2, front, 2 * S, waist - floor, 0.05, paint, M.Paint, Z.Front, 0.01);
  b.block(0, floor, mid, 2 * S, 0.05, len, black, M.Metal, Z.Trim);
  const outline: Vtx[] = [
    [-S, floor],
    [S, floor],
    [S, roof - 0.08, 0.025],
    [-S, roof - 0.08, 0.025],
  ];
  const window: Vtx[] = [
    [-0.35, 1.47, 0.02],
    [0.35, 1.47, 0.02],
    [0.35, 1.73, 0.02],
    [-0.35, 1.73, 0.02],
  ];
  const wall = new THREE.Shape(rounded(outline));
  wall.holes.push(new THREE.Path(rounded(window)));
  extrudeZ(b, wall, back - 0.025, back + 0.025, paint, M.Paint, Z.Rear, 0.008);
  frontPane(
    b,
    [
      [-0.37, 1.45, 0.02],
      [0.37, 1.45, 0.02],
      [0.37, 1.75, 0.02],
      [-0.37, 1.75, 0.02],
    ],
    back + 0.027,
    1,
    rubber,
    M.Rubber,
    Z.Rear,
    window,
  );
  frontPane(b, window, back + 0.003, 1, glass, M.Glass, Z.Glass);
  // Upright one-piece windscreen leaning back a little, and its wipers hanging from the top.
  const lean = Math.atan2(0.08, roof - waist);
  b.push().translate(0, waist, front).rotate(lean, 0, 0);
  const h = roof - waist - 0.06;
  b.block(0, 0.03, 0, 2 * S, 0.06, 0.07, paint, M.Paint, Z.Front, 0.01);
  b.block(0, h, 0, 2 * S, 0.08, 0.08, paint, M.Paint, Z.Front, 0.01);
  for (const x of [-S + 0.04, S - 0.04]) b.block(x, h / 2, 0, 0.08, h, 0.07, paint, M.Paint, Z.Front, 0.01);
  b.block(0, h / 2 + 0.01, 0, 2 * S - 0.14, h - 0.1, 0.012, glass, M.Glass, Z.Glass);
  for (const x of [0.5, -0.4]) {
    b.rod(
      { x, y: h - 0.06, z: -0.03 },
      { x: x - 0.12, y: h - 0.5, z: -0.03 },
      0.007,
      black,
      M.Rubber,
      Z.Front,
    );
    b.rod(
      { x, y: h - 0.06, z: -0.036 },
      { x: x - 0.1, y: h - 0.46, z: -0.036 },
      0.004,
      black,
      M.Rubber,
      Z.Front,
    );
  }
  b.pop();
  // Steel cab roof with a raised circular access hatch and hinge/latch fittings.
  b.block(0, roof + 0.02, mid, 2 * S + 0.04, 0.08, len + 0.08, paint, M.Paint, Z.Roof, 0.035);
  const hx = -0.48,
    hz = -0.75;
  b.ring(hx, roof + 0.067, hz, 0.265, 0.012, rubber, M.Rubber, 'y', Z.Roof);
  b.slot = M.Paint;
  b.tag = Z.Roof;
  b.push().translate(hx, roof + 0.08, hz);
  b.geometry(new THREE.CylinderGeometry(0.257, 0.257, 0.025, 48), paint);
  b.pop();
  for (const x of [hx - 0.13, hx + 0.13])
    b.block(x, roof + 0.086, hz + 0.25, 0.09, 0.025, 0.065, bar, M.Metal, Z.Roof, 0.004);
  b.block(hx, roof + 0.1, hz - 0.22, 0.09, 0.025, 0.045, bar, M.Metal, Z.Roof, 0.004);
  b.rod(
    { x: hx - 0.08, y: roof + 0.113, z: hz - 0.12 },
    { x: hx + 0.08, y: roof + 0.113, z: hz - 0.12 },
    0.009,
    steel,
    M.Metal,
    Z.Roof,
  );

  for (const x of [hx - 0.08, hx + 0.08])
    b.rod(
      { x, y: roof + 0.08, z: hz - 0.12 },
      { x, y: roof + 0.113, z: hz - 0.12 },
      0.008,
      steel,
      M.Metal,
      Z.Roof,
    );
  for (const side of [-1, 1]) {
    const x = side * S;
    // Steel lower side and door, its shut lines, handle and a window frame with glass.
    b.block(x, (floor + waist) / 2, mid, 0.04, waist - floor, len, paint, M.Paint, Z.Sides, 0.01);
    const d0 = front + 0.28,
      d1 = back - 0.15;
    for (const z of [d0, d1])
      b.block(
        x + side * 0.022,
        (floor + roof) / 2 - 0.02,
        z,
        0.006,
        roof - floor - 0.1,
        0.008,
        black,
        M.Rubber,
        Z.Sides,
      );
    b.block(x + side * 0.03, waist - 0.08, d1 - 0.12, 0.02, 0.04, 0.14, rubber, M.Rubber, Z.Sides, 0.006);
    const y1 = roof - 0.04;
    const frame = (ya: number, yb: number, za: number, zb: number) =>
      b.block(x, (ya + yb) / 2, (za + zb) / 2, 0.05, yb - ya, zb - za, paint, M.Paint, Z.Sides, 0.008);
    frame(waist, waist + 0.05, front, back);
    frame(y1 - 0.05, y1, front, back);
    frame(waist, y1, front, front + 0.08);
    frame(waist, y1, d1 - 0.04, back);
    frame(waist, y1, d0 - 0.03, d0 + 0.03);
    b.block(
      x,
      (waist + y1) / 2,
      (front + 0.08 + d1 - 0.04) / 2,
      0.008,
      y1 - waist - 0.1,
      d1 - front - 0.12,
      glass,
      M.Glass,
      Z.Glass,
    );
    // Grab handle up the rear pillar and a two-rung step below the door.
    b.rod(
      { x: x + side * 0.05, y: 0.9, z: back - 0.06 },
      { x: x + side * 0.05, y: 1.6, z: back - 0.06 },
      0.014,
      steel,
      M.Metal,
      Z.Sides,
    );
    for (const y of [-0.15, 0.27]) b.block(side * 1.08, y, -0.75, 0.18, 0.03, 0.42, black, M.Metal, Z.Sides);
    for (const z of [-0.95, -0.55]) {
      continuousTube(
        b,
        [
          new THREE.Vector3(side * 1.08, -0.17, z),
          new THREE.Vector3(side * 1.08, floor - 0.04, z),
          new THREE.Vector3(side * S, floor, z),
        ],
        0.014,
        black,
        Z.Sides,
        M.Metal,
        ROUND_BEND,
      );
      b.block(side * S, floor - 0.02, z, 0.06, 0.05, 0.07, black, M.Metal, Z.Sides, 0.004);
    }
    // Mirrors on a tubular frame from the screen pillar: two arms out to an upright tube,
    // a tall main mirror clamped to it and a small wide-angle one below.
    const mx = x + side * 0.26,
      mz = front - 0.02;
    for (const y of [1.6, 1.9])
      b.rod({ x, y: y - 0.04, z: front + 0.04 }, { x: mx, y, z: mz }, 0.014, black, M.Metal, Z.Sides);
    b.rod({ x: mx, y: 1.44, z: mz }, { x: mx, y: 1.92, z: mz }, 0.014, black, M.Metal, Z.Sides);
    for (const y of [1.5, 1.7, 1.86])
      b.block(mx + side * 0.04, y, mz, 0.07, 0.03, 0.03, black, M.Metal, Z.Trim);
    mirrorHead(b, side, { x: mx + side * 0.12, y: 1.78, z: mz }, 0.17, 0.3, 0.06, black, 0.2);
    mirrorHead(b, side, { x: mx + side * 0.11, y: 1.5, z: mz }, 0.15, 0.12, 0.06, black, 0.35);
  }
  // HF whip aerial on the left rear corner of the cab.
  b.block(-0.98, roof + 0.07, back - 0.08, 0.08, 0.08, 0.08, black, M.Rubber, Z.Roof, 0.01);
  b.rod(
    { x: -0.98, y: roof + 0.1, z: back - 0.08 },
    { x: -1.0, y: 3.9, z: back + 0.05 },
    0.005,
    black,
    M.Rubber,
    Z.Roof,
  );
}

/** The spare wheel standing on the frame behind the cab, and the air intake stack beside it. */
function behindCab(b: VehicleBuilder, tuning: VehicleTuning, wheel: THREE.BufferGeometry): void {
  b.tag = Z.Rear;
  b.push()
    .translate(0, 1.05, SPARE_Z)
    .rotate(0, Math.PI / 2, 0);
  b.geometry(wheel.clone(), black);
  b.pop();
  b.block(0, 0.46, SPARE_Z, 1.0, 0.06, 0.3, black, M.Metal, Z.Trim);
  for (const x of [-0.45, 0.45]) b.block(x, 0.34, SPARE_Z, 0.12, 0.2, 0.2, black, M.Metal, Z.Trim);
  for (const x of [-0.5, 0.5])
    b.rod({ x, y: 0.46, z: SPARE_Z }, { x: x * 0.4, y: 1.5, z: SPARE_Z }, 0.02, black);
  const { x, y, z } = tuning.intake;
  // The intake pipe comes up from under the cab's back corner.
  continuousTube(
    b,
    [
      new THREE.Vector3(x, 0.72, CAB.back - 0.25),
      new THREE.Vector3(x, 0.72, z),
      new THREE.Vector3(x, y + 0.05, z),
    ],
    0.075,
    paint,
    Z.Rear,
    M.Paint,
    ROUND_BEND,
  );
  b.slot = M.Paint;
  b.tag = Z.Roof;
  b.push().translate(x, y + 0.1, z);
  b.geometry(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 16), black);
  b.pop();
  b.push().translate(x, y + 0.17, z);
  b.geometry(new THREE.CylinderGeometry(0.08, 0.12, 0.05, 16), black);
  b.pop();
  for (const yy of [1.2, 1.7])
    b.rod({ x, y: yy, z }, { x: CAB.side - 0.02, y: yy, z: CAB.back }, 0.012, black);
}

function tray(b: VehicleBuilder): void {
  const { front, back, side: S, floor, top } = TRAY;
  const mid = (front + back) / 2,
    len = back - front;
  // Floor on its bearers, the dropsides with pressed ribs, the headboard and the tailgate.
  b.block(0, floor, mid, 2 * S, 0.06, len, paint.clone().multiplyScalar(0.85), M.Paint, Z.Trim);
  for (const x of [-0.45, 0.45]) b.block(x, floor - 0.09, mid, 0.12, 0.12, len, black, M.Metal, Z.Trim);
  for (let z = front + 0.2; z < back; z += 0.5)
    b.block(0, floor - 0.06, z, 1.42, 0.06, 0.06, black, M.Metal, Z.Trim);
  b.block(0, floor - 0.06, back - 0.06, 1.42, 0.06, 0.06, black, M.Metal, Z.Trim);
  const h = top - floor;
  for (const side of [-1, 1]) {
    b.block(side * (S - 0.02), (floor + top) / 2, mid, 0.04, h, len, paint, M.Paint, Z.Sides, 0.008);
    for (const y of [floor + 0.12, floor + 0.28])
      b.block(side * (S + 0.002), y, mid, 0.012, 0.035, len - 0.1, paint, M.Paint, Z.Sides, 0.004);
    for (let z = front + 0.4; z < back - 0.2; z += 0.95)
      b.block(side * (S + 0.006), (floor + top) / 2, z, 0.02, h, 0.05, paint, M.Paint, Z.Sides, 0.006);
    for (const z of [0.75, 1.55, 2.4, 3.2]) {
      b.block(side * (S + 0.009), floor + 0.055, z, 0.025, 0.105, 0.11, paint, M.Paint, Z.Sides, 0.004);
      b.rod(
        { x: side * (S + 0.022), y: floor, z: z - 0.065 },
        { x: side * (S + 0.022), y: floor, z: z + 0.065 },
        0.013,
        bar,
        M.Metal,
        Z.Sides,
      );
    }
    mudguard(b, side, AXLE_Z, floor - 0.015, Z.Rear, false);
  }
  b.block(0, (floor + top) / 2, front, 2 * S, h, 0.04, paint, M.Paint, Z.Sides, 0.008);
  b.block(0, (floor + top) / 2, back - 0.02, 2 * S, h, 0.04, paint, M.Paint, Z.Rear, 0.008);
  for (const y of [floor + 0.12, floor + 0.28])
    b.block(0, y, back + 0.002, 2 * S - 0.1, 0.035, 0.012, paint, M.Paint, Z.Rear, 0.004);
  for (const x of [-0.9, 0.9]) b.block(x, top - 0.04, back + 0.01, 0.08, 0.05, 0.03, steel, M.Metal, Z.Rear);

  for (const x of [-0.72, 0.72]) {
    b.block(x, floor + 0.05, back + 0.009, 0.15, 0.09, 0.025, paint, M.Paint, Z.Rear, 0.004);
    b.rod(
      { x: x - 0.11, y: floor, z: back + 0.027 },
      { x: x + 0.11, y: floor, z: back + 0.027 },
      0.014,
      bar,
      M.Metal,
      Z.Rear,
    );
  }
  addCargoCanvas(b);
  addCargoBows(b);
  addBoardSupports(b);
}

function rear(b: VehicleBuilder, tuning: VehicleTuning, wheel: THREE.BufferGeometry): void {
  // Rear crossmember with the pintle hook and trailer socket, lamps and the plate.
  b.block(0, 0.2, 3.42, 1.9, 0.2, 0.14, black, M.Metal, Z.Rear, 0.01);
  const tow = tuning.towPoint;
  b.block(0, tow.y + 0.02, tow.z - 0.06, 0.16, 0.14, 0.1, black, M.Metal, Z.Rear, 0.01);
  b.ring(0, tow.y - 0.01, tow.z + 0.02, 0.05, 0.016, black, M.Metal, 'y', Z.Rear);
  b.slot = M.Rubber;
  b.tag = Z.Rear;
  b.push()
    .translate(0.35, 0.22, 3.5)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12), black);
  b.pop();
  for (const side of [-1, 1]) {
    b.block(side * 0.95, 0.45, 3.46, 0.22, 0.14, 0.05, black, M.Rubber, Z.Rear, 0.01);
    b.block(side * 0.95, 0.48, 3.49, 0.18, 0.05, 0.012, red, M.Red, Z.Rear, 0.004);
    b.block(side * 0.95, 0.42, 3.49, 0.18, 0.04, 0.012, amber, M.Amber, Z.Rear, 0.004);
    // Bracket plate from the lamp up to the tray's rear bearer.
    b.block(side * 0.95, 0.6, 3.42, 0.16, 0.2, 0.03, black, M.Metal, Z.Rear);
  }
  armyPlate(b, -0.55, 0.2, 3.497, 1, '41-108');
  // Jerry cans in holders under the back of the tray.
  for (const side of [-1, 1]) jerryCan(b, side * 0.95, 0.3, 2.9);
  // The second spare hangs on the left dropside on a carrier, clear of the rear wheel and
  // of the pintle hook: two rails bolted along the dropside and a hub plate.
  const { x: sx, y: sy, z: sz } = UNIMOG_SIDE_SPARE;
  for (const y of [sy - 0.25, TRAY.top - 0.09])
    for (const z of [sz - 0.3, sz + 0.3])
      b.block(-1.177, y, z, 0.08, 0.08, 0.08, black, M.Metal, Z.Sides, 0.005);
  const face = -(TRAY.side + 0.012);
  for (const y of [sy - 0.25, TRAY.top - 0.09])
    b.block(face - 0.025, y, sz, 0.05, 0.06, 0.8, black, M.Metal, Z.Sides);
  for (const z of [sz - 0.3, sz + 0.3])
    b.block(face - 0.025, 0.875, z, 0.05, 0.41, 0.05, black, M.Metal, Z.Sides);
  b.block(face - 0.06, sy, sz, 0.04, 0.26, 0.26, black, M.Metal, Z.Sides, 0.01);
  b.tag = Z.Sides;
  b.push().translate(sx, sy, sz);
  b.geometry(wheel.clone(), black);
  b.pop();
}

/** Pressed-steel jerry can in a cage, its long side facing out. */
function jerryCan(b: VehicleBuilder, x: number, y: number, z: number): void {
  const can = new THREE.Color('#5B6640');
  b.block(x, y, z, 0.17, 0.47, 0.34, can, M.Paint, Z.Rear, 0.02);
  b.block(x, y + 0.26, z - 0.08, 0.03, 0.05, 0.12, can, M.Paint, Z.Rear, 0.01);
  b.block(x, y - 0.25, z, 0.22, 0.03, 0.4, black, M.Metal, Z.Rear);
  for (const side of [-1, 1])
    b.block(x + side * 0.095, y + 0.05, z, 0.012, 0.04, 0.38, black, M.Rubber, Z.Rear);
  for (const dz of [-0.185, 0.185]) b.block(x, y + 0.05, z + dz, 0.19, 0.04, 0.012, black, M.Rubber, Z.Rear);
  b.block(x + Math.sign(x) * 0.102, y + 0.05, z, 0.012, 0.06, 0.045, steel, M.Metal, Z.Rear, 0.003);
  // The holder's back plate up to the tray bearer above, and an arm in to the frame rail.
  const s = Math.sign(x);
  b.block(x - s * 0.1, (y - 0.26 + 0.62) / 2, z, 0.03, 0.62 - (y - 0.26), 0.4, black, M.Metal, Z.Rear);
  b.block(
    (x - s * 0.1 + s * 0.5) / 2,
    0.14,
    z,
    Math.abs(x - s * 0.1) - 0.5,
    0.06,
    0.08,
    black,
    M.Metal,
    Z.Trim,
  );
}

export function buildUnimogBody(tuning: VehicleTuning, wheel: THREE.BufferGeometry): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  chassis(b);
  frontEnd(b, tuning);
  cab(b);
  behindCab(b, tuning, wheel);
  tray(b);
  rear(b, tuning, wheel);
  addUnimogInterior(b, tuning.engine.redlineRpm);
  const g = b.build();
  return cleanGeometry(g);
}

/** 12.5R20 cross-country tyre with deep chevron bars, an Army green rim and the portal hub. */
export function buildUnimogWheel(tuning: VehicleTuning): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const r = tuning.wheelRadius,
    w = tuning.wheelWidth;
  const tyre = unimogColors.tyre;
  const rimR = 0.27;
  b.slot = M.Rubber;
  b.tag = Z.Trim;
  b.push().rotate(0, 0, -Math.PI / 2);
  const profile = [
    [rimR - 0.01, -w * 0.45],
    [r * 0.72, -w * 0.52],
    [r * 0.9, -w * 0.5],
    [r * 0.955, -w * 0.4],
    [r * 0.955, w * 0.4],
    [r * 0.9, w * 0.5],
    [r * 0.72, w * 0.52],
    [rimR - 0.01, w * 0.45],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  b.geometry(new THREE.LatheGeometry(profile, 56), tyre);
  b.pop();
  // Chevron bars: a bar out from each shoulder, staggered and angled towards the centre.
  const lugs = 22;
  for (let i = 0; i < lugs; i++)
    for (const side of [-1, 1]) {
      const angle = ((i + (side > 0 ? 0.5 : 0)) / lugs) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(side * w * 0.24, Math.cos(angle) * r * 0.96, Math.sin(angle) * r * 0.96)
        .rotate(angle, side * 0.45, 0);
      b.box(w * 0.5, 0.05, 0.07, tyre);
      b.pop();
    }
  for (const side of [-1, 1]) {
    b.ring(side * w * 0.5, 0, 0, r * 0.74, 0.005, tyre.clone().multiplyScalar(1.4), M.Rubber, 'x');
    // Rim flange and the dished centre with its bolt ring.
    b.ring(side * (w * 0.5 - 0.005), 0, 0, rimR, 0.016, paint, M.Paint, 'x');
    const circle = (cx: number, cy: number, r: number, n: number) =>
      Array.from(
        { length: n },
        (_, i) =>
          new THREE.Vector2(
            cx + r * Math.cos((i * Math.PI * 2) / n),
            cy + r * Math.sin((i * Math.PI * 2) / n),
          ),
      );
    const disc = new THREE.Shape(circle(0, 0, 0.25, 48));
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      disc.holes.push(new THREE.Path(circle(Math.cos(a) * 0.205, Math.sin(a) * 0.205, 0.022, 16).reverse()));
    }
    disc.holes.push(new THREE.Path(circle(0, 0, 0.063, 32).reverse()));
    b.push()
      .translate(side * (w * 0.5 - 0.027), 0, 0)
      .rotate(0, Math.PI / 2, 0);
    extrudeZ(b, disc, -0.008, 0.008, paint, M.Paint, Z.Trim, 0);
    b.pop();
    b.slot = M.Paint;
    b.push()
      .translate(side * (w * 0.5 - 0.015), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.155, 0.175, 0.03, 40), paint);
    b.pop();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      b.slot = M.Metal;
      b.push()
        .translate(side * (w * 0.5 + 0.008), Math.cos(a) * 0.125, Math.sin(a) * 0.125)
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.015, 0.018, 0.025, 6), steel);
      b.pop();
    }
    // The hub reduction's cover in the middle.
    b.slot = M.Metal;
    b.push()
      .translate(side * (w * 0.5 + 0.03), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 20), black);
    b.pop();
  }
  return cleanGeometry(b.build());
}

/** Recovery boards on external support bows with closed straps. */
export function buildUnimogPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder(),
    wood = new THREE.Color('#A9824F'),
    x = index === 0 ? -0.45 : 0.45,
    y = BOARD_Y,
    z = BOARD_Z,
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
  for (const zz of BOARD_STRAPS) {
    b.block(x, y + 0.03, zz, W + 0.02, 0.012, 0.045, black, M.Rubber, Z.Roof);
    for (const side of [-1, 1])
      b.block(x + (side * (W + 0.02)) / 2, y - 0.018, zz, 0.012, 0.1, 0.045, black, M.Rubber, Z.Roof);
    b.block(x, y - 0.06, zz, W + 0.03, 0.012, 0.045, black, M.Rubber, Z.Roof);
  }
  return cleanGeometry(b.build());
}
