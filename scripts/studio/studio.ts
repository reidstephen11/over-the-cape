/**
 * Dev-only page: one vehicle on plain ground in the late-afternoon light, for checking a
 * model without loading a map. Open http://localhost:5173/scripts/studio/?vehicle=hilux
 * with the dev server running; scripts/studio-shots.ts photographs it from all round.
 */
import * as THREE from 'three';
import { lateAfternoon } from '../../src/data/environment';
import { isVehicleId, vehicles } from '../../src/data/vehicles';
import { applyFogEnvironment } from '../../src/render/fog';
import { Lighting } from '../../src/render/lighting';
import { Sky } from '../../src/render/sky';
import { VehicleModel } from '../../src/render/vehicleModel';

const params = new URLSearchParams(location.search);
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

const model = new VehicleModel(tuning);
for (let i = 0; i < 4; i++) model.wheels[i].pivot.position.y = tuning.wheels[i].y - rest;
model.suspension.update(model.wheels.map((w) => w.pivot.position.y));
scene.add(model.root);

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
