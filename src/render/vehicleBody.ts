export { buildVehicleWheel } from './vehicleWheel';
export { buildRackPlank } from './vehicleEquipment';
import { cleanGeometry, subdivideSurface } from './bodyRefinement';
import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import type { VehicleTuning } from '../data/vehicle';
import { BodyZone as Z, VehicleBuilder, VehicleMaterial as M } from './vehicleGeometry';
import { addVehicleInterior } from './vehicleInterior';
import { pal } from './colors';
import { addVehicleEquipment } from './vehicleEquipment';
import { extrudeZ } from './bodyShapes';
import { roundHead, stalk } from './mirrors';

// Axes as in the game: x across, y up from the body origin (the axles sit 0.12 m lower on
// the lifted springs), z backwards, so the nose is at -z.
// Photographs and dimensions: reference/vehicles/landcruiser-fj40/SOURCES.md
// (the Camel Trophy dress: reference/vehicles/camel-trophy/SOURCES.md).
export const HW = 0.832; // half the 1.665 m body width
const AXLE = 1.15; // half the 2.3 m wheelbase
const ARCH = 0.52;
const ARCH_Y = 0.04;
const SILL = 0.08;
const BELT = 0.8;
const GUARD_TOP = 0.78;
export const NOSE = -1.8;
export const TAIL = 1.86;
const ROOF = 1.64;
const LAMP_Y = 0.55;
/** Top face of the flat bonnet. */
export const BONNET_TOP = 0.865;

const steel = new THREE.Color('#93988F'),
  chrome = new THREE.Color('#C9CCC6'),
  rubber = new THREE.Color('#252B28'),
  dark = new THREE.Color('#1C201E'),
  well = new THREE.Color('#2A2D2A'),
  glass = new THREE.Color('#9CB9B5'),
  red = new THREE.Color('#AE3029'),
  amber = new THREE.Color('#EDA53E'),
  lamp = new THREE.Color('#E3E4CD');

/** Paint for the body panels and for the hardtop, window frames and grille surround. */
export interface Livery {
  body: THREE.Color;
  roof: THREE.Color;
}

export const standardLivery: Livery = {
  body: pal('vehicleBody'),
  roof: pal('vehicleRoof'),
};

type P =
  | [number, number]
  | { arc: [number, number, number, number, number] }
  | { quad: [number, number, number, number] };

/**
 * A side profile (z, y), extruded across the car from x0 to x1. Edges are rounded by `bevel`
 * without growing the outline; curved panels get smooth shading and sharp folds stay sharp.
 * Faces of the wheel arches (`arches`: z, y, r) are painted as the dark inner wheel well.
 */
function sideProfile(
  b: VehicleBuilder,
  pts: P[],
  x0: number,
  x1: number,
  color: THREE.Color,
  zone: number,
  bevel: number,
  arches: [number, number, number][] = [],
): void {
  const s = new THREE.Shape();
  let first = true;
  for (const p of pts) {
    if (Array.isArray(p)) {
      if (first) s.moveTo(-p[0], p[1]);
      else s.lineTo(-p[0], p[1]);
    } else if ('arc' in p) {
      const [z, y, r, a0, a1] = p.arc;
      s.absarc(-z, y, r, a0, a1, false);
    } else {
      const [cz, cy, z, y] = p.quad;
      s.quadraticCurveTo(-cz, cy, -z, y);
    }
    first = false;
  }
  const size = bevel * 0.8;
  const raw = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, x1 - x0 - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: size,
    bevelOffset: -size,
    bevelSegments: 4,
    curveSegments: 28,
  });
  const g = toCreasedNormals(raw, Math.PI / 5);
  // Paint the arch walls dark: faces near an arch circle that face its centre.
  const pos = g.getAttribute('position'),
    nrm = g.getAttribute('normal');
  const colors = new Float32Array(pos.count * 3),
    slots = new Float32Array(pos.count);
  const c = new THREE.Vector3(),
    n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    c.set(0, 0, 0);
    n.set(0, 0, 0);
    for (let k = 0; k < 3; k++) {
      c.x += pos.getX(i + k) / 3;
      c.y += pos.getY(i + k) / 3;
      n.x += nrm.getX(i + k);
      n.y += nrm.getY(i + k);
      n.z += nrm.getZ(i + k);
    }
    n.normalize();
    let inWell = false;
    for (const [az, ay, ar] of arches) {
      const dx = -az - c.x,
        dy = ay - c.y,
        d = Math.hypot(dx, dy);
      if (d < ar + 0.01 && d > ar - 0.08 && (n.x * dx + n.y * dy) / d > 0.55) inWell = true;
    }
    const col = inWell ? well : color;
    for (let k = 0; k < 3; k++) {
      colors.set([col.r, col.g, col.b], (i + k) * 3);
      slots[i + k] = inWell ? M.Rubber : M.Paint;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.setAttribute('materialSlot', new THREE.BufferAttribute(slots, 1));
  g.rotateY(Math.PI / 2);
  b.tag = zone;
  b.push().translate(x0 + bevel, 0, 0);
  b.geometry(g, color);
  b.pop();
}

/** A plan-view outline (x, -z), extruded upwards from y0 to y1 with rounded edges. */
function planProfile(
  b: VehicleBuilder,
  shape: THREE.Shape,
  y0: number,
  y1: number,
  color: THREE.Color,
  zone: number,
  bevel: number,
): void {
  const size = bevel * 0.8;
  const raw = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, y1 - y0 - 2 * bevel),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: size,
    bevelOffset: -size,
    bevelSegments: 4,
    curveSegments: 20,
  });
  let g = toCreasedNormals(raw, Math.PI / 5);
  g.rotateX(-Math.PI / 2);
  b.slot = M.Paint;
  if (zone === Z.Roof) {
    g = subdivideSurface(g, (_c, n) => Math.abs(n.y) > 0.999, 2);
    const pos = g.getAttribute('position'),
      norm = g.getAttribute('normal');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setY(i, pos.getY(i) + 0.035 * Math.max(0, 1 - (x / HW) ** 2));
      const n = new THREE.Vector3(
        norm.getX(i) + ((0.07 * x) / (HW * HW)) * norm.getY(i),
        norm.getY(i),
        norm.getZ(i),
      ).normalize();
      norm.setXYZ(i, n.x, n.y, n.z);
    }
  }
  b.tag = zone;
  b.push().translate(0, y0 + bevel, 0);
  b.geometry(g, color);
  b.pop();
}

/** Plan outline: the body's width, square-ish at the front and rounded at the back. */
function plan(front: number, rear: number, half: number, rFront: number, rRear: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-half + rFront, -front);
  s.lineTo(half - rFront, -front);
  s.quadraticCurveTo(half, -front, half, -front - rFront);
  s.lineTo(half, -rear + rRear);
  s.absarc(half - rRear, -rear + rRear, rRear, 0, -Math.PI / 2, true);
  s.lineTo(-half + rRear, -rear);
  s.absarc(-half + rRear, -rear + rRear, rRear, -Math.PI / 2, -Math.PI, true);
  s.lineTo(-half, -front - rFront);
  s.quadraticCurveTo(-half, -front, -half + rFront, -front);
  return s;
}

/** Part of an upright cylinder round a rear corner, from y0 to y1. */
function corner(
  b: VehicleBuilder,
  side: number,
  r: number,
  y0: number,
  y1: number,
  color: THREE.Color,
  slot: number,
  zone: number,
): void {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, 18, 1, true, side > 0 ? 0 : -Math.PI / 2, Math.PI / 2);
  b.slot = slot as typeof b.slot;
  b.tag = zone;
  b.push().translate(side * (HW - r), (y0 + y1) / 2, TAIL - r);
  b.geometry(g, color);
  b.pop();
}

/** Round lamp: chrome bezel, dark seat and a domed lens, facing forwards from (x, y, z). */
function headlamp(b: VehicleBuilder, x: number, y: number, z: number): void {
  b.ring(x, y, z - 0.012, 0.094, 0.016, chrome, M.Metal, 'z', Z.Front);
  b.slot = M.Rubber;
  b.tag = Z.Front;
  b.push()
    .translate(x, y, z - 0.006)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.096, 0.096, 0.012, 28), rubber);
  b.pop();
  b.slot = M.Headlamp;
  b.push()
    .translate(x, y, z - 0.014)
    .scale(1, 1, 0.3);
  b.geometry(new THREE.SphereGeometry(0.084, 24, 12), lamp);
  b.pop();
  for (let i = -3; i <= 3; i++) {
    const w = Math.sqrt(0.078 ** 2 - (i * 0.02) ** 2) * 2;
    b.block(x, y + i * 0.02, z - 0.04, w, 0.003, 0.003, lamp, M.Headlamp, Z.Front);
  }
}

function front(b: VehicleBuilder, livery: Livery): void {
  const body = livery.body,
    cream = livery.roof;
  const a = Math.asin((0.16 - ARCH_Y) / ARCH);
  for (const side of [-1, 1]) {
    // Front guards: flat tops rolling over into an upright nose that carries the lamp,
    // tucking under into the wheel arch.
    const x0 = side > 0 ? 0.52 : -0.845,
      x1 = side > 0 ? 0.845 : -0.52;
    sideProfile(
      b,
      [
        [-0.6, 0.1],
        [-0.6, GUARD_TOP],
        [NOSE + 0.15, GUARD_TOP],
        { quad: [NOSE, GUARD_TOP, NOSE, GUARD_TOP - 0.15] },
        [NOSE, 0.27],
        { quad: [NOSE, 0.16, NOSE + 0.11, 0.16] },
        [-AXLE - ARCH * Math.cos(a), 0.16],
        { arc: [-AXLE, ARCH_Y, ARCH, a, Math.PI - a] },
        [-0.6, 0.16],
      ],
      x0,
      x1,
      body,
      Z.Front,
      0.05,
      [[-AXLE, ARCH_Y, ARCH]],
    );
    // Inner wheelhouse beside the engine, so the arch doesn't show daylight.
    b.block(side * 0.37, 0.36, -AXLE, 0.02, 0.62, 1.04, well, M.Rubber, Z.Trim);
    const lx = side * 0.683;
    headlamp(b, lx, LAMP_Y, NOSE);
    // Side lamp over an indicator, under the headlamp.
    b.block(lx, 0.315, NOSE - 0.008, 0.15, 0.085, 0.02, rubber, M.Rubber, Z.Front, 0.01);
    b.block(lx - side * 0.035, 0.315, NOSE - 0.02, 0.06, 0.055, 0.012, lamp, M.Headlamp, Z.Front, 0.006);
    b.block(lx + side * 0.035, 0.315, NOSE - 0.02, 0.06, 0.055, 0.012, amber, M.Amber, Z.Front, 0.006);
  }
  // Flat bonnet between the guards, standing a little above them, with its front lip.
  b.block(0, 0.825, -1.19, 1.06, 0.08, 1.15, body, M.Paint, Z.Front, 0.035);
  b.block(0, 0.8, -1.755, 1.04, 0.05, 0.03, body, M.Paint, Z.Front, 0.012);
  for (const side of [-1, 1]) b.block(side * 0.44, 0.868, -0.7, 0.07, 0.012, 0.12, steel, M.Metal, Z.Front);
  for (const side of [-1, 1]) {
    // Rolled bonnet shoulder and its visible rubber seam, external over-centre catches.
    b.block(side * 0.52, 0.79, -1.19, 0.018, 0.015, 1.1, rubber, M.Rubber, Z.Front, 0.006);
    b.block(side * 0.538, 0.745, -1.58, 0.018, 0.105, 0.042, steel, M.Metal, Z.Front, 0.005);
    b.rod(
      { x: side * 0.55, y: 0.72, z: -1.6 },
      { x: side * 0.55, y: 0.79, z: -1.6 },
      0.009,
      rubber,
      M.Rubber,
      Z.Front,
    );
  }
  // Dark engine bay behind the grille and under the bonnet.
  b.block(0, 0.47, -1.19, 0.72, 0.62, 1.08, dark, M.Rubber, Z.Trim);
  // 1979–84 rectangular bezel: one pressed surround spanning both round lamps.
  const rectangle = (x0: number, y0: number, x1: number, y1: number, r: number) => {
    const s = new THREE.Shape();
    s.moveTo(x0 + r, y0);
    s.lineTo(x1 - r, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + r);
    s.lineTo(x1, y1 - r);
    s.quadraticCurveTo(x1, y1, x1 - r, y1);
    s.lineTo(x0 + r, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  };
  const outer = rectangle(-0.81, 0.385, 0.81, 0.745, 0.045);
  const inner = rectangle(-0.795, 0.4, 0.795, 0.73, 0.035);
  outer.holes.push(new THREE.Path(inner.getPoints(24).reverse()));
  extrudeZ(b, outer, NOSE - 0.04, NOSE - 0.022, chrome, M.Metal, Z.Front, 0);
  const panel = rectangle(-0.795, 0.4, 0.795, 0.73, 0.035);
  for (const side of [-1, 1]) {
    const h = new THREE.Path();
    h.absarc(side * 0.683, LAMP_Y, 0.108, 0, Math.PI * 2, true);
    panel.holes.push(h);
  }
  const opening = rectangle(-0.495, 0.417, 0.495, 0.708, 0.035);
  panel.holes.push(new THREE.Path(opening.getPoints(24).reverse()));
  extrudeZ(b, panel, NOSE - 0.034, NOSE - 0.015, cream, M.Paint, Z.Front, 0);
  b.block(0, 0.561, NOSE + 0.004, 0.985, 0.29, 0.018, dark, M.Rubber, Z.Front, 0.02);
  // Dark, fine grille mesh behind a legible raised TOYOTA emblem, high enough in the grille
  // to clear the winch and the bull bar's mid rail.
  for (let i = 0; i < 11; i++)
    b.block(0, 0.43 + i * 0.026, NOSE - 0.01, 0.96, 0.005, 0.006, well, M.Metal, Z.Front);
  for (let i = 0; i < 35; i++)
    b.block(-0.476 + i * 0.028, 0.56, NOSE - 0.01, 0.004, 0.26, 0.006, well, M.Metal, Z.Front);
  b.block(0, 0.66, NOSE - 0.025, 0.44, 0.085, 0.012, dark, M.Rubber, Z.Front, 0.007);
  const glyphs: Record<string, string[]> = {
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  };
  for (let k = 0; k < 6; k++)
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 5; col++)
        if (glyphs['TOYOTA'[k]][row][col] === '1')
          b.block(
            -(-0.185 + k * 0.063 + col * 0.01),
            0.69 - row * 0.01,
            NOSE - 0.036,
            0.0102,
            0.0102,
            0.008,
            cream,
            M.Paint,
            Z.Front,
          );
  // Cowl in front of the screen, and a louvred vent on each side panel behind the guard.
  b.block(0, 0.83, -0.565, 1.66, 0.1, 0.12, body, M.Paint, Z.Front, 0.02);
  for (const side of [-1, 1]) {
    b.block(side * (HW - 0.005), 0.66, -0.552, 0.012, 0.15, 0.085, dark, M.Rubber, Z.Sides, 0.004);
    for (let i = 0; i < 4; i++)
      b.block(side * (HW + 0.002), 0.605 + i * 0.036, -0.552, 0.012, 0.01, 0.085, body, M.Paint, Z.Sides);
  }
}

function windscreen(b: VehicleBuilder, livery: Livery): void {
  const body = livery.body;
  // One flat pane in a body-colour frame, almost upright, with wipers parked at the bottom.
  b.push().translate(0, 1.19, -0.53).rotate(0.09, 0, 0);
  for (const y of [-0.3, 0.3]) b.block(0, y, 0, 1.64, 0.07, 0.06, body, M.Paint, Z.Front, 0.015);
  for (const x of [-0.79, 0.79]) b.block(x, 0, 0, 0.07, 0.66, 0.06, body, M.Paint, Z.Front, 0.015);
  b.block(0, 0, 0, 1.52, 0.54, 0.012, glass, M.Glass, Z.Glass);
  for (const x of [-0.42, 0.24])
    b.rod(
      { x, y: -0.255, z: -0.035 },
      { x: x + 0.34, y: -0.235, z: -0.035 },
      0.007,
      rubber,
      M.Rubber,
      Z.Front,
    );
  for (const x of [-0.42, 0.24]) b.block(x, -0.26, -0.03, 0.03, 0.03, 0.03, rubber, M.Rubber, Z.Front);
  b.pop();
  for (const side of [-1, 1]) {
    // Round mirrors on cranked stalks from brackets at the screen's lower corners.
    b.block(side * 0.84, 0.9, -0.51, 0.06, 0.05, 0.05, steel, M.Metal, Z.Trim, 0.01);
    stalk(
      b,
      [
        { x: side * 0.86, y: 0.9, z: -0.51 },
        { x: side * 0.94, y: 0.99, z: -0.53 },
        { x: side * 0.97, y: 1.12, z: -0.58 },
      ],
      0.01,
      steel,
    );
    roundHead(b, side, { x: side * 0.99, y: 1.16, z: -0.555 }, 0.07, steel);
  }
}

function sides(b: VehicleBuilder, livery: Livery): void {
  const body = livery.body,
    cream = livery.roof;
  const a = Math.asin((SILL - ARCH_Y) / ARCH);
  for (const side of [-1, 1]) {
    const x0 = side > 0 ? HW - 0.06 : -HW,
      x1 = side > 0 ? HW : -HW + 0.06;
    // Tub side and door below the belt, cut round the rear wheel.
    sideProfile(
      b,
      [
        [-0.6, SILL],
        [AXLE - ARCH * Math.cos(a), SILL],
        { arc: [AXLE, ARCH_Y, ARCH, a, Math.PI - a] },
        [TAIL - 0.1, SILL],
        [TAIL - 0.1, BELT],
        [-0.6, BELT],
      ],
      x0,
      x1,
      body,
      Z.Sides,
      0.02,
      [[AXLE, ARCH_Y, ARCH]],
    );
    // A painted lip round the rear arch and a dark inner wheelhouse.
    b.slot = M.Paint;
    b.tag = Z.Rear;
    b.push()
      .translate(side * (HW + 0.008), ARCH_Y, AXLE)
      .rotate(0, Math.PI / 2, 0);
    b.geometry(new THREE.TorusGeometry(ARCH + 0.012, 0.02, 6, 36, Math.PI - 2 * a).rotateZ(a), body);
    b.pop();
    b.block(side * 0.52, 0.33, AXLE, 0.02, 0.58, 1.04, well, M.Rubber, Z.Trim);
    b.block(side * 0.7, 0.6, AXLE, 0.25, 0.02, 1.04, well, M.Rubber, Z.Trim);
    // Pressed crease along the side, below the belt.
    b.block(side * (HW + 0.004), 0.66, 0.6, 0.012, 0.022, 2.4, body, M.Paint, Z.Sides, 0.006);
    // Door: shut lines, exposed hinges and a pull handle.
    for (const z of [-0.5, 0.5])
      b.block(side * (HW + 0.002), 0.79, z, 0.006, 1.42, 0.01, rubber, M.Rubber, Z.Sides);
    b.block(side * (HW + 0.002), 0.11, 0, 0.006, 0.01, 1.0, rubber, M.Rubber, Z.Sides);
    for (const y of [0.3, 0.66]) {
      b.block(side * (HW + 0.012), y, -0.48, 0.02, 0.07, 0.09, body, M.Paint, Z.Sides, 0.006);
      b.rod(
        { x: side * (HW + 0.025), y: y - 0.04, z: -0.52 },
        { x: side * (HW + 0.025), y: y + 0.04, z: -0.52 },
        0.012,
        steel,
      );
    }
    b.block(side * (HW + 0.012), 0.72, 0.38, 0.018, 0.04, 0.14, steel, M.Metal, Z.Sides, 0.008);
    // Door window frame in body colour, with a quarter-light at the front.
    const fx = side * (HW - 0.03);
    b.block(fx, 0.83, 0, 0.05, 0.06, 1.0, body, M.Paint, Z.Sides, 0.01);
    b.block(fx, 1.47, 0.01, 0.05, 0.06, 0.98, body, M.Paint, Z.Sides, 0.01);
    b.block(fx, 1.15, -0.475, 0.05, 0.66, 0.05, body, M.Paint, Z.Sides, 0.01);
    b.block(fx, 1.15, 0.475, 0.05, 0.66, 0.05, body, M.Paint, Z.Sides, 0.01);
    b.block(fx, 1.15, -0.25, 0.04, 0.6, 0.025, body, M.Paint, Z.Sides, 0.008);
    b.block(side * (HW - 0.035), 1.15, 0, 0.012, 0.58, 0.92, glass, M.Glass, Z.Glass);
    // Hardtop side behind the door: a sliding window, then the curved corner window.
    const hx = side * (HW - 0.03);
    b.block(hx, 0.84, 1.0, 0.05, 0.08, 1.0, cream, M.Paint, Z.Sides, 0.01);
    b.block(hx, 1.5, 1.0, 0.05, 0.1, 1.0, cream, M.Paint, Z.Sides, 0.01);
    b.block(hx, 1.17, 0.55, 0.05, 0.66, 0.1, cream, M.Paint, Z.Sides, 0.01);
    b.block(hx, 1.17, 1.44, 0.05, 0.66, 0.12, cream, M.Paint, Z.Sides, 0.01);
    b.block(side * (HW - 0.035), 1.17, 0.99, 0.012, 0.58, 0.78, glass, M.Glass, Z.Glass);
    b.block(side * (HW - 0.025), 1.17, 0.99, 0.016, 0.58, 0.02, cream, M.Paint, Z.Sides);
  }
}

function rear(b: VehicleBuilder, livery: Livery): void {
  const body = livery.body,
    cream = livery.roof;
  const R = 0.3;
  // The tub's back panel across the full width between its rounded corners.
  b.block(0, (SILL + BELT) / 2, TAIL - 0.03, 2 * (HW - 0.1) + 0.01, BELT - SILL, 0.06, body, M.Paint, Z.Rear);
  for (const side of [-1, 1]) {
    corner(b, side, 0.1, SILL, BELT, body, M.Paint, Z.Rear);
    // Hardtop corner: cream bands above and below a curved window.
    const band = (y0: number, y1: number, r: number, color: THREE.Color, slot: number) => {
      const g = new THREE.CylinderGeometry(
        r,
        r,
        y1 - y0,
        18,
        1,
        true,
        side > 0 ? 0 : -Math.PI / 2,
        Math.PI / 2,
      );
      b.slot = slot as typeof b.slot;
      b.tag = Z.Rear;
      b.push().translate(side * (HW - R), (y0 + y1) / 2, TAIL - R);
      b.geometry(g, color);
      b.pop();
    };
    band(BELT, 0.88, R, cream, M.Paint);
    band(0.88, 1.46, R - 0.005, glass, M.Glass);
    band(1.46, 1.56, R, cream, M.Paint);
    // The tub's top ledge round its tighter corner, under the hardtop's rounder one.
    const ledge = new THREE.Shape();
    const sx = side;
    ledge.moveTo(sx * (HW - R), -(TAIL - R));
    ledge.lineTo(sx * HW, -(TAIL - R));
    ledge.lineTo(sx * HW, -(TAIL - 0.1));
    ledge.absarc(sx * (HW - 0.1), -(TAIL - 0.1), 0.1, side > 0 ? 0 : Math.PI, -Math.PI / 2, side > 0);
    ledge.lineTo(sx * (HW - R), -TAIL);
    const lg = new THREE.ExtrudeGeometry(ledge, {
      depth: 0.012,
      bevelEnabled: false,
      curveSegments: 8,
    });
    lg.rotateX(-Math.PI / 2);
    b.slot = M.Paint;
    b.tag = Z.Rear;
    b.push().translate(0, BELT - 0.006, 0);
    b.geometry(lg, body);
    b.pop();
    // Corner glass meets the side pillar and the rear door frame.
    b.block(side * (HW - 0.03), 1.17, TAIL - R - 0.02, 0.05, 0.62, 0.05, cream, M.Paint, Z.Rear, 0.01);
    b.block(side * (HW - R + 0.02), 1.17, TAIL - 0.03, 0.05, 0.62, 0.05, cream, M.Paint, Z.Rear, 0.01);
    // Rear barn door: cream frame and glass above the belt.
    const dx = side * 0.27;
    b.block(dx, 0.84, TAIL - 0.02, 0.52, 0.08, 0.05, cream, M.Paint, Z.Rear, 0.01);
    b.block(dx, 1.51, TAIL - 0.02, 0.52, 0.1, 0.05, cream, M.Paint, Z.Rear, 0.01);
    b.block(side * 0.02, 1.17, TAIL - 0.02, 0.04, 0.62, 0.05, cream, M.Paint, Z.Rear, 0.01);
    b.block(side * 0.52, 1.17, TAIL - 0.02, 0.04, 0.62, 0.05, cream, M.Paint, Z.Rear, 0.01);
    b.block(dx, 1.17, TAIL - 0.025, 0.46, 0.58, 0.012, glass, M.Glass, Z.Glass);
    // Door shut lines and exposed hinges on the outer edges.
    b.block(side * 0.54, 0.79, TAIL + 0.002, 0.01, 1.42, 0.006, rubber, M.Rubber, Z.Rear);
    for (const y of [0.64, 1.25]) {
      b.block(side * 0.57, y, TAIL + 0.01, 0.07, 0.07, 0.02, body, M.Paint, Z.Rear, 0.006);
      b.rod(
        { x: side * 0.58, y: y - 0.045, z: TAIL + 0.025 },
        { x: side * 0.58, y: y + 0.045, z: TAIL + 0.025 },
        0.012,
        steel,
      );
    }
    // Small upright combination lamps on the corner panels, clear of the doors.
    const tx = side * 0.655;
    b.block(tx, 0.42, TAIL + 0.012, 0.11, 0.25, 0.025, rubber, M.Rubber, Z.Rear, 0.01);
    b.block(tx, 0.5, TAIL + 0.026, 0.085, 0.07, 0.012, red, M.Red, Z.Rear, 0.006);
    b.block(tx, 0.425, TAIL + 0.026, 0.085, 0.065, 0.012, amber, M.Amber, Z.Rear, 0.006);
    b.block(tx, 0.345, TAIL + 0.026, 0.085, 0.055, 0.012, lamp, M.Lamp, Z.Rear, 0.006);
    for (let i = 0; i < 3; i++)
      b.block(
        tx,
        0.48 + i * 0.02,
        TAIL + 0.034,
        0.08,
        0.003,
        0.003,
        red.clone().multiplyScalar(0.5),
        M.Red,
        Z.Rear,
      );
  }
  // Centre split and handle between the two doors.
  b.block(0, 0.79, TAIL + 0.002, 0.008, 1.42, 0.006, rubber, M.Rubber, Z.Rear);
  b.block(-0.09, 0.7, TAIL + 0.012, 0.11, 0.025, 0.025, steel, M.Metal, Z.Rear);
}

function roof(b: VehicleBuilder, livery: Livery): void {
  const cream = livery.roof;
  // Hardtop roof: rounded rear corners over the curved windows, drip rails, raised ribs.
  planProfile(b, plan(-0.53, TAIL, HW, 0.05, 0.3), 1.53, ROOF, cream, Z.Roof, 0.03);
  for (const side of [-1, 1])
    b.block(side * (HW + 0.008), 1.535, 0.6, 0.016, 0.018, 2.2, cream, M.Paint, Z.Roof, 0.006);
  for (const x of [-0.5, -0.25, 0.25, 0.5])
    b.block(
      x,
      ROOF + 0.005 + 0.035 * (1 - (x / HW) ** 2),
      0.66,
      0.035,
      0.014,
      2.25,
      cream,
      M.Paint,
      Z.Roof,
      0.006,
    );
}

/** The short-wheelbase body in a livery; `extras` adds what that livery carries on top. */
export function buildVehicleBody(
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
  livery: Livery = standardLivery,
  extras?: { aerialSide: -1 | 1; add(b: VehicleBuilder): void },
): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  for (const [z0, z1, w] of [
    [-0.7, 0.64, 1.5],
    [0.64, 1.68, 1.04],
    [1.68, 1.8, 1.5],
  ])
    b.block(0, 0.11, (z0 + z1) / 2, w, 0.06, z1 - z0, rubber, M.Rubber, Z.Trim);
  front(b, livery);
  windscreen(b, livery);
  sides(b, livery);
  rear(b, livery);
  roof(b, livery);
  addVehicleInterior(b, tuning.engine.redlineRpm);
  addVehicleEquipment(b, tuning, wheel, extras?.aerialSide);
  extras?.add(b);
  return cleanGeometry(subdivideSurface(b.build(), (c, n) => n.y > 0.95 && c.y > 0.7, 1));
}
