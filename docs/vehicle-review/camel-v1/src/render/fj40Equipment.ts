import { continuousTube, cleanGeometry } from "./fj40Refinement";
import * as THREE from "three";
import type { VehicleTuning } from "../data/vehicle";
import { pal } from "./colors";
import {
  BodyZone as Z,
  VehicleBuilder,
  VehicleMaterial as M,
} from "./vehicleGeometry";
import { BONNET_TOP, HW, NOSE, TAIL } from "./fj40Proposal";
import { markPart } from "./fj40ReviewParts";

const trim = new THREE.Color("#343D37"),
  steel = new THREE.Color("#959B94"),
  bar = new THREE.Color("#2E3430");
const black = new THREE.Color("#232926"),
  canvas = new THREE.Color("#77735A");
const red = new THREE.Color("#B84A32");

type V = { x: number; y: number; z: number };
const v = (x: number, y: number, z: number): V => ({ x, y, z });

function plate(
  b: VehicleBuilder,
  x: number,
  y: number,
  z: number,
  facing: number,
): void {
  b.push()
    .translate(x, y, z)
    .rotate(0, facing < 0 ? Math.PI : 0, 0);
  b.block(0, 0, 0, 0.36, 0.12, 0.015, black, M.Rubber, Z.Trim, 0.009);
  b.block(
    0,
    0,
    0.01,
    0.33,
    0.095,
    0.008,
    pal("vehicleRoof"),
    M.Paint,
    Z.Trim,
    0.005,
  );
  const line = (ax: number, ay: number, bx: number, by: number) =>
    b.rod(
      { x: ax, y: ay, z: 0.017 },
      { x: bx, y: by, z: 0.017 },
      0.003,
      black,
      M.Rubber,
    );
  line(-0.12, -0.028, -0.12, 0.028);
  line(-0.12, 0.028, -0.08, 0.028);
  line(-0.12, 0, -0.09, 0);
  line(-0.05, 0.028, -0.01, 0.028);
  line(-0.02, 0.028, -0.02, -0.02);
  line(-0.02, -0.02, -0.04, -0.028);
  line(-0.04, -0.028, -0.055, -0.015);
  line(0.01, 0, 0.03, 0);
  line(0.06, 0.028, 0.045, 0);
  line(0.045, 0, 0.085, 0);
  line(0.08, -0.028, 0.08, 0.028);
  for (const x0 of [0.11, 0.145]) line(x0, -0.028, x0, 0.028);
  line(0.11, -0.028, 0.145, -0.028);
  line(0.11, 0.028, 0.145, 0.028);
  b.pop();
}

/** A bent steel tube through the points, with a ball at each bend so the joints close. */
function tubePath(
  b: VehicleBuilder,
  pts: V[],
  r: number,
  color: THREE.Color,
): void {
  continuousTube(
    b,
    pts.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    r,
    color,
  );
}

/** Red bow shackle on a recovery point. */
function shackle(
  b: VehicleBuilder,
  x: number,
  y: number,
  z: number,
  facing: number,
): void {
  b.block(x, y + 0.03, z, 0.07, 0.1, 0.04, steel, M.Metal, Z.Trim);
  b.ring(
    x,
    y - 0.03,
    z + facing * 0.03,
    0.045,
    0.011,
    red,
    M.Paint,
    "x",
    Z.Trim,
  );
  b.rod(
    v(x - 0.05, y, z + facing * 0.03),
    v(x + 0.05, y, z + facing * 0.03),
    0.011,
    steel,
  );
}

/**
 * A period steel bull bar fitted to the new nose: a deep pan carrying the winch, a centre
 * hoop over the grille and side loops that wrap above the headlamps to the guards.
 */
function bullBar(b: VehicleBuilder, tuning: VehicleTuning): void {
  const face = tuning.winchMount.z; // the pan's front face carries the fairlead
  const back = NOSE - 0.03;
  const zc = (face + back) / 2;
  // A single folded pan with swept ends. Brackets reach the narrowed frame rails.
  const outline = new THREE.Shape();
  outline.moveTo(-0.69, -face);
  outline.lineTo(0.69, -face);
  outline.lineTo(0.89, -(face + 0.1));
  outline.lineTo(0.89, -back);
  outline.lineTo(-0.89, -back);
  outline.lineTo(-0.89, -(face + 0.1));
  outline.closePath();
  const pan = new THREE.ExtrudeGeometry(outline, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
  });
  pan.rotateX(-Math.PI / 2);
  b.slot = M.Metal;
  b.tag = Z.Front;
  b.push().translate(0, 0.17, 0);
  b.geometry(pan, bar);
  b.pop();
  for (const x of [-0.31, 0.31])
    b.block(x, 0.17, back + 0.12, 0.08, 0.22, 0.3, bar, M.Metal, Z.Trim, 0.008);
  const zt = NOSE - 0.1;
  tubePath(
    b,
    [
      v(-0.36, 0.39, zc),
      v(-0.36, 0.86, zt),
      v(0.36, 0.86, zt),
      v(0.36, 0.39, zc),
    ],
    0.03,
    bar,
  );
  const joinY = 0.73,
    joinZ = zc + ((zt - zc) * (joinY - 0.39)) / (0.86 - 0.39);
  for (const side of [-1, 1]) {
    tubePath(
      b,
      [
        v(side * 0.85, 0.39, zc + 0.025),
        v(side * 0.85, 0.73, zt + 0.035),
        v(side * 0.74, 0.76, joinZ),
        v(side * 0.36, joinY, joinZ),
      ],
      0.026,
      bar,
    );
    b.block(
      side * 0.85,
      0.39,
      zc + 0.025,
      0.075,
      0.045,
      0.11,
      bar,
      M.Metal,
      Z.Front,
      0.005,
    );
    b.block(
      side * 0.36,
      0.39,
      zc,
      0.075,
      0.045,
      0.11,
      bar,
      M.Metal,
      Z.Front,
      0.005,
    );
  }
  const midY = 0.59,
    midZ = zc + ((zt - zc) * (midY - 0.39)) / (0.86 - 0.39);
  b.rod(
    v(-0.36, midY, midZ),
    v(0.36, midY, midZ),
    0.022,
    bar,
    M.Metal,
    Z.Front,
  );
  // Winch on a cradle behind the pan; only its top and the roller fairlead show.
  b.rod(v(-0.2, 0.44, back - 0.05), v(0.2, 0.44, back - 0.05), 0.075, trim);
  for (let i = 0; i < 13; i++)
    b.ring(
      -0.15 + i * 0.025,
      0.44,
      back - 0.05,
      0.074,
      0.005,
      steel,
      M.Metal,
      "x",
      Z.Front,
    );
  for (const x of [-0.22, 0.22])
    b.block(
      x,
      0.44,
      back - 0.05,
      0.03,
      0.17,
      0.17,
      black,
      M.Rubber,
      Z.Front,
      0.012,
    );
  b.rod(v(-0.38, 0.44, back - 0.05), v(-0.24, 0.44, back - 0.05), 0.06, trim);
  const m = tuning.winchMount;
  b.block(
    m.x,
    m.y,
    face - 0.005,
    0.38,
    0.14,
    0.02,
    steel,
    M.Metal,
    Z.Front,
    0.006,
  );
  b.block(m.x, m.y, face - 0.012, 0.22, 0.06, 0.015, black, M.Rubber, Z.Front);
  for (const y of [m.y - 0.035, m.y + 0.035])
    b.rod(
      v(m.x - 0.11, y, face - 0.03),
      v(m.x + 0.11, y, face - 0.03),
      0.016,
      steel,
      M.Metal,
      Z.Front,
    );
  for (const x of [m.x - 0.12, m.x + 0.12])
    b.rod(
      v(x, m.y - 0.05, face - 0.03),
      v(x, m.y + 0.05, face - 0.03),
      0.016,
      steel,
      M.Metal,
      Z.Front,
    );
  b.ring(
    m.x,
    m.y - 0.02,
    face - 0.05,
    0.026,
    0.008,
    red,
    M.Paint,
    "z",
    Z.Front,
  );
  for (const side of [-1, 1]) shackle(b, side * 0.66, 0.2, face - 0.02, -1);
  b.block(
    -0.43,
    0.28,
    face - 0.023,
    0.38,
    0.14,
    0.025,
    bar,
    M.Metal,
    Z.Front,
    0.004,
  );
  plate(b, -0.43, 0.28, face - 0.042, -1);
}

function rearBumper(b: VehicleBuilder, tuning: VehicleTuning): void {
  const z = TAIL + 0.09;
  b.block(0, 0.21, z, 1.7, 0.15, 0.15, bar, M.Metal, Z.Rear, 0.014);
  for (const x of [-0.47, 0.47])
    b.block(x, 0.17, TAIL + 0.02, 0.08, 0.1, 0.14, bar, M.Metal, Z.Trim);
  for (const side of [-1, 1]) shackle(b, side * 0.62, 0.16, z + 0.075, 1);
  // Towbar tongue and ball at the tow point.
  const t = tuning.towPoint;
  b.block(t.x, t.y + 0.02, t.z + 0.07, 0.1, 0.06, 0.18, bar, M.Metal, Z.Rear);
  b.slot = M.Metal;
  b.tag = Z.Rear;
  b.push().translate(t.x, t.y + 0.1, t.z + 0.13);
  b.geometry(new THREE.SphereGeometry(0.03, 12, 8), steel);
  b.pop();
  b.rod(
    v(t.x, t.y + 0.05, t.z + 0.13),
    v(t.x, t.y + 0.08, t.z + 0.13),
    0.012,
    steel,
  );
  plate(b, 0.3, 0.215, z + 0.08, 1);
}

function chassis(b: VehicleBuilder): void {
  // Chassis, crossmembers, transmission pan and exhaust visible from side and underneath.
  for (const side of [-1, 1]) {
    b.block(side * 0.3, 0.02, -1.19, 0.09, 0.16, 0.84, trim, M.Metal, Z.Trim);
    b.rod(
      v(side * 0.3, 0.02, -0.77),
      v(side * 0.43, 0.02, -0.57),
      0.045,
      trim,
      M.Metal,
      Z.Trim,
    );
    b.block(side * 0.43, 0.02, 0.54, 0.09, 0.16, 2.22, trim, M.Metal, Z.Trim);
  }
  for (const z of [-1.51, -0.55, 0.44, 1.5])
    b.block(
      0,
      0.02,
      z,
      z < -0.7 ? 0.6 : 0.86,
      0.09,
      0.09,
      trim,
      M.Metal,
      Z.Trim,
    );
  b.block(
    0,
    0.015,
    -0.23,
    0.38,
    0.15,
    0.65,
    steel.clone().multiplyScalar(0.5),
    M.Metal,
    Z.Trim,
    0.025,
  );
  b.rod(
    { x: 0.31, y: -0.04, z: -0.66 },
    { x: 0.4, y: -0.03, z: 1.13 },
    0.025,
    steel,
  );
  b.rod(
    { x: 0.4, y: -0.03, z: 1.13 },
    { x: 0.64, y: -0.06, z: 1.74 },
    0.025,
    steel,
  );
  b.slot = M.Metal;
  b.tag = Z.Trim;
  b.push()
    .translate(0.37, -0.02, 0.56)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(
    new THREE.CylinderGeometry(0.08, 0.08, 0.48, 12),
    steel.clone().multiplyScalar(0.6),
  );
  b.pop();
}

function roofGear(b: VehicleBuilder): void {
  // Feet, basket deck, perimeter rails, uprights and tie-down rings.
  for (const x of [-0.68, 0.68]) {
    for (const z of [-0.29, 0.66, 1.52]) {
      b.block(x, 1.695, z, 0.08, 0.15, 0.1, trim, M.Metal, Z.Roof, 0.008);
      b.rod(
        v(x, 1.72, z),
        v(Math.sign(x) * 0.825, 1.55, z),
        0.013,
        trim,
        M.Metal,
        Z.Roof,
      );
      b.block(
        Math.sign(x) * 0.835,
        1.545,
        z,
        0.032,
        0.06,
        0.1,
        trim,
        M.Metal,
        Z.Roof,
        0.006,
      );
    }
    b.rod(
      { x, y: 1.77, z: -0.4 },
      { x, y: 1.77, z: 1.62 },
      0.022,
      trim,
      M.Metal,
      Z.Roof,
    );
    b.rod(
      { x, y: 1.94, z: -0.4 },
      { x, y: 1.94, z: 1.62 },
      0.018,
      trim,
      M.Metal,
      Z.Roof,
    );
    for (const z of [-0.4, 0.1, 0.62, 1.12, 1.62])
      b.rod({ x, y: 1.77, z }, { x, y: 1.94, z }, 0.012, trim, M.Metal, Z.Roof);
  }
  for (const z of [-0.4, 1.62]) {
    b.rod(
      { x: -0.68, y: 1.77, z },
      { x: 0.68, y: 1.77, z },
      0.022,
      trim,
      M.Metal,
      Z.Roof,
    );
    b.rod(
      { x: -0.68, y: 1.94, z },
      { x: 0.68, y: 1.94, z },
      0.018,
      trim,
      M.Metal,
      Z.Roof,
    );
  }
  for (let i = 0; i < 10; i++)
    b.block(0, 1.77, -0.3 + i * 0.2, 1.35, 0.025, 0.028, trim, M.Metal, Z.Roof);
  // Strapped canvas luggage and a small latched toolbox leave room for both recovery planks.
  b.block(0.4, 1.91, 1.01, 0.38, 0.25, 0.71, canvas, M.Fabric, Z.Roof, 0.045);
  for (const z of [0.9, 1.3]) {
    const strap = new THREE.Shape();
    strap.moveTo(0.195, 1.75);
    strap.lineTo(0.605, 1.75);
    strap.lineTo(0.605, 1.99);
    strap.quadraticCurveTo(0.605, 2.047, 0.55, 2.047);
    strap.lineTo(0.25, 2.047);
    strap.quadraticCurveTo(0.195, 2.047, 0.195, 1.99);
    strap.closePath();
    const hole = new THREE.Path();
    hole.moveTo(0.207, 1.762);
    hole.lineTo(0.207, 1.99);
    hole.quadraticCurveTo(0.207, 2.035, 0.25, 2.035);
    hole.lineTo(0.55, 2.035);
    hole.quadraticCurveTo(0.593, 2.035, 0.593, 1.99);
    hole.lineTo(0.593, 1.762);
    hole.closePath();
    strap.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(strap, {
      depth: 0.04,
      bevelEnabled: false,
    });
    b.slot = M.Rubber;
    b.tag = Z.Roof;
    b.push().translate(0, 0, z - 0.02);
    b.geometry(g, black);
    b.pop();
    b.block(0.612, 1.93, z, 0.016, 0.055, 0.047, steel, M.Metal, Z.Roof, 0.003);
  }
  b.block(0.4, 1.87, 0.12, 0.38, 0.17, 0.57, trim, M.Metal, Z.Roof, 0.015);
  b.block(0.4, 1.963, 0.12, 0.39, 0.022, 0.59, trim, M.Metal, Z.Roof, 0.008);
  for (const z of [-0.05, 0.29])
    b.block(0.6, 1.9, z, 0.012, 0.07, 0.04, steel, M.Metal, Z.Roof);
  b.rod(
    { x: 0.35, y: 1.995, z: 0.12 },
    { x: 0.45, y: 1.995, z: 0.12 },
    0.008,
    steel,
    M.Metal,
    Z.Roof,
  );
  for (const x of [0.35, 0.45])
    b.block(x, 1.981, 0.12, 0.018, 0.028, 0.024, steel, M.Metal, Z.Roof, 0.003);
}

/** The first spare on the right-hand rear door and a jerry can on the left, clear of the lamps. */
function rearDoorGear(b: VehicleBuilder, wheel: THREE.BufferGeometry): void {
  const sx = 0.27,
    sy = 0.86,
    sz = TAIL + 0.23;
  // Wheel carrier: a plate on the door with three studs.
  markPart(b, 128, () => {
    b.block(sx, sy, TAIL + 0.03, 0.26, 0.26, 0.04, bar, M.Metal, Z.Rear, 0.01);
    b.rod(
      v(sx, sy, TAIL + 0.03),
      v(sx, sy, sz - 0.13),
      0.045,
      bar,
      M.Metal,
      Z.Rear,
    );
  });
  markPart(b, 64, () => {
    b.tag = Z.Rear;
    b.push()
      .translate(sx, sy, sz)
      .rotate(0, -Math.PI / 2, 0);
    b.geometry(wheel.clone(), black);
    b.pop();
  });
  // Jerry can in a cradle on the left door, below the window.
  const olive = new THREE.Color("#667258");
  const cx = -0.27,
    cy = 0.5,
    cz = TAIL + 0.13;
  b.block(cx, cy - 0.235, cz - 0.02, 0.3, 0.035, 0.24, bar, M.Metal, Z.Rear);
  for (const x of [cx - 0.14, cx + 0.14])
    b.block(x, cy - 0.1, TAIL + 0.03, 0.03, 0.3, 0.04, bar, M.Metal, Z.Rear);
  b.block(cx, cy, cz, 0.25, 0.43, 0.19, olive, M.Paint, Z.Rear, 0.02);
  for (const side of [-1, 1])
    b.rod(
      v(cx - 0.09, cy - 0.17 + (side > 0 ? 0 : 0.3), cz + 0.1),
      v(cx + 0.09, cy - 0.17 + (side > 0 ? 0.3 : 0), cz + 0.1),
      0.009,
      olive,
      M.Paint,
      Z.Rear,
    );
  b.block(
    cx,
    cy - 0.02,
    cz + 0.105,
    0.035,
    0.37,
    0.017,
    black,
    M.Rubber,
    Z.Rear,
  );
  b.block(cx, cy - 0.221, cz, 0.035, 0.012, 0.22, black, M.Rubber, Z.Rear);
  b.block(cx, cy + 0.216, cz, 0.035, 0.012, 0.22, black, M.Rubber, Z.Rear);
  b.block(
    cx,
    cy - 0.002,
    cz - 0.1,
    0.035,
    0.43,
    0.012,
    black,
    M.Rubber,
    Z.Rear,
  );
  b.block(
    cx,
    cy + 0.02,
    cz + 0.118,
    0.055,
    0.065,
    0.012,
    steel,
    M.Metal,
    Z.Rear,
    0.004,
  );
  for (const x of [cx - 0.06, cx + 0.03])
    b.rod(
      v(x, cy + 0.21, cz),
      v(x, cy + 0.28, cz),
      0.012,
      olive,
      M.Paint,
      Z.Rear,
    );
  b.rod(
    v(cx - 0.06, cy + 0.28, cz),
    v(cx + 0.03, cy + 0.28, cz),
    0.012,
    olive,
    M.Paint,
    Z.Rear,
  );
  b.slot = M.Metal;
  b.tag = Z.Rear;
  b.push().translate(cx + 0.08, cy + 0.22, cz);
  b.geometry(new THREE.CylinderGeometry(0.025, 0.025, 0.018, 12), steel);
  b.pop();
}

/** The second spare lying flat on a plate on the bonnet, held down by a centre clamp. */
function bonnetSpare(
  b: VehicleBuilder,
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
): void {
  const z = -1.2,
    base = BONNET_TOP + 0.08,
    top = base + tuning.wheelWidth + 0.044;
  markPart(b, 512, () => {
    b.block(
      0,
      BONNET_TOP + 0.04,
      z,
      0.34,
      0.08,
      0.34,
      bar,
      M.Metal,
      Z.Front,
      0.01,
    );
  });
  markPart(b, 256, () => {
    b.tag = Z.Front;
    b.push()
      .translate(0, base + tuning.wheelWidth / 2, z)
      .rotate(0, 0, Math.PI / 2);
    b.geometry(wheel.clone(), black);
    b.pop();
  });
  markPart(b, 512, () => {
    b.rod(v(0, base, z), v(0, top + 0.04, z), 0.014, steel, M.Metal, Z.Front);
    b.block(0, top + 0.01, z, 0.24, 0.02, 0.06, bar, M.Metal, Z.Front, 0.006);
    b.rod(
      v(-0.06, top + 0.04, z),
      v(0.06, top + 0.04, z),
      0.01,
      steel,
      M.Metal,
      Z.Front,
    );
  });
}

export function addVehicleEquipment(
  b: VehicleBuilder,
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
  /** Which front guard carries the aerial: -1 left, +1 right. */
  aerialSide: -1 | 1 = -1,
): void {
  markPart(b, 1, () => bullBar(b, tuning));
  rearBumper(b, tuning);
  chassis(b);
  markPart(b, 2, () => roofGear(b));
  rearDoorGear(b, wheel);
  markPart(b, 4, () => bonnetSpare(b, tuning, wheel));
  // Flexible whip aerial on the guard.
  const ax = aerialSide * (HW - 0.06);
  b.block(ax, 0.8, -0.77, 0.06, 0.04, 0.06, black, M.Rubber, Z.Front);
  b.rod(
    { x: ax, y: 0.82, z: -0.77 },
    { x: ax + aerialSide * 0.02, y: 1.62, z: -0.73 },
    0.005,
    trim,
  );
}

export function buildRackPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const wood = pal("barkOchre");
  const x = index === 0 ? -0.46 : -0.1;
  b.block(x, 1.81, 0.59, 0.3, 0.055, 2.4, wood, M.Fabric, Z.Roof);
  for (let i = 0; i < 4; i++)
    b.block(
      x - 0.12 + i * 0.075,
      1.84,
      0.59,
      0.004,
      0.003,
      2.34,
      wood.clone().multiplyScalar(0.74),
      M.Fabric,
      Z.Roof,
    );
  for (const z of [-0.1, 1.3]) {
    b.block(x, 1.846, z, 0.305, 0.015, 0.045, black, M.Rubber, Z.Roof);
    for (const side of [-1, 1])
      b.block(
        x + side * 0.156,
        1.8,
        z,
        0.012,
        0.1,
        0.045,
        black,
        M.Rubber,
        Z.Roof,
      );
    b.block(x, 1.752, z, 0.325, 0.012, 0.045, black, M.Rubber, Z.Roof);
    b.block(x + 0.13, 1.855, z, 0.035, 0.012, 0.055, steel, M.Metal, Z.Roof);
  }
  return cleanGeometry(b.build());
}
