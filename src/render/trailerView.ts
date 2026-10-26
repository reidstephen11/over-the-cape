import * as THREE from 'three';
import { DRUM, drumSpots, type TrailerTuning } from '../data/trailers';
import type { VehicleTuning } from '../data/vehicle';
import type { Trailer } from '../sim/trailer';
import { slerp } from '../sim/vehicle/math';
import { patchFog } from './fog';
import {
  BodyZone as Z,
  groupVehicleMaterials,
  VehicleBuilder,
  VehicleMaterial as M,
} from './vehicleGeometry';
import { buildVehicleWheel } from './vehicleWheel';

const galv = new THREE.Color('#A3A8A4');
const dark = new THREE.Color('#3A3D3B');
const red = new THREE.Color('#A3261B');
const drumBlue = new THREE.Color('#2F4F7A');

/**
 * A trailer (src/sim/trailer.ts) drawn in code like the vehicles: a galvanised 6×4 box on
 * two wheels with an A-frame drawbar, the coupling and the jockey wheel, which is wound
 * up while it's hitched. Drums stand in the box when it carries them.
 */
export class TrailerView {
  readonly root = new THREE.Group();
  private readonly materials: THREE.Material[];
  private readonly wheels: { pivot: THREE.Group; spin: THREE.Group }[] = [];
  private readonly jockey: THREE.Mesh;
  private readonly drums = new THREE.Group();
  private drumCount = -1;
  private readonly tmpQ = { x: 0, y: 0, z: 0, w: 1 };

  constructor(private readonly trailer: Trailer) {
    const t = trailer.tuning;
    this.root.name = t.name;
    const metal = () =>
      patchFog(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.6 }));
    const matte = () => patchFog(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    // One material per vehicle material slot, as the vehicle bodies use.
    this.materials = Object.values(M).map((slot) =>
      slot === M.Metal || slot === M.Paint ? metal() : matte(),
    );
    const body = new THREE.Mesh(build(t), this.materials);
    body.castShadow = true;
    body.receiveShadow = true;
    this.root.add(body);
    const wheelGeo = buildVehicleWheel({
      wheelRadius: t.wheelRadius,
      wheelWidth: t.wheelWidth,
    } as VehicleTuning);
    groupVehicleMaterials(wheelGeo);
    for (const w of t.wheels) {
      const pivot = new THREE.Group();
      pivot.position.set(w.x, w.y - t.suspensionRestLength, w.z);
      const spin = new THREE.Group();
      const mesh = new THREE.Mesh(wheelGeo, this.materials);
      mesh.castShadow = true;
      spin.add(mesh);
      pivot.add(spin);
      this.root.add(pivot);
      this.wheels.push({ pivot, spin });
    }
    const jb = new VehicleBuilder();
    const j = t.jockey;
    jb.rod({ x: j.x, y: j.y + j.r, z: j.z }, { x: j.x, y: t.coupling.y + 0.12, z: j.z }, 0.03, galv);
    jb.slot = M.Rubber;
    jb.tag = Z.Trim;
    jb.push()
      .translate(j.x, j.y, j.z)
      .rotate(0, 0, Math.PI / 2);
    jb.geometry(new THREE.CylinderGeometry(j.r, j.r, 0.05, 16), dark);
    jb.pop();
    const jockeyGeo = jb.build();
    groupVehicleMaterials(jockeyGeo);
    this.jockey = new THREE.Mesh(jockeyGeo, this.materials);
    this.jockey.castShadow = true;
    this.root.add(this.jockey);
    this.root.add(this.drums);
    this.update(1);
  }

  /** Stand `count` drums in the box (none, or up to six). */
  setDrums(count: number): void {
    if (count === this.drumCount) return;
    this.drumCount = count;
    for (const c of [...this.drums.children]) {
      this.drums.remove(c);
      (c as THREE.Mesh).geometry.dispose();
    }
    if (count <= 0) return;
    const b = new VehicleBuilder();
    const bed = this.trailer.tuning.bed;
    for (const [x, z] of drumSpots(count, bed)) {
      b.slot = M.Paint;
      b.tag = Z.Sides;
      b.push().translate(x, bed.y + DRUM.height / 2, z);
      b.geometry(new THREE.CylinderGeometry(DRUM.radius, DRUM.radius, DRUM.height, 20), drumBlue);
      b.pop();
      // Rolling hoops and the bung on the lid.
      for (const y of [0.3, 0.58])
        b.ring(x, bed.y + y, z, DRUM.radius + 0.008, 0.012, drumBlue, M.Paint, 'y');
      b.block(x + 0.15, bed.y + DRUM.height + 0.01, z, 0.06, 0.02, 0.06, dark, M.Metal, Z.Trim);
    }
    const geo = b.build();
    groupVehicleMaterials(geo);
    const mesh = new THREE.Mesh(geo, this.materials);
    mesh.castShadow = true;
    this.drums.add(mesh);
  }

  /** Follow the trailer between physics steps (`alpha` 0 = the last step, 1 = now). */
  update(alpha: number): void {
    const tr = this.trailer;
    const p0 = tr.prevPosition;
    const p1 = tr.body.translation();
    this.root.position.set(
      p0.x + (p1.x - p0.x) * alpha,
      p0.y + (p1.y - p0.y) * alpha,
      p0.z + (p1.z - p0.z) * alpha,
    );
    const q = slerp(tr.prevRotation, tr.body.rotation(), alpha, this.tmpQ);
    this.root.quaternion.set(q.x, q.y, q.z, q.w);
    const t = tr.tuning;
    for (let i = 0; i < this.wheels.length; i++) {
      this.wheels[i].pivot.position.y = t.wheels[i].y - tr.wheels[i].suspension;
      this.wheels[i].spin.rotation.x = -tr.wheels[i].rotation;
    }
    // Wound up off the ground while it's on the ball.
    this.jockey.position.y = tr.hitchedTo ? 0.22 : 0;
  }

  dispose(): void {
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    for (const m of this.materials) m.dispose();
  }
}

/** The box, guards, drawbar, coupling, axle and lamps (local, as the physics). */
function build(t: TrailerTuning): THREE.BufferGeometry {
  const b = new VehicleBuilder();
  const bed = t.bed;
  const len = bed.hz * 2 + 0.06;
  const wid = bed.hx * 2 + 0.06;
  const front = bed.cz - bed.hz - 0.03;
  const back = bed.cz + bed.hz + 0.03;
  // Floor, the four sides and the rolled top rail round them.
  b.block(0, bed.y - 0.02, bed.cz, wid, 0.04, len, galv, M.Metal, Z.Sides);
  for (const side of [-1, 1]) {
    b.block(
      side * (bed.hx + 0.015),
      bed.y + bed.sides / 2 - 0.02,
      bed.cz,
      0.03,
      bed.sides,
      len,
      galv,
      M.Metal,
    );
    b.rod(
      { x: side * (bed.hx + 0.015), y: bed.y + bed.sides - 0.02, z: front },
      { x: side * (bed.hx + 0.015), y: bed.y + bed.sides - 0.02, z: back },
      0.025,
      galv,
    );
  }
  for (const z of [front, back]) {
    b.block(
      0,
      bed.y + bed.sides / 2 - 0.02,
      z,
      wid,
      bed.sides,
      0.03,
      galv,
      M.Metal,
      z === back ? Z.Rear : Z.Front,
    );
    b.rod(
      { x: -bed.hx, y: bed.y + bed.sides - 0.02, z },
      { x: bed.hx, y: bed.y + bed.sides - 0.02, z },
      0.025,
      galv,
    );
  }
  // Chassis rails under the floor, out to the drawbar.
  for (const side of [-1, 1])
    b.block(side * 0.45, bed.y - 0.08, bed.cz, 0.06, 0.08, len, dark, M.Metal, Z.Trim);
  // Mudguards over the wheels, outside the box.
  const hubY = t.wheels[0].y - t.suspensionRestLength + 0.03;
  for (const w of t.wheels) {
    const x = w.x;
    b.block(x, hubY + t.wheelRadius + 0.08, w.z, t.wheelWidth + 0.08, 0.02, 0.7, galv, M.Metal, Z.Sides);
    for (const dz of [-1, 1])
      b.block(x, hubY + t.wheelRadius - 0.02, w.z + dz * 0.36, t.wheelWidth + 0.08, 0.2, 0.02, galv, M.Metal);
  }
  // Leaf springs and the axle.
  for (const w of t.wheels) b.block(w.x * 0.88, hubY + 0.06, w.z, 0.05, 0.03, 0.9, dark, M.Metal, Z.Trim);
  b.rod({ x: t.wheels[0].x, y: hubY, z: 0 }, { x: t.wheels[1].x, y: hubY, z: 0 }, 0.03, dark);
  // The A-frame drawbar from the front corners to the coupling.
  const c = t.coupling;
  for (const side of [-1, 1])
    b.rod({ x: side * 0.45, y: bed.y - 0.08, z: front + 0.3 }, { x: 0, y: c.y, z: c.z + 0.16 }, 0.035, dark);
  b.block(0, c.y + 0.04, c.z + 0.08, 0.1, 0.09, 0.26, dark, M.Metal, Z.Front, 0.02);
  b.block(0, c.y + 0.1, c.z + 0.12, 0.04, 0.03, 0.12, galv, M.Metal, Z.Front);
  // Safety chains hang from the drawbar.
  for (const side of [-1, 1])
    b.rod(
      { x: side * 0.05, y: c.y, z: c.z + 0.2 },
      { x: side * 0.08, y: c.y - 0.12, z: c.z + 0.05 },
      0.008,
      dark,
    );
  // Tail lamps and the number plate on the back.
  for (const side of [-1, 1])
    b.block(side * (bed.hx - 0.1), bed.y + 0.06, back + 0.025, 0.14, 0.06, 0.02, red, M.Red, Z.Rear);
  b.block(0, bed.y + 0.06, back + 0.025, 0.37, 0.13, 0.01, new THREE.Color('#E8E2C8'), M.Paint, Z.Rear);
  const geo = b.build();
  groupVehicleMaterials(geo);
  return geo;
}
