import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Vec3 } from '../sim/vehicle/math';
import type { VehicleTuning } from '../data/vehicle';
import { BodyZone as Z, VehicleBuilder, VehicleMaterial as M } from './vehicleGeometry';
import { addVehicleInterior } from './vehicleInterior';
import { addFj40GlbEquipment } from './vehicleEquipment';
import { cleanGeometry } from './bodyRefinement';
import { standardLivery, type Livery } from './vehicleBody';

/**
 * The Blender-built FJ40 (public/models/fj40.glb, tools/blender/fj40) as the short-wheelbase
 * 40 Series' body and wheels. TEST BRANCH ONLY (fj40-blender-test): the GLB is loaded once
 * before the drive starts; ?fj40=code keeps the hand-coded body, and a failed load falls back
 * to it too. The GLB is Y-up, metres, nose to -Z: already the game's frame.
 *
 * Kept from the code car: the cabin and dials (the cockpit camera and instruments are laid out
 * on them), the roof rack the planks ride on, the roof spare and aerial, and the moving axles
 * and springs (VehicleSuspension). Left out of the GLB for the same reason: interior_*,
 * chassis_axle_*, chassis_spring_*; the wheel_* nodes become the shared wheel geometry.
 */

/**
 * GLB hubs are at y = -0.108 and the tyres meet the ground. The game parks its hubs at
 * y = -0.12, so the body drops 12 mm and the wheels sit in the arches. The previous
 * +0.108 lift lined the roof up with the code body and left a 120 mm gap above each tyre.
 */
const LIFT = -0.012;
/** The rear spare, as modelled, covered the left tail lamp. It and its carrier move inboard. */
const SPARE_INBOARD = 0.22;
const GLB_TYRE_R = 0.392;

let gltfRoot: THREE.Object3D | null = null;
let loading: Promise<void> | null = null;

export function fj40GlbWanted(): boolean {
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).get('fj40') !== 'code';
}

/** Whether the GLB is loaded and the shortie is drawn from it. */
export function fj40GlbActive(): boolean {
  return gltfRoot !== null && fj40GlbWanted();
}

/** Load the GLB (once). Never rejects: on failure the code body is used. */
export function loadFj40Glb(): Promise<void> {
  if (!fj40GlbWanted()) return Promise.resolve();
  loading ??= new GLTFLoader()
    .loadAsync(`${import.meta.env.BASE_URL}models/fj40.glb`)
    .then((gltf) => {
      gltf.scene.updateMatrixWorld(true);
      gltfRoot = gltf.scene;
      console.info('[fj40] Blender GLB loaded');
    })
    .catch((err: unknown) => {
      console.warn('[fj40] GLB failed to load; using the code body', err);
    });
  return loading;
}

/** The named part a mesh belongs to (multi-material parts load as a group of meshes). */
function partName(o: THREE.Object3D): string {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) {
    if (/^(body|trim|glass|wheel|spare|lamp|chassis|interior)_?/.test(p.name)) return p.name;
  }
  return o.name;
}

function zoneOf(part: string): number {
  if (part.startsWith('body_front')) return Z.Front;
  if (part.startsWith('body_sides')) return Z.Sides;
  if (part.startsWith('body_rear')) return Z.Rear;
  if (part.startsWith('body_roof')) return Z.Roof;
  if (part.startsWith('glass_')) return Z.Glass;
  return Z.Trim;
}

function slotAndColour(part: string, mat: THREE.MeshStandardMaterial, livery: Livery): [number, THREE.Color] {
  const name = mat.name;
  const c = mat.color ? mat.color.clone() : new THREE.Color(0.5, 0.5, 0.5);
  if (name === 'paint') return [M.Paint, livery.body.clone()];
  if (name === 'paint_roof') return [M.Paint, livery.roof.clone()];
  if (name === 'glass') return [part.startsWith('trim_mirror') ? M.Mirror : M.Glass, c];
  if (name === 'lamp_lens') return [part.startsWith('lamp_head') ? M.Headlamp : M.Lamp, c];
  if (name === 'lamp_red') return [M.Red, c];
  if (name === 'lamp_amber') return [M.Amber, c];
  if (name.startsWith('interior')) return [M.Fabric, c];
  if (name === 'trim_black' || name === 'tyre_rubber' || name === 'chassis_black') return [M.Rubber, c];
  if (name === 'trim_white' || name === 'wheel_white') return [M.Paint, c];
  return [M.Metal, c];
}

interface Soup {
  pos: number[];
  nrm: number[];
  col: number[];
  tag: number[];
  slot: number[];
}

function addMesh(
  soup: Soup,
  mesh: THREE.Mesh,
  part: string,
  livery: Livery,
  map: (v: THREE.Vector3) => void,
): void {
  const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  const p = geo.getAttribute('position'),
    n = geo.getAttribute('normal');
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const groups = geo.groups.length ? geo.groups : [{ start: 0, count: p.count, materialIndex: 0 }];
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const v = new THREE.Vector3(),
    nv = new THREE.Vector3();
  const zone = zoneOf(part);
  for (const g of groups) {
    const [slot, colour] = slotAndColour(
      part,
      mats[g.materialIndex ?? 0] as THREE.MeshStandardMaterial,
      livery,
    );
    for (let i = g.start; i < Math.min(g.start + g.count, p.count); i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
      map(v);
      soup.pos.push(v.x, v.y, v.z);
      if (n) nv.fromBufferAttribute(n, i).applyMatrix3(normalMatrix).normalize();
      else nv.set(0, 1, 0);
      soup.nrm.push(nv.x, nv.y, nv.z);
      soup.col.push(colour.r, colour.g, colour.b);
      soup.tag.push(zone);
      soup.slot.push(slot);
    }
  }
  if (geo !== mesh.geometry) geo.dispose();
}

function soupGeometry(s: Soup): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(s.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(s.nrm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(s.col, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((s.pos.length / 3) * 2), 2));
  geo.setAttribute('tag', new THREE.Float32BufferAttribute(s.tag, 1));
  geo.setAttribute('materialSlot', new THREE.Float32BufferAttribute(s.slot, 1));
  return geo;
}

/**
 * Wheels, the code cabin and the moving axles stay out. The stock bumpers are left out too:
 * the touring bull bar and the rear bar take their place, and the two together z-fought.
 */
const skipInBody = /^(wheel_|interior_|chassis_axle|chassis_spring|trim_bumper_|trim_reflector)/;

/** The GLB body in the game's attributes, with the code cabin, rack, roof spare and aerial. */
export function buildFj40GlbBody(
  tuning: VehicleTuning,
  wheel: THREE.BufferGeometry,
  livery: Livery = standardLivery,
): THREE.BufferGeometry {
  if (!gltfRoot) throw new Error('fj40.glb not loaded');
  // ?fj40paint=b22d1f tries another body colour (test branch only); otherwise the livery's.
  const paint = new URLSearchParams(location.search).get('fj40paint');
  if (paint && /^[0-9a-f]{6}$/i.test(paint)) livery = { ...livery, body: new THREE.Color(`#${paint}`) };
  const soup: Soup = { pos: [], nrm: [], col: [], tag: [], slot: [] };
  gltfRoot.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const part = partName(o);
    if (skipInBody.test(part)) return;
    addMesh(soup, o as THREE.Mesh, part, livery, (v) => {
      v.y += LIFT;
      if (part === 'spare' || part.startsWith('spare') || part === 'trim_spare_carrier') v.x += SPARE_INBOARD;
    });
  });
  const glb = soupGeometry(soup);
  const b = new VehicleBuilder();
  addVehicleInterior(b, tuning.engine.redlineRpm);
  addFj40GlbEquipment(b, tuning, wheel);
  const code = b.build();
  const merged = mergeGeometries([glb, code]);
  glb.dispose();
  code.dispose();
  if (!merged) throw new Error('fj40: could not merge GLB and code geometry');
  return cleanGeometry(merged);
}

/**
 * The GLB's right front wheel (its outer face to +X) as the one wheel all four share: the outer
 * half mirrored onto the inner side, as the code wheel is drawn, scaled to the physics radius.
 */
export function buildFj40GlbWheel(tuning: VehicleTuning): THREE.BufferGeometry {
  if (!gltfRoot) throw new Error('fj40.glb not loaded');
  const node = gltfRoot.getObjectByName('wheel_fr');
  if (!node) throw new Error('fj40.glb has no wheel_fr');
  const hub = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
  const k = tuning.wheelRadius / GLB_TYRE_R;
  const half: Soup = { pos: [], nrm: [], col: [], tag: [], slot: [] };
  node.traverse((o) => {
    if ((o as THREE.Mesh).isMesh)
      addMesh(half, o as THREE.Mesh, 'wheel_fr', standardLivery, (v) => void v.sub(hub).multiplyScalar(k));
  });
  const out: Soup = { pos: [], nrm: [], col: [], tag: [], slot: [] };
  for (let t = 0; t < half.pos.length / 9; t++) {
    const cx = half.pos[t * 9] + half.pos[t * 9 + 3] + half.pos[t * 9 + 6];
    if (cx < 0) continue;
    for (const mirror of [1, -1]) {
      const order = mirror === 1 ? [0, 1, 2] : [0, 2, 1];
      for (const j of order) {
        const i = t * 3 + j;
        out.pos.push(mirror * Math.max(0, half.pos[i * 3]), half.pos[i * 3 + 1], half.pos[i * 3 + 2]);
        out.nrm.push(mirror * half.nrm[i * 3], half.nrm[i * 3 + 1], half.nrm[i * 3 + 2]);
        out.col.push(half.col[i * 3], half.col[i * 3 + 1], half.col[i * 3 + 2]);
        out.tag.push(Z.Trim);
        out.slot.push(half.slot[i]);
      }
    }
  }
  return cleanGeometry(soupGeometry(out));
}

/** Headlamp lens centres on the GLB (lamp_head_l/r), in the game frame. */
export function fj40GlbHeadlamps(): Vec3[] {
  const out: Vec3[] = [];
  for (const name of ['lamp_head_l', 'lamp_head_r']) {
    const o = gltfRoot?.getObjectByName(name);
    if (!o) continue;
    const box = new THREE.Box3().setFromObject(o);
    const c = box.getCenter(new THREE.Vector3());
    out.push({ x: c.x, y: c.y + LIFT, z: box.min.z });
  }
  return out;
}
