import * as THREE from "three";
import {
  BodyZone as Z,
  VehicleBuilder,
  VehicleMaterial as M,
} from "./vehicleGeometry";
import { perentieColors } from "./perentiePaint";
import { continuousTube } from "./perentieRefinement";

const FRONT = -0.73,
  BACK = 2.31,
  HALF = 0.855,
  TOP = 1.51;
const { canvas, galv, bar } = perentieColors;
const seam = canvas.clone().multiplyScalar(0.73),
  inside = canvas.clone().multiplyScalar(0.83);
const bows = [FRONT, 0.23, 0.95, 1.62, BACK];
export const TILT_RACK_Z = [0.23, 1.62];
export const TILT_BOARD_Y = 1.6;
export const TILT_BOARD_Z = (TILT_RACK_Z[0] + TILT_RACK_Z[1]) / 2;
/** Rounded shoulders, with a small tension sag between support bows. */
export function canvasY(x: number, z: number): number {
  const u = Math.abs(x) / HALF;
  let sag = 0;
  for (let i = 0; i < bows.length - 1; i++)
    if (z >= bows[i] && z <= bows[i + 1]) {
      const t = (z - bows[i]) / (bows[i + 1] - bows[i]);
      sag = -0.011 * Math.sin(Math.PI * t) ** 2;
      break;
    }
  return TOP - 0.02 * u * u - 0.115 * u ** 8 + sag * (1 - 0.3 * u * u);
}
function skin(
  b: VehicleBuilder,
  nu: number,
  nv: number,
  point: (u: number, v: number) => THREE.Vector3,
  normal: THREE.Vector3,
  color: THREE.Color,
  zone: number,
): void {
  for (const layer of [0, 1]) {
    const p: number[] = [],
      idx: number[] = [];
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const v = point(i / nu, j / nv).addScaledVector(
          normal,
          layer ? -0.007 : 0,
        );
        p.push(v.x, v.y, v.z);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    const a = new THREE.Vector3().fromArray(p, 0),
      c = new THREE.Vector3().fromArray(p, 3),
      d = new THREE.Vector3().fromArray(p, (nu + 1) * 3);
    const reverse = c.sub(a).cross(d.sub(a)).dot(normal) * (layer ? -1 : 1) < 0;
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i,
          b = a + 1,
          c = a + nu + 1,
          d = c + 1;
        idx.push(...(reverse ? [a, c, b, b, c, d] : [a, b, c, b, d, c]));
      }
    g.setIndex(idx);
    g.computeVertexNormals();
    b.slot = M.Fabric;
    b.tag = zone;
    b.geometry(g, layer ? inside : color);
  }
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export function addCanvasTilt(b: VehicleBuilder): void {
  skin(
    b,
    32,
    48,
    (u, t) => {
      const x = (u * 2 - 1) * HALF,
        z = FRONT + t * (BACK - FRONT);
      return v(x, canvasY(x, z), z);
    },
    v(0, 1, 0),
    canvas,
    Z.Roof,
  );
  // Rear curtains are rolled and strapped beneath the eaves, exposing the tub.
  for (const side of [-1, 1]) {
    const start = 0.24,
      end = 2.29,
      mid = (start + end) / 2;
    const roll = new THREE.CylinderGeometry(0.044, 0.044, end - start, 24, 24);
    roll.rotateX(Math.PI / 2);
    roll.translate(side * 0.861, 0, mid);
    const p = roll.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i),
        wave = 0.0015 * Math.sin((z - start) * Math.PI * 12);
      p.setY(i, p.getY(i) + canvasY(HALF, z) - 0.035 + wave);
    }
    roll.computeVertexNormals();
    b.slot = M.Fabric;
    b.tag = Z.Sides;
    b.geometry(roll, canvas);
    for (const z of [start, end])
      for (const radius of [0.027, 0.038])
        b.ring(
          side * 0.861,
          canvasY(HALF, z) - 0.035,
          z,
          radius,
          0.0022,
          seam,
          M.Fabric,
          "z",
          Z.Sides,
        );
    for (const z of [0.39, 0.95, 1.62, 2.18]) {
      const y = canvasY(HALF, z) - 0.035;
      b.ring(side * 0.861, y, z, 0.046, 0.0045, seam, M.Fabric, "z", Z.Sides);
      b.block(
        side * 0.903,
        y + 0.012,
        z,
        0.01,
        0.025,
        0.022,
        galv,
        M.Metal,
        Z.Sides,
        0.002,
      );
      b.rod(
        v(side * 0.861, y + 0.045, z),
        v(side * 0.837, canvasY(0.837, z) + 0.003, z),
        0.004,
        seam,
        M.Fabric,
        Z.Sides,
      );
    }
  }
  const rearPoints = Array.from({ length: 17 }, (_, i) => {
    const x = -0.8 + i * 0.1;
    return v(x, canvasY(x, BACK) - 0.065, BACK - 0.005);
  });
  continuousTube(b, rearPoints, 0.043, canvas, Z.Rear, M.Fabric);
  for (const x of [-0.47, 0.47]) {
    const y = canvasY(x, BACK) - 0.065;
    b.ring(x, y, BACK - 0.005, 0.045, 0.0045, seam, M.Fabric, "x", Z.Rear);
    b.rod(
      v(x, y + 0.043, BACK - 0.005),
      v(x, canvasY(x, BACK) + 0.003, BACK + 0.01),
      0.004,
      seam,
      M.Fabric,
      Z.Rear,
    );
    b.block(
      x,
      y - 0.005,
      BACK + 0.043,
      0.025,
      0.022,
      0.009,
      galv,
      M.Metal,
      Z.Rear,
      0.002,
    );
  }
  // The short front valance wraps down onto the windscreen top rail.
  skin(
    b,
    32,
    6,
    (u, t) => {
      const x = (u * 2 - 1) * HALF;
      return v(x, 1.35 + t * (canvasY(x, FRONT) - 1.35), FRONT - 0.005);
    },
    v(0, 0, -1),
    canvas,
    Z.Roof,
  );
  for (const z of bows)
    for (let i = 0; i < 32; i++) {
      const x0 = -HALF + (i * HALF) / 16,
        x1 = x0 + HALF / 16;
      b.rod(
        v(x0, canvasY(x0, z) + 0.002, z),
        v(x1, canvasY(x1, z) + 0.002, z),
        0.002,
        seam,
        M.Fabric,
        Z.Roof,
      );
    }
}
export function addCanvasHoops(b: VehicleBuilder): void {
  for (const z of [0.23, 0.95, 1.62, 2.26]) {
    const pts = [v(-0.8, 0.79, z), v(-0.8, 1.385, z)];
    for (let i = 0; i <= 16; i++) {
      const x = -0.78 + i * 0.0975;
      pts.push(v(x, canvasY(x, z) - 0.023, z));
    }
    pts.push(v(0.8, 1.385, z), v(0.8, 0.79, z));
    continuousTube(b, pts, 0.012, galv, Z.Trim, M.Paint);
  }
}
export function addTiltRack(b: VehicleBuilder): void {
  for (const z of TILT_RACK_Z) {
    b.block(0, 1.56, z, 1.63, 0.03, 0.045, bar, M.Metal, Z.Roof, 0.004);
    for (const side of [-1, 1]) {
      b.block(
        side * 0.8,
        1.47,
        z,
        0.035,
        0.18,
        0.045,
        bar,
        M.Metal,
        Z.Roof,
        0.004,
      );
      b.block(
        side * 0.8,
        1.39,
        z,
        0.065,
        0.035,
        0.1,
        bar,
        M.Metal,
        Z.Roof,
        0.004,
      );
    }
  }
  for (const x of [-0.54, 0.54])
    b.block(
      x,
      1.56,
      TILT_BOARD_Z,
      0.035,
      0.03,
      1.58,
      bar,
      M.Metal,
      Z.Roof,
      0.004,
    );
}
