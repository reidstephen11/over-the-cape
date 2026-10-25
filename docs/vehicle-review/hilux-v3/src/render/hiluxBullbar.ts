import * as THREE from "three";
import {
  VehicleBuilder,
  VehicleMaterial as M,
  BodyZone as Z,
} from "./vehicleGeometry";
import type { HoopBar } from "./roobar";

/** Review prototype: each hoop is one continuous swept surface, with shared joint centres. */
export function hoopBar(b: VehicleBuilder, bar: HoopBar): void {
  const { color } = bar;
  b.slot = M.Metal;
  b.tag = Z.Front;
  const outline = new THREE.Shape();
  const points = [
    [-0.98, -2.2],
    [-0.85, -2.32],
    [0.85, -2.32],
    [0.98, -2.2],
    [0.91, -2.1],
    [0.77, -2.18],
    [-0.77, -2.18],
    [-0.91, -2.1],
  ];
  points.forEach(([x, z], i) =>
    i ? outline.lineTo(x, z) : outline.moveTo(x, z),
  );
  outline.closePath();
  const beam = new THREE.ExtrudeGeometry(outline, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    steps: 1,
  });
  beam.rotateX(Math.PI / 2);
  beam.translate(0, 0.18, 0);
  b.geometry(beam, color);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const tube = (pts: THREE.Vector3[], radius = 0.026) => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    let last = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const c = pts[i],
        next = pts[i + 1];
      const r = Math.min(
        0.085,
        c.distanceTo(last) * 0.4,
        c.distanceTo(next) * 0.4,
      );
      const a = c
        .clone()
        .add(last.clone().sub(c).normalize().multiplyScalar(r));
      const d = c
        .clone()
        .add(next.clone().sub(c).normalize().multiplyScalar(r));
      path.add(new THREE.LineCurve3(last, a));
      path.add(new THREE.QuadraticBezierCurve3(a, c, d));
      last = d;
    }
    path.add(new THREE.LineCurve3(last, pts.at(-1)!));
    b.slot = M.Metal;
    b.tag = Z.Front;
    b.geometry(new THREE.TubeGeometry(path, 96, radius, 12, false), color);
  };
  const z = (y: number) => -2.27 + (y - 0.17) * 0.12;
  tube([
    V(-0.44, 0.14, z(0.14)),
    V(-0.44, 0.7, z(0.7)),
    V(0.44, 0.7, z(0.7)),
    V(0.44, 0.14, z(0.14)),
  ]);
  for (const s of [-1, 1]) {
    // The branch penetrates the centre post; the lower leg enters the swept beam.
    tube([
      V(s * 0.43, 0.59, z(0.59)),
      V(s * 0.88, 0.59, -2.18),
      V(s * 0.89, 0.14, -2.18),
    ]);
    b.block(
      s * 0.44,
      0.19,
      z(0.19),
      0.082,
      0.025,
      0.075,
      color,
      M.Metal,
      Z.Front,
      0.008,
    );
    b.block(
      s * 0.89,
      0.19,
      -2.18,
      0.075,
      0.025,
      0.075,
      color,
      M.Metal,
      Z.Front,
      0.008,
    );
    b.rod(
      V(s * 0.42, 0.08, -2.21),
      V(s * 0.35, 0.04, -1.91),
      0.026,
      color,
      M.Metal,
      Z.Trim,
    );
    for (const y of [0.2, 0.23])
      b.block(
        s * 0.44,
        y,
        z(0.2) - 0.028,
        0.011,
        0.011,
        0.006,
        new THREE.Color("#858887"),
        M.Metal,
        Z.Front,
        0.003,
      );
  }
}
