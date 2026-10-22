import * as THREE from 'three';
import type { VehicleTuning } from '../data/vehicle';
import { plankTuning } from '../data/tools';
import { BodyZone as Z, VehicleBuilder, VehicleMaterial as M } from './vehicleGeometry';
import { armyPlate } from './perentieBody';
import { addUnimogInterior } from './unimogInterior';
import { unimogColors } from './unimogPaint';

/**
 * Unimog UL1700L cargo truck in Australian Army green, with an Army plate (41-108): a
 * short sloping bonnet with a black slotted grille, round headlamps low beside it under
 * guards, flat-topped front mudguards standing clear of the wheels, a square cab with a
 * big upright screen and a canvas roof, the spare wheel standing behind the cab, the air
 * intake stack beside it, and a dropside steel tray under a canvas tilt. A winch sits
 * behind the front bumper and a pintle hook on the rear crossmember. Ground is about
 * 0.68 m below the origin when parked.
 */
const { paint, canvas, bar } = unimogColors;
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
const CAB = { front: -1.65, back: -0.1, side: 1.1, floor: 0.68, waist: 1.32, roof: 1.98 };
const TRAY = { front: 0.3, back: 3.45, side: 1.15, floor: 0.72, top: 1.14 };
const TILT_TOP = 2.26;
const SPARE_Z = 0.12;

/** A flat four-cornered panel, seen from both sides. */
function panel(
  b: VehicleBuilder,
  pts: [THREE.Vector3Like, THREE.Vector3Like, THREE.Vector3Like, THREE.Vector3Like],
  color: THREE.Color,
  slot: number,
  zone: number,
): void {
  b.slot = slot as typeof b.slot;
  b.tag = zone;
  const [p, q, r, s] = pts;
  b.quad(p, q, r, s, color);
  b.quad(s, r, q, p, color);
}

function chassis(b: VehicleBuilder): void {
  // Ladder frame and crossmembers, high over the portal axles.
  for (const x of [-0.45, 0.45]) b.block(x, 0.14, 0.15, 0.12, 0.22, 6.5, black, M.Metal, Z.Trim);
  for (const z of [-2.9, -1.0, 0.4, 1.3, 2.6]) b.block(0, 0.14, z, 0.9, 0.12, 0.1, black, M.Metal, Z.Trim);
  // Engine block and sump behind the front axle, the gearbox under the cab.
  b.block(0, 0.42, -2.25, 0.66, 0.5, 1.0, black, M.Metal, Z.Trim, 0.03);
  b.block(0, 0.14, -2.05, 0.56, 0.18, 0.7, black, M.Metal, Z.Trim, 0.03);
  b.block(0, 0.08, -0.75, 0.5, 0.24, 0.86, black, M.Metal, Z.Trim, 0.04);
  // Propshafts down to the axles' centre housings.
  const shaft = steel.clone().multiplyScalar(0.6);
  b.rod({ x: 0.04, y: 0.0, z: -1.15 }, { x: 0.08, y: -0.06, z: -1.8 }, 0.04, shaft);
  b.rod({ x: 0.04, y: 0.0, z: -0.35 }, { x: 0.08, y: -0.06, z: 1.8 }, 0.04, shaft);
  // Fuel tank on the left, the battery box on the right, and the exhaust out to the right.
  b.block(-0.8, 0.3, -0.35, 0.34, 0.42, 0.9, black, M.Metal, Z.Sides, 0.04);
  b.block(0.8, 0.34, -0.55, 0.3, 0.32, 0.5, paint, M.Paint, Z.Sides, 0.02);
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
  // Sloping bonnet over the engine, its sides with cooling louvres, and the nose panel.
  const len = Math.hypot(CAB.front - NOSE, BONNET.back - BONNET.front);
  const pitch = Math.atan2(BONNET.back - BONNET.front, CAB.front - NOSE);
  b.push()
    .translate(0, (BONNET.front + BONNET.back) / 2, (NOSE + CAB.front) / 2)
    .rotate(-pitch, 0, 0);
  b.block(0, 0, 0, 1.26, 0.05, len + 0.02, paint, M.Paint, Z.Front, 0.02);
  b.pop();
  for (const side of [-1, 1]) {
    const x = side * 0.62;
    panel(
      b,
      [
        { x, y: 0.5, z: NOSE },
        { x, y: 0.5, z: CAB.front },
        { x, y: BONNET.back, z: CAB.front },
        { x, y: BONNET.front, z: NOSE },
      ],
      paint,
      M.Paint,
      Z.Front,
    );
    for (let i = 0; i < 5; i++)
      b.block(side * 0.627, 0.8, -2.55 + i * 0.12, 0.01, 0.22, 0.03, black, M.Rubber, Z.Front);
  }
  b.block(0, 0.79, NOSE, 1.26, 0.58, 0.05, paint, M.Paint, Z.Front, 0.012);
  // Black grille: a frame round horizontal slots.
  b.block(0, 0.8, NOSE - 0.03, 0.9, 0.4, 0.02, black, M.Rubber, Z.Front, 0.008);
  for (let i = 0; i < 7; i++)
    b.block(0, 0.63 + i * 0.056, NOSE - 0.044, 0.84, 0.016, 0.012, rubber, M.Rubber, Z.Front);

  // Front bumper with its towing jaw, and the winch drum behind it with a roller fairlead.
  b.block(0, 0.38, -3.1, 2.2, 0.28, 0.16, paint, M.Paint, Z.Front, 0.012);
  b.block(0, 0.25, -3.12, 2.1, 0.04, 0.14, black, M.Metal, Z.Front);
  for (const side of [-1, 1]) {
    b.block(side * 0.6, 0.38, -3.19, 0.14, 0.2, 0.06, black, M.Metal, Z.Front, 0.01);
    b.rod(
      { x: side * 0.6, y: 0.31, z: -3.24 },
      { x: side * 0.6, y: 0.45, z: -3.24 },
      0.018,
      steel,
      M.Metal,
      Z.Front,
    );
  }
  b.rod({ x: -0.32, y: 0.5, z: -2.96 }, { x: 0.32, y: 0.5, z: -2.96 }, 0.11, black, M.Metal, Z.Front);
  b.block(0.42, 0.5, -2.96, 0.14, 0.22, 0.22, bar, M.Metal, Z.Front, 0.02);
  const mount = tuning.winchMount;
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
    // Round headlamps low beside the grille on brackets, behind wire guards.
    const lx = side * 0.86;
    b.block(lx, 0.62, -2.88, 0.08, 0.1, 0.2, black, M.Metal, Z.Front);
    b.slot = M.Rubber;
    b.tag = Z.Front;
    b.push()
      .translate(lx, 0.62, -2.98)
      .rotate(Math.PI / 2, 0, 0);
    b.geometry(new THREE.CylinderGeometry(0.11, 0.1, 0.12, 24), black);
    b.pop();
    b.ring(lx, 0.62, -3.045, 0.092, 0.012, steel, M.Metal, 'z', Z.Front);
    b.slot = M.Headlamp;
    b.push().translate(lx, 0.62, -3.045).scale(1, 1, 0.3);
    b.geometry(new THREE.SphereGeometry(0.086, 24, 12), lens);
    b.pop();
    for (const dx of [-0.05, 0, 0.05])
      b.rod(
        { x: lx + dx, y: 0.52, z: -3.08 },
        { x: lx + dx, y: 0.72, z: -3.08 },
        0.005,
        black,
        M.Rubber,
        Z.Front,
      );
    b.rod(
      { x: lx - 0.1, y: 0.62, z: -3.08 },
      { x: lx + 0.1, y: 0.62, z: -3.08 },
      0.005,
      black,
      M.Rubber,
      Z.Front,
    );
    // Indicator and side lamp on the mudguard's front edge.
    b.block(side * 0.98, 0.78, -2.63, 0.12, 0.06, 0.04, black, M.Rubber, Z.Front, 0.008);
    b.block(side * 1.02, 0.78, -2.655, 0.05, 0.04, 0.01, amber, M.Amber, Z.Front, 0.004);
    b.block(side * 0.94, 0.78, -2.655, 0.05, 0.04, 0.01, lens, M.Headlamp, Z.Front, 0.004);
    mudguard(b, side, -AXLE_Z, 0.72, Z.Front, true);
  }
}

/** A flat-topped mudguard over a wheel, with sloping ends and a rubber flap behind it. */
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
  for (const end of [-1, 1]) {
    b.push()
      .translate(x, top - 0.16, axle + end * 0.7)
      .rotate(end * 0.5, 0, 0);
    b.block(0, 0, 0, 0.46, 0.3, 0.035, paint, M.Paint, zone, 0.008);
    b.pop();
  }
  // Inner edge so the guard reads as a deep channel from the side.
  b.block(side * 0.76, top - 0.08, axle, 0.02, 0.14, 1.2, paint.clone().multiplyScalar(0.8), M.Paint, Z.Trim);
  const flapY = front ? 0.3 : 0.28;
  b.block(x, flapY, axle + 0.84, 0.42, 0.44, 0.02, black, M.Rubber, Z.Trim);
}

function cab(b: VehicleBuilder): void {
  const { front, back, side: S, floor, waist, roof } = CAB;
  const mid = (front + back) / 2,
    len = back - front;
  // Front wall above the bonnet, the floor pan, the rear wall and its small window.
  b.block(0, (floor + waist) / 2, front, 2 * S, waist - floor, 0.05, paint, M.Paint, Z.Front, 0.01);
  b.block(0, floor, mid, 2 * S, 0.05, len, black, M.Metal, Z.Trim);
  b.block(0, (floor + roof) / 2 - 0.04, back, 2 * S, roof - floor - 0.08, 0.05, paint, M.Paint, Z.Rear, 0.01);
  b.block(0, 1.6, back + 0.03, 0.7, 0.26, 0.012, glass, M.Glass, Z.Glass);
  b.block(0, 1.6, back + 0.028, 0.74, 0.3, 0.008, rubber, M.Rubber, Z.Rear);
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
  // Canvas roof over the cab on its frame.
  b.block(0, roof + 0.02, mid, 2 * S + 0.04, 0.08, len + 0.08, canvas, M.Fabric, Z.Roof, 0.035);

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
    for (const y of [-0.15, 0.27]) {
      b.block(side * 1.02, y, -0.75, 0.14, 0.03, 0.42, black, M.Metal, Z.Sides);
      for (const z of [-0.95, -0.55])
        b.rod({ x: side * 1.02, y, z }, { x: side * 0.98, y: floor, z }, 0.012, black, M.Metal, Z.Sides);
    }
    // Door mirrors on long arms from the screen pillars.
    b.rod(
      { x: x, y: 1.55, z: front + 0.04 },
      { x: x + side * 0.24, y: 1.72, z: front - 0.02 },
      0.012,
      black,
      M.Rubber,
      Z.Sides,
    );
    b.rod(
      { x: x, y: 1.85, z: front + 0.04 },
      { x: x + side * 0.24, y: 1.88, z: front - 0.02 },
      0.012,
      black,
      M.Rubber,
      Z.Sides,
    );
    b.block(x + side * 0.26, 1.8, front - 0.02, 0.05, 0.24, 0.16, black, M.Rubber, Z.Trim, 0.015);
    b.block(x + side * 0.26, 1.8, front + 0.065, 0.04, 0.2, 0.006, steel, M.Metal, Z.Trim, 0.01);
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
  for (const x of [-0.5, 0.5])
    b.rod({ x, y: 0.46, z: SPARE_Z }, { x: x * 0.4, y: 1.5, z: SPARE_Z }, 0.02, black);
  const { x, y, z } = tuning.intake;
  b.rod({ x, y: 0.9, z }, { x, y: y + 0.05, z }, 0.075, paint, M.Paint, Z.Rear);
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
    b.block(0, floor - 0.06, z, 2 * S - 0.1, 0.06, 0.06, black, M.Metal, Z.Trim);
  const h = top - floor;
  for (const side of [-1, 1]) {
    b.block(side * (S - 0.02), (floor + top) / 2, mid, 0.04, h, len, paint, M.Paint, Z.Sides, 0.008);
    for (const y of [floor + 0.12, floor + 0.28])
      b.block(side * (S + 0.002), y, mid, 0.012, 0.035, len - 0.1, paint, M.Paint, Z.Sides, 0.004);
    for (let z = front + 0.4; z < back - 0.2; z += 0.95)
      b.block(side * (S + 0.006), (floor + top) / 2, z, 0.02, h, 0.05, paint, M.Paint, Z.Sides, 0.006);
    mudguard(b, side, AXLE_Z, floor - 0.06, Z.Rear, false);
  }
  b.block(0, (floor + top) / 2, front, 2 * S, h, 0.04, paint, M.Paint, Z.Sides, 0.008);
  b.block(0, (floor + top) / 2, back - 0.02, 2 * S, h, 0.04, paint, M.Paint, Z.Rear, 0.008);
  for (const y of [floor + 0.12, floor + 0.28])
    b.block(0, y, back + 0.002, 2 * S - 0.1, 0.035, 0.012, paint, M.Paint, Z.Rear, 0.004);
  for (const x of [-0.9, 0.9]) b.block(x, top - 0.04, back + 0.01, 0.08, 0.05, 0.03, steel, M.Metal, Z.Rear);

  // The canvas tilt on its hoops, with straps over the hoops and a rear curtain.
  const tz0 = front + 0.03,
    tz1 = back - 0.03;
  const tmid = (tz0 + tz1) / 2,
    tlen = tz1 - tz0;
  b.block(0, TILT_TOP - 0.05, tmid, 2 * S + 0.02, 0.1, tlen, canvas, M.Fabric, Z.Roof, 0.05);
  const sideH = TILT_TOP - 0.08 - top;
  for (const side of [-1, 1])
    b.block(side * (S + 0.01), top + sideH / 2, tmid, 0.03, sideH, tlen, canvas, M.Fabric, Z.Sides, 0.01);
  b.block(0, top + sideH / 2, tz0, 2 * S, sideH, 0.03, canvas, M.Fabric, Z.Sides, 0.01);
  b.block(0, top + sideH / 2, tz1 + 0.01, 2 * S, sideH, 0.03, canvas, M.Fabric, Z.Rear, 0.01);
  const strap = canvas.clone().multiplyScalar(0.72);
  for (let i = 0; i < 5; i++) {
    const z = tz0 + 0.1 + (i * (tlen - 0.2)) / 4;
    b.block(0, TILT_TOP + 0.002, z, 2 * S - 0.1, 0.006, 0.05, strap, M.Fabric, Z.Roof);
    for (const side of [-1, 1])
      b.block(side * (S + 0.027), top + sideH / 2, z, 0.006, sideH - 0.06, 0.05, strap, M.Fabric, Z.Sides);
  }
  b.block(0, top + 0.6, tz1 + 0.03, 2 * S - 0.1, 0.012, 0.006, strap, M.Fabric, Z.Rear);
  for (const x of [-0.6, 0, 0.6])
    b.block(x, top + 0.3, tz1 + 0.03, 0.05, 0.6, 0.006, strap, M.Fabric, Z.Rear);
  // Lashing rope along the bottom of the tilt.
  for (const side of [-1, 1])
    b.rod(
      { x: side * (S + 0.03), y: top + 0.05, z: tz0 + 0.05 },
      { x: side * (S + 0.03), y: top + 0.05, z: tz1 - 0.05 },
      0.007,
      rubber,
      M.Rubber,
      Z.Sides,
    );
}

function rear(b: VehicleBuilder, tuning: VehicleTuning): void {
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
    b.block(side * 0.95, 0.52, 3.43, 0.04, 0.12, 0.04, black, M.Metal, Z.Rear);
  }
  armyPlate(b, -0.55, 0.45, 3.48, 1, '41-108');
  // Jerry cans in holders under the back of the tray.
  for (const side of [-1, 1]) jerryCan(b, side * 0.95, 0.3, 2.9);
}

/** Pressed-steel jerry can in a cage, its long side facing out. */
function jerryCan(b: VehicleBuilder, x: number, y: number, z: number): void {
  const can = new THREE.Color('#5B6640');
  b.block(x, y, z, 0.17, 0.47, 0.34, can, M.Paint, Z.Rear, 0.02);
  b.block(x, y + 0.26, z - 0.08, 0.03, 0.05, 0.12, can, M.Paint, Z.Rear, 0.01);
  b.block(x, y - 0.25, z, 0.22, 0.03, 0.4, black, M.Metal, Z.Rear);
  b.block(x + Math.sign(x) * 0.095, y + 0.05, z, 0.012, 0.04, 0.4, black, M.Rubber, Z.Rear);
}

export function buildUnimogBody(tuning: VehicleTuning, wheel: THREE.BufferGeometry): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  chassis(b);
  frontEnd(b, tuning);
  cab(b);
  behindCab(b, tuning, wheel);
  tray(b);
  rear(b, tuning);
  addUnimogInterior(b, tuning.engine.redlineRpm);
  return b.build();
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
    b.slot = M.Paint;
    b.push()
      .translate(side * (w * 0.5 - 0.035), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(rimR - 0.01, rimR - 0.01, 0.02, 40),
      paint.clone().multiplyScalar(0.9),
    );
    b.pop();
    b.push()
      .translate(side * (w * 0.5 - 0.015), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.17, 0.19, 0.03, 32), paint);
    b.pop();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      b.slot = M.Metal;
      b.push()
        .translate(side * (w * 0.5 + 0.004), Math.cos(a) * 0.225, Math.sin(a) * 0.225)
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.011, 0.013, 0.018, 6), steel);
      b.pop();
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.slot = M.Metal;
      b.push()
        .translate(side * (w * 0.5 + 0.01), Math.cos(a) * 0.11, Math.sin(a) * 0.11)
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.016, 0.019, 0.026, 6), steel);
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
  return b.build();
}

/** A recovery board strapped to the tilt roof (index 0 on the left). */
export function buildUnimogPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const wood = new THREE.Color('#A9824F');
  const x = index === 0 ? -0.45 : 0.45,
    y = TILT_TOP + 0.035,
    z = (TRAY.front + TRAY.back) / 2;
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
  for (const dz of [-0.75, 0.75]) {
    b.block(x, y + 0.03, z + dz, W + 0.01, 0.012, 0.045, black, M.Rubber, Z.Roof);
    for (const s of [-1, 1])
      b.block(x + (s * (W + 0.02)) / 2, y - 0.01, z + dz, 0.012, 0.07, 0.045, black, M.Rubber, Z.Roof);
  }
  return b.build();
}
