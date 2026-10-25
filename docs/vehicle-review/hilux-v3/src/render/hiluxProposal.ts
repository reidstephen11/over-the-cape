import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { VehicleTuning } from "../data/vehicle";
import { plankTuning } from "../data/tools";
import {
  BodyZone as Z,
  VehicleBuilder,
  VehicleMaterial as M,
} from "./vehicleGeometry";
import { addHiluxInterior } from "./hiluxInterior";
import { hiluxColors } from "./hiluxPaint";
import { hoopBar } from "./hiluxBullbar";
import { roundHead, stalk } from "./mirrors";

/**
 * Early Toyota Hilux 4WD single cab (1979–83) with the factory styleside tub, in deep
 * red: a long flat bonnet between flat-topped wings, a full-width grille with round
 * headlamps in square bezels at its ends, a raked windscreen, door glass with a vent
 * window, a short cab with a small rear window, and a tub whose smooth sides run on
 * flush with the cab, with vertical tail lamps in its rear corners and a chrome step
 * bumper. Added for the game: a black bull bar with a winch behind it, and a ladder rack
 * over the tub that carries the two recovery boards. The tailgate is left plain, with no
 * maker's lettering. Ground is about 0.5 m below the origin when parked.
 */
const { paint, chrome, bar } = hiluxColors;
const black = new THREE.Color("#1E2120"),
  rubber = new THREE.Color("#262928"),
  steel = new THREE.Color("#8F938D");
const red = new THREE.Color("#B3271F"),
  amber = new THREE.Color("#E5992F"),
  lens = new THREE.Color("#E6E4D2");
const glass = new THREE.Color("#A2BAB6"),
  plateWhite = new THREE.Color("#E9E7DD"),
  maroon = new THREE.Color("#6A1F2A");

/** Body sides, wheel openings and the main heights and stations (vehicle frame). */
const SIDE = 0.835;
const SILL = -0.02;
const WAIST = 0.6;
const ARCH = { radius: 0.47, cy: -0.1 };
const FRONT_FACE = -2.15;
const COWL = { y: 0.63, z: -0.93 };
const SCREEN_TOP = { y: 1.21, z: -0.5 };
const DOOR = { front: -0.86, back: 0.22 };
const CAB_BACK = 0.36;
const ROOF = 1.27;
const TUB_FRONT = 0.43;
const TAIL = 2.43;
const TUB_FLOOR = 0.3;
const RACK_TOP = 1.31;
const AXLE_Z = 1.4;
const clearanceSolids: { name: string; min: number[]; max: number[] }[] = [];
/** Record the same solid box that is drawn, for the review clearance audit. */
function solidBox(
  b: VehicleBuilder,
  name: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: THREE.Color,
  slot: (typeof M)[keyof typeof M],
  zone: number,
): void {
  clearanceSolids.push({
    name,
    min: [x - w / 2, y - h / 2, z - d / 2],
    max: [x + w / 2, y + h / 2, z + d / 2],
  });
  b.block(x, y, z, w, h, d, color, slot, zone);
}
const accessoryRanges: { start: number; end: number }[] = [];
let bonnetTopology = {
  boundaryEdges: 0,
  nonManifoldEdges: 0,
  inconsistentlyWoundEdges: 0,
};
const innerWells: { name: string; min: number[]; max: number[] }[] = [];

/**
 * A side panel from `start` to `end` with a round wheel opening cut around `axle`: a
 * skin with a return edge, so the well can be looked into, a body-colour lip round the
 * opening and a dark inner well (the front ones sit further in, clear of the wheels at
 * full lock).
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
    inner = side * (axle > 0 ? 0.715 : SIDE - 0.045);
  const steps = 30;
  const low = (z: number) =>
    Math.max(
      SILL,
      Math.sqrt(Math.max(0, ARCH.radius ** 2 - (z - axle) ** 2)) + ARCH.cy,
    );
  b.slot = M.Paint;
  b.tag = zone;
  for (let i = 0; i < steps; i++) {
    const za = start + ((end - start) * i) / steps,
      zb = start + ((end - start) * (i + 1)) / steps;
    const ya = low(za),
      yb = low(zb);
    const a = { x: outer, y: ya, z: za },
      c = { x: outer, y: top, z: zb };
    const bb = { x: outer, y: yb, z: zb },
      d = { x: outer, y: top, z: za };
    const ai = { ...a, x: inner },
      bi = { ...bb, x: inner },
      ci = { ...c, x: inner },
      di = { ...d, x: inner };
    if (side > 0) b.quad(ai, bi, ci, di, paint);
    else b.quad(di, ci, bi, ai, paint);
    if (side > 0) b.quad(a, ai, bi, bb, paint);
    else b.quad(bb, bi, ai, a, paint);
    if (side > 0) b.quad(d, c, ci, di, paint);
    else b.quad(di, ci, c, d, paint);
  }
  const panelPos: number[] = [],
    panelIndex: number[] = [];
  for (let i = 0; i <= steps; i++)
    for (let row = 0; row <= 8; row++) {
      const z = start + ((end - start) * i) / steps,
        t = row / 8,
        y = low(z) + (top - low(z)) * t;
      panelPos.push(
        outer + side * 0.012 * Math.sin((Math.PI * (y - SILL)) / (top - SILL)),
        y,
        z,
      );
    }
  for (let i = 0; i < steps; i++)
    for (let row = 0; row < 8; row++) {
      const a = i * 9 + row,
        c = a + 9;
      if (side < 0) panelIndex.push(a, c, c + 1, a, c + 1, a + 1);
      else panelIndex.push(a, a + 1, c + 1, a, c + 1, c);
    }
  const panel = new THREE.BufferGeometry();
  panel.setAttribute("position", new THREE.Float32BufferAttribute(panelPos, 3));
  panel.setIndex(panelIndex);
  panel.computeVertexNormals();
  b.slot = M.Paint;
  b.tag = zone;
  b.geometry(panel, paint);
  b.slot = M.Paint;
  b.tag = zone;
  b.push()
    .translate(side * (SIDE + 0.008), ARCH.cy, axle)
    .rotate(0, Math.PI / 2, 0)
    .rotate(0, 0, Math.asin((SILL - ARCH.cy + 0.018) / (ARCH.radius + 0.012)))
    .scale(1, 1, 0.65);
  b.geometry(
    new THREE.TorusGeometry(
      ARCH.radius + 0.012,
      0.018,
      8,
      48,
      Math.PI - 2 * Math.asin((SILL - ARCH.cy + 0.018) / (ARCH.radius + 0.012)),
    ),
    paint,
  );
  b.pop();
  const wellStart = b.positions.length;
  b.block(
    side * wellX,
    ARCH.cy + 0.22,
    axle,
    0.03,
    0.58,
    ARCH.radius * 2,
    black,
    M.Rubber,
    Z.Trim,
  );
  const bounds = new THREE.Box3().setFromArray(b.positions.slice(wellStart));
  innerWells.push({
    name: `${axle < 0 ? "front" : "rear"}-${side < 0 ? "left" : "right"}`,
    min: bounds.min.toArray(),
    max: bounds.max.toArray(),
  });
  // The well's roof stops at the inner skin, so it never shows through the outer one.
  solidBox(
    b,
    `liner-roof-${side}-${axle}`,
    (side * (wellX + SIDE - 0.05)) / 2,
    ARCH.cy + ARCH.radius + 0.057,
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
  "0": [
    [0, 0, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 0, 0],
  ],
  "3": [
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [0.25, 0.5, 1, 0.5],
  ],
  "6": [
    [1, 1, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [1, 0, 1, 0.5],
    [1, 0.5, 0, 0.5],
  ],
  R: [
    [0, 0, 0, 1],
    [0, 1, 1, 1],
    [1, 1, 1, 0.5],
    [1, 0.5, 0, 0.5],
    [0.35, 0.5, 1, 0],
  ],
  N: [
    [0, 0, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 1, 1],
  ],
  "-": [[0.15, 0.5, 0.85, 0.5]],
};

/** White plate with maroon "RN-036" (the plate faces -z before `facing` turns it). */
function plate(
  b: VehicleBuilder,
  x: number,
  y: number,
  z: number,
  facing: 1 | -1,
): void {
  b.push()
    .translate(x, y, z)
    .rotate(0, facing > 0 ? Math.PI : 0, 0);
  b.block(0, 0, 0, 0.36, 0.12, 0.012, plateWhite, M.Lamp, Z.Trim, 0.006);
  const text = "RN-036";
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
        maroon,
        M.Rubber,
        Z.Trim,
      );
  }
  b.pop();
}

/** Crowned, closed bonnet panel: the ridge falls gently towards the front edge. */
function bonnet(b: VehicleBuilder): void {
  const nx = 32,
    nz = 20,
    pos: number[] = [],
    indices: number[] = [];
  for (let layer = 0; layer < 2; layer++)
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const u = (i / nx) * 2 - 1,
          t = j / nz,
          width = 0.731 + 0.006 * t;
        pos.push(
          u * width,
          0.586 + 0.035 * t + 0.037 * (1 - u * u) - layer * 0.018,
          -2.13 + 1.18 * t,
        );
      }
  const N = (nx + 1) * (nz + 1);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i,
        c = a + nx + 1;
      indices.push(
        a,
        c,
        a + 1,
        a + 1,
        c,
        c + 1,
        a + N,
        a + 1 + N,
        c + N,
        a + 1 + N,
        c + 1 + N,
        c + N,
      );
    }
  const edge = (a: number, c: number) =>
    indices.push(a, a + N, c, c, a + N, c + N);
  for (let i = 0; i < nx; i++) {
    edge(i + 1, i);
    edge(nz * (nx + 1) + i, nz * (nx + 1) + i + 1);
  }
  for (let j = 0; j < nz; j++) {
    edge(j * (nx + 1), (j + 1) * (nx + 1));
    edge((j + 1) * (nx + 1) + nx, j * (nx + 1) + nx);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const edges = new Map<string, { count: number; direction: number }>();
  for (let i = 0; i < indices.length; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = indices[i + j],
        c = indices[i + ((j + 1) % 3)],
        key = `${Math.min(a, c)},${Math.max(a, c)}`;
      const e = edges.get(key) ?? { count: 0, direction: 0 };
      e.count++;
      e.direction += a < c ? 1 : -1;
      edges.set(key, e);
    }
  bonnetTopology = {
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    inconsistentlyWoundEdges: 0,
  };
  for (const e of edges.values()) {
    if (e.count === 1) bonnetTopology.boundaryEdges++;
    if (e.count > 2) bonnetTopology.nonManifoldEdges++;
    if (e.direction !== 0) bonnetTopology.inconsistentlyWoundEdges++;
  }
  b.slot = M.Paint;
  b.tag = Z.Front;
  b.geometry(g, paint);
  // Wing crowns close the volume between the bonnet seam and vertical wing skin.
  for (const side of [-1, 1]) {
    const p: number[] = [],
      idx: number[] = [];
    for (let j = 0; j <= 20; j++)
      for (let i = 0; i <= 8; i++) {
        const t = j / 20,
          u = i / 8,
          x = (0.739 + 0.006 * t) * (1 - u) + SIDE * u;
        p.push(
          side * x,
          (0.586 + 0.035 * t) * (1 - u) +
            0.6 * u +
            0.008 * Math.sin(Math.PI * u),
          -2.13 + 1.18 * t,
        );
      }
    for (let j = 0; j < 20; j++)
      for (let i = 0; i < 8; i++) {
        const a = j * 9 + i,
          c = a + 9;
        if (side > 0) idx.push(a, c, a + 1, a + 1, c, c + 1);
        else idx.push(a, a + 1, c, a + 1, c + 1, c);
      }
    const wing = new THREE.BufferGeometry();
    wing.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    wing.setIndex(idx);
    wing.computeVertexNormals();
    b.geometry(wing, paint);
  }
}

function frontEnd(b: VehicleBuilder): void {
  const F = FRONT_FACE;
  bonnet(b);
  b.slot = M.Paint;
  b.tag = Z.Front;
  for (let i = 0; i < 32; i++) {
    const x0 = -0.731 + (i * 1.462) / 32,
      x1 = x0 + 1.462 / 32;
    const upper = (x: number) => 0.586 + 0.037 * (1 - (x / 0.731) ** 2) - 0.003;
    b.quad(
      { x: x0, y: 0.55, z: F + 0.006 },
      { x: x0, y: upper(x0), z: -2.128 },
      { x: x1, y: upper(x1), z: -2.128 },
      { x: x1, y: 0.55, z: F + 0.006 },
      paint,
    );
  }
  b.block(0, 0.625, -0.95, 1.49, 0.035, 0.08, paint, M.Paint, Z.Front, 0.012);
  for (let i = 0; i < 13; i++)
    b.block(
      -0.48 + i * 0.08,
      0.647,
      -0.95,
      0.042,
      0.004,
      0.044,
      black,
      M.Rubber,
      Z.Front,
      0.002,
    );
  // Recessed grille opening, surrounded by the painted front apron.
  b.block(
    0,
    0.411,
    F + 0.015,
    1.65,
    0.33,
    0.055,
    paint,
    M.Paint,
    Z.Front,
    0.022,
  );
  b.block(
    0,
    0.418,
    F - 0.018,
    1.57,
    0.271,
    0.022,
    black,
    M.Rubber,
    Z.Front,
    0.018,
  );
  for (const y of [0.284, 0.552])
    b.block(
      0,
      y,
      F - 0.033,
      1.57,
      0.012,
      0.014,
      chrome,
      M.Metal,
      Z.Front,
      0.005,
    );
  for (const side of [-1, 1]) {
    archPanel(b, side, F, DOOR.front - 0.01, -1.4, 0.6, Z.Front, 0.4);

    const hx = side * 0.655;
    b.block(
      hx,
      0.416,
      F - 0.036,
      0.246,
      0.245,
      0.018,
      chrome,
      M.Metal,
      Z.Front,
      0.022,
    );
    b.block(
      hx,
      0.416,
      F - 0.047,
      0.221,
      0.22,
      0.012,
      black,
      M.Rubber,
      Z.Front,
      0.028,
    );
    b.ring(hx, 0.416, F - 0.059, 0.103, 0.008, chrome, M.Metal, "z", Z.Front);
    // Shallow lens with an inset reflector; fine pressed-glass flutes catch the light.
    b.slot = M.Headlamp;
    b.tag = Z.Front;
    b.push()
      .translate(hx, 0.416, F - 0.058)
      .scale(1, 1, 0.16);
    b.geometry(new THREE.SphereGeometry(0.096, 40, 20), lens);
    b.pop();
    for (let i = -6; i <= 6; i++) {
      const x = i * 0.013,
        h = Math.sqrt(0.092 ** 2 - x * x);
      b.rod(
        { x: hx + x, y: 0.416 - h, z: F - 0.075 },
        { x: hx + x, y: 0.416 + h, z: F - 0.075 },
        0.0009,
        new THREE.Color("#B9C7C6"),
        M.Metal,
        Z.Front,
      );
    }
    for (const dy of [-0.043, 0, 0.043]) {
      const w = Math.sqrt(0.09 ** 2 - dy * dy);
      b.rod(
        { x: hx - w, y: 0.416 + dy, z: F - 0.077 },
        { x: hx + w, y: 0.416 + dy, z: F - 0.077 },
        0.0008,
        chrome,
        M.Metal,
        Z.Front,
      );
    }
    b.block(
      side * 0.841,
      0.34,
      -1.99,
      0.014,
      0.052,
      0.115,
      black,
      M.Rubber,
      Z.Front,
      0.008,
    );
    b.block(
      side * 0.85,
      0.34,
      -1.99,
      0.009,
      0.038,
      0.096,
      amber,
      M.Amber,
      Z.Front,
      0.007,
    );
  }
  for (const x of [-0.46, -0.23, 0, 0.23, 0.46])
    b.block(
      x,
      0.417,
      F - 0.039,
      0.011,
      0.235,
      0.015,
      steel,
      M.Rubber,
      Z.Front,
      0.002,
    );
  for (let i = 0; i < 4; i++)
    b.block(
      0,
      0.323 + i * 0.063,
      F - 0.052,
      1.04,
      0.018,
      0.021,
      chrome,
      M.Metal,
      Z.Front,
      0.004,
    );
  b.block(
    0,
    0.419,
    F - 0.067,
    0.33,
    0.071,
    0.016,
    black,
    M.Rubber,
    Z.Front,
    0.003,
  );
  const glyphs: Record<string, string[]> = {
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  };
  [..."TOYOTA"].forEach((ch, k) =>
    glyphs[ch].forEach((row, j) =>
      [...row].forEach((v, i) => {
        if (v === "1")
          b.block(
            0.143 - k * 0.05 - i * 0.007,
            0.441 - j * 0.007,
            F - 0.078,
            0.007,
            0.007,
            0.003,
            chrome,
            M.Metal,
            Z.Front,
          );
      }),
    ),
  );
  b.block(0, 0.205, F + 0.02, 1.64, 0.13, 0.05, paint, M.Paint, Z.Front, 0.018);
  for (const x of [-0.42, 0.42])
    b.block(x, 0.04, F + 0.05, 0.06, 0.06, 0.14, black, M.Metal, Z.Trim);
  b.block(0, -0.05, -1.72, 0.4, 0.15, 0.46, black, M.Metal, Z.Trim, 0.02);
}

function windscreen(b: VehicleBuilder): void {
  const dy = SCREEN_TOP.y - COWL.y,
    dz = SCREEN_TOP.z - COWL.z;
  const lean = Math.atan2(dz, dy),
    L = Math.hypot(dy, dz);
  b.push().translate(0, COWL.y, COWL.z).rotate(lean, 0, 0);
  // Glass in a black rubber surround between the body-colour pillars.
  b.block(0, L / 2, 0, 1.44, L - 0.05, 0.008, glass, M.Glass, Z.Glass);
  for (const y of [0.015, L - 0.015])
    b.block(0, y, 0.002, 1.48, 0.026, 0.02, rubber, M.Rubber, Z.Front);
  for (const x of [-0.73, 0.73])
    b.block(x, L / 2, 0.002, 0.026, L, 0.02, rubber, M.Rubber, Z.Front);
  for (const x of [-0.775, 0.775])
    b.block(
      x,
      L / 2,
      0.01,
      0.07,
      L + 0.02,
      0.05,
      paint,
      M.Paint,
      Z.Front,
      0.012,
    );
  // Wipers parked along the bottom of the screen.
  for (const x of [0.52, -0.12]) {
    b.rod(
      { x, y: 0.05, z: -0.02 },
      { x: x - 0.44, y: 0.08, z: -0.02 },
      0.006,
      black,
      M.Rubber,
      Z.Front,
    );
    b.rod(
      { x, y: 0.055, z: -0.026 },
      { x: x - 0.4, y: 0.085, z: -0.026 },
      0.004,
      black,
      M.Rubber,
      Z.Front,
    );
  }
  // Rear-view mirror inside the top of the screen.
  b.block(0, L - 0.09, 0.05, 0.2, 0.06, 0.02, black, M.Rubber, Z.Trim, 0.01);
  b.pop();
}

function cab(b: VehicleBuilder): void {
  // Roof with drip rails, B-pillars and the back wall round its small rear window.
  const roofLen = CAB_BACK - SCREEN_TOP.z;
  {
    const g = new RoundedBoxGeometry(1.64, 0.055, roofLen, 3, 0.026);
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i);
      const crown =
        0.018 *
        Math.max(0, 1 - (x / 0.82) ** 2) *
        Math.max(0, 1 - (z / (roofLen / 2)) ** 4);
      pos.setY(i, pos.getY(i) + crown);
    }
    g.computeVertexNormals();
    b.slot = M.Paint;
    b.tag = Z.Roof;
    b.push().translate(0, ROOF - 0.035, (SCREEN_TOP.z + CAB_BACK) / 2);
    b.geometry(g, paint);
    b.pop();
  }
  for (const side of [-1, 1]) {
    b.rod(
      { x: side * 0.79, y: ROOF - 0.045, z: SCREEN_TOP.z + 0.01 },
      { x: side * 0.79, y: ROOF - 0.045, z: CAB_BACK - 0.01 },
      0.008,
      paint,
      M.Paint,
      Z.Roof,
    );
    b.block(
      side * 0.79,
      (WAIST + ROOF - 0.03) / 2,
      (DOOR.back + CAB_BACK) / 2 + 0.01,
      0.07,
      ROOF - WAIST - 0.03,
      CAB_BACK - DOOR.back,
      paint,
      M.Paint,
      Z.Sides,
      0.012,
    );
  }
  const backZ = CAB_BACK - 0.01;
  const wy0 = 0.73,
    wy1 = 1.13,
    wx = 0.52;
  b.block(
    0,
    (SILL + wy0) / 2,
    backZ,
    1.62,
    wy0 - SILL,
    0.025,
    paint,
    M.Paint,
    Z.Rear,
  );
  b.block(
    0,
    (wy1 + ROOF - 0.02) / 2,
    backZ,
    1.56,
    ROOF - 0.02 - wy1,
    0.025,
    paint,
    M.Paint,
    Z.Rear,
  );
  for (const side of [-1, 1])
    b.block(
      (side * (wx + 0.8)) / 2,
      (wy0 + wy1) / 2,
      backZ,
      0.8 - wx,
      wy1 - wy0,
      0.025,
      paint,
      M.Paint,
      Z.Rear,
    );
  b.block(
    0,
    (wy0 + wy1) / 2,
    backZ,
    wx * 2,
    wy1 - wy0,
    0.008,
    glass,
    M.Glass,
    Z.Glass,
  );
  b.block(
    0,
    wy0,
    backZ + 0.014,
    wx * 2 + 0.02,
    0.02,
    0.012,
    rubber,
    M.Rubber,
    Z.Rear,
  );
  b.block(
    0,
    wy1,
    backZ + 0.014,
    wx * 2 + 0.02,
    0.02,
    0.012,
    rubber,
    M.Rubber,
    Z.Rear,
  );

  const pillarZ = (y: number) =>
    COWL.z + ((y - COWL.y) * (SCREEN_TOP.z - COWL.z)) / (SCREEN_TOP.y - COWL.y);
  for (const side of [-1, 1]) {
    const x = side * (SIDE - 0.015);
    // Door skin below the waist, its seams, a chrome pull handle and the lock.
    {
      const g = new THREE.BoxGeometry(
        0.03,
        WAIST - SILL,
        DOOR.back - DOOR.front,
        2,
        16,
        12,
      );
      const pos = g.getAttribute("position");
      for (let i = 0; i < pos.count; i++) {
        const t = (pos.getY(i) + (WAIST - SILL) / 2) / (WAIST - SILL);
        pos.setX(i, pos.getX(i) + side * 0.01 * Math.sin(t * Math.PI));
      }
      g.computeVertexNormals();
      b.slot = M.Paint;
      b.tag = Z.Sides;
      b.push().translate(x, (SILL + WAIST) / 2, (DOOR.front + DOOR.back) / 2);
      b.geometry(g, paint);
      b.pop();
    }
    for (const z of [DOOR.front - 0.006, DOOR.back + 0.006])
      b.block(
        side * (SIDE + 0.002),
        (SILL + WAIST) / 2,
        z,
        0.006,
        WAIST - SILL,
        0.007,
        black,
        M.Rubber,
        Z.Sides,
      );
    b.block(
      side * (SIDE + 0.012),
      0.5,
      DOOR.back - 0.13,
      0.02,
      0.035,
      0.14,
      chrome,
      M.Metal,
      Z.Sides,
      0.01,
    );
    b.slot = M.Metal;
    b.tag = Z.Sides;
    b.push()
      .translate(side * (SIDE + 0.006), 0.5, DOOR.back - 0.04)
      .rotate(0, 0, Math.PI / 2);
    b.geometry(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12), chrome);
    b.pop();
    // Cab corner behind the door.
    b.block(
      x,
      (SILL + WAIST) / 2,
      (DOOR.back + CAB_BACK) / 2 + 0.008,
      0.03,
      WAIST - SILL,
      CAB_BACK - DOOR.back - 0.01,
      paint,
      M.Paint,
      Z.Sides,
      0.008,
    );
    // Door glass with a vent window at the front, in a thin chrome frame.
    const gx = side * 0.8;
    const top = SCREEN_TOP.y - 0.01;
    const vent = -0.66;
    b.slot = M.Glass;
    b.tag = Z.Glass;
    const g0 = { x: gx, y: WAIST + 0.01, z: pillarZ(WAIST + 0.01) + 0.03 },
      g1 = { x: gx, y: WAIST + 0.01, z: DOOR.back - 0.02 },
      g2 = { x: gx - side * 0.035, y: top, z: DOOR.back - 0.02 },
      g3 = { x: gx - side * 0.035, y: top, z: SCREEN_TOP.z + 0.03 };
    b.quad(g0, g1, g2, g3, glass);
    // The divider runs up to where it meets the windscreen pillar.
    const ventTop =
      COWL.y +
      ((vent - COWL.z) * (SCREEN_TOP.y - COWL.y)) / (SCREEN_TOP.z - COWL.z);
    b.rod(
      { x: gx + side * 0.004, y: WAIST + 0.01, z: vent },
      { x: gx - side * 0.012, y: ventTop, z: vent },
      0.008,
      chrome,
      M.Metal,
      Z.Sides,
    );
    b.rod(
      { x: gx - side * 0.031, y: top, z: SCREEN_TOP.z + 0.02 },
      { x: gx - side * 0.031, y: top, z: DOOR.back - 0.01 },
      0.009,
      chrome,
      M.Metal,
      Z.Sides,
    );
    b.rod(
      { x: gx + side * 0.004, y: WAIST + 0.01, z: DOOR.back - 0.012 },
      { x: gx - side * 0.031, y: top, z: DOOR.back - 0.012 },
      0.009,
      chrome,
      M.Metal,
      Z.Sides,
    );
    b.rod(
      { x: side * (SIDE - 0.01), y: WAIST + 0.004, z: DOOR.front },
      { x: side * (SIDE - 0.01), y: WAIST + 0.004, z: DOOR.back },
      0.01,
      chrome,
      M.Metal,
      Z.Sides,
    );
    // Round chrome door mirror: a foot on the door's front corner, a cranked stalk, and the
    // head on a ball joint.
    const mz = DOOR.front + 0.13;
    b.block(
      side * (SIDE + 0.008),
      WAIST - 0.03,
      mz + 0.01,
      0.02,
      0.05,
      0.1,
      black,
      M.Rubber,
      Z.Sides,
      0.01,
    );
    stalk(
      b,
      [
        { x: side * (SIDE + 0.015), y: WAIST - 0.03, z: mz + 0.01 },
        { x: side * (SIDE + 0.09), y: WAIST + 0.06, z: mz },
        { x: side * (SIDE + 0.13), y: WAIST + 0.2, z: mz - 0.03 },
      ],
      0.009,
      chrome,
    );
    roundHead(
      b,
      side,
      { x: side * (SIDE + 0.15), y: WAIST + 0.24, z: mz - 0.005 },
      0.07,
      chrome,
    );
    // The pressed waist crease ends at the door and cab/tub gaps.
    for (const [start, end] of [
      [FRONT_FACE + 0.04, DOOR.front - 0.018],
      [DOOR.front + 0.018, DOOR.back - 0.018],
      [TUB_FRONT + 0.02, TAIL - 0.06],
    ]) {
      b.block(
        side * 0.843,
        0.45,
        (start + end) / 2,
        0.006,
        0.008,
        end - start,
        paint.clone().multiplyScalar(0.82),
        M.Paint,
        Z.Sides,
        0.002,
      );
    }
  }
}

function tub(b: VehicleBuilder): void {
  for (const side of [-1, 1]) {
    archPanel(b, side, TUB_FRONT, TAIL, AXLE_Z, WAIST, Z.Rear, 0.51);
    // Capping rail along the top of each side, and the rear corner post with the lamps.
    b.block(
      side * (SIDE - 0.03),
      WAIST + 0.012,
      (TUB_FRONT + TAIL) / 2,
      0.075,
      0.025,
      TAIL - TUB_FRONT,
      paint,
      M.Paint,
      Z.Sides,
      0.008,
    );
    b.block(
      side * 0.785,
      (SILL + WAIST) / 2,
      TAIL - 0.02,
      0.1,
      WAIST - SILL,
      0.05,
      paint,
      M.Paint,
      Z.Rear,
      0.01,
    );
    const lx = side * 0.79;
    b.block(
      lx,
      0.3,
      TAIL + 0.008,
      0.08,
      0.42,
      0.02,
      black,
      M.Rubber,
      Z.Rear,
      0.008,
    );
    b.block(
      lx,
      0.41,
      TAIL + 0.02,
      0.066,
      0.17,
      0.012,
      red,
      M.Red,
      Z.Rear,
      0.006,
    );
    b.block(
      lx,
      0.25,
      TAIL + 0.02,
      0.066,
      0.12,
      0.012,
      amber,
      M.Amber,
      Z.Rear,
      0.006,
    );
    b.block(
      lx,
      0.14,
      TAIL + 0.02,
      0.066,
      0.07,
      0.012,
      lens,
      M.Metal,
      Z.Rear,
      0.006,
    );
    // Hollow wheel housing: roof, inboard wall and end walls, open underneath.
    const innerPaint = paint.clone().multiplyScalar(0.8);
    solidBox(
      b,
      `housing-top-${side}`,
      side * 0.665,
      0.5,
      AXLE_Z,
      0.33,
      0.025,
      1.0,
      innerPaint,
      M.Paint,
      Z.Trim,
    );
    solidBox(
      b,
      `housing-inner-${side}`,
      side * 0.5125,
      0.4,
      AXLE_Z,
      0.025,
      0.2,
      1.0,
      innerPaint,
      M.Paint,
      Z.Trim,
    );
    for (const dz of [-0.4875, 0.4875])
      solidBox(
        b,
        `housing-end-${side}-${dz}`,
        side * 0.665,
        0.4,
        AXLE_Z + dz,
        0.33,
        0.2,
        0.025,
        innerPaint,
        M.Paint,
        Z.Trim,
      );
  }
  // Fuel filler on the left side, just behind the cab.
  b.slot = M.Metal;
  b.tag = Z.Sides;
  b.push()
    .translate(-SIDE - 0.006, 0.47, TUB_FRONT + 0.2)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(new THREE.CylinderGeometry(0.048, 0.048, 0.016, 18), chrome);
  b.pop();
  // Front wall behind the cab, the ribbed floor and its underside.
  const inside = paint.clone().multiplyScalar(0.8);
  b.block(
    0,
    (TUB_FLOOR + WAIST) / 2,
    TUB_FRONT + 0.015,
    1.62,
    WAIST - TUB_FLOOR + 0.02,
    0.03,
    paint,
    M.Paint,
    Z.Rear,
  );
  b.block(
    0,
    (SILL + TUB_FLOOR) / 2,
    TUB_FRONT + 0.015,
    1.62,
    TUB_FLOOR - SILL,
    0.03,
    paint,
    M.Paint,
    Z.Rear,
  );
  // The bed floor has real openings beneath both wheel housings.
  solidBox(
    b,
    "bed-centre",
    0,
    TUB_FLOOR,
    (TUB_FRONT + TAIL) / 2,
    1.0,
    0.025,
    TAIL - TUB_FRONT,
    inside,
    M.Paint,
    Z.Trim,
  );
  for (const side of [-1, 1])
    for (const [from, to] of [
      [TUB_FRONT, AXLE_Z - 0.5],
      [AXLE_Z + 0.5, TAIL],
    ])
      solidBox(
        b,
        `bed-side-${side}-${from}`,
        side * 0.655,
        TUB_FLOOR,
        (from + to) / 2,
        0.31,
        0.025,
        to - from,
        inside,
        M.Paint,
        Z.Trim,
      );
  for (let i = 0; i < 9; i++) {
    const x = -0.64 + i * 0.16;
    for (const [from, to] of Math.abs(x) < 0.49
      ? [[TUB_FRONT + 0.03, TAIL - 0.03]]
      : [
          [TUB_FRONT + 0.03, AXLE_Z - 0.5],
          [AXLE_Z + 0.5, TAIL - 0.03],
        ])
      b.block(
        x,
        TUB_FLOOR + 0.016,
        (from + to) / 2,
        0.035,
        0.012,
        to - from,
        inside.clone().multiplyScalar(1.1),
        M.Paint,
        Z.Trim,
      );
  }
  // Drop-down tailgate with pressed ribs, latches at its top corners and its stays.
  b.block(
    0,
    (SILL + 0.04 + WAIST) / 2,
    TAIL,
    1.47,
    WAIST - SILL - 0.04,
    0.045,
    paint,
    M.Paint,
    Z.Rear,
    0.012,
  );
  for (const y of [0.18, 0.44])
    b.block(
      0,
      y,
      TAIL + 0.026,
      1.3,
      0.05,
      0.01,
      paint.clone().multiplyScalar(0.9),
      M.Paint,
      Z.Rear,
      0.006,
    );
  for (const side of [-1, 1]) {
    b.block(
      side * 0.67,
      WAIST - 0.06,
      TAIL + 0.028,
      0.08,
      0.035,
      0.014,
      chrome,
      M.Metal,
      Z.Rear,
      0.008,
    );
    b.rod(
      { x: side * 0.7, y: WAIST - 0.02, z: TAIL - 0.04 },
      { x: side * 0.76, y: WAIST - 0.12, z: TAIL - 0.04 },
      0.006,
      steel,
      M.Metal,
      Z.Rear,
    );
  }
  // Chrome step bumper with a rubber tread, its brackets and the rear plate.
  b.block(0, 0.1, 2.5, 1.64, 0.11, 0.1, chrome, M.Metal, Z.Rear, 0.025);
  b.block(0, 0.158, 2.49, 0.5, 0.012, 0.08, rubber, M.Rubber, Z.Rear, 0.004);
  for (const x of [-0.42, 0.42])
    b.block(x, 0.04, 2.44, 0.06, 0.07, 0.12, black, M.Metal, Z.Trim);
  plate(b, 0, 0.1, 2.556, 1);
  // A jerry can strapped against the front wall, and a steel toolbox.
  jerryCan(b, -0.55, TUB_FLOOR + 0.25, TUB_FRONT + 0.17);
  b.block(
    0.42,
    TUB_FLOOR + 0.13,
    TUB_FRONT + 0.2,
    0.62,
    0.24,
    0.3,
    new THREE.Color("#5E625C"),
    M.Metal,
    Z.Trim,
    0.012,
  );
  b.block(
    0.42,
    TUB_FLOOR + 0.255,
    TUB_FRONT + 0.2,
    0.64,
    0.02,
    0.32,
    new THREE.Color("#5E625C"),
    M.Metal,
    Z.Trim,
    0.006,
  );
  b.block(
    0.42,
    TUB_FLOOR + 0.2,
    TUB_FRONT + 0.355,
    0.08,
    0.03,
    0.012,
    chrome,
    M.Metal,
    Z.Trim,
    0.004,
  );
}

/** Pressed-steel jerry can, standing upright, with its handles and cap. */
function jerryCan(b: VehicleBuilder, x: number, y: number, z: number): void {
  const can = new THREE.Color("#5E6A43");
  b.block(x, y, z, 0.17, 0.47, 0.34, can, M.Paint, Z.Trim, 0.02);
  for (const k of [-1, 1])
    b.rod(
      { x: x + 0.087, y: y - 0.18, z: z - 0.12 * k },
      { x: x + 0.087, y: y + 0.18, z: z + 0.12 * k },
      0.008,
      can,
      M.Paint,
      Z.Trim,
    );
  b.block(x, y + 0.26, z - 0.08, 0.03, 0.05, 0.12, can, M.Paint, Z.Trim, 0.01);
  b.block(x, y + 0.255, z + 0.1, 0.06, 0.04, 0.06, can, M.Paint, Z.Trim, 0.01);
  b.block(x, y + 0.05, z, 0.19, 0.035, 0.36, black, M.Rubber, Z.Trim);
}

function rack(b: VehicleBuilder): void {
  const r = 0.022;
  const fz = TUB_FRONT + 0.05,
    rz = TAIL - 0.06,
    x = 0.78;
  // Headboard frame behind the cab (with bars guarding the rear window) and the rear frame.
  for (const z of [fz, rz]) {
    for (const side of [-1, 1])
      b.rod(
        { x: side * x, y: WAIST + 0.01, z },
        { x: side * x, y: RACK_TOP, z },
        r,
        bar,
        M.Metal,
        Z.Roof,
      );
    b.rod(
      { x: -x, y: RACK_TOP, z },
      { x, y: RACK_TOP, z },
      r,
      bar,
      M.Metal,
      Z.Roof,
    );
  }
  b.rod(
    { x: -x, y: WAIST + 0.03, z: fz },
    { x, y: WAIST + 0.03, z: fz },
    0.018,
    bar,
    M.Metal,
    Z.Roof,
  );
  b.rod(
    { x: -x, y: 0.97, z: fz },
    { x, y: 0.97, z: fz },
    0.018,
    bar,
    M.Metal,
    Z.Roof,
  );
  for (const bx of [-0.36, -0.12, 0.12, 0.36])
    b.rod(
      { x: bx, y: WAIST + 0.03, z: fz },
      { x: bx, y: RACK_TOP, z: fz },
      0.012,
      bar,
      M.Metal,
      Z.Roof,
    );
  // Side rails and a middle crossbar the boards lie on.
  for (const side of [-1, 1])
    b.rod(
      { x: side * x, y: RACK_TOP, z: fz },
      { x: side * x, y: RACK_TOP, z: rz },
      r,
      bar,
      M.Metal,
      Z.Roof,
    );
  b.rod(
    { x: -x, y: RACK_TOP, z: (fz + rz) / 2 },
    { x, y: RACK_TOP, z: (fz + rz) / 2 },
    r,
    bar,
    M.Metal,
    Z.Roof,
  );
  // Feet clamped to the capping rails.
  for (const z of [fz, rz])
    for (const side of [-1, 1])
      b.block(
        side * x,
        WAIST + 0.02,
        z,
        0.08,
        0.025,
        0.1,
        bar,
        M.Metal,
        Z.Roof,
        0.006,
      );
}

function chassisAndRecovery(
  b: VehicleBuilder,
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
): void {
  // Ladder frame, crossmembers, gearbox and transfer case, propshafts, tank and exhaust.
  for (const side of [-1, 1]) {
    const stations = [
      [-1.99, 0.35],
      [-0.8, 0.35],
      [-0.5, 0.42],
      [2.35, 0.42],
    ];
    const profile = new THREE.Shape();
    const points = [
      ...stations.map(([z, x]) => [side * x - 0.045, z]),
      ...[...stations].reverse().map(([z, x]) => [side * x + 0.045, z]),
    ];
    points.forEach(([x, z], i) =>
      i ? profile.lineTo(x, z) : profile.moveTo(x, z),
    );
    profile.closePath();
    const rail = new THREE.ExtrudeGeometry(profile, {
      depth: 0.15,
      bevelEnabled: false,
    });
    rail.rotateX(Math.PI / 2);
    rail.translate(0, 0.055, 0);
    b.slot = M.Metal;
    b.tag = Z.Trim;
    b.geometry(rail, black);
    for (const [name, x, from, to] of [
      ["front", 0.35, -1.99, -0.8],
      ["rear", 0.42, -0.5, 2.35],
    ] as const)
      clearanceSolids.push({
        name: `chassis-${side}-${name}`,
        min: [side * x - 0.045, -0.095, from],
        max: [side * x + 0.045, 0.055, to],
      });
  }
  for (const z of [-2.0, -0.85, 0.42, 1.75, 2.38])
    b.block(0, -0.02, z, 0.84, 0.08, 0.08, black, M.Metal, Z.Trim);
  b.block(0.04, -0.04, -0.32, 0.38, 0.16, 0.62, black, M.Metal, Z.Trim, 0.03);
  const shaft = steel.clone().multiplyScalar(0.6);
  b.rod(
    { x: 0.1, y: -0.08, z: -0.6 },
    { x: 0.08, y: -0.11, z: -1.27 },
    0.03,
    shaft,
  );
  b.rod(
    { x: 0.0, y: -0.07, z: 0.0 },
    { x: 0.05, y: -0.1, z: 1.28 },
    0.034,
    shaft,
  );
  // Tank and shield sit between the chassis rails, clear of the rear tyre sweep.
  solidBox(
    b,
    "fuel-tank",
    -0.12,
    0.06,
    0.6,
    0.26,
    0.24,
    0.66,
    black,
    M.Metal,
    Z.Trim,
  );
  solidBox(
    b,
    "tank-shield",
    -0.12,
    -0.075,
    0.6,
    0.32,
    0.02,
    0.72,
    steel.clone().multiplyScalar(0.45),
    M.Metal,
    Z.Trim,
  );
  b.rod(
    { x: 0.3, y: -0.06, z: -1.3 },
    { x: 0.3, y: -0.08, z: 0.3 },
    0.026,
    steel,
  );
  b.slot = M.Metal;
  b.tag = Z.Trim;
  b.push()
    .translate(0.3, -0.07, 0.62)
    .rotate(Math.PI / 2, 0, 0);
  b.geometry(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 12), shaft);
  b.pop();
  b.rod(
    { x: 0.3, y: -0.08, z: 0.88 },
    { x: 0.32, y: -0.04, z: 1.7 },
    0.024,
    steel,
  );
  b.rod(
    { x: 0.32, y: -0.04, z: 1.7 },
    { x: 0.62, y: -0.05, z: 2.18 },
    0.024,
    steel,
  );
  // The spare wheel slung flat under the back of the tub.
  b.tag = Z.Rear;
  b.push()
    .translate(0, 0.06, 2.02)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(wheel.clone(), black);
  b.pop();
  for (const x of [-0.2, 0.2])
    b.block(x, -0.04, 2.02, 0.05, 0.03, 0.8, black, M.Metal, Z.Trim);
  // The second spare lies flat on the tub floor between the wheel housings, with a ratchet
  // strap over it to the tie-down rails.
  const sy = TUB_FLOOR + 0.03 + tuning.wheelWidth * 0.53,
    sz = 1.75,
    strapY = sy + tuning.wheelWidth * 0.53 + 0.006;
  const orangeStrap = new THREE.Color("#C9762C");
  b.tag = Z.Rear;
  b.push()
    .translate(0, sy, sz)
    .rotate(0, 0, Math.PI / 2);
  b.geometry(wheel.clone(), black);
  b.pop();
  b.block(0, strapY, sz, 0.76, 0.008, 0.05, orangeStrap, M.Fabric, Z.Rear);
  for (const side of [-1, 1])
    b.rod(
      { x: side * 0.38, y: strapY, z: sz },
      { x: side * 0.48, y: TUB_FLOOR + 0.03, z: sz },
      0.01,
      orangeStrap,
      M.Fabric,
      Z.Rear,
    );

  // Steel bar in place of the bumper: a heavy beam with three hoops over the grille and
  // headlamps. It covers the factory bumper lamps, so the amber park and indicator lamps
  // sit in the beam's ends, as bar makers fitted them.
  const accessoryStart = b.vertexCount;
  const face = -2.34;
  hoopBar(b, {
    face,
    beamY: 0.1,
    beamH: 0.18,
    half: 0.86,
    post: 0.42,
    top: 0.64,
    lamp: 0.58,
    outer: 0.84,
    tube: 0.03,
    color: bar,
  });
  for (const side of [-1, 1]) {
    b.block(
      side * 0.68,
      0.1,
      face - 0.004,
      0.15,
      0.06,
      0.012,
      black,
      M.Rubber,
      Z.Front,
      0.006,
    );
    b.block(
      side * 0.68,
      0.1,
      face - 0.012,
      0.13,
      0.044,
      0.01,
      amber,
      M.Amber,
      Z.Front,
      0.005,
    );
  }
  plate(b, -0.38, 0.1, face - 0.012, -1);
  // Winch drum in its cradle behind the bar, its motor, and a roller fairlead at the cable exit.
  b.rod(
    { x: -0.18, y: 0.15, z: -2.23 },
    { x: 0.18, y: 0.15, z: -2.23 },
    0.065,
    black,
    M.Metal,
    Z.Front,
  );
  for (let i = 0; i < 12; i++)
    b.ring(
      -0.15 + i * 0.027,
      0.15,
      -2.23,
      0.064,
      0.005,
      steel,
      M.Metal,
      "x",
      Z.Front,
    );
  b.rod(
    { x: -0.36, y: 0.15, z: -2.23 },
    { x: -0.2, y: 0.15, z: -2.23 },
    0.055,
    black,
    M.Metal,
    Z.Front,
  );
  for (const x of [-0.2, 0.2])
    b.block(x, 0.15, -2.23, 0.03, 0.17, 0.17, black, M.Rubber, Z.Front, 0.012);
  const mount = { ...tuning.winchMount, z: -2.38 };
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
  accessoryRanges.push({ start: accessoryStart, end: b.vertexCount });
  // Whip aerial on the right front wing.
  b.block(0.78, 0.62, -1.0, 0.05, 0.04, 0.05, black, M.Rubber, Z.Front);
  b.rod(
    { x: 0.78, y: 0.64, z: -1.0 },
    { x: 0.8, y: 1.62, z: -0.96 },
    0.004,
    black,
    M.Rubber,
    Z.Roof,
  );
}

export function buildHiluxBody(
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  innerWells.length = 0;
  clearanceSolids.length = 0;
  accessoryRanges.length = 0;
  frontEnd(b);
  windscreen(b);
  cab(b);
  tub(b);
  rack(b);
  chassisAndRecovery(b, tuning, wheel);
  addHiluxInterior(b, tuning.engine.redlineRpm);
  // The factory bench has two adjustable head restraints.
  for (const x of [-0.43, 0.43]) {
    for (const dx of [-0.065, 0.065])
      b.rod(
        { x: x + dx, y: 0.81, z: 0.245 },
        { x: x + dx, y: 0.94, z: 0.245 },
        0.007,
        steel,
        M.Metal,
        Z.Trim,
      );
    b.block(
      x,
      0.955,
      0.245,
      0.245,
      0.16,
      0.09,
      hiluxColors.vinyl,
      M.Fabric,
      Z.Trim,
      0.025,
    );
  }
  const g = b.build();
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i),
      y = pos.getY(i),
      z = pos.getZ(i);
    if (z > -0.97 && z < 0.38 && y > 0.61 && Math.abs(x) < 0.86) {
      x *= 1 - 0.065 * Math.min(1, (y - 0.61) / 0.65);
    }
    pos.setXYZ(i, x, y, z);
  }
  // Retain the builder's smooth normals on tubes/lenses; adjust only the shaped cab.
  const normals = g.getAttribute("normal");
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i),
      y = pos.getY(i);
    if (z > -0.97 && z < 0.38 && y > 0.61 && Math.abs(pos.getX(i)) < 0.86) {
      const n = new THREE.Vector3(
        normals.getX(i),
        normals.getY(i),
        normals.getZ(i),
      );
      n.x /= 1 - 0.065 * Math.min(1, (y - 0.61) / 0.65);
      n.normalize();
      normals.setXYZ(i, n.x, n.y, n.z);
    }
  }
  // Remove collapsed primitive triangles while keeping every remaining authored attribute.
  const keep: number[] = [],
    a = new THREE.Vector3(),
    b0 = new THREE.Vector3(),
    c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b0.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    if (b0.sub(a).cross(c.sub(a)).lengthSq() > 1e-20)
      keep.push(i, i + 1, i + 2);
  }
  const clean = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(g.attributes)) {
    const data = new Float32Array(keep.length * attribute.itemSize);
    keep.forEach((old, j) => {
      for (let k = 0; k < attribute.itemSize; k++)
        data[j * attribute.itemSize + k] = attribute.getComponent(old, k);
    });
    clean.setAttribute(
      name,
      new THREE.BufferAttribute(data, attribute.itemSize),
    );
  }
  clean.setAttribute(
    "reviewPart",
    new THREE.Float32BufferAttribute(
      keep.map((i) =>
        accessoryRanges.some((r) => i >= r.start && i < r.end) ? 1 : 0,
      ),
      1,
    ),
  );
  clean.userData = {
    clearanceSolids: structuredClone(clearanceSolids),
    bonnetTopology,
    innerWells: structuredClone(innerWells),
    removedDegenerateTriangles: (pos.count - keep.length) / 3,
  };
  g.dispose();
  return clean;
}

/** A 7.00-16 light-truck tyre with a block tread, on a pale steel wheel with six studs. */
export function buildHiluxWheel(tuning: VehicleTuning): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const r = tuning.wheelRadius,
    w = tuning.wheelWidth;
  const tyre = new THREE.Color("#232624");
  const rim = hiluxColors.wheel;
  const rimR = 0.205;
  b.slot = M.Rubber;
  b.tag = Z.Trim;
  b.push().rotate(0, 0, -Math.PI / 2);
  const profile = [
    [rimR - 0.01, -w * 0.47],
    [r * 0.7, -w * 0.53],
    [r * 0.9, -w * 0.49],
    [r * 0.965, -w * 0.38],
    [r * 0.965, w * 0.38],
    [r * 0.9, w * 0.49],
    [r * 0.7, w * 0.53],
    [rimR - 0.01, w * 0.47],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  b.geometry(new THREE.LatheGeometry(profile, 48), tyre);
  b.pop();
  // Two staggered rows of shoulder blocks and a broken centre rib.
  const blocks = 28;
  for (let i = 0; i < blocks; i++) {
    for (const side of [-1, 1]) {
      const angle = ((i + (side > 0 ? 0.5 : 0)) / blocks) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(
          side * w * 0.27,
          Math.cos(angle) * r * 0.965,
          Math.sin(angle) * r * 0.965,
        )
        .rotate(angle, side * 0.12, 0);
      b.box(w * 0.38, 0.032, 0.048, tyre);
      b.pop();
    }
    const angle = ((i + 0.25) / blocks) * Math.PI * 2;
    b.push()
      .translate(0, Math.cos(angle) * r * 0.968, Math.sin(angle) * r * 0.968)
      .rotate(angle, 0, 0);
    b.box(w * 0.16, 0.03, 0.04, tyre);
    b.pop();
  }
  for (const side of [-1, 1]) {
    b.ring(
      side * w * 0.5,
      0,
      0,
      r * 0.72,
      0.004,
      tyre.clone().multiplyScalar(1.4),
      M.Rubber,
      "x",
    );
    // Rim flange, the dished centre with round vents, the hub and six wheel nuts.
    b.ring(side * (w * 0.5 - 0.005), 0, 0, rimR, 0.013, rim, M.Paint, "x");
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
    b.geometry(new THREE.CylinderGeometry(0.115, 0.13, 0.03, 32), rim);
    b.pop();
    for (let i = 0; i < 6; i++) {
      const a = ((i + 0.5) / 6) * Math.PI * 2;
      b.slot = M.Rubber;
      b.push()
        .translate(
          side * (w * 0.5 - 0.016),
          Math.cos(a) * 0.16,
          Math.sin(a) * 0.16,
        )
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 14), black);
      b.pop();
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      b.slot = M.Metal;
      b.push()
        .translate(
          side * (w * 0.5 + 0.008),
          Math.cos(a) * 0.0698,
          Math.sin(a) * 0.0698,
        )
        .rotate(0, 0, -Math.PI / 2);
      b.geometry(new THREE.CylinderGeometry(0.0125, 0.015, 0.02, 6), steel);
      b.pop();
    }
    // Free-wheeling hub cap in the middle.
    b.slot = M.Metal;
    b.push()
      .translate(side * (w * 0.5 + 0.022), 0, 0)
      .rotate(0, 0, -Math.PI / 2);
    b.geometry(
      new THREE.CylinderGeometry(0.046, 0.054, 0.05, 20),
      steel.clone().multiplyScalar(0.9),
    );
    b.pop();
  }
  return b.build();
}

/** A recovery board strapped on the ladder rack over the tub (index 0 on the left). */
export function buildHiluxPlank(index: number): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const wood = new THREE.Color("#A9824F");
  const x = index === 0 ? -0.36 : 0.36,
    y = RACK_TOP + 0.05,
    z = 1.36;
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
  for (const dz of [TUB_FRONT + 0.05 - z, TAIL - 0.06 - z]) {
    b.block(
      x,
      y + 0.03,
      z + dz,
      W + 0.01,
      0.012,
      0.045,
      black,
      M.Rubber,
      Z.Roof,
    );
    b.block(
      x,
      RACK_TOP - 0.028,
      z + dz,
      W + 0.02,
      0.012,
      0.045,
      black,
      M.Rubber,
      Z.Roof,
    );
    for (const s of [-1, 1])
      b.block(
        x + (s * (W + 0.02)) / 2,
        (y + 0.03 + RACK_TOP - 0.028) / 2,
        z + dz,
        0.012,
        y + 0.03 - (RACK_TOP - 0.028),
        0.045,
        black,
        M.Rubber,
        Z.Roof,
      );
  }
  return b.build();
}
