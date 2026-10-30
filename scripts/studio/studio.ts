/**
 * Dev-only page: one vehicle on plain ground in the late-afternoon light, for checking a
 * model without loading a map. Open http://localhost:5173/scripts/studio/?vehicle=hilux
 * with the dev server running; scripts/studio-shots.ts photographs it from all round.
 * `?trailer=no5` (or `box6x4`) shows a trailer on its own at the origin; with `vehicle` as
 * well, the trailer stands hitched behind the vehicle. `?stock` draws the 80 Series without its
 * touring gear, and `?plain` puts the vehicle on a flat white backdrop, for laying its outline
 * over a reference photograph.
 */
import * as THREE from 'three';
import { lateAfternoon } from '../../src/data/environment';
import { isVehicleId, vehicles } from '../../src/data/vehicles';
import { hitchPoint, trailers, type TrailerTuning } from '../../src/data/trailers';
import type { Trailer } from '../../src/sim/trailer';
import { TrailerView } from '../../src/render/trailerView';
import { applyFogEnvironment } from '../../src/render/fog';
import { Lighting } from '../../src/render/lighting';
import { Sky } from '../../src/render/sky';
import { VehicleModel } from '../../src/render/vehicleModel';
import { vehicleLooks } from '../../src/render/vehicleLooks';
import { buildBodyCore } from '../../src/render/sooty80Body';

const params = new URLSearchParams(location.search);
const trailerId = params.get('trailer') as TrailerTuning['id'] | null;
const alone = trailerId !== null && !params.has('vehicle');
const id = params.get('vehicle') ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const tuning = vehicles[id].tuning;
const env = lateAfternoon;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = env.toneMapping === 'agx' ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = env.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 2000);
const lighting = new Lighting(scene, env);
lighting.sun.shadow.mapSize.set(2048, 2048);
for (const k of ['left', 'bottom'] as const) lighting.sun.shadow.camera[k] = -8;
for (const k of ['right', 'top'] as const) lighting.sun.shadow.camera[k] = 8;
lighting.sun.shadow.camera.updateProjectionMatrix();
const sky = new Sky(env);
scene.add(sky.mesh);
const pmrem = new THREE.PMREMGenerator(renderer);
const skyScene = new THREE.Scene();
skyScene.add(new Sky(env).mesh);
scene.environment = pmrem.fromScene(skyScene, 0.04, 0.1, 200, { size: 128 }).texture;
scene.environmentIntensity = 0.45;
applyFogEnvironment(scene, env, 2000);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: '#8B7355', roughness: 1 }),
);
// Derive the hub height from the suspension: lifted vehicles need not use -0.12 m.
const rest = tuning.suspensionRestLength - 0.12;
ground.position.y = tuning.wheels[0].y - rest - tuning.wheelRadius;
ground.receiveShadow = true;
scene.add(ground);
if (params.has('plain')) {
  sky.mesh.visible = ground.visible = false;
  scene.background = new THREE.Color('#ffffff');
}
if (params.has('stock') && id === 'sooty80')
  vehicleLooks.sooty80.body = (t, wheel) => buildBodyCore(t, wheel, false);

const model = new VehicleModel(tuning);
// The stock body has no rack, so its recovery boards stay off.
if (params.has('stock')) model.rackPlanks.visible = false;
for (let i = 0; i < 4; i++) model.wheels[i].pivot.position.y = tuning.wheels[i].y - rest;
model.suspension.update(model.wheels.map((w) => w.pivot.position.y));
if (!alone) scene.add(model.root);

/** A trailer standing still: on its own with its ground under the origin, or on the vehicle's hitch. */
if (trailerId) {
  const t = trailers[trailerId];
  if (!t) throw new Error(`Unknown trailer ${trailerId}`);
  const sag = (t.mass * 9.81) / (t.wheels.length * t.springRate);
  const susp = t.suspensionRestLength - sag;
  const groundBelowMount = susp + t.wheelRadius;
  let pos = new THREE.Vector3(0, ground.position.y + groundBelowMount, 0);
  let pitch = 0;
  if (!alone) {
    const h = hitchPoint(tuning);
    const axleY = ground.position.y + groundBelowMount;
    pitch = Math.atan2(h.y - (axleY + t.coupling.y), -t.coupling.z);
    // Coupling on the hitch: the axle sits `reach` behind it along the drawbar.
    const k = new THREE.Vector3(t.coupling.x, t.coupling.y, t.coupling.z).applyAxisAngle(
      new THREE.Vector3(1, 0, 0),
      pitch,
    );
    pos = new THREE.Vector3(h.x - k.x, h.y - k.y, h.z - k.z);
  }
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
  const fake = {
    tuning: t,
    prevPosition: { x: pos.x, y: pos.y, z: pos.z },
    prevRotation: { x: q.x, y: q.y, z: q.z, w: q.w },
    body: { translation: () => pos, rotation: () => q },
    wheels: t.wheels.map(() => ({ suspension: susp, rotation: 0 })),
    hitchedTo: alone ? null : {},
  } as unknown as Trailer;
  const view = new TrailerView(fake);
  view.setDrums(Number(params.get('drums') ?? 0));
  view.root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.receiveShadow = true;
  });
  scene.add(view.root);
}

function view(x: number, y: number, z: number, tx = 0, ty = 0.3, tz = 0, fov = 45): void {
  camera.fov = fov;
  camera.position.set(x, y, z);
  camera.lookAt(tx, ty, tz);
  camera.updateProjectionMatrix();
  lighting.follow(new THREE.Vector3());
  sky.update(camera);
  renderer.render(scene, camera);
}

declare global {
  interface Window {
    studio: { view: typeof view; cockpit(): void; ready: boolean };
  }
}
window.studio = {
  view,
  /** From the driver's seat, as the game's cockpit view sees it. */
  cockpit() {
    const c = vehicles[id].cabin;
    model.setCockpitView(true);
    camera.fov = 70;
    camera.position.set(c.eye.x, c.eye.y, c.eye.z);
    camera.rotation.set(c.pitch, 0, 0, 'YXZ');
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    model.setCockpitView(false);
  },
  ready: true,
};
view(5, 2, -5);
