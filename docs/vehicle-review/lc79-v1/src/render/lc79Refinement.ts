import * as THREE from "three";
import {
  VehicleBuilder,
  VehicleMaterial as M,
  BodyZone as Z,
} from "./vehicleGeometry";

/** Subdivide selected triangles while retaining colours, material IDs and smooth normals. */
export function subdivideSurface(
  source: THREE.BufferGeometry,
  select: (centre: THREE.Vector3, normal: THREE.Vector3) => boolean,
  levels = 2,
): THREE.BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source;
  const attributes = Object.entries(g.attributes);
  const output: Record<string, number[]> = Object.fromEntries(
    attributes.map(([name]) => [name, []]),
  );
  type Vertex = Record<string, number[]>;
  const read = (i: number): Vertex =>
    Object.fromEntries(
      attributes.map(([name, a]) => [
        name,
        Array.from({ length: a.itemSize }, (_, k) => a.getComponent(i, k)),
      ]),
    );
  const midpoint = (a: Vertex, b: Vertex): Vertex =>
    Object.fromEntries(
      attributes.map(([name]) => [
        name,
        a[name].map((x, k) => (x + b[name][k]) / 2),
      ]),
    );
  const emit = (a: Vertex, b: Vertex, c: Vertex, depth: number): void => {
    if (depth) {
      const ab = midpoint(a, b),
        bc = midpoint(b, c),
        ca = midpoint(c, a);
      emit(a, ab, ca, depth - 1);
      emit(ab, b, bc, depth - 1);
      emit(ca, bc, c, depth - 1);
      emit(ab, bc, ca, depth - 1);
      return;
    }
    for (const vertex of [a, b, c])
      for (const [name] of attributes) output[name].push(...vertex[name]);
  };
  for (let i = 0; i < g.attributes.position.count; i += 3) {
    const a = read(i),
      b = read(i + 1),
      c = read(i + 2),
      centre = new THREE.Vector3(),
      normal = new THREE.Vector3();
    for (const p of [a, b, c]) {
      centre.add(
        new THREE.Vector3(...(p.position as [number, number, number])),
      );
      normal.add(new THREE.Vector3(...(p.normal as [number, number, number])));
    }
    emit(
      a,
      b,
      c,
      select(centre.multiplyScalar(1 / 3), normal.normalize()) ? levels : 0,
    );
  }
  const result = new THREE.BufferGeometry();
  for (const [name, a] of attributes)
    result.setAttribute(
      name,
      new THREE.Float32BufferAttribute(output[name], a.itemSize),
    );
  if (g !== source) g.dispose();
  source.dispose();
  return result;
}

/** One smoothly swept tube per bent member, rather than separate cylinders and joint balls. */
export function continuousTube(
  b: VehicleBuilder,
  points: THREE.Vector3[],
  radius: number,
  color: THREE.Color,
  zone: number = Z.Front,
  slot: typeof b.slot = M.Metal,
): void {
  const path = new THREE.CurvePath<THREE.Vector3>();
  let previous = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i],
      next = points[i + 1],
      distance = Math.min(
        0.085,
        previous.distanceTo(corner) * 0.35,
        next.distanceTo(corner) * 0.35,
      );
    const start = corner
      .clone()
      .add(previous.clone().sub(corner).normalize().multiplyScalar(distance));
    const end = corner
      .clone()
      .add(next.clone().sub(corner).normalize().multiplyScalar(distance));
    path.add(new THREE.LineCurve3(previous, start));
    path.add(new THREE.QuadraticBezierCurve3(start, corner, end));
    previous = end;
  }
  path.add(new THREE.LineCurve3(previous, points[points.length - 1]));
  b.slot = slot;
  b.tag = zone;
  b.geometry(new THREE.TubeGeometry(path, 72, radius, 12, false), color);
}

/** Remove collapsed primitive faces without discarding smooth normals or semantic attributes. */
export function cleanGeometry(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = g.getAttribute("position"),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  const kept: number[] = [];
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    if (b.sub(a).cross(c.sub(a)).lengthSq() > 1e-20) kept.push(i, i + 1, i + 2);
  }
  const result = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(g.attributes)) {
    const data = new Float32Array(kept.length * attr.itemSize);
    kept.forEach((old, j) => {
      for (let k = 0; k < attr.itemSize; k++)
        data[j * attr.itemSize + k] = attr.getComponent(old, k);
    });
    result.setAttribute(name, new THREE.BufferAttribute(data, attr.itemSize));
  }
  result.userData = {
    ...g.userData,
    removedDegenerateTriangles: (p.count - kept.length) / 3,
  };
  g.dispose();
  result.computeBoundingBox();
  return result;
}
