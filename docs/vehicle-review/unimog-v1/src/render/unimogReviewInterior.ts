import * as THREE from "three";
import { vehicles } from "../data/vehicles";
import { unimogColors } from "./unimogPaint";
import {
  BodyZone as Z,
  VehicleBuilder,
  VehicleMaterial as M,
} from "./vehicleGeometry";
import { addDialFaces, addSteeringColumn } from "./vehicleInstruments";

/**
 * The Unimog's cab: a flat steel dash across the cab with the dials in front of the
 * right-hand driver, two seats either side of the gearbox hump with its row of levers
 * (gears, the field and road groups, the lockers and the power take-off), a big wheel on
 * a steep column, floor pedals, and painted door skins (the handbrake lever moves: see
 * vehicleInstruments.ts).
 */
export function addUnimogInterior(b: VehicleBuilder, redlineRpm: number): void {
  const cabin = vehicles.unimog.cabin;
  const { paint, vinyl } = unimogColors;
  const dark = new THREE.Color("#252726"),
    mat = new THREE.Color("#1D1F1E"),
    metal = new THREE.Color("#8A8E86"),
    inner = paint.clone().multiplyScalar(0.8);
  // Rubber floor mat and the gearbox hump between the seats.
  b.block(0, 0.756, -0.88, 2.1, 0.012, 1.5, mat, M.Rubber, Z.Trim);
  b.block(0, 0.84, -0.95, 0.46, 0.26, 1.0, inner, M.Paint, Z.Trim, 0.04);
  // Dash: a steel panel across the cab under the screen, and its top rail.
  b.block(0, 1.17, -1.47, 2.1, 0.32, 0.25, inner, M.Paint, Z.Trim, 0.02);
  b.block(0, 1.34, -1.52, 2.1, 0.04, 0.24, dark, M.Rubber, Z.Trim, 0.015);
  b.block(0.5, 1.2, -1.343, 0.5, 0.22, 0.006, dark, M.Rubber, Z.Trim);
  addDialFaces(b, cabin, redlineRpm);
  // Switches and a placard on the passenger side.
  for (let i = 0; i < 5; i++) {
    b.slot = M.Metal;
    b.tag = Z.Trim;
    b.push()
      .translate(-0.15 - i * 0.08, 1.2, -1.34)
      .rotate(Math.PI / 2, 0, 0);
    b.geometry(new THREE.CylinderGeometry(0.01, 0.01, 0.025, 10), metal);
    b.pop();
  }
  b.block(
    -0.6,
    1.12,
    -1.343,
    0.3,
    0.12,
    0.006,
    new THREE.Color("#C9C3A6"),
    M.Fabric,
    Z.Trim,
  );
  addSteeringColumn(b, cabin);
  // Floor-hinged clutch, brake and throttle pedals.
  for (const [x, w] of [
    [0.36, 0.08],
    [0.52, 0.09],
    [0.68, 0.06],
  ]) {
    b.rod({ x, y: 0.72, z: -1.32 }, { x, y: 0.84, z: -1.2 }, 0.01, metal);
    b.block(x, 0.84, -1.18, w, 0.1, 0.02, dark, M.Rubber, Z.Trim);
  }
  // The levers on the hump: the gear lever, then the group, locker and take-off levers.
  for (const [x, top, z, knob] of [
    [0.1, 1.32, -0.95, dark],
    [-0.02, 1.16, -1.05, new THREE.Color("#9C3A2C")],
    [-0.1, 1.12, -1.0, new THREE.Color("#D2B33A")],
    [-0.16, 1.1, -0.92, dark],
  ] as const) {
    b.rod({ x, y: 0.97, z: z + 0.1 }, { x, y: top, z }, 0.01, metal);
    b.slot = M.Rubber;
    b.push().translate(x, top, z);
    b.geometry(new THREE.SphereGeometry(0.025, 12, 8), knob);
    b.pop();
  }
  // Two seats with high backs against the rear wall.
  for (const x of [0.5, -0.55]) {
    b.block(x, 0.88, -0.45, 0.42, 0.32, 0.36, dark, M.Metal, Z.Trim);
    b.block(x, 1.09, -0.52, 0.52, 0.12, 0.5, vinyl, M.Fabric, Z.Trim, 0.04);
    b.push().rotate(-0.12, 0, 0);
    b.block(x, 1.48, -0.06, 0.52, 0.62, 0.1, vinyl, M.Fabric, Z.Trim, 0.04);
    b.pop();
  }
  // Painted inner door skins with a pull handle; the canvas lining overhead.
  for (const side of [-1, 1]) {
    const x = side * 1.07;
    b.block(x, 1.0, -0.85, 0.02, 0.6, 1.45, inner, M.Paint, Z.Trim, 0.01);
    b.rod(
      { x: x - side * 0.02, y: 1.18, z: -0.6 },
      { x: x - side * 0.02, y: 1.18, z: -0.35 },
      0.012,
      dark,
    );
  }
  b.block(
    0,
    1.93,
    -0.86,
    2.14,
    0.008,
    1.48,
    unimogColors.canvas.clone().multiplyScalar(0.8),
    M.Fabric,
    Z.Trim,
  );
}
