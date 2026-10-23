import * as THREE from 'three';
import { BodyZone as Z, VehicleBuilder, VehicleMaterial as M } from './vehicleGeometry';

/**
 * A three-hoop steel bar in the style of the Army Perentie's brushguard: a heavy beam across
 * the front with its ends swept back, a centre hoop over the grille with a mid rail, and a
 * hoop over each headlamp out to the beam's ends, in thick bent tube that leans back a little.
 */
export interface HoopBar {
  /** z of the beam's front face. */
  face: number;
  /** The beam's centre height and height. */
  beamY: number;
  beamH: number;
  /** Half the beam's width, before its swept-back ends. */
  half: number;
  /** x of the centre hoop's legs, and the height of its top rail. */
  post: number;
  top: number;
  /** Height of the rails over the headlamps, and x of the lamp hoops' outer legs. */
  lamp: number;
  outer: number;
  tube: number;
  color: THREE.Color;
}

type P = { x: number; y: number; z: number };
const p = (x: number, y: number, z: number): P => ({ x, y, z });

/** The polyline with each inner corner bent round over `r` along its legs. */
function bend(pts: P[], r: number, seg = 5): P[] {
  const out: P[] = [pts[0]];
  for (let i = 1; i + 1 < pts.length; i++) {
    const [a, c, n] = [pts[i - 1], pts[i], pts[i + 1]];
    const la = Math.hypot(a.x - c.x, a.y - c.y, a.z - c.z),
      ln = Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z);
    const da = Math.min(r, la / 2) / la,
      dn = Math.min(r, ln / 2) / ln;
    const s = p(c.x + (a.x - c.x) * da, c.y + (a.y - c.y) * da, c.z + (a.z - c.z) * da),
      e = p(c.x + (n.x - c.x) * dn, c.y + (n.y - c.y) * dn, c.z + (n.z - c.z) * dn);
    for (let k = 0; k <= seg; k++) {
      const t = k / seg,
        u = 1 - t;
      out.push(
        p(
          u * u * s.x + 2 * u * t * c.x + t * t * e.x,
          u * u * s.y + 2 * u * t * c.y + t * t * e.y,
          u * u * s.z + 2 * u * t * c.z + t * t * e.z,
        ),
      );
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Tube along the points, with a ball at each joint so bends stay round. */
export function tube(b: VehicleBuilder, pts: P[], r: number, color: THREE.Color): void {
  for (let i = 0; i + 1 < pts.length; i++) b.rod(pts[i], pts[i + 1], r, color, M.Metal, Z.Front);
  b.slot = M.Metal;
  b.tag = Z.Front;
  for (const q of pts.slice(1, -1)) {
    b.push().translate(q.x, q.y, q.z);
    b.geometry(new THREE.SphereGeometry(r, 12, 8), color);
    b.pop();
  }
}

export function hoopBar(b: VehicleBuilder, bar: HoopBar): void {
  const { face, beamY, beamH, half, post, top, lamp, outer, tube: r, color } = bar;
  const depth = 0.12,
    beamTop = beamY + beamH / 2;
  // Beam, with a capping plate along its top edge and its ends swept back to the wings.
  b.block(0, beamY, face + depth / 2, 2 * half, beamH, depth, color, M.Metal, Z.Front, 0.02);
  b.block(0, beamTop - 0.012, face - 0.006, 2 * half - 0.04, 0.024, 0.02, color, M.Metal, Z.Front, 0.008);
  for (const side of [-1, 1]) {
    b.push()
      .translate(side * (half - 0.03), beamY, face + depth / 2 + 0.02)
      .rotate(0, -side * 0.5, 0);
    b.block(side * 0.1, 0, 0, 0.22, beamH, depth, color, M.Metal, Z.Front, 0.02);
    b.pop();
  }
  // Legs stand on the beam a little back from its face; everything above leans back.
  const zb = face + 0.05,
    lean = 0.06 / (top - beamTop);
  const zAt = (y: number) => zb + (y - beamTop) * lean;
  // Centre hoop over the grille, with a mid rail.
  tube(
    b,
    bend(
      [p(-post, beamTop, zb), p(-post, top, zAt(top)), p(post, top, zAt(top)), p(post, beamTop, zb)],
      0.09,
    ),
    r,
    color,
  );
  const mid = (beamTop + top) / 2 + 0.02;
  b.rod(p(-post, mid, zAt(mid)), p(post, mid, zAt(mid)), r * 0.8, color, M.Metal, Z.Front);
  // Lamp hoops: out from the centre hoop over each headlamp, then down to the beam's end.
  for (const side of [-1, 1]) {
    const zl = zAt(lamp);
    tube(
      b,
      bend(
        [p(side * post, lamp, zl), p(side * outer, lamp, zl + 0.05), p(side * outer, beamTop, zb + 0.13)],
        0.08,
      ),
      r,
      color,
    );
    // Gusset where the lamp hoop meets the beam, and a stay back under the bar to the chassis.
    b.block(side * outer, beamTop + 0.02, zb + 0.13, 0.08, 0.04, 0.08, color, M.Metal, Z.Front, 0.01);
    b.rod(
      p(side * 0.42, beamY, face + depth),
      p(side * 0.42, beamY - 0.04, face + 0.42),
      0.028,
      color,
      M.Metal,
      Z.Trim,
    );
  }
  // Feet of the centre hoop on the beam.
  for (const side of [-1, 1])
    b.block(side * post, beamTop + 0.02, zb, 0.08, 0.04, 0.08, color, M.Metal, Z.Front, 0.01);
}
