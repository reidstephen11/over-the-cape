import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import type { VehicleTuning } from '../data/vehicle';
import { sooty80Cabin } from '../data/sooty80';
import { VehicleBuilder, BodyZone as Z, VehicleMaterial as M } from './vehicleGeometry';
import { extrudeX, extrudeZ, sideShape, rounded, inset, type Vtx } from './bodyShapes';
import { cleanGeometry, continuousTube } from './bodyRefinement';
import { reviewRanges, markPart, attachParts } from './sooty80Parts';
import { addDialFaces, addSteeringColumn } from './vehicleInstruments';
import { mirrorHead } from './mirrors';
export { buildVehicleWheel } from './sooty80Wheel';
const F = -2.23,
  TAIL = 2.47,
  WB = 1.425,
  HW = 0.925,
  WAIST = 0.735,
  SILL = 0.035,
  ARCH = 0.56,
  ACY = -0.15,
  COWL = -0.98;
const paint = new THREE.Color('#99ACB5'),
  dark = new THREE.Color('#252B2D'),
  black = new THREE.Color('#1D2426'),
  steel = new THREE.Color('#A5ADAE'),
  chrome = new THREE.Color('#C1C9CB');
const glass = new THREE.Color('#6F8990'),
  red = new THREE.Color('#AE2924'),
  amber = new THREE.Color('#DB8F2E'),
  lens = new THREE.Color('#E2E3D7'),
  orange = new THREE.Color('#DE722B');
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const tube = (
  b: VehicleBuilder,
  p: number[][],
  r: number,
  c = black,
  zone: number = Z.Trim,
  slot: typeof b.slot = M.Metal,
) =>
  continuousTube(
    b,
    p.map((a) => v(a[0], a[1], a[2])),
    r,
    c,
    zone,
    slot,
  );
const rectangle = (x0: number, y0: number, x1: number, y1: number, r = 0.01) =>
  new THREE.Shape(
    rounded([
      [x0, y0, r],
      [x1, y0, r],
      [x1, y1, r],
      [x0, y1, r],
    ]),
  );
const edgeAt = (z: number) => 0.655 + 0.08 * THREE.MathUtils.clamp((z - F) / (COWL - F), 0, 1);
const topAt = (z: number) => (z < COWL ? edgeAt(z) - 0.03 : WAIST);
const xAt = (y: number) => HW - 0.135 * THREE.MathUtils.clamp((y - WAIST) / 0.535, 0, 1);
function reverse(g: THREE.BufferGeometry) {
  const raw = g.index ? g.toNonIndexed() : g;
  for (const a of Object.values(raw.attributes))
    for (let i = 0; i < a.count; i += 3)
      for (let k = 0; k < a.itemSize; k++) {
        const t = a.getComponent(i + 1, k);
        a.setComponent(i + 1, k, a.getComponent(i + 2, k));
        a.setComponent(i + 2, k, t);
      }
  const n = raw.getAttribute('normal');
  if (n) for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return raw;
}
/** Indexed smooth patch: longitudinal rows, cross-section columns. */
function patch(
  b: VehicleBuilder,
  rows: THREE.Vector3[][],
  color: THREE.Color,
  slot: typeof b.slot,
  zone: number,
  flip = false,
) {
  const cols = rows[0].length,
    positions = rows.flat().flatMap((p) => p.toArray()),
    ids: number[] = [];
  for (let i = 0; i < rows.length - 1; i++)
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j,
        c = a + cols + 1,
        bb = a + cols,
        d = a + 1;
      if (flip) ids.push(a, d, c, a, c, bb);
      else ids.push(a, bb, c, a, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(ids);
  g.computeVertexNormals();
  b.slot = slot;
  b.tag = zone;
  b.geometry(g, color);
}
function archLow(z: number) {
  let y = SILL;
  for (const axle of [-WB, WB])
    if (Math.abs(z - axle) < ARCH)
      y = Math.max(y, ACY + Math.sqrt(Math.max(0, ARCH * ARCH - (z - axle) ** 2)));
  return y;
}
function widthAt(y: number, z: number) {
  const blend = THREE.MathUtils.clamp((y - SILL) / (topAt(z) - SILL), 0, 1);
  let x = 0.905 + 0.02 * blend + 0.02 * Math.sin(Math.PI * blend);
  for (const edge of [F, TAIL])
    if (Math.abs(z - edge) < 0.12) {
      const t = 1 - Math.abs(z - edge) / 0.12;
      x -= 0.07 * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
    }
  return x;
}
function lowerBody(b: VehicleBuilder) {
  const zs = Array.from({ length: 121 }, (_, i) => F + ((TAIL - F) * i) / 120);
  for (const a of [-WB, WB])
    for (const d of [-1, 1]) zs.push(a + d * Math.sqrt(ARCH * ARCH - (SILL - ACY) ** 2));
  zs.sort((a, b) => a - b);
  for (const side of [-1, 1]) {
    const outer = zs.map((z) =>
      Array.from({ length: 11 }, (_, j) => {
        const y = archLow(z) + ((topAt(z) - archLow(z)) * j) / 10;
        return v(side * widthAt(y, z), y, z);
      }),
    );
    const inner = outer.map((row) => row.map((p) => v(p.x - side * 0.028, p.y, p.z)));
    patch(b, outer, paint, M.Paint, Z.Sides, side > 0);
    patch(b, inner, paint, M.Paint, Z.Sides, side < 0);
    patch(
      b,
      outer.map((r, i) => [inner[i][0], r[0]]),
      dark,
      M.Rubber,
      Z.Trim,
      side < 0,
    );
    patch(
      b,
      outer.map((r, i) => [r[r.length - 1], inner[i][r.length - 1]]),
      paint,
      M.Paint,
      Z.Sides,
      side < 0,
    );
    // Rounded front wing crowns roll down to the side skins.
    const rows = Array.from({ length: 33 }, (_, i) => {
      const z = F + ((COWL - F) * i) / 32;
      return Array.from({ length: 13 }, (_, j) => {
        const t = j / 12;
        return v(side * (0.64 + (0.925 - 0.64) * t), edgeAt(z) - 0.03 * t * t, z);
      });
    });
    patch(b, rows, paint, M.Paint, Z.Front, side < 0);
    for (const axle of [-WB, WB]) {
      const a = Math.asin((SILL - ACY) / ARCH),
        arc = (r: number) =>
          Array.from({ length: 49 }, (_, i) => {
            const aa = Math.asin((SILL - ACY) / r),
              t = aa + ((Math.PI - 2 * aa) * i) / 48;
            return [axle + r * Math.cos(t), ACY + r * Math.sin(t)] as Vtx;
          });
      extrudeX(
        b,
        sideShape([...arc(ARCH + 0.045), ...arc(ARCH - 0.005).reverse()]),
        side > 0 ? 0.902 : -0.982,
        side > 0 ? 0.982 : -0.902,
        black,
        M.Rubber,
        axle < 0 ? Z.Front : Z.Rear,
        0.007,
      );
      const innerX = axle < 0 ? 0.315 : 0.57;
      b.block(side * innerX, 0.44, axle, 0.025, 0.32, 1.16, dark, M.Rubber, Z.Trim);
      b.block((side * (innerX + 0.91)) / 2, 0.58, axle, 0.93 - innerX, 0.035, 1.16, dark, M.Rubber, Z.Trim);
      // End returns and clip bolts, all attached to the flare extrusion.
      for (let i = 0; i < 7; i++) {
        const t = a + 0.1 + ((Math.PI - 2 * a - 0.2) * i) / 6;
        b.block(
          side * 0.985,
          ACY + (ARCH + 0.023) * Math.sin(t),
          axle + (ARCH + 0.023) * Math.cos(t),
          0.008,
          0.01,
          0.01,
          steel,
          M.Metal,
          Z.Trim,
          0.003,
        );
      }
    }
    // Door seams follow the front arch return, keeping the recognisable four-door layout.
    tube(
      b,
      [
        [side * 0.933, 0.717, -0.99],
        [side * 0.931, 0.52, -0.98],
        [side * 0.926, 0.14, -0.82],
        [side * 0.91, 0.05, -0.7],
        [side * 0.91, 0.043, 0.27],
      ].map((p) => [side * (widthAt(p[1], p[2]) + 0.0015), p[1], p[2]]),
      0.0038,
      dark,
      Z.Sides,
      M.Rubber,
    );
    for (const z of [0.27, 1.12]) {
      const low = archLow(z) + 0.008;
      tube(
        b,
        [
          [side * 0.928, 0.72, z],
          [side * 0.929, Math.max(0.31, low + 0.022), z],
          [side * 0.91, low, z],
        ].map((p) => [side * (widthAt(p[1], p[2]) + 0.0015), p[1], p[2]]),
        0.0038,
        dark,
        Z.Sides,
        M.Rubber,
      );
    }
    for (const z of [0.12, 0.96]) {
      b.block(side * 0.938, 0.66, z, 0.02, 0.043, 0.15, black, M.Rubber, Z.Sides, 0.009);
      b.block(side * 0.95, 0.668, z - 0.025, 0.008, 0.011, 0.083, steel, M.Metal, Z.Sides, 0.003);
    }
    b.block(
      side * 0.94,
      0.47,
      0.1,
      0.018,
      0.038,
      1.8,
      paint.clone().multiplyScalar(0.87),
      M.Paint,
      Z.Sides,
      0.008,
    );
    b.block(side * 0.908, 0.03, 0.18, 0.055, 0.045, 1.8, black, M.Rubber, Z.Trim, 0.012);
  }
}
function bonnet(b: VehicleBuilder) {
  const rows = Array.from({ length: 34 }, (_, i) => {
    const z = F + 0.025 + ((COWL - F - 0.04) * i) / 33;
    return Array.from({ length: 33 }, (_, j) => {
      const x = -0.645 + (1.29 * j) / 32;
      return v(x, edgeAt(z) + 0.037 * (1 - (x / 0.66) ** 2), z);
    });
  });
  patch(b, rows, paint, M.Paint, Z.Front);
  patch(
    b,
    rows.map((r) => r.map((p) => v(p.x, p.y - 0.035, p.z))),
    paint,
    M.Paint,
    Z.Front,
    true,
  );
  for (const j of [0, 32])
    patch(
      b,
      rows.map((r) => [v(r[j].x, r[j].y - 0.035, r[j].z), r[j]]),
      paint,
      M.Paint,
      Z.Front,
      j === 0,
    );
  for (const row of [rows[0], rows[rows.length - 1]])
    patch(b, [row.map((p) => v(p.x, p.y - 0.035, p.z)), row], paint, M.Paint, Z.Front, row !== rows[0]);
  for (const side of [-1, 1])
    b.block(side * 0.65, 0.727, -1.01, 0.012, 0.01, 0.11, dark, M.Rubber, Z.Front, 0.004);
  b.block(0, 0.76, COWL + 0.005, 1.83, 0.065, 0.12, paint, M.Paint, Z.Front, 0.025);
  b.block(0, 0.43, -1.54, 0.58, 0.5, 1.05, black, M.Rubber, Z.Trim, 0.025);
}
/** Real openings in a tumblehome side frame, with smoothed bevels and preserved normals. */
function sidePanel(
  b: VehicleBuilder,
  side: number,
  verts: Vtx[],
  holes: Vtx[][],
  c: THREE.Color,
  slot: typeof b.slot,
  zone: number,
  offset = 0,
) {
  const raw = new THREE.ExtrudeGeometry(sideShape(verts, holes), {
    depth: 0.026,
    bevelEnabled: false,
    curveSegments: 16,
  });
  const g = toCreasedNormals(raw, Math.PI / 4);
  g.rotateY(Math.PI / 2);
  g.translate(side > 0 ? HW - 0.026 : -HW, 0, 0);
  const p = g.getAttribute('position'),
    n = g.getAttribute('normal');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setX(i, p.getX(i) + side * (xAt(y) - HW + offset));
    const nn = v(n.getX(i), n.getY(i) + ((side * 0.135) / 0.535) * n.getX(i), n.getZ(i)).normalize();
    n.setXYZ(i, nn.x, nn.y, nn.z);
  }
  b.slot = slot;
  b.tag = zone;
  b.geometry(g, c);
}
function sideGlass(b: VehicleBuilder, side: number, pts: Vtx[]) {
  let g = new THREE.ShapeGeometry(sideShape(pts), 20);
  g.rotateY(Math.PI / 2);
  const p = g.getAttribute('position'),
    n = g.getAttribute('normal');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setX(i, side * (xAt(y) - 0.01));
    n.setXYZ(i, 1, (side * 0.135) / 0.535, 0);
  }
  if (side < 0) g = reverse(g) as THREE.ShapeGeometry;
  b.slot = M.Glass;
  b.tag = Z.Glass;
  b.geometry(g, glass);
}
function glasshouse(b: VehicleBuilder) {
  const outline: Vtx[] = [
    [-1.005, 0.718],
    [-0.755, 1.282, 0.035],
    [2.29, 1.282, 0.045],
    [2.445, 1.1, 0.05],
    [2.445, 0.718],
  ];
  const windows: Vtx[][] = [
    [
      [-0.957, 0.768],
      [-0.727, 1.241, 0.025],
      [0.205, 1.241, 0.025],
      [0.205, 0.768, 0.018],
    ],
    [
      [0.32, 0.768],
      [0.32, 1.241, 0.02],
      [1.073, 1.241, 0.02],
      [1.073, 0.768, 0.02],
    ],
    [
      [1.18, 0.768],
      [1.18, 1.241, 0.025],
      [2.225, 1.241, 0.03],
      [2.358, 1.084, 0.04],
      [2.358, 0.768, 0.025],
    ],
  ];
  for (const side of [-1, 1]) {
    const a = v(side * 0.86, 0.75, -1.02),
      bb = v(side * 0.765, 1.27, -0.75),
      c = v(side * xAt(1.282), 1.282, -0.755),
      d = v(side * HW, 0.718, -1.005);
    b.slot = M.Paint;
    b.tag = Z.Front;
    if (side > 0) b.quad(a, bb, c, d, paint);
    else b.quad(d, c, bb, a, paint);
    sidePanel(b, side, outline, windows, paint, M.Paint, Z.Sides);
    for (let j = 0; j < windows.length; j++) {
      const outer = windows[j],
        inner = inset(outer, 0.014);
      sidePanel(b, side, outer, [inner], black, M.Rubber, Z.Sides, 0.006);
      sideGlass(b, side, inset(inner, 0.002));
      if (j === 2) {
        for (const z of [1.42, 2.1])
          b.block(side * (xAt(1.239) + 0.014), 1.239, z, 0.035, 0.022, 0.09, steel, M.Metal, Z.Trim, 0.006);
        for (const z of [1.4, 2.12])
          b.block(side * (xAt(0.799) + 0.014), 0.799, z, 0.025, 0.038, 0.05, black, M.Rubber, Z.Trim, 0.005);
      }
    }
    // Front quarterlight and mirrors carried by an actual triangular sail.
    b.block(side * (xAt(1.02) + 0.003), 1.02, -0.72, 0.018, 0.43, 0.018, black, M.Rubber, Z.Sides);
    b.block(side * 0.928, 0.8, -0.88, 0.045, 0.13, 0.15, black, M.Rubber, Z.Trim, 0.018);
    b.rod(v(side * 0.95, 0.82, -0.86), v(side * 1.035, 0.87, -0.84), 0.022, black, M.Rubber, Z.Trim);
    mirrorHead(b, side, v(side * 1.075, 0.91, -0.81), 0.2, 0.13, 0.105, paint, 0.12);
  }
  // Windscreen frame and glass are raked together, rather than standing vertically.
  const h = Math.hypot(0.52, 0.27),
    lean = Math.atan2(0.27, 0.52);
  b.push().translate(0, 0.75, -1.02).rotate(lean, 0, 0);
  for (const y of [0, h]) b.block(0, y, 0, y === 0 ? 1.76 : 1.53, 0.045, 0.05, paint, M.Paint, Z.Front, 0.01);
  for (const side of [-1, 1])
    b.rod(v(side * 0.86, 0.0, 0), v(side * 0.765, h, 0), 0.026, paint, M.Paint, Z.Front);
  const wind = new THREE.Shape(
    rounded([
      [-0.823, 0.028],
      [0.823, 0.028],
      [0.728, h - 0.025],
      [-0.728, h - 0.025],
    ]),
  );
  let pane = new THREE.ShapeGeometry(wind);
  pane = reverse(pane) as THREE.ShapeGeometry;
  b.slot = M.Glass;
  b.tag = Z.Glass;
  b.geometry(pane, glass);
  for (const x of [-0.49, 0.18])
    b.rod(v(x, 0.03, -0.028), v(x + 0.35, 0.06, -0.028), 0.006, black, M.Rubber, Z.Front);
  b.pop();
}
function roof(b: VehicleBuilder) {
  const pts: Vtx[] = [
    [-0.806, 1.27],
    [0.806, 1.27],
    [0.806, 1.294, 0.025],
    [0.72, 1.326, 0.035],
  ];
  for (let i = 1; i <= 32; i++) {
    const x = 0.72 - (1.44 * i) / 32;
    pts.push([x, 1.326 + 0.017 * (1 - (x / 0.72) ** 2)]);
  }
  pts.push([-0.806, 1.294, 0.025]);
  extrudeZ(b, new THREE.Shape(rounded(pts)), -0.755, 2.335, paint, M.Paint, Z.Roof, 0.02);
  for (const side of [-1, 1])
    b.block(side * 0.813, 1.277, 0.78, 0.018, 0.018, 3.03, paint, M.Paint, Z.Roof, 0.006);
  for (const x of [-0.42, -0.21, 0.21, 0.42])
    b.block(
      x,
      1.331 + 0.017 * (1 - (x / 0.72) ** 2),
      0.78,
      0.027,
      0.009,
      2.93,
      paint,
      M.Paint,
      Z.Roof,
      0.004,
    );
}
function frontEnd(b: VehicleBuilder) {
  b.block(0, 0.493, F + 0.027, 1.73, 0.297, 0.055, paint, M.Paint, Z.Front, 0.045);
  for (const side of [-1, 1]) {
    const x = side * 0.662;
    b.block(x, 0.514, F - 0.008, 0.365, 0.205, 0.033, black, M.Rubber, Z.Front, 0.022);
    b.block(x, 0.518, F - 0.029, 0.337, 0.174, 0.018, chrome, M.Metal, Z.Front, 0.018);
    b.block(x, 0.518, F - 0.041, 0.315, 0.153, 0.016, lens, M.Headlamp, Z.Front, 0.015);
    for (let i = 0; i < 11; i++)
      b.block(x - 0.142 + i * 0.028, 0.518, F - 0.052, 0.003, 0.133, 0.004, lens, M.Headlamp, Z.Front);
    b.block(side * 0.842, 0.514, F + 0.005, 0.091, 0.198, 0.052, amber, M.Amber, Z.Front, 0.02);
    b.push()
      .translate(side * 0.894, 0.514, F + 0.04)
      .rotate(0, -side * 0.45, 0);
    b.block(0, 0, 0, 0.066, 0.183, 0.025, amber, M.Amber, Z.Front, 0.015);
    b.pop();
  }
  b.block(0, 0.51, F - 0.01, 0.946, 0.24, 0.035, black, M.Rubber, Z.Front, 0.025);
  for (const y of [0.415, 0.506, 0.598])
    b.block(0, y, F - 0.035, 0.916, 0.02, 0.024, chrome, M.Metal, Z.Front, 0.008);
  for (const side of [-1, 1])
    b.block(side * 0.457, 0.507, F - 0.034, 0.018, 0.204, 0.025, chrome, M.Metal, Z.Front, 0.005);
  // Toyota oval centred on the three-bar early-80 grille.
  b.slot = M.Metal;
  b.tag = Z.Front;
  b.push()
    .translate(0, 0.51, F - 0.058)
    .scale(1, 0.6, 1);
  b.geometry(new THREE.TorusGeometry(0.054, 0.004, 6, 36), chrome);
  b.pop();
  b.push()
    .translate(0, 0.51, F - 0.062)
    .scale(0.43, 1, 1);
  b.geometry(new THREE.TorusGeometry(0.033, 0.0034, 6, 28), chrome);
  b.pop();
  b.block(0, 0.39, F + 0.027, 0.71, 0.015, 0.026, black, M.Rubber, Z.Front);
}
function rearEnd(b: VehicleBuilder) {
  b.block(0, 0.365, TAIL - 0.018, 1.78, 0.62, 0.048, paint, M.Paint, Z.Rear, 0.045);
  const shape = new THREE.Shape(
    rounded([
      [-0.9, 0.714],
      [0.9, 0.714],
      [0.78, 1.28, 0.025],
      [-0.78, 1.28, 0.025],
    ]),
  );
  const hole = rectangle(-0.72, 0.78, 0.72, 1.224, 0.045);
  shape.holes.push(new THREE.Path(hole.getPoints(20).reverse()));
  const gg = new THREE.ShapeGeometry(shape);
  const pp = gg.getAttribute('position'),
    nn = gg.getAttribute('normal');
  for (let i = 0; i < pp.count; i++) {
    pp.setZ(i, TAIL - (0.155 * (pp.getY(i) - 0.735)) / 0.545);
    nn.setXYZ(i, 0, 0.155 / 0.545, 1);
  }
  b.slot = M.Paint;
  b.tag = Z.Rear;
  b.geometry(gg, paint);
  const seal = rectangle(-0.735, 0.765, 0.735, 1.239, 0.052);
  seal.holes.push(new THREE.Path(rectangle(-0.711, 0.788, 0.711, 1.216, 0.041).getPoints(20).reverse()));
  for (const [s, c, slot] of [
    [seal, black, M.Rubber],
    [rectangle(-0.718, 0.782, 0.718, 1.22, 0.045), glass, M.Glass],
  ] as const) {
    const g = new THREE.ShapeGeometry(s);
    const p = g.getAttribute('position'),
      n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i++) {
      p.setZ(i, TAIL + 0.007 - (0.155 * (p.getY(i) - 0.735)) / 0.545);
      n.setXYZ(i, 0, 0.155 / 0.545, 1);
    }
    b.slot = slot;
    b.tag = slot === M.Glass ? Z.Glass : Z.Rear;
    b.geometry(g, c);
  }
  b.block(0, 0.613, TAIL + 0.011, 1.56, 0.008, 0.008, black, M.Rubber, Z.Rear);
  b.block(-0.3, 0.405, TAIL + 0.026, 0.37, 0.13, 0.02, black, M.Rubber, Z.Rear, 0.008);
  plate(b, -0.3, 0.405, TAIL + 0.04, 1, '80 MK2');
  b.block(0.09, 0.65, TAIL + 0.027, 0.16, 0.034, 0.026, black, M.Rubber, Z.Rear, 0.008);
  for (const side of [-1, 1]) {
    const x = side * 0.83;
    b.block(x, 0.524, TAIL - 0.006, 0.146, 0.355, 0.058, black, M.Rubber, Z.Rear, 0.025);
    for (const [y, c, slot, h] of [
      [0.627, red, M.Red, 0.12],
      [0.522, lens, M.Lamp, 0.069],
      [0.422, amber, M.Amber, 0.105],
    ] as const) {
      b.block(x, y, TAIL + 0.03, 0.121, h, 0.018, c, slot, Z.Rear, 0.012);
      for (let i = 0; i < 4; i++)
        b.block(x - 0.045 + i * 0.03, y, TAIL + 0.041, 0.002, h - 0.012, 0.003, c, slot, Z.Rear);
    }
  }
  b.rod(v(-0.49, 0.831, TAIL - 0.011), v(0.16, 0.849, TAIL - 0.017), 0.007, black, M.Rubber, Z.Rear);
  b.block(0.35, 1.257, TAIL - 0.15, 0.25, 0.027, 0.025, red, M.Red, Z.Rear, 0.007);
}
function chassis(b: VehicleBuilder, t: VehicleTuning) {
  // Long, stepped ladder frame with raised sections above the spring seats.
  for (const side of [-1, 1]) {
    const front: Vtx[] = [
      [-2.24, 0.04],
      [-1.82, 0.255],
      [-1.02, 0.255],
      [-0.76, -0.085],
      [-0.76, 0.085],
      [-1.02, 0.425],
      [-1.82, 0.425],
      [-2.24, 0.21],
    ];
    const back: Vtx[] = [
      [-0.65, -0.085],
      [0.65, -0.085],
      [0.94, 0.255],
      [1.94, 0.255],
      [2.25, 0.03],
      [2.48, 0.03],
      [2.48, 0.2],
      [2.25, 0.2],
      [1.94, 0.425],
      [0.94, 0.425],
      [0.65, 0.085],
      [-0.65, 0.085],
    ];
    extrudeX(b, sideShape(front), side * 0.31 - 0.045, side * 0.31 + 0.045, black, M.Metal, Z.Trim, 0.008);
    extrudeX(b, sideShape(back), side * 0.43 - 0.045, side * 0.43 + 0.045, black, M.Metal, Z.Trim, 0.008);
    b.rod(v(side * 0.31, 0, -0.76), v(side * 0.43, 0, -0.65), 0.045, black, M.Metal, Z.Trim);
  }
  for (const z of [-2.08, -0.62, 0.55, 2.3])
    b.block(0, z < -1 ? 0.22 : 0.06, z, z < -1 ? 0.62 : 0.86, 0.08, 0.09, black, M.Metal, Z.Trim);
  for (const [z0, z1, width, y] of [
    [-0.88, 0.86, 1.72, 0.14],
    [0.86, 2.0, 1.1, 0.46],
    [2.0, 2.4, 1.7, 0.46],
  ])
    b.block(0, y, (z0 + z1) / 2, width, 0.04, z1 - z0, black, M.Rubber, Z.Trim);
  b.block(0, 0.3, 0.85, 1.1, 0.32, 0.04, black, M.Rubber, Z.Trim);
  b.block(0, -0.025, -0.25, 0.36, 0.19, 0.71, dark, M.Metal, Z.Trim, 0.03);
  b.rod(v(0.08, -0.09, -0.56), v(0.08, -0.196, -WB), 0.031, steel, M.Metal, Z.Trim);
  b.rod(v(0.08, -0.08, 0.13), v(0.08, -0.196, WB), 0.031, steel, M.Metal, Z.Trim);
  b.block(0.6, 0.04, 0.15, 0.27, 0.22, 0.65, black, M.Metal, Z.Trim, 0.03);
  tube(
    b,
    [
      [-0.23, -0.07, -0.85],
      [-0.23, -0.07, 1.75],
      [-0.7, -0.04, 2.31],
    ],
    0.034,
    steel,
    Z.Trim,
  );
  // Explicit coil seats and damper towers; only their intended contacts are excluded in suspension-body checks.
  markPart(b, 1024, () => {
    for (const w of t.wheels) {
      const side = Math.sign(w.x),
        sx = w.x - side * 0.42,
        rail = side * (w.front ? 0.31 : 0.43),
        dz = w.front ? 0.16 : -0.16,
        dx = sx + (w.front ? 0.02 : -0.1) * side;
      b.block(sx, 0.26, w.z, 0.21, 0.025, 0.22, black, M.Metal, Z.Trim, 0.006);
      for (const z of [w.z - 0.075, w.z + 0.075])
        b.rod(v(rail, 0.34, z), v(sx, 0.25, z), 0.017, steel, M.Metal, Z.Trim);
      b.rod(v(rail, 0.34, w.z + dz), v(dx, 0.32, w.z + dz), 0.017, steel, M.Metal, Z.Trim);
      b.block(dx, 0.32, w.z + dz, 0.07, 0.04, 0.07, black, M.Metal, Z.Trim, 0.005);
    }
  });
}
function interior(b: VehicleBuilder, t: VehicleTuning) {
  const cloth = new THREE.Color('#4C5354');
  b.block(0, 0.7, -0.74, 1.64, 0.24, 0.25, black, M.Rubber, Z.Trim, 0.035);
  // Keep the instrument pod behind the dial faces so the working gauges are visible.
  b.block(0.43, 0.78, -0.675, 0.46, 0.19, 0.14, dark, M.Rubber, Z.Trim, 0.024);
  addDialFaces(b, sooty80Cabin, t.engine.redlineRpm);
  addSteeringColumn(b, sooty80Cabin);
  b.block(-0.04, 0.69, -0.59, 0.31, 0.19, 0.022, black, M.Rubber, Z.Trim, 0.009);
  b.block(-0.04, 0.7, -0.574, 0.25, 0.125, 0.008, new THREE.Color('#506A72'), M.Paint, Z.Trim, 0.005);
  for (const x of [-0.43, 0.43]) {
    b.block(x, 0.43, 0.03, 0.51, 0.14, 0.54, cloth, M.Fabric, Z.Trim, 0.05);
    b.push().translate(x, 0.79, 0.3).rotate(-0.1, 0, 0);
    b.block(0, 0, 0, 0.51, 0.65, 0.14, cloth, M.Fabric, Z.Trim, 0.05);
    b.pop();
    for (const dx of [-0.16, 0.16]) b.block(x + dx, 0.28, 0.02, 0.025, 0.2, 0.45, steel, M.Metal, Z.Trim);
    b.block(x, 1.12, 0.32, 0.26, 0.16, 0.095, cloth, M.Fabric, Z.Trim, 0.035);
  }
  b.block(0, 0.33, 0.16, 0.24, 0.25, 0.78, black, M.Rubber, Z.Trim, 0.025);
  for (const [x, z, h] of [
    [0.04, -0.16, 0.62],
    [-0.08, -0.04, 0.52],
  ]) {
    b.rod(v(x, 0.35, z + 0.1), v(x, h, z), 0.009, steel, M.Metal, Z.Trim);
    b.slot = M.Rubber;
    b.tag = Z.Trim;
    b.push().translate(x, h, z);
    b.geometry(new THREE.SphereGeometry(0.025, 12, 8), black);
    b.pop();
  }
  // Rear seats removed in the MkII-inspired layout: drawers, water and a fridge instead.
  b.block(0, 0.585, 1.53, 1.25, 0.21, 1.61, dark, M.Fabric, Z.Trim, 0.018);
  for (const x of [-0.32, 0.32]) {
    b.block(x, 0.579, 2.343, 0.59, 0.16, 0.022, black, M.Metal, Z.Trim, 0.006);
    b.rod(v(x - 0.08, 0.59, 2.362), v(x + 0.08, 0.59, 2.362), 0.009, steel, M.Metal, Z.Trim);
  }
  b.block(-0.32, 0.94, 1.83, 0.54, 0.48, 0.65, new THREE.Color('#727E80'), M.Metal, Z.Trim, 0.035);
  b.block(-0.32, 1.189, 1.83, 0.55, 0.032, 0.66, black, M.Rubber, Z.Trim, 0.018);
  for (const x of [-0.56, -0.08]) b.block(x, 0.99, 2.164, 0.022, 0.1, 0.028, black, M.Rubber, Z.Trim, 0.006);
  b.block(0.35, 0.85, 1.89, 0.3, 0.32, 0.2, new THREE.Color('#969F8E'), M.Paint, Z.Trim, 0.025);
  b.block(0.35, 1.024, 1.89, 0.16, 0.04, 0.06, black, M.Rubber, Z.Trim, 0.008);
  b.block(0.28, 0.82, 1.19, 0.53, 0.27, 0.5, new THREE.Color('#6D705E'), M.Fabric, Z.Trim, 0.04);
}
function plate(b: VehicleBuilder, x: number, y: number, z: number, facing: number, text: string) {
  const glyphs: Record<string, string[]> = {
    '0': ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'],
    '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'],
    '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'],
    M: ['10001', '11011', '10101', '10001', '10001'],
    K: ['101', '110', '100', '110', '101'],
    ' ': ['000', '000', '000', '000', '000'],
  };
  b.push()
    .translate(x, y, z)
    .rotate(0, facing < 0 ? Math.PI : 0, 0);
  b.block(0, 0, 0, 0.34, 0.105, 0.016, black, M.Rubber, Z.Trim, 0.007);
  b.block(0, 0, 0.011, 0.32, 0.087, 0.008, new THREE.Color('#E3E5DD'), M.Paint, Z.Trim, 0.004);
  let xx = -0.132;
  for (const char of text) {
    const gl = glyphs[char];
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < gl[row].length; col++)
        if (gl[row][col] === '1')
          b.block(
            xx + col * 0.009,
            -0.025 + (4 - row) * 0.012,
            0.018,
            0.0085,
            0.0115,
            0.004,
            black,
            M.Rubber,
            Z.Trim,
          );
    xx += (gl[0].length + 1) * 0.009;
  }
  b.pop();
}
function bullbar(b: VehicleBuilder) {
  const face = F - 0.22,
    back = F - 0.03;
  const p = new THREE.Shape(
    rounded([
      [-0.73, -face],
      [0.73, -face],
      [0.99, -face - 0.11],
      [1.01, -back],
      [-1.01, -back],
      [-0.99, -face - 0.11],
    ]),
  );
  const pan = new THREE.ExtrudeGeometry(p, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 3,
  });
  pan.rotateX(-Math.PI / 2);
  b.slot = M.Metal;
  b.tag = Z.Front;
  b.push().translate(0, 0.105, 0);
  b.geometry(pan, black);
  b.pop();
  for (const x of [-0.31, 0.31])
    b.block(x, 0.17, back + 0.1, 0.08, 0.15, 0.34, black, M.Metal, Z.Trim, 0.006);
  const zc = (face + back) / 2,
    zt = F - 0.12;
  tube(
    b,
    [
      [-0.43, 0.32, zc],
      [-0.43, 0.79, zt],
      [0.43, 0.79, zt],
      [0.43, 0.32, zc],
    ],
    0.031,
    black,
    Z.Front,
  );
  const yy = 0.65,
    zz = zc + ((zt - zc) * (yy - 0.32)) / (0.79 - 0.32);
  for (const side of [-1, 1]) {
    tube(
      b,
      [
        [side * 0.99, 0.32, zc + 0.04],
        [side * 0.99, 0.67, zt + 0.05],
        [side * 0.84, 0.7, zz],
        [side * 0.43, yy, zz],
      ],
      0.028,
      black,
      Z.Front,
    );
    for (const x of [side * 0.43, side * 0.99])
      b.block(
        x,
        0.322,
        zc + (Math.abs(x) > 0.9 ? 0.04 : 0),
        0.075,
        0.04,
        0.12,
        black,
        M.Metal,
        Z.Front,
        0.004,
      );
  }
  // Red Edition-style winch, steel drum and a properly pierced hawse fairlead.
  b.rod(v(-0.15, 0.35, back - 0.075), v(0.17, 0.35, back - 0.075), 0.067, dark, M.Metal, Z.Front);
  for (let i = 0; i < 14; i++)
    b.ring(-0.14 + i * 0.022, 0.35, back - 0.075, 0.067, 0.004, steel, M.Metal, 'x', Z.Front);
  b.block(-0.235, 0.35, back - 0.075, 0.15, 0.15, 0.17, new THREE.Color('#B53428'), M.Paint, Z.Front, 0.018);
  b.block(0.205, 0.35, back - 0.075, 0.05, 0.16, 0.17, black, M.Metal, Z.Front, 0.008);
  const fair = rectangle(-0.16, 0.17, 0.16, 0.28, 0.025);
  fair.holes.push(new THREE.Path(rectangle(-0.11, 0.203, 0.11, 0.247, 0.018).getPoints(16).reverse()));
  extrudeZ(b, fair, face - 0.055, face - 0.025, steel, M.Metal, Z.Front, 0.002);
  b.ring(0, 0.195, face - 0.084, 0.024, 0.008, new THREE.Color('#C13C2C'), M.Paint, 'z', Z.Front);
  for (const x of [-0.225, 0.225]) {
    b.block(x, 0.377, zt - 0.1, 0.055, 0.11, 0.07, black, M.Metal, Z.Front, 0.007);
    b.slot = M.Rubber;
    b.tag = Z.Front;
    b.push()
      .translate(x, 0.545, zt - 0.1)
      .rotate(Math.PI / 2, 0, 0);
    b.geometry(new THREE.CylinderGeometry(0.105, 0.091, 0.075, 32), black);
    b.pop();
    b.ring(x, 0.545, zt - 0.142, 0.101, 0.007, steel, M.Metal, 'z', Z.Front);
    b.slot = M.DrivingLamp;
    b.push()
      .translate(x, 0.545, zt - 0.148)
      .scale(1, 1, 0.12);
    b.geometry(new THREE.SphereGeometry(0.092, 24, 10), lens);
    b.pop();
    for (const [dx, dy] of [
      [-0.042, -0.032],
      [0, -0.032],
      [0.042, -0.032],
      [-0.042, 0.032],
      [0, 0.032],
      [0.042, 0.032],
    ])
      b.block(x + dx, 0.545 + dy, zt - 0.161, 0.027, 0.028, 0.004, lens, M.DrivingLamp, Z.Front, 0.004);
  }
  for (const side of [-1, 1]) {
    b.block(side * 0.66, 0.14, face - 0.014, 0.075, 0.11, 0.06, steel, M.Metal, Z.Front, 0.008);
    b.ring(side * 0.66, 0.1, face - 0.06, 0.036, 0.01, new THREE.Color('#B93828'), M.Paint, 'x', Z.Front);
  }
  b.block(-0.5, 0.215, face - 0.03, 0.36, 0.13, 0.025, black, M.Metal, Z.Front, 0.005);
  plate(b, -0.5, 0.215, face - 0.049, -1, '80 MK2');
  // Aerial base is bolted to the outer bar wing.
  b.block(0.83, 0.704, zt + 0.015, 0.075, 0.045, 0.08, black, M.Rubber, Z.Front, 0.01);
  b.rod(v(0.83, 0.725, zt + 0.015), v(0.85, 1.53, zt + 0.04), 0.006, black, M.Rubber, Z.Front);
}
function sideProtectionAndIntake(b: VehicleBuilder) {
  for (const side of [-1, 1]) {
    tube(
      b,
      [
        [side * 0.99, 0.55, F - 0.01],
        [side * 1.01, 0.53, -1.82],
        [side * 1.015, 0.47, -0.73],
        [side * 1.015, 0.04, -0.68],
      ],
      0.029,
    );
    tube(
      b,
      [
        [side * 1.015, 0.04, -0.68],
        [side * 1.015, 0.04, 0.83],
      ],
      0.03,
    );
    b.block(side * 0.985, 0.048, 0.08, 0.16, 0.028, 1.49, black, M.Metal, Z.Trim, 0.012);
    for (const z of [-0.48, 0.24, 0.73])
      b.rod(v(side * 0.43, 0.01, z), v(side * 1.015, 0.04, z), 0.025, black, M.Metal, Z.Trim);
  }
  // Four-inch stainless intake follows the right windscreen pillar, with attached clamps.
  const sx = 1.002;
  b.block(0.794, 0.735, -1.12, 0.18, 0.07, 0.18, black, M.Rubber, Z.Front, 0.02);
  tube(
    b,
    [
      [0.794, 0.765, -1.12],
      [0.94, 0.8, -0.98],
      [sx, 0.99, -0.84],
      [sx, 1.33, -0.67],
    ],
    0.0508,
    steel,
    Z.Front,
  );
  for (const y of [1.12, 1.25]) {
    const z = -0.84 + ((y - 0.99) / 0.34) * 0.17;
    b.push().translate(sx, y, z).rotate(Math.atan2(0.17, 0.34), 0, 0);
    b.ring(0, 0, 0, 0.054, 0.004, black, M.Rubber, 'y', Z.Front);
    b.pop();
    b.rod(v(sx, y, z), v(xAt(y), y, z + 0.025), 0.009, black, M.Metal, Z.Front);
  }
  b.slot = M.Metal;
  b.tag = Z.Front;
  b.push().translate(sx, 1.365, -0.64).rotate(-0.2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.065, 0.053, 0.11, 24), steel);
  b.pop();
  b.push().translate(sx, 1.418, -0.651).rotate(-0.2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.07, 0.07, 0.016, 24), black);
  b.pop();
}
function roofEquipment(b: VehicleBuilder) {
  // A full-length slatted platform on roof-following backbone rails.
  for (const side of [-1, 1]) {
    const rail = side * 0.68;
    for (const z of [-0.52, 0.5, 1.52, 2.12]) {
      b.block(rail, 1.345, z, 0.12, 0.03, 0.12, black, M.Rubber, Z.Roof, 0.008);
      b.block(rail, 1.398, z, 0.055, 0.09, 0.08, black, M.Metal, Z.Roof, 0.006);
    }
    b.block(rail, 1.433, 0.8, 0.045, 0.05, 2.8, black, M.Metal, Z.Roof, 0.008);
    b.block(side * 0.79, 1.475, 0.8, 0.035, 0.06, 3.02, black, M.Metal, Z.Roof, 0.01);
  }
  for (const z of [-0.71, 2.31]) b.block(0, 1.475, z, 1.61, 0.06, 0.045, black, M.Metal, Z.Roof, 0.01);
  for (let i = 0; i < 10; i++)
    b.block(-0.72 + i * 0.16, 1.476, 0.8, 0.074, 0.035, 2.98, black, M.Metal, Z.Roof, 0.005);
  // 50 inch dual-row roof light bar; two bolted end brackets meet the platform frame.
  for (const x of [-0.642, 0.642])
    b.block(x, 1.505, -0.732, 0.045, 0.09, 0.075, steel, M.Metal, Z.Roof, 0.006);
  b.block(0, 1.535, -0.766, 1.285, 0.079, 0.085, black, M.Metal, Z.Roof, 0.012);
  for (let i = 0; i < 30; i++)
    for (const y of [1.519, 1.55])
      b.block(-0.598 + i * 0.0412, y, -0.812, 0.03, 0.023, 0.008, lens, M.DrivingLamp, Z.Roof, 0.004);
  // Passenger-side awning bag and three closed mounting brackets.
  for (const z of [-0.3, 0.7, 1.7]) {
    b.block(-0.887, 1.47, z, 0.22, 0.035, 0.075, steel, M.Metal, Z.Roof, 0.005);
    b.block(-0.975, 1.49, z, 0.035, 0.1, 0.075, steel, M.Metal, Z.Roof, 0.005);
  }
  b.block(-1.019, 1.515, 0.74, 0.145, 0.145, 2.56, new THREE.Color('#353B37'), M.Fabric, Z.Roof, 0.045);
  for (const z of [-0.22, 0.73, 1.69])
    b.block(-1.095, 1.52, z, 0.012, 0.14, 0.043, black, M.Rubber, Z.Roof, 0.004);
  // Compact camp lights sit on visible platform brackets.
  for (const side of [-1, 1])
    for (const z of [0.1, 1.9]) {
      b.block(side * 0.82, 1.458, z, 0.065, 0.045, 0.085, black, M.Metal, Z.Roof, 0.008);
      b.block(side * 0.855, 1.46, z, 0.012, 0.025, 0.06, lens, M.DrivingLamp, Z.Roof, 0.004);
    }
}
function rearCarrier(b: VehicleBuilder, w: THREE.BufferGeometry) {
  b.block(0, 0.16, TAIL + 0.086, 1.96, 0.2, 0.21, black, M.Metal, Z.Rear, 0.025);
  for (const side of [-1, 1])
    b.block(side * 0.82, 0.18, TAIL - 0.005, 0.18, 0.16, 0.23, black, M.Metal, Z.Rear, 0.025);
  const x = 0.43,
    y = 0.75,
    z = TAIL + 0.39;
  markPart(b, 128, () => {
    b.block(0.88, 0.31, TAIL + 0.11, 0.09, 0.37, 0.1, steel, M.Metal, Z.Rear, 0.012);
    tube(
      b,
      [
        [0.88, 0.3, TAIL + 0.13],
        [0.88, 0.65, TAIL + 0.15],
        [x, 0.75, z - 0.2],
      ],
      0.028,
      black,
      Z.Rear,
    );
    b.block(x, y, z - 0.22, 0.25, 0.24, 0.055, black, M.Metal, Z.Rear, 0.008);
    b.rod(v(x, y, z - 0.22), v(x, y, z - 0.1), 0.045, black, M.Metal, Z.Rear);
    b.block(-0.45, 0.29, TAIL + 0.145, 0.12, 0.05, 0.055, steel, M.Metal, Z.Rear, 0.006);
  });
  markPart(b, 64, () => {
    b.tag = Z.Rear;
    b.push()
      .translate(x, y, z)
      .rotate(0, -Math.PI / 2, 0);
    b.geometry(w.clone(), black);
    b.pop();
  });
  b.block(0, 0.035, TAIL + 0.18, 0.11, 0.07, 0.18, black, M.Metal, Z.Rear, 0.008);
  b.slot = M.Metal;
  b.tag = Z.Rear;
  b.push().translate(0, 0.1, TAIL + 0.25);
  b.geometry(new THREE.SphereGeometry(0.027, 12, 8), steel);
  b.pop();
}
export function buildBodyCore(t: VehicleTuning, w: THREE.BufferGeometry, modified: boolean) {
  reviewRanges.length = 0;
  const b = new VehicleBuilder();
  lowerBody(b);
  bonnet(b);
  glasshouse(b);
  frontEnd(b);
  rearEnd(b);
  chassis(b, t);
  interior(b, t);
  markPart(b, 8, () => roof(b));
  if (modified) {
    markPart(b, 1, () => bullbar(b));
    sideProtectionAndIntake(b);
    markPart(b, 2, () => roofEquipment(b));
    markPart(b, 4, () => rearCarrier(b, w));
  } else {
    b.block(0, 0.19, F - 0.05, 1.86, 0.14, 0.15, dark, M.Rubber, Z.Front, 0.035);
    b.block(0, 0.17, TAIL + 0.07, 1.86, 0.16, 0.17, dark, M.Rubber, Z.Rear, 0.03);
  }
  return cleanGeometry(attachParts(b.build()));
}
export function buildVehicleBody(t: VehicleTuning, w: THREE.BufferGeometry) {
  return buildBodyCore(t, w, true);
}
/** Two pairs of recovery boards: four boards, each with moulded handles and traction teeth. */
export function buildRackPlank(index: number) {
  const b = new VehicleBuilder(),
    x = index === 0 ? -0.29 : 0.26;
  for (const y of [1.535, 1.59]) {
    const body = new THREE.Shape(
      rounded([
        [-0.155, -0.58, 0.05],
        [0.155, -0.58, 0.05],
        [0.166, -0.45, 0.03],
        [0.166, 0.45, 0.03],
        [0.155, 0.58, 0.05],
        [-0.155, 0.58, 0.05],
        [-0.166, 0.45, 0.03],
        [-0.166, -0.45, 0.03],
      ]),
    );
    for (const z of [-0.38, 0.38])
      body.holes.push(
        new THREE.Path(
          rectangle(-0.095, z - 0.045, 0.095, z + 0.045, 0.018)
            .getPoints(12)
            .reverse(),
        ),
      );
    const g = new THREE.ExtrudeGeometry(body, {
      depth: 0.027,
      bevelEnabled: true,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      bevelSegments: 2,
    });
    g.rotateX(-Math.PI / 2);
    b.slot = M.Fabric;
    b.tag = Z.Roof;
    b.push().translate(x, y, 1.12);
    b.geometry(g, orange);
    b.pop();
    for (let j = 0; j < 17; j++)
      for (const xx of [-0.11, 0, 0.11]) {
        const z = 0.62 + j * 0.062;
        b.block(x + xx, y + 0.0435, z, 0.026, 0.023, 0.026, steel, M.Metal, Z.Roof, 0.005);
      }
  }
  for (const z of [0.75, 1.49]) {
    b.block(x, 1.51, z, 0.34, 0.04, 0.06, black, M.Metal, Z.Roof, 0.006);
    for (const dx of [-0.12, 0.12])
      b.rod(v(x + dx, 1.51, z), v(x + dx, 1.69, z), 0.007, steel, M.Metal, Z.Roof);
    b.block(x, 1.653, z, 0.32, 0.022, 0.045, black, M.Rubber, Z.Roof, 0.005);
  }
  return cleanGeometry(b.build());
}
