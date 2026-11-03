import * as THREE from 'three';
import { VehicleBuilder, VehicleMaterial as M, BodyZone as Z } from './vehicleGeometry';

/** Subdivide selected triangles while retaining colours, material IDs and smooth normals. */
export function subdivideSurface(
  source: THREE.BufferGeometry,
  select: (centre: THREE.Vector3, normal: THREE.Vector3) => boolean,
  levels = 2,
): THREE.BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source;
  const attributes = Object.entries(g.attributes);
  const output: Record<string, number[]> = Object.fromEntries(attributes.map(([name]) => [name, []]));
  type Vertex = Record<string, number[]>;
  const read = (i: number): Vertex =>
    Object.fromEntries(
      attributes.map(([name, a]) => [
        name,
        Array.from({ length: a.itemSize }, (_, k) => a.getComponent(i, k)),
      ]),
    );
  const midpoint = (a: Vertex, b: Vertex): Vertex =>
    Object.fromEntries(attributes.map(([name]) => [name, a[name].map((x, k) => (x + b[name][k]) / 2)]));
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
    for (const vertex of [a, b, c]) for (const [name] of attributes) output[name].push(...vertex[name]);
  };
  for (let i = 0; i < g.attributes.position.count; i += 3) {
    const a = read(i),
      b = read(i + 1),
      c = read(i + 2),
      centre = new THREE.Vector3(),
      normal = new THREE.Vector3();
    for (const p of [a, b, c]) {
      centre.add(new THREE.Vector3(...(p.position as [number, number, number])));
      normal.add(new THREE.Vector3(...(p.normal as [number, number, number])));
    }
    emit(a, b, c, select(centre.multiplyScalar(1 / 3), normal.normalize()) ? levels : 0);
  }
  const result = new THREE.BufferGeometry();
  for (const [name, a] of attributes)
    result.setAttribute(name, new THREE.Float32BufferAttribute(output[name], a.itemSize));
  if (g !== source) g.dispose();
  source.dispose();
  return result;
}

/**
 * How far a bend in a swept tube reaches back along each straight: at least `min` (or
 * `perRadius` tube radii), and no more than `share` of the shorter straight.
 */
export interface TubeBend {
  min: number;
  perRadius: number;
  share: number;
}

/** Tight bends, as on the Patrol's and Perentie's bull bars and racks. */
export const TIGHT_BEND: TubeBend = { min: 0.085, perRadius: 0, share: 0.35 };
/** Wider bends that grow with the tube, as on the Unimog and the Troop Carrier's bull bar. */
export const ROUND_BEND: TubeBend = { min: 0.085, perRadius: 2.4, share: 0.45 };

/**
 * One smoothly swept tube per bent member, rather than separate cylinders and joint balls.
 * Each straight is one ring of quads and each bend five, so a bull bar member costs a few
 * hundred triangles where a uniformly sampled tube cost 1,728 however short it was. Thin
 * tubes get six sides, bar tubes ten.
 */
export function continuousTube(
  b: VehicleBuilder,
  points: THREE.Vector3[],
  radius: number,
  color: THREE.Color,
  zone: number = Z.Front,
  slot: typeof b.slot = M.Metal,
  bend: TubeBend = TIGHT_BEND,
): void {
  const samples: THREE.Vector3[] = [points[0].clone()];
  let previous = points[0];
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i],
      next = points[i + 1],
      distance = Math.min(
        Math.max(bend.min, radius * bend.perRadius),
        previous.distanceTo(corner) * bend.share,
        next.distanceTo(corner) * bend.share,
      );
    const start = corner.clone().add(previous.clone().sub(corner).normalize().multiplyScalar(distance));
    const end = corner.clone().add(next.clone().sub(corner).normalize().multiplyScalar(distance));
    const arc = new THREE.QuadraticBezierCurve3(start, corner, end);
    for (let k = 0; k <= BEND_SEGMENTS; k++) samples.push(arc.getPoint(k / BEND_SEGMENTS));
    previous = end;
  }
  samples.push(points[points.length - 1].clone());
  b.slot = slot;
  b.tag = zone;
  b.geometry(sweptTube(samples, radius, radius < 0.012 ? 6 : radius < 0.025 ? 8 : 10), color);
}

const BEND_SEGMENTS = 5;

/** An open tube of `sides` smooth-shaded quads per step along `samples`, framed by parallel transport. */
export function sweptTube(samples: THREE.Vector3[], radius: number, sides: number): THREE.BufferGeometry {
  const n = samples.length;
  const tangents = samples.map((_, i) => {
    const a = samples[Math.max(0, i - 1)],
      c = samples[Math.min(n - 1, i + 1)];
    return c.clone().sub(a).normalize();
  });
  // Parallel-transport one normal along the tube so the quads never twist at a bend.
  const normals: THREE.Vector3[] = [];
  const t0 = tangents[0];
  const pick = Math.abs(t0.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  normals.push(pick.cross(t0).normalize());
  for (let i = 1; i < n; i++) {
    const axis = tangents[i - 1].clone().cross(tangents[i]);
    const next = normals[i - 1].clone();
    if (axis.lengthSq() > 1e-12) {
      const angle = Math.acos(THREE.MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1));
      next.applyAxisAngle(axis.normalize(), angle);
    }
    normals.push(next);
  }
  const rings = samples.map((p, i) => {
    const bin = tangents[i].clone().cross(normals[i]);
    return Array.from({ length: sides }, (_, k) => {
      const a = (k / sides) * Math.PI * 2;
      const dir = normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(bin, Math.sin(a));
      return { p: p.clone().addScaledVector(dir, radius), n: dir };
    });
  });
  const positions: number[] = [],
    norms: number[] = [];
  const put = (...vs: { p: THREE.Vector3; n: THREE.Vector3 }[]) => {
    for (const v of vs) {
      positions.push(v.p.x, v.p.y, v.p.z);
      norms.push(v.n.x, v.n.y, v.n.z);
    }
  };
  for (let i = 0; i < n - 1; i++)
    for (let k = 0; k < sides; k++) {
      const a = rings[i][k],
        bb = rings[i][(k + 1) % sides],
        c = rings[i + 1][(k + 1) % sides],
        d = rings[i + 1][k];
      put(a, c, bb, a, d, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  return g;
}

/** Remove collapsed primitive faces without discarding smooth normals or semantic attributes. */
export function cleanGeometry(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = g.getAttribute('position'),
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
      for (let k = 0; k < attr.itemSize; k++) data[j * attr.itemSize + k] = attr.getComponent(old, k);
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
