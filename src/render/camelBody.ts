import * as THREE from 'three';
import type { VehicleTuning } from '../data/vehicle';
import { vehicles } from '../data/vehicles';
import { VehicleBuilder, BodyZone as Z, VehicleMaterial as M } from './vehicleGeometry';
import { extrudeX, extrudeZ, sideShape, rounded, type Vtx } from './bodyShapes';
import { ROUND_BEND, cleanGeometry, continuousTube } from './bodyRefinement';
import { addDialFaces, addSteeringColumn } from './vehicleInstruments';
import { mirrorHead } from './mirrors';
import { letter, camel } from './camelMarkings';

/**
 * The 1986 Camel Trophy Land Rover Ninety, as the Australian event ran it: a left-hand-drive
 * County station wagon in Sandglow yellow on a 2.36 m wheelbase, with flat wing tops, black
 * front lamp panels, a slatted grille, Alpine roof windows, a front and bulkhead cage, a
 * raised intake into the left wing, a deep basket rack with four work lamps, jerry cans and
 * sand ladders, a tall winch behind a hawse fairlead, and spares on the bonnet and the rear
 * door. Same frame as the other vehicles: x right, y up, z back, axles at ±1.18 m.
 * Sources: reference/vehicles/camel-trophy/SOURCES.md.
 */
const SIDE = 0.835,
  F = -1.805,
  TAIL = 1.76,
  AXLE = 1.18,
  SILL = 0.07,
  WAIST = 0.78;
const SCUTTLE = -0.72,
  BPOST = 0.31,
  ARCH = 0.5,
  ARCH_Y = -0.04,
  DECK = 1.62;
const paint = new THREE.Color('#C7973F'),
  black = new THREE.Color('#242824'),
  rubber = new THREE.Color('#222522');
const steel = new THREE.Color('#A0A59D'),
  dark = new THREE.Color('#343832'),
  glass = new THREE.Color('#9FAF9E');
const amber = new THREE.Color('#D78C2C'),
  red = new THREE.Color('#AA3025'),
  lens = new THREE.Color('#E6E0C7');
const blue = new THREE.Color('#263C62'),
  yellow = new THREE.Color('#E9B846');
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const tube = (b: VehicleBuilder, pts: number[][], r: number, c = black, zone: number = Z.Trim) =>
  continuousTube(
    b,
    pts.map((p) => v(p[0], p[1], p[2])),
    r,
    c,
    zone,
    M.Metal,
    ROUND_BEND,
  );
function rect(x0: number, y0: number, x1: number, y1: number, r = 0.01): THREE.Shape {
  return new THREE.Shape(
    rounded([
      [x0, y0, r],
      [x1, y0, r],
      [x1, y1, r],
      [x0, y1, r],
    ]),
  );
}
function disk(
  b: VehicleBuilder,
  x: number,
  y: number,
  z: number,
  r: number,
  depth: number,
  c: THREE.Color,
  slot: typeof b.slot,
  zone: number = Z.Front,
) {
  b.slot = slot;
  b.tag = zone;
  b.push()
    .translate(x, y, z)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(r, r, depth, 24), c);
  b.pop();
}
function roundLamp(
  b: VehicleBuilder,
  x: number,
  y: number,
  z: number,
  r: number,
  c: THREE.Color,
  slot: typeof b.slot,
  zone: number,
) {
  disk(b, x, y, z, r + 0.009, 0.023, black, M.Rubber, zone);
  b.ring(x, y, z - 0.014, r, 0.006, steel, M.Metal, 'z', zone);
  b.slot = slot;
  b.tag = zone;
  b.push()
    .translate(x, y, z - 0.018)
    .scale(1, 1, 0.22);
  b.geometry(new THREE.SphereGeometry(r - 0.007, 24, 10), c);
  b.pop();
  for (const dx of [-0.55, -0.25, 0.05, 0.35, 0.65]) {
    const px = dx * r,
      hh = Math.sqrt((r - 0.009) ** 2 - px * px);
    b.block(x + px, y, z - 0.028, 0.0018, hh * 1.8, 0.002, c, slot, zone);
  }
}
/** Folded outer skins, an actual arch opening and connected, dark wheel-box ceilings. */
function archPanel(
  b: VehicleBuilder,
  side: number,
  z0: number,
  z1: number,
  axle: number,
  top: number,
  inner: number,
  zone: number,
) {
  const a = Math.asin((SILL - ARCH_Y) / ARCH),
    path: Vtx[] = [[z0, SILL]];
  const before = axle - ARCH * Math.cos(a),
    after = axle + ARCH * Math.cos(a);
  if (before > z0) path.push([before, SILL]);
  for (let i = 0; i <= 40; i++) {
    const angle = Math.PI - a - ((Math.PI - 2 * a) * i) / 40;
    const z = axle + ARCH * Math.cos(angle);
    if (z >= z0 && z <= z1) path.push([z, ARCH_Y + ARCH * Math.sin(angle)]);
  }
  if (after < z1) path.push([after, SILL]);
  path.push([z1, SILL], [z1, top], [z0, top]);
  extrudeX(
    b,
    sideShape(path),
    side > 0 ? SIDE - 0.032 : -SIDE,
    side > 0 ? SIDE : -SIDE + 0.032,
    paint,
    M.Paint,
    zone,
    0.009,
    [[axle, ARCH_Y]],
  );
  const arc = (r: number) =>
    Array.from({ length: 41 }, (_, i) => {
      const aa = Math.asin((SILL - ARCH_Y) / r),
        t = aa + ((Math.PI - 2 * aa) * i) / 40;
      return [axle + r * Math.cos(t), ARCH_Y + r * Math.sin(t)] as Vtx;
    });
  extrudeX(
    b,
    sideShape([...arc(ARCH + 0.055), ...arc(ARCH - 0.004).reverse()]),
    side > 0 ? SIDE - 0.006 : -SIDE - 0.055,
    side > 0 ? SIDE + 0.055 : -SIDE + 0.006,
    black,
    M.Rubber,
    zone,
    0.006,
  );
  b.block(
    side * inner,
    axle < 0 ? 0.425 : 0.22,
    axle,
    0.025,
    axle < 0 ? 0.29 : 0.7,
    1.03,
    dark,
    M.Rubber,
    Z.Trim,
  );
  b.block(
    (side * (inner + SIDE - 0.018)) / 2,
    0.552,
    axle,
    SIDE - inner + 0.01,
    0.035,
    1.03,
    dark,
    M.Rubber,
    Z.Trim,
  );
}
function front(b: VehicleBuilder) {
  for (const side of [-1, 1]) {
    archPanel(b, side, F, SCUTTLE, -AXLE, 0.695, 0.355, Z.Front);
    b.block(side * 0.715, 0.707, -1.265, 0.24, 0.034, 1.08, paint, M.Paint, Z.Front, 0.012);
    b.block(side * 0.626, 0.399, F + 0.015, 0.415, 0.59, 0.037, paint, M.Paint, Z.Front, 0.009);
    // Civilian Ninety headlamp panels: no Perentie convoy lights.
    b.block(side * 0.626, 0.405, F - 0.012, 0.39, 0.54, 0.023, black, M.Rubber, Z.Front, 0.01);
    roundLamp(b, side * 0.626, 0.467, F - 0.035, 0.095, lens, M.Headlamp, Z.Front);
    roundLamp(b, side * 0.737, 0.218, F - 0.017, 0.032, amber, M.Amber, Z.Front);
    roundLamp(b, side * 0.522, 0.218, F - 0.017, 0.03, lens, M.Headlamp, Z.Front);
    b.block(side * 0.575, 0.676, -1.34, 0.014, 0.014, 1.18, black, M.Rubber, Z.Front, 0.004);
    b.block(side * 0.577, 0.686, -1.74, 0.022, 0.055, 0.044, steel, M.Metal, Z.Front, 0.006);
    b.block(side * 0.577, 0.703, -0.86, 0.07, 0.016, 0.09, steel, M.Metal, Z.Front, 0.003);
    // Side repeaters, wing top pioneer-tool clamps and small panel rivets.
    b.block(side * (SIDE + 0.006), 0.62, -0.86, 0.018, 0.038, 0.075, amber, M.Amber, Z.Front, 0.008);
  }
  // Separate rolled bonnet over the flat-topped wings, with a mild transverse crown.
  const bonnet: Vtx[] = [
    [-0.58, 0.675],
    [0.58, 0.675],
    [0.58, 0.705, 0.016],
  ];
  for (let i = 1; i <= 24; i++) {
    const x = 0.58 - (1.16 * i) / 24;
    bonnet.push([x, 0.705 + 0.038 * (1 - (x / 0.58) ** 2)]);
  }
  extrudeZ(b, new THREE.Shape(rounded(bonnet)), F + 0.018, SCUTTLE - 0.028, paint, M.Paint, Z.Front, 0.012);
  b.block(0, 0.43, -1.24, 0.54, 0.49, 0.95, black, M.Rubber, Z.Trim, 0.015);
  // Period black moulded grille, with fine horizontal slats and an oval badge.
  const grille = rect(-0.405, 0.195, 0.405, 0.689, 0.018),
    hole = rect(-0.365, 0.24, 0.365, 0.645, 0.012);
  grille.holes.push(new THREE.Path(hole.getPoints(12).reverse()));
  extrudeZ(b, grille, F - 0.027, F + 0.006, black, M.Rubber, Z.Front, 0.002);
  b.block(0, 0.445, F + 0.014, 0.735, 0.407, 0.025, dark, M.Rubber, Z.Front);
  for (let i = 0; i < 11; i++)
    b.block(0, 0.251 + i * 0.037, F - 0.016, 0.73, 0.014, 0.022, black, M.Rubber, Z.Front, 0.004);
  for (const x of [-0.28, -0.14, 0, 0.14, 0.28])
    b.block(x, 0.44, F - 0.008, 0.008, 0.38, 0.022, black, M.Rubber, Z.Front);
  b.slot = M.Paint;
  b.tag = Z.Front;
  b.push()
    .translate(-0.23, 0.6, F - 0.035)
    .scale(1, 0.44, 1);
  b.geometry(
    new THREE.CylinderGeometry(0.075, 0.075, 0.009, 32).rotateX(Math.PI / 2),
    new THREE.Color('#3E5136'),
  );
  b.pop();
  b.push()
    .translate(-0.23, 0.6, F - 0.044)
    .rotate(0, Math.PI, 0);
  letter(b, 'LAND ROVER', 0.013, 0.12, 0.15);
  b.pop();
}
function cabinShell(b: VehicleBuilder) {
  b.block(0, 0.785, SCUTTLE, 1.67, 0.17, 0.1, paint, M.Paint, Z.Front, 0.009);
  for (const x of [-0.39, 0.39]) {
    b.block(x, 0.789, SCUTTLE - 0.058, 0.52, 0.105, 0.017, paint, M.Paint, Z.Front, 0.005);
    b.block(x, 0.843, SCUTTLE - 0.063, 0.515, 0.008, 0.012, black, M.Rubber, Z.Front);
    for (const xx of [x - 0.18, x + 0.18])
      b.block(xx, 0.846, SCUTTLE - 0.058, 0.04, 0.016, 0.018, steel, M.Metal, Z.Front, 0.003);
  }
  // A raked one-piece windscreen with two low wipers.
  b.push()
    .translate(0, 0.866, SCUTTLE + 0.012)
    .rotate(0.13, 0, 0);
  for (const y of [0, 0.535]) b.block(0, y, 0, 1.66, 0.055, 0.06, paint, M.Paint, Z.Front, 0.008);
  for (const x of [-0.803, 0.803]) b.block(x, 0.267, 0, 0.055, 0.59, 0.06, paint, M.Paint, Z.Front, 0.008);
  b.block(0, 0.268, 0, 1.55, 0.478, 0.013, glass, M.Glass, Z.Glass);
  for (const x of [-0.49, 0.18]) {
    b.rod(v(x, 0.025, -0.036), v(x + 0.36, 0.052, -0.036), 0.006, black, M.Rubber, Z.Front);
    b.block(x, 0.015, -0.037, 0.026, 0.026, 0.018, black, M.Rubber, Z.Front, 0.004);
  }
  b.pop();
  const z0 = SCUTTLE + 0.035,
    z1 = BPOST - 0.014;
  for (const side of [-1, 1]) {
    const x = side * SIDE;
    b.block(x, 0.425, (z0 + z1) / 2, 0.032, 0.71, z1 - z0, paint, M.Paint, Z.Sides, 0.009);
    for (const z of [z0 - 0.01, z1 + 0.01])
      b.block(side * (SIDE + 0.005), 0.7, z, 0.007, 1.24, 0.008, black, M.Rubber, Z.Sides);
    b.block(
      side * (SIDE - 0.004),
      0.04,
      (z0 + z1) / 2,
      0.044,
      0.065,
      z1 - z0 + 0.04,
      paint,
      M.Paint,
      Z.Sides,
      0.007,
    );
    for (const yy of [0.26, 0.65]) {
      b.block(side * (SIDE + 0.013), yy, z0 + 0.045, 0.024, 0.065, 0.105, paint, M.Paint, Z.Sides, 0.006);
      b.rod(
        v(side * (SIDE + 0.028), yy - 0.038, z0 + 0.005),
        v(side * (SIDE + 0.028), yy + 0.038, z0 + 0.005),
        0.009,
        steel,
        M.Metal,
        Z.Sides,
      );
    }
    b.block(side * (SIDE + 0.015), 0.694, z1 - 0.11, 0.025, 0.05, 0.14, black, M.Rubber, Z.Sides, 0.006);
    // Full metal door top, fixed quarterlight and wind-up main pane.
    for (const yy of [0.807, 1.395])
      b.block(
        side * (SIDE - 0.008),
        yy,
        (z0 + z1) / 2,
        0.038,
        0.045,
        z1 - z0,
        paint,
        M.Paint,
        Z.Sides,
        0.006,
      );
    for (const z of [z0 + 0.025, z1 - 0.012])
      b.block(side * (SIDE - 0.008), 1.1, z, 0.038, 0.59, 0.05, paint, M.Paint, Z.Sides, 0.006);
    b.block(side * (SIDE - 0.019), 1.1, (z0 + z1) / 2, 0.012, 0.545, z1 - z0 - 0.09, glass, M.Glass, Z.Glass);
    b.block(side * (SIDE + 0.003), 1.1, -0.44, 0.016, 0.55, 0.018, black, M.Rubber, Z.Sides);
    b.rod(v(side * 0.802, 0.63, -0.1), v(side * 0.802, 0.68, -0.16), 0.008, steel, M.Metal, Z.Trim);
    b.block(side * 0.79, 0.68, -0.16, 0.025, 0.025, 0.025, black, M.Rubber, Z.Trim, 0.005);
    // Larger Britax-style truck mirror on a cranked arm.
    b.block(side * 0.852, 0.77, z0 + 0.065, 0.03, 0.1, 0.07, black, M.Metal, Z.Trim, 0.006);
    tube(
      b,
      [
        [side * 0.86, 0.78, z0 + 0.065],
        [side * 0.955, 0.84, z0 + 0.04],
        [side * 0.97, 1.09, z0 + 0.1],
      ],
      0.012,
    );
    mirrorHead(b, side, v(side * 0.985, 1.15, z0 + 0.1), 0.15, 0.235, 0.055, black);
  }
}
function rearBody(b: VehicleBuilder) {
  for (const side of [-1, 1]) {
    archPanel(b, side, BPOST, TAIL, AXLE, WAIST, 0.555, Z.Rear);
    b.block(side * (SIDE + 0.005), WAIST, 0.915, 0.019, 0.025, 1.67, paint, M.Paint, Z.Sides, 0.004);
    // Station wagon side window, wide enough for the forward-facing rear seat.
    const x = side * (SIDE - 0.008),
      z0 = BPOST + 0.03,
      z1 = TAIL - 0.29;
    for (const yy of [0.824, 1.39])
      b.block(x, yy, (z0 + z1) / 2, 0.035, 0.055, z1 - z0, paint, M.Paint, Z.Sides, 0.006);
    for (const z of [z0 + 0.025, z1 - 0.022])
      b.block(x, 1.11, z, 0.035, 0.575, 0.05, paint, M.Paint, Z.Sides, 0.005);
    b.block(x - side * 0.014, 1.11, (z0 + z1) / 2, 0.01, 0.51, z1 - z0 - 0.09, glass, M.Glass, Z.Glass);
    b.block(x + side * 0.012, 1.11, 1.0, 0.016, 0.51, 0.018, black, M.Rubber, Z.Sides);
    b.block(x, 1.11, (z1 + TAIL) / 2, 0.039, 0.61, TAIL - z1 + 0.025, paint, M.Paint, Z.Rear, 0.008);
    for (const z of [0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.7])
      b.block(side * (SIDE + 0.012), 0.746, z, 0.005, 0.006, 0.006, steel, M.Metal, Z.Sides, 0.002);
    b.block(side * 0.69, 0.27, TAIL + 0.005, 0.29, 0.41, 0.045, paint, M.Paint, Z.Rear, 0.005);
  }
  // Single side-hinged rear station-wagon door with a window.
  b.block(0, 0.425, TAIL - 0.012, 1.05, 0.71, 0.036, paint, M.Paint, Z.Rear, 0.008);
  for (const x of [-0.505, 0.505])
    b.block(x, 0.77, TAIL + 0.012, 0.008, 1.34, 0.008, black, M.Rubber, Z.Rear);
  for (const yy of [0.81, 1.39])
    b.block(0, yy, TAIL - 0.007, 1.04, 0.055, 0.04, paint, M.Paint, Z.Rear, 0.005);
  for (const x of [-0.494, 0.494])
    b.block(x, 1.1, TAIL - 0.007, 0.058, 0.59, 0.04, paint, M.Paint, Z.Rear, 0.005);
  b.block(0, 1.1, TAIL - 0.014, 0.9, 0.51, 0.012, glass, M.Glass, Z.Glass);
  for (const side of [-1, 1])
    b.block(side * 0.68, 1.1, TAIL - 0.012, 0.29, 0.64, 0.04, paint, M.Paint, Z.Rear, 0.006);
  b.block(-0.43, 0.72, TAIL + 0.024, 0.12, 0.055, 0.025, black, M.Rubber, Z.Rear, 0.004);
  for (const y of [0.38, 1.2]) {
    b.block(0.532, y, TAIL + 0.028, 0.1, 0.06, 0.036, paint, M.Paint, Z.Rear, 0.004);
    b.rod(
      v(0.565, y - 0.044, TAIL + 0.047),
      v(0.565, y + 0.044, TAIL + 0.047),
      0.011,
      steel,
      M.Metal,
      Z.Rear,
    );
  }
  for (const side of [-1, 1]) {
    // Rear lamps face +z: rotate local round lamps with their bodies.
    b.push()
      .translate(side * 0.686, 0, TAIL + 0.024)
      .rotate(0, Math.PI, 0);
    roundLamp(b, 0, 0.59, 0, 0.033, amber, M.Amber, Z.Rear);
    roundLamp(b, 0, 0.47, 0, 0.036, red, M.Red, Z.Rear);
    roundLamp(b, 0, 0.26, 0, 0.039, red, M.Red, Z.Rear);
    b.pop();
    // Simple lamp guards with actual mounting tabs.
    for (const xx of [side * 0.625, side * 0.746])
      b.rod(v(xx, 0.19, TAIL + 0.072), v(xx, 0.66, TAIL + 0.072), 0.005, black, M.Metal, Z.Rear);
    for (const y of [0.19, 0.35, 0.66])
      b.rod(
        v(side * 0.625, y, TAIL + 0.072),
        v(side * 0.746, y, TAIL + 0.072),
        0.005,
        black,
        M.Metal,
        Z.Rear,
      );
  }
  b.block(0, 0.1, TAIL + 0.06, 1.49, 0.155, 0.11, black, M.Metal, Z.Rear, 0.008);
  b.block(0, 0.02, TAIL + 0.14, 0.11, 0.13, 0.13, steel, M.Metal, Z.Rear, 0.008);
  b.rod(v(-0.065, 0.025, TAIL + 0.18), v(0.065, 0.025, TAIL + 0.18), 0.018, black, M.Metal, Z.Rear);
  plate(b, -0.29, 0.16, TAIL + 0.123, 1);
  // Tools above the rear door are fixed to the metal header.
  for (const x of [-0.42, 0.42])
    b.block(x, 1.445, TAIL + 0.03, 0.055, 0.055, 0.05, black, M.Rubber, Z.Rear, 0.004);
  b.rod(
    v(-0.55, 1.45, TAIL + 0.055),
    v(0.45, 1.45, TAIL + 0.055),
    0.015,
    new THREE.Color('#8F7149'),
    M.Fabric,
    Z.Rear,
  );
  b.block(0.45, 1.45, TAIL + 0.055, 0.22, 0.035, 0.1, steel, M.Metal, Z.Rear, 0.008);
}
function roof(b: VehicleBuilder) {
  // Thin central cap and separately pierced roof shoulders leave real Alpine apertures.
  const top: Vtx[] = Array.from({ length: 33 }, (_, i) => {
    const x = -0.65 + (1.3 * i) / 32;
    return [x, 1.515 + 0.015 * (1 - (x / 0.65) ** 2)] as Vtx;
  });
  const lower = top.map(([x, y]) => [x, y - 0.022] as Vtx).reverse();
  extrudeZ(
    b,
    new THREE.Shape(rounded([...top, ...lower])),
    SCUTTLE + 0.05,
    TAIL + 0.007,
    paint,
    M.Paint,
    Z.Roof,
    0.004,
  );
  const section: Vtx[] = [
    [-SIDE, 1.415],
    [SIDE, 1.415],
    [SIDE, 1.445, 0.018],
    [0.65, 1.515, 0.04],
    ...top.slice().reverse().slice(1),
    [-SIDE, 1.445, 0.018],
  ];
  for (const zz of [SCUTTLE + 0.05, TAIL - 0.018])
    extrudeZ(b, new THREE.Shape(rounded(section)), zz, zz + 0.025, paint, M.Paint, Z.Roof, 0.004);
  for (const side of [-1, 1]) {
    b.block(side * (SIDE - 0.007), 1.43, 0.545, 0.014, 0.03, 2.43, paint, M.Paint, Z.Roof, 0.003);
    b.block(side * (SIDE + 0.01), 1.438, 0.545, 0.022, 0.022, 2.43, paint, M.Paint, Z.Roof, 0.006);
    b.push()
      .translate(side * 0.7425, 1.48, 0)
      .rotate(0, 0, -side * Math.atan2(0.07, 0.185));
    const shell = rect(-0.09892, -(TAIL + 0.007), 0.09892, -(SCUTTLE + 0.05), 0.005);
    const opening = rect(-0.055, -1.25, 0.055, -0.63, 0.025);
    shell.holes.push(new THREE.Path(opening.getPoints(20).reverse()));
    const panel = new THREE.ExtrudeGeometry(shell, {
      depth: 0.014,
      bevelEnabled: false,
      curveSegments: 16,
    });
    panel.rotateX(-Math.PI / 2);
    panel.translate(0, -0.014, 0);
    b.slot = M.Paint;
    b.tag = Z.Roof;
    b.geometry(panel, paint);
    const seal = rect(-0.062, -1.262, 0.062, -0.618, 0.03),
      hole = rect(-0.048, -1.246, 0.048, -0.634, 0.023);
    seal.holes.push(new THREE.Path(hole.getPoints(20).reverse()));
    const gasket = new THREE.ExtrudeGeometry(seal, {
      depth: 0.006,
      bevelEnabled: false,
      curveSegments: 16,
    });
    gasket.rotateX(-Math.PI / 2);
    b.slot = M.Rubber;
    b.tag = Z.Roof;
    b.geometry(gasket, black);
    const pane = new THREE.ExtrudeGeometry(rect(-0.05, -1.248, 0.05, -0.632, 0.024), {
      depth: 0.003,
      bevelEnabled: false,
      curveSegments: 16,
    });
    pane.rotateX(-Math.PI / 2);
    pane.translate(0, 0.003, 0);
    b.slot = M.Glass;
    b.tag = Z.Glass;
    b.geometry(pane, glass);
    b.pop();
  }
  for (const x of [-0.43, 0, 0.43])
    b.block(
      x,
      1.521 + 0.015 * (1 - (x / 0.65) ** 2),
      0.555,
      0.025,
      0.014,
      2.27,
      paint,
      M.Paint,
      Z.Roof,
      0.005,
    );
}
function chassis(b: VehicleBuilder) {
  // Kicked-up rails pass above the coil springs; the middle rails remain under the cab.
  for (const side of [-1, 1]) {
    for (const [x, points] of [
      [
        0.3,
        [
          [-1.7, 0.02],
          [-1.5, 0.255],
          [-0.92, 0.255],
          [-0.64, -0.085],
          [-0.64, 0.085],
          [-0.92, 0.425],
          [-1.5, 0.425],
          [-1.7, 0.19],
        ],
      ],
      [
        0.43,
        [
          [-0.54, -0.085],
          [0.65, -0.085],
          [0.92, 0.255],
          [1.43, 0.255],
          [1.7, -0.045],
          [1.8, -0.045],
          [1.8, 0.125],
          [1.7, 0.125],
          [1.43, 0.425],
          [0.92, 0.425],
          [0.65, 0.085],
          [-0.54, 0.085],
        ],
      ],
    ] as [number, number[][]][]) {
      const outline = points.map((p) => [p[0], p[1], 0.025] as Vtx);
      extrudeX(b, sideShape(outline), side * x - 0.045, side * x + 0.045, black, M.Metal, Z.Trim, 0.004);
    }
    b.rod(v(side * 0.3, 0, -0.64), v(side * 0.43, 0, -0.54), 0.045, black, M.Metal, Z.Trim);
  }
  for (const z of [-1.66, -0.52, 0.48, 1.74])
    b.block(0, z < -1 ? 0.15 : 0, z, z < -1 ? 0.6 : 0.86, 0.085, 0.08, black, M.Metal, Z.Trim);
  for (const [z0, z1, w] of [
    [-0.7, 0.64, 1.6],
    [0.64, 1.67, 1.05],
    [1.67, 1.72, 1.6],
  ])
    b.block(0, z0 > 0 ? 0.46 : 0.15, (z0 + z1) / 2, w, 0.04, z1 - z0, black, M.Rubber, Z.Trim);
  b.block(0, -0.025, -0.18, 0.35, 0.18, 0.61, black, M.Metal, Z.Trim, 0.025);
  b.rod(v(0.08, -0.06, -0.5), v(0.08, -0.12, -1.13), 0.026, steel, M.Metal, Z.Trim);
  b.rod(v(0.08, -0.06, 0.13), v(0.08, -0.12, 1.16), 0.026, steel, M.Metal, Z.Trim);
  b.block(0.6, 0.04, 0.2, 0.25, 0.19, 0.6, black, M.Metal, Z.Trim, 0.015);
  b.rod(v(-0.23, -0.08, -0.7), v(-0.23, -0.07, 1.45), 0.022, steel, M.Metal, Z.Trim);
  b.rod(v(-0.23, -0.07, 1.45), v(-0.62, -0.04, 1.7), 0.022, steel, M.Metal, Z.Trim);
  const guard = new THREE.Shape(
    rounded([
      [-0.38, 0.02],
      [0.38, 0.02],
      [0.38, 0.18],
      [-0.38, 0.18],
    ]),
  );
  b.push().translate(0, 0.03, -1.67).rotate(-0.6, 0, 0);
  extrudeZ(b, guard, -0.025, 0, steel, M.Metal, Z.Trim, 0);
  b.pop();
}
function plate(b: VehicleBuilder, x: number, y: number, z: number, side: number) {
  b.push()
    .translate(x, y, z)
    .rotate(0, side < 0 ? Math.PI : 0, 0);
  b.block(0, 0, 0, 0.27, 0.105, 0.015, black, M.Rubber, Z.Trim, 0.006);
  b.block(0, 0, 0.01, 0.25, 0.086, 0.008, side > 0 ? yellow : lens, M.Paint, Z.Trim, 0.004);
  const lines: Record<string, number[][]> = {
    C: [
      [1, 1, 0, 1],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
    ],
    T: [
      [0, 1, 1, 1],
      [0.5, 1, 0.5, 0],
    ],
    '-': [[0.2, 0.5, 0.8, 0.5]],
    '8': [
      [0, 0, 1, 0],
      [1, 0, 1, 1],
      [1, 1, 0, 1],
      [0, 1, 0, 0],
      [0, 0.5, 1, 0.5],
    ],
    '6': [
      [1, 1, 0, 1],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [1, 0, 1, 0.5],
      [1, 0.5, 0, 0.5],
    ],
  };
  for (let k = 0; k < 5; k++)
    for (const [ax, ay, bx, by] of lines['CT-86'[k]])
      b.rod(
        v(-0.102 + k * 0.041 + ax * 0.029, -0.027 + ay * 0.054, 0.018),
        v(-0.102 + k * 0.041 + bx * 0.029, -0.027 + by * 0.054, 0.018),
        0.0025,
        black,
        M.Rubber,
        Z.Trim,
      );
  b.pop();
}
function bullbar(b: VehicleBuilder) {
  const front = -2.245,
    back = -2.075,
    zc = (front + back) / 2;
  b.block(0, 0.155, zc, 1.78, 0.125, back - front, black, M.Metal, Z.Front, 0.009);
  for (const x of [-0.3, 0.3]) b.block(x, 0.105, -2.01, 0.075, 0.16, 0.4, black, M.Metal, Z.Trim, 0.005);
  tube(
    b,
    [
      [-0.37, 0.21, zc],
      [-0.37, 0.82, -2.09],
      [0.37, 0.82, -2.09],
      [0.37, 0.21, zc],
    ],
    0.027,
    black,
    Z.Front,
  );
  const joinY = 0.66,
    joinZ = zc + ((-2.09 - zc) * (joinY - 0.21)) / (0.82 - 0.21);
  for (const side of [-1, 1]) {
    tube(
      b,
      [
        [side * 0.89, 0.21, zc],
        [side * 0.89, 0.63, -2.09],
        [side * 0.75, 0.68, joinZ],
        [side * 0.37, joinY, joinZ],
      ],
      0.025,
      black,
      Z.Front,
    );
    for (const x of [side * 0.37, side * 0.89])
      b.block(x, 0.219, zc, 0.068, 0.035, 0.09, black, M.Metal, Z.Front, 0.004);
    b.block(side * 0.63, 0.18, front - 0.026, 0.08, 0.09, 0.09, steel, M.Metal, Z.Front, 0.01);
    b.rod(
      v(side * 0.675, 0.18, front - 0.065),
      v(side * 0.585, 0.18, front - 0.065),
      0.014,
      black,
      M.Metal,
      Z.Front,
    );
  }
  // Tall 8274-type upright gearbox/motor and a drum on the bumper cradle.
  b.block(0, 0.26, -2.13, 0.58, 0.08, 0.25, black, M.Metal, Z.Front, 0.008);
  b.rod(v(-0.16, 0.365, -2.14), v(0.17, 0.365, -2.14), 0.079, dark, M.Metal, Z.Front);
  for (let i = 0; i < 16; i++)
    b.ring(-0.145 + i * 0.019, 0.365, -2.14, 0.078, 0.0048, steel, M.Metal, 'x', Z.Front);
  b.block(-0.245, 0.415, -2.14, 0.12, 0.3, 0.21, black, M.Metal, Z.Front, 0.012);
  b.block(-0.245, 0.6, -2.14, 0.105, 0.1, 0.16, dark, M.Metal, Z.Front, 0.008);
  b.block(0.205, 0.365, -2.14, 0.05, 0.19, 0.2, black, M.Metal, Z.Front, 0.007);
  // A hawse fairlead with an actual opening.
  const s = rect(-0.14, 0.25, 0.14, 0.35, 0.022),
    hole = rect(-0.102, 0.275, 0.102, 0.325, 0.02);
  s.holes.push(new THREE.Path(hole.getPoints(12).reverse()));
  extrudeZ(b, s, front - 0.065, front - 0.035, steel, M.Metal, Z.Front, 0.002);
  b.rod(v(0, 0.3, front - 0.045), v(0, 0.3, front - 0.085), 0.005, steel, M.Metal, Z.Front);
  b.ring(0, 0.275, front - 0.09, 0.019, 0.006, steel, M.Metal, 'z', Z.Front);
  b.block(0.39, 0.145, front - 0.018, 0.28, 0.12, 0.025, black, M.Metal, Z.Front, 0.004);
  plate(b, 0.39, 0.145, front - 0.035, -1);
}
function cageAndIntake(b: VehicleBuilder) {
  // Front/bulkhead cage and B hoop; no modern full rear-roof cage.
  for (const z of [-0.65, 0.35])
    tube(
      b,
      [
        [-0.9, 0.19, z - 0.07],
        [-0.9, 1.56, z],
        [0.9, 1.56, z],
        [0.9, 0.19, z - 0.07],
      ],
      0.027,
    );
  for (const side of [-1, 1]) {
    b.rod(v(side * 0.78, 1.56, -0.65), v(side * 0.78, 1.56, 0.35), 0.027, black, M.Metal, Z.Trim);
    for (const z of [-0.72, 0.28])
      b.block(side * 0.87, 0.21, z, 0.1, 0.08, 0.12, black, M.Metal, Z.Trim, 0.006);
    // Swivel work lamp on each A post, with its arm landing on the actual cage tube.
    b.rod(v(side * 0.9, 1.25, -0.667), v(side * 0.79, 1.265, -0.76), 0.013, black, M.Metal, Z.Trim);
    roundLamp(b, side * 0.79, 1.3, -0.76, 0.055, lens, M.DrivingLamp, Z.Front);
  }
  // LR-style raised intake, entering the front of the left wing.
  b.block(-0.724, 0.738, -1.7, 0.13, 0.07, 0.18, black, M.Rubber, Z.Front, 0.009);
  tube(
    b,
    [
      [-0.724, 0.755, -1.7],
      [-0.8, 0.79, -1.5],
      [-0.91, 0.79, -0.84],
      [-0.995, 1.07, -0.74],
      [-0.995, 1.48, -0.65],
    ],
    0.044,
    black,
    Z.Front,
  );
  for (const yy of [1.21, 1.36]) {
    const zz = -0.74 + ((yy - 1.07) / 0.41) * 0.09;
    b.rod(
      v(-0.995, yy, zz),
      v(-0.9, yy, -0.72 + ((yy - 0.19) / 1.37) * 0.07),
      0.009,
      steel,
      M.Metal,
      Z.Front,
    );
    b.push().translate(-0.995, yy, zz).rotate(Math.atan2(0.09, 0.41), 0, 0);
    b.ring(0, 0, 0, 0.048, 0.005, steel, M.Metal, 'y', Z.Front);
    b.pop();
  }
  b.slot = M.Rubber;
  b.tag = Z.Front;
  b.push().translate(-0.995, 1.51, -0.65);
  b.geometry(new THREE.CylinderGeometry(0.072, 0.063, 0.075, 24), black);
  b.pop();
  b.push().translate(-0.995, 1.558, -0.65);
  b.geometry(new THREE.CylinderGeometry(0.093, 0.093, 0.025, 28), black);
  b.pop();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    b.block(
      -0.995 + Math.cos(a) * 0.071,
      1.512,
      -0.65 + Math.sin(a) * 0.071,
      0.009,
      0.035,
      0.009,
      dark,
      M.Rubber,
      Z.Front,
    );
  }
  // Tool on the right wing top, held by two clamp blocks.
  for (const z of [-1.5, -1.04]) b.block(0.72, 0.742, z, 0.1, 0.045, 0.047, black, M.Rubber, Z.Front, 0.004);
  b.rod(v(0.72, 0.77, -1.69), v(0.72, 0.77, -0.86), 0.014, new THREE.Color('#8F7149'), M.Fabric, Z.Front);
  b.block(0.72, 0.77, -1.67, 0.14, 0.025, 0.18, steel, M.Metal, Z.Front, 0.01);
}
function plaque(b: VehicleBuilder, w: number, h: number) {
  const s = new THREE.Shape(
    rounded([
      [-w / 2, -h / 2, 0.025],
      [w / 2, -h / 2, 0.025],
      [w / 2, h / 2, 0.025],
      [-w / 2, h / 2, 0.025],
    ]),
  );
  extrudeZ(b, s, -0.008, 0, yellow, M.Paint, Z.Trim, 0);
  b.slot = M.Paint;
  b.tag = Z.Trim;
  b.push().translate(0, h * 0.04, 0.001);
  camel(b, w * 0.5, 1);
  b.pop();
  b.push().translate(0, -h * 0.12, 0.002);
  letter(b, 'CAMEL', h * 0.18, 0.15, 0.18);
  b.pop();
  b.push().translate(0, -h * 0.35, 0.002);
  letter(b, 'TROPHY', h * 0.115, 0.15, 0.28);
  b.pop();
  // Thin blue border, with rounded plate corners.
  for (const side of [-1, 1])
    b.block(side * (w / 2 - 0.012), 0, 0.003, 0.006, h - 0.035, 0.003, blue, M.Paint, Z.Trim);
  for (const yy of [-h / 2 + 0.012, h / 2 - 0.012])
    b.block(0, yy, 0.003, w - 0.035, 0.006, 0.003, blue, M.Paint, Z.Trim);
}
function markings(b: VehicleBuilder) {
  for (const side of [-1, 1]) {
    b.push()
      .translate(side * (SIDE + 0.02), 0.48, -0.19)
      .rotate(0, (side * Math.PI) / 2, 0);
    plaque(b, 0.46, 0.4);
    b.pop();
    b.push()
      .translate(side * (SIDE + 0.018), 0.711, 1.34)
      .rotate(0, (side * Math.PI) / 2, 0);
    b.slot = M.Paint;
    b.tag = Z.Sides;
    letter(b, 'AUSTRALIA', 0.04, 0.13, 0.22);
    b.pop();
  }
  b.push().translate(-0.66, 1.18, TAIL + 0.03);
  plaque(b, 0.2, 0.18);
  b.pop();
}
function roofRack(b: VehicleBuilder) {
  for (const side of [-1, 1]) {
    const x = side * 0.76;
    b.rod(v(x, DECK, -0.66), v(x, DECK, 1.63), 0.019, black, M.Metal, Z.Roof);
    b.rod(v(x, 1.95, -0.66), v(x, 1.8, 1.63), 0.017, black, M.Metal, Z.Roof);
    for (const z of [-0.66, -0.17, 0.32, 0.81, 1.3, 1.63])
      b.rod(v(x, DECK, z), v(x, 1.95 - ((z + 0.66) / 2.29) * 0.15, z), 0.011, black, M.Metal, Z.Roof);
    for (const z of [-0.45, 0.26, 0.97, 1.54]) {
      b.block(side * 0.818, 1.445, z, 0.055, 0.047, 0.095, black, M.Metal, Z.Roof, 0.005);
      b.rod(v(side * 0.82, 1.46, z), v(x, DECK, z), 0.014, black, M.Metal, Z.Roof);
      b.block(side * 0.854, 1.435, z, 0.025, 0.05, 0.1, black, M.Metal, Z.Roof, 0.004);
    }
  }
  for (const [z, y] of [
    [-0.66, 1.95],
    [1.63, 1.8],
  ]) {
    b.rod(v(-0.76, DECK, z), v(0.76, DECK, z), 0.019, black, M.Metal, Z.Roof);
    b.rod(v(-0.76, y, z), v(0.76, y, z), 0.017, black, M.Metal, Z.Roof);
  }
  for (let i = 0; i < 11; i++) b.block(0, DECK, -0.6 + i * 0.22, 1.5, 0.024, 0.028, black, M.Metal, Z.Roof);
  // No rack decking. Upright jerry cans occupy the rear rack in individual cradles.
  for (const x of [0.19, 0.54]) jerryCan(b, x, DECK + 0.0425 + 0.215, 1.4);
  const canvas = new THREE.Color('#77704E');
  b.block(-0.36, DECK + 0.155, 0.88, 0.54, 0.285, 0.67, canvas, M.Fabric, Z.Roof, 0.045);
  for (const z of [0.72, 0.94]) {
    const strap = rect(-0.642, DECK - 0.026, -0.078, DECK + 0.31, 0.057),
      hole = rect(-0.63, DECK - 0.014, -0.09, DECK + 0.298, 0.045);
    strap.holes.push(new THREE.Path(hole.getPoints(20).reverse()));
    extrudeZ(b, strap, z - 0.02, z + 0.02, black, M.Rubber, Z.Roof, 0);
    b.block(-0.65, DECK + 0.13, z, 0.016, 0.055, 0.05, steel, M.Metal, Z.Roof, 0.003);
  }
  b.block(-0.32, DECK + 0.102, -0.2, 0.61, 0.18, 0.44, black, M.Metal, Z.Roof, 0.012);
  b.block(-0.32, DECK + 0.198, -0.2, 0.63, 0.018, 0.46, black, M.Metal, Z.Roof, 0.005);
  for (const x of [-0.55, -0.12])
    b.block(x, DECK + 0.175, -0.427, 0.045, 0.075, 0.022, steel, M.Metal, Z.Roof, 0.003);
  for (const x of [-0.39, -0.25])
    b.block(x, DECK + 0.221, -0.2, 0.018, 0.028, 0.025, steel, M.Metal, Z.Roof, 0.003);
  b.rod(v(-0.39, DECK + 0.238, -0.2), v(-0.25, DECK + 0.238, -0.2), 0.007, steel, M.Metal, Z.Roof);
  for (const x of [-0.55, -0.12])
    b.block(x, DECK + 0.015, -0.16, 0.055, 0.035, 0.06, steel, M.Metal, Z.Roof, 0.003);
  // Four Litemate-style rectangular work lamps, mounted to the rack's front structure.
  for (const x of [-0.61, -0.27, 0.27, 0.61]) {
    b.block(x, 1.725, -0.66, 0.04, 0.21, 0.05, black, M.Metal, Z.Roof, 0.004);
    b.block(x, 1.84, -0.685, 0.15, 0.135, 0.1, black, M.Rubber, Z.Roof, 0.016);
    b.block(x, 1.84, -0.74, 0.127, 0.107, 0.013, lens, M.DrivingLamp, Z.Roof, 0.01);
    for (let i = 0; i < 6; i++)
      b.block(x - 0.05 + i * 0.02, 1.84, -0.748, 0.002, 0.09, 0.003, lens, M.DrivingLamp, Z.Roof);
  }
  b.rod(v(-0.66, 1.72, -0.66), v(0.66, 1.72, -0.66), 0.014, black, M.Metal, Z.Roof);
  b.push().translate(0, 1.835, -0.756).rotate(0, Math.PI, 0);
  plaqueMount(b);
  b.pop();
}
function plaqueMount(b: VehicleBuilder) {
  b.block(0, 0, -0.015, 0.035, 0.3, 0.025, black, M.Metal, Z.Roof);
  b.block(0, -0.12, -0.07, 0.045, 0.035, 0.14, black, M.Metal, Z.Roof, 0.004);
  plaque(b, 0.34, 0.29);
}
function jerryCan(b: VehicleBuilder, x: number, y: number, z: number) {
  const olive = new THREE.Color('#646B46');
  b.block(x, DECK + 0.025, z, 0.33, 0.035, 0.24, black, M.Metal, Z.Roof, 0.004);
  for (const xx of [x - 0.157, x + 0.157])
    b.block(xx, DECK + 0.115, z, 0.022, 0.2, 0.24, black, M.Metal, Z.Roof, 0.003);
  b.block(x, y, z, 0.29, 0.43, 0.19, olive, M.Paint, Z.Roof, 0.023);
  for (const dir of [-1, 1])
    b.rod(
      v(x - 0.1, y - dir * 0.15, z + 0.101),
      v(x + 0.1, y + dir * 0.15, z + 0.101),
      0.008,
      olive,
      M.Paint,
      Z.Roof,
    );
  for (const xx of [x - 0.08, x - 0.01, x + 0.06]) {
    b.rod(v(xx, y + 0.205, z - 0.025), v(xx, y + 0.27, z - 0.025), 0.009, olive, M.Paint, Z.Roof);
    b.rod(v(xx, y + 0.27, z - 0.025), v(xx, y + 0.27, z + 0.035), 0.009, olive, M.Paint, Z.Roof);
    b.rod(v(xx, y + 0.27, z + 0.035), v(xx, y + 0.205, z + 0.035), 0.009, olive, M.Paint, Z.Roof);
  }
  b.slot = M.Metal;
  b.tag = Z.Roof;
  b.push().translate(x + 0.1, y + 0.224, z + 0.035);
  b.geometry(new THREE.CylinderGeometry(0.023, 0.026, 0.018, 16), olive);
  b.pop();
  b.push().translate(x + 0.1, y + 0.239, z + 0.035);
  b.geometry(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 16), steel);
  b.pop();
  b.block(x, y, z + 0.109, 0.035, 0.42, 0.012, black, M.Rubber, Z.Roof);
  b.block(x, y, z - 0.108, 0.035, 0.42, 0.012, black, M.Rubber, Z.Roof);
  for (const yy of [y - 0.22, y + 0.219]) b.block(x, yy, z, 0.035, 0.014, 0.23, black, M.Rubber, Z.Roof);
  b.block(x, y + 0.01, z + 0.12, 0.055, 0.06, 0.013, steel, M.Metal, Z.Roof, 0.003);
}
function spares(b: VehicleBuilder, t: VehicleTuning, w: THREE.BufferGeometry) {
  const rear = { x: 0.12, y: 0.78, z: TAIL + 0.255 };
  b.block(rear.x, rear.y, TAIL + 0.04, 0.27, 0.25, 0.06, black, M.Metal, Z.Rear, 0.006);
  b.rod(v(rear.x, rear.y, TAIL + 0.04), v(rear.x, rear.y, rear.z - 0.09), 0.043, black, M.Metal, Z.Rear);
  b.push()
    .translate(rear.x, rear.y, rear.z)
    .rotate(0, -Math.PI / 2, 0);
  b.geometry(w.clone(), rubber);
  b.pop();
  const cy = 0.743 + t.wheelWidth / 2 + 0.075,
    z = -1.31;
  b.block(0, 0.785, z, 0.34, 0.09, 0.34, black, M.Metal, Z.Front, 0.008);
  b.push()
    .translate(0, cy, z)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(w.clone(), rubber);
  b.pop();
  const top = cy + t.wheelWidth / 2 + 0.045;
  b.rod(v(0, 0.8, z), v(0, top + 0.04, z), 0.014, steel, M.Metal, Z.Front);
  b.block(0, top, z, 0.22, 0.018, 0.055, black, M.Metal, Z.Front, 0.004);
  b.rod(v(-0.06, top + 0.025, z), v(0.06, top + 0.025, z), 0.009, steel, M.Metal, Z.Front);
}
function interior(b: VehicleBuilder, t: VehicleTuning) {
  const seat = new THREE.Color('#6D6045');
  b.block(0, 0.36, 0.02, 1.56, 0.25, 0.39, paint, M.Paint, Z.Trim, 0.008);
  b.block(0, 0.27, -0.27, 0.31, 0.2, 0.62, black, M.Rubber, Z.Trim, 0.025);
  b.block(0, 0.63, SCUTTLE + 0.025, 1.57, 0.39, 0.04, paint, M.Paint, Z.Trim);
  b.block(0, 0.8, SCUTTLE + 0.09, 1.58, 0.065, 0.2, black, M.Rubber, Z.Trim, 0.01);
  // The binnacle stands just ahead of the dial faces, so they show from the seat.
  const cabin = vehicles.camel.cabin;
  b.block(cabin.dials.speed.x, 0.875, cabin.dialZ - 0.093, 0.44, 0.2, 0.18, black, M.Rubber, Z.Trim, 0.015);
  addDialFaces(b, vehicles.camel.cabin, t.engine.redlineRpm);
  addSteeringColumn(b, vehicles.camel.cabin);
  for (const x of [-0.42, 0.42]) {
    b.block(x, 0.54, 0.015, 0.46, 0.12, 0.48, seat, M.Fabric, Z.Trim, 0.035);
    b.block(x, 0.89, 0.23, 0.46, 0.62, 0.11, seat, M.Fabric, Z.Trim, 0.035);
    for (const dx of [-0.115, 0.115])
      b.block(x + dx, 0.603, 0.01, 0.009, 0.005, 0.41, dark, M.Fabric, Z.Trim);
    for (const z of [-0.12, 0.15]) b.block(x, 0.474, z, 0.4, 0.03, 0.035, black, M.Metal, Z.Trim);
  }
  for (const [x, z, yy] of [
    [-0.11, -0.21, 0.75],
    [-0.02, -0.29, 0.65],
  ]) {
    b.rod(v(x, 0.37, z - 0.12), v(x, yy, z), 0.009, steel, M.Metal, Z.Trim);
    b.slot = M.Rubber;
    b.tag = Z.Trim;
    b.push().translate(x, yy, z);
    b.geometry(new THREE.SphereGeometry(0.025, 12, 8), black);
    b.pop();
  }
  b.block(0, 0.305, 0.63, 1.05, 0.31, 0.035, paint, M.Paint, Z.Trim);
  // One forward-facing rear passenger seat, dog guard and connected wheel boxes.
  b.block(-0.36, 0.64, 1.17, 0.51, 0.12, 0.48, seat, M.Fabric, Z.Trim, 0.025);
  b.block(-0.36, 0.95, 1.41, 0.51, 0.58, 0.11, seat, M.Fabric, Z.Trim, 0.025);
  for (const z of [1.02, 1.32])
    for (const x of [-0.56, -0.16]) b.block(x, 0.54, z, 0.025, 0.1, 0.025, steel, M.Metal, Z.Trim);
  for (const z of [1.02, 1.32]) b.block(-0.36, 0.48, z, 0.43, 0.025, 0.05, steel, M.Metal, Z.Trim);
  for (const side of [-1, 1])
    b.block(side * 0.68, 0.57, AXLE, 0.3, 0.06, 1.07, paint, M.Paint, Z.Trim, 0.006);
  for (const x of [-0.73, 0.73]) b.rod(v(x, 0.15, 0.46), v(x, 1.36, 0.46), 0.012, black, M.Metal, Z.Trim);
  for (let i = 0; i < 10; i++)
    b.rod(v(-0.7 + i * 0.156, 0.81, 0.46), v(-0.7 + i * 0.156, 1.33, 0.46), 0.004, black, M.Metal, Z.Trim);
  for (const y of [0.81, 1.07, 1.33])
    b.rod(v(-0.73, y, 0.46), v(0.73, y, 0.46), 0.006, black, M.Metal, Z.Trim);
}
export function buildCamelBody(t: VehicleTuning, w: THREE.BufferGeometry): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  front(b);
  cabinShell(b);
  rearBody(b);
  chassis(b);
  interior(b, t);
  // Coil seats on the axles and the radius-arm brackets that hold them to the chassis.
  for (const z of [-AXLE, AXLE])
    for (const side of [-1, 1]) {
      const x = side * 0.403,
        rail = side * (z < 0 ? 0.3 : 0.43),
        dz = z < 0 ? 0.16 : -0.16;
      b.block(x, 0.26, z, 0.22, 0.025, 0.22, black, M.Metal, Z.Trim, 0.005);
      for (const zz of [z - 0.075, z + 0.075])
        b.rod(v(rail, 0.34, zz), v(x, 0.25, zz), 0.018, steel, M.Metal, Z.Trim);
      b.rod(
        v(rail, 0.34, z + dz),
        v(side * (z < 0 ? 0.423 : 0.303), 0.32, z + dz),
        0.018,
        steel,
        M.Metal,
        Z.Trim,
      );
      b.block(
        side * (z < 0 ? 0.423 : 0.303),
        0.32,
        z + dz,
        0.075,
        0.04,
        0.075,
        black,
        M.Metal,
        Z.Trim,
        0.006,
      );
    }
  roof(b);
  b.push().translate(0, 0, 0.17);
  bullbar(b);
  b.pop();
  cageAndIntake(b);
  markings(b);
  roofRack(b);
  spares(b, t, w);
  return cleanGeometry(b.build());
}
/** Actual perforated metal sand ladders along the two sides of the rack. */
export function buildCamelPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder(),
    side = index === 0 ? -1 : 1;
  const outline: Vtx[] = [
    [-0.52, 1.7, 0.025],
    [1.6, 1.7, 0.025],
    [1.6, 1.94, 0.025],
    [-0.52, 1.94, 0.025],
  ];
  const holes: Vtx[][] = [];
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 17; i++) {
      const z = -0.45 + i * 0.12,
        y = 1.745 + row * 0.1;
      holes.push([
        [z - 0.037, y - 0.024, 0.015],
        [z + 0.037, y - 0.024, 0.015],
        [z + 0.037, y + 0.024, 0.015],
        [z - 0.037, y + 0.024, 0.015],
      ]);
    }
  extrudeX(
    b,
    sideShape(outline, holes),
    side > 0 ? 0.785 : -0.804,
    side > 0 ? 0.804 : -0.785,
    steel,
    M.Metal,
    Z.Roof,
    0.002,
  );
  for (const y of [1.707, 1.933])
    b.block(side * 0.807, y, 0.54, 0.015, 0.015, 2.08, steel, M.Metal, Z.Roof, 0.005);
  for (const z of [-0.17, 1.3]) {
    b.rod(v(side * 0.76, 1.76, z), v(side * 0.818, 1.76, z), 0.009, black, M.Metal, Z.Roof);
    b.block(side * 0.822, 1.8, z, 0.022, 0.13, 0.045, black, M.Metal, Z.Roof, 0.003);
    b.block(side * 0.834, 1.8, z, 0.015, 0.045, 0.065, steel, M.Metal, Z.Roof, 0.004);
  }
  return cleanGeometry(b.build());
}
