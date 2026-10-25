import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { groupVehicleMaterials } from "./src/render/vehicleGeometry";
import { VehicleModel } from "./src/render/vehicleModel";
import { vehicleLooks } from "./src/render/vehicleLooks";
import { unimogTuning as tuning } from "./src/data/unimog";
import {
  buildUnimogBody,
  buildUnimogPlank,
  buildUnimogWheel,
} from "./src/render/unimogProposal";
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#e7e8e5");
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.65;
scene.add(new THREE.HemisphereLight("#ffffff", "#63736d", 1.2));
const key = new THREE.DirectionalLight("#fff3dc", 3.0);
key.position.set(-3, 7, -4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
key.shadow.bias = -0.0003;
scene.add(key);
const fill = new THREE.DirectionalLight("#e4f0ff", 0.9);
fill.position.set(4, 3, 2);
scene.add(fill);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: "#e7e8e5", roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -(tuning.wheelRadius + 0.12);
ground.receiveShadow = true;
scene.add(ground);
const original = new VehicleModel(tuning);
const factoryBody = vehicleLooks.unimog.body;
vehicleLooks.unimog.body = buildUnimogBody;
const factoryWheel = vehicleLooks.unimog.wheel;
vehicleLooks.unimog.wheel = buildUnimogWheel;
const factoryPlank = vehicleLooks.unimog.plank;
vehicleLooks.unimog.plank = buildUnimogPlank;
const proposed = new VehicleModel(tuning);
vehicleLooks.unimog.body = factoryBody;
vehicleLooks.unimog.plank = factoryPlank;
vehicleLooks.unimog.wheel = factoryWheel;
for (const model of [original, proposed]) {
  const rest = tuning.suspensionRestLength - 0.12;
  for (let i = 0; i < 4; i++)
    model.wheels[i].pivot.position.y = tuning.wheels[i].y - rest;
  model.suspension.update(model.wheels.map((w) => w.pivot.position.y));
  scene.add(model.root);
}
original.root.visible = false;
const camera = new THREE.PerspectiveCamera(
  38,
  innerWidth / innerHeight,
  0.05,
  200,
);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.35, 0);
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 2;
controls.maxDistance = 15;
let redrawPaused = false;
const render = () => {
  if (!redrawPaused) renderer.render(scene, camera);
};
controls.addEventListener("change", render);
const views: Record<string, number[]> = {
  hero: [-7.4, 3.6, -9.2, 0, 0.95, 0.25, 38],
  front: [0, 1.8, -10.5, 0, 0.95, -0.1, 35],
  side: [-11.5, 2.1, 0.3, 0, 1.0, 0.3, 38],
  rear: [7.3, 3.7, 9.2, 0, 1.0, 0.7, 38],
  detail: [-3.4, 1.7, -5.6, 0, 0.78, -2.65, 36],
  roof: [-4.8, 5.7, -5.1, 0, 1.5, 0.25, 40],
};
function view(name: string) {
  const v = views[name];
  camera.position.set(v[0], v[1], v[2]);
  controls.target.set(v[3], v[4], v[5]);
  camera.fov = v[6];
  camera.updateProjectionMatrix();
  controls.update();
  render();
}
let showBar = true,
  showRack = true,
  showGear = true,
  showCanvas = true;
const originalIndices = new Map(
  [original, proposed].map((m) => [
    m,
    Array.from(m.body.geometry.index!.array),
  ]),
);
function bar(visible: boolean) {
  showBar = visible;
  for (const m of [original, proposed]) {
    const g = m.body.geometry,
      part = g.getAttribute("reviewPart"),
      slots = g.getAttribute("materialSlot"),
      idx = originalIndices.get(m)!;
    const selected: number[] = [];
    g.clearGroups();
    for (let slot = 0; slot < 11; slot++) {
      const start = selected.length;
      for (let i = 0; i < idx.length; i += 3) {
        const a = idx[i],
          b = idx[i + 1],
          c = idx[i + 2];
        if (slots.getX(a) !== slot) continue;
        if (
          (!showBar && part.getX(a) & 1) ||
          (!showRack && part.getX(a) & 2) ||
          (!showGear && part.getX(a) & 4) ||
          (!showCanvas && part.getX(a) & 8)
        )
          continue;
        selected.push(a, b, c);
      }
      if (selected.length > start)
        g.addGroup(start, selected.length - start, slot);
    }
    g.setIndex(selected);
  }
  document.querySelector("#bar")!.textContent = visible
    ? "Hide bumper"
    : "Show bumper";
  render();
}
function rack(visible: boolean) {
  showRack = visible;
  for (const model of [original, proposed]) model.rackPlanks.visible = visible;
  bar(showBar);
  document.getElementById("rack")!.textContent = visible
    ? "Hide roof gear"
    : "Show roof gear";
}
function gear(visible: boolean) {
  showGear = visible;
  bar(showBar);
  document.getElementById("gear")!.textContent = visible
    ? "Hide lamp guards"
    : "Show lamp guards";
}
function canvas(visible: boolean) {
  showCanvas = visible;
  bar(showBar);
  document.getElementById("canvas")!.textContent = visible
    ? "Hide canvas"
    : "Show canvas";
}
function select(which: string) {
  original.root.visible = which === "original";
  proposed.root.visible = which === "proposed";
  for (const k of ["original", "proposed"])
    document.getElementById(k)!.classList.toggle("active", k === which);
  document.getElementById("mode")!.textContent =
    which === "original" ? "CURRENT GAME MODEL" : "PROPOSED MODEL";
  render();
}
let steer = 0,
  bump = 0;
function pose(angle: number, compression: number) {
  steer = Math.max(-33, Math.min(33, angle));
  bump = Math.max(0, Math.min(200, compression));
  for (const model of [original, proposed]) {
    for (let i = 0; i < 4; i++) {
      const pivot = model.wheels[i].pivot;
      pivot.rotation.y = tuning.wheels[i].front ? (steer * Math.PI) / 180 : 0;
      pivot.position.y = -0.12 + bump / 1000;
    }
    model.suspension.update(model.wheels.map((w) => w.pivot.position.y));
  }
  (document.getElementById("steer") as HTMLInputElement).value = String(steer);
  (document.getElementById("bump") as HTMLInputElement).value = String(bump);
  document.getElementById("steer-value")!.textContent = `${steer}°`;
  document.getElementById("bump-value")!.textContent = `${bump} mm`;
  render();
}
document.getElementById("steer")!.oninput = (e) =>
  pose(Number((e.target as HTMLInputElement).value), bump);
document.getElementById("bump")!.oninput = (e) =>
  pose(steer, Number((e.target as HTMLInputElement).value));
document.getElementById("pose-reset")!.onclick = () => pose(0, 0);
async function exportModel() {
  proposed.suspension.update([-0.12, -0.12, -0.12, -0.12]);
  const clone = proposed.root.clone(true);
  clone.visible = true;
  const clonedBodyGroup =
    clone.children[proposed.root.children.indexOf(proposed.bodyGroup)];
  clonedBodyGroup.children[
    proposed.bodyGroup.children.indexOf(proposed.rackPlanks)
  ].visible = true;
  proposed.suspension.update(proposed.wheels.map((w) => w.pivot.position.y));
  // Export the complete model at its parked stance, independently of review toggles.
  const body = clone.getObjectByName(proposed.body.name) as THREE.Mesh;

  for (let i = 0; i < 4; i++) {
    const originalPivot = proposed.wheels[i].pivot;
    const childIndex = proposed.root.children.indexOf(originalPivot);
    const pivot = clone.children[childIndex];
    pivot.rotation.y = 0;
    pivot.position.y = -0.12;
  }
  clone.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry = o.geometry.clone();
      if (o === body) groupVehicleMaterials(o.geometry);
      for (const name of Object.keys(o.geometry.attributes))
        if (!["position", "normal", "uv", "color"].includes(name))
          o.geometry.deleteAttribute(name);
    }
  });
  try {
    return (await new GLTFExporter().parseAsync(clone, {
      binary: true,
      onlyVisible: true,
    })) as ArrayBuffer;
  } finally {
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
  }
}
(document.getElementById("export") as HTMLButtonElement).onclick = async () => {
  const data = await exportModel();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "model/gltf-binary" }));
  a.download = "unimog-proposal-v1.glb";
  a.click();
  URL.revokeObjectURL(a.href);
};
for (const k of ["original", "proposed"])
  document.getElementById(k)!.onclick = () => select(k);
document
  .querySelectorAll<HTMLButtonElement>("[data-view]")
  .forEach((b) => (b.onclick = () => view(b.dataset.view!)));
document.getElementById("bar")!.onclick = () => bar(!showBar);
document.getElementById("rack")!.onclick = () => rack(!showRack);
document.getElementById("gear")!.onclick = () => gear(!showGear);
document.getElementById("canvas")!.onclick = () => canvas(!showCanvas);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  render();
});
view("hero");
(window as any).review = {
  ready: true,
  batch: (action: () => void) => {
    redrawPaused = true;
    try {
      action();
    } finally {
      redrawPaused = false;
      render();
    }
  },
  view,
  select,
  bar,
  rack,
  gear,
  canvas,
  pose,
  exportModel,
  setCamera: (eye: number[], target: number[], fov = 38) => {
    camera.position.fromArray(eye);
    controls.target.fromArray(target);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    controls.update();
    render();
  },
  inspection: (on: boolean) => {
    ground.visible = !on;
    controls.maxPolarAngle = on ? Math.PI : Math.PI * 0.49;
    render();
  },
  models: { original, proposed },
  render,
  validateGLB: async () => {
    const data = await (await fetch("./unimog-proposal-v1.glb")).arrayBuffer();
    const result = await new GLTFLoader().parseAsync(data, "");
    let meshes = 0,
      triangles = 0;
    result.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        meshes++;
        const p = o.geometry.getAttribute("position");
        for (const n of p.array)
          if (!Number.isFinite(n)) throw Error("Nonfinite coordinate");
        triangles += (o.geometry.index?.count ?? p.count) / 3;
      }
    });
    const box = new THREE.Box3().setFromObject(result.scene);
    return {
      meshes,
      triangles,
      bounds: box.getSize(new THREE.Vector3()).toArray(),
    };
  },
  stats: () => ({
    originalVertices: original.body.geometry.getAttribute("position").count,
    proposedVertices: proposed.body.geometry.getAttribute("position").count,
  }),
};
