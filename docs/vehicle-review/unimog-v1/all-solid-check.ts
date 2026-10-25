import { writeFileSync } from "node:fs";
import * as THREE from "three";
import { VehicleBuilder } from "./src/render/vehicleGeometry";
import { buildUnimogBody, buildUnimogWheel } from "./src/render/unimogProposal";
import { unimogTuning as t } from "./src/data/unimog";
const boxes: {
  inverse: THREE.Matrix4;
  worldBounds: THREE.Box3;
  size: THREE.Vector3;
  r: number;
  name: string;
}[] = [];
const original = VehicleBuilder.prototype.block;
let active = false;
VehicleBuilder.prototype.block = function (
  x,
  y,
  z,
  w,
  h,
  d,
  color,
  slot,
  zone,
  radius = 0,
) {
  if (active) {
    const matrix = this.matrix
      .clone()
      .multiply(new THREE.Matrix4().makeTranslation(x, y, z));
    boxes.push({
      worldBounds: new THREE.Box3(
        new THREE.Vector3(-w / 2, -h / 2, -d / 2),
        new THREE.Vector3(w / 2, h / 2, d / 2),
      ).applyMatrix4(matrix),
      inverse: matrix.invert(),
      size: new THREE.Vector3(w / 2, h / 2, d / 2),
      r: Math.min(radius, w / 2, h / 2, d / 2),
      name: new Error().stack?.split("\n")[2]?.trim() ?? "box",
    });
  }
  return original.call(this, x, y, z, w, h, d, color, slot, zone, radius);
};
const wheel = buildUnimogWheel(t);
active = true;
buildUnimogBody(t, wheel);
active = false;
const raw = wheel.getAttribute("position");
const unique = new Map<string, number[]>();
for (let i = 0; i < raw.count; i++) {
  const v = [raw.getX(i), raw.getY(i), raw.getZ(i)];
  unique.set(v.map((x) => x.toFixed(7)).join(","), v);
}
const wp = new THREE.Float32BufferAttribute([...unique.values()].flat(), 3),
  v = new THREE.Vector3(),
  local = new THREE.Vector3();
const hitMap = new Map<string, unknown>();
let states = 0;
for (let wi = 0; wi < 4; wi++)
  for (const steer of t.wheels[wi].front
    ? Array.from({ length: 67 }, (_, i) => i - 33)
    : [0])
    for (const bump of Array.from({ length: 21 }, (_, i) => i * 0.01)) {
      states++;
      const hub = t.wheels[wi],
        rot = new THREE.Matrix4().makeRotationY((steer * Math.PI) / 180);
      const envelope = new THREE.Box3(
        new THREE.Vector3(hub.x - 0.9, -0.8, hub.z - 0.9),
        new THREE.Vector3(hub.x + 0.9, 0.8, hub.z + 0.9),
      );
      const candidates = boxes.filter((box) =>
        box.worldBounds.intersectsBox(envelope),
      );
      for (let i = 0; i < wp.count; i++) {
        v.fromBufferAttribute(wp, i)
          .applyMatrix4(rot)
          .add(new THREE.Vector3(hub.x, -0.12 + bump, hub.z));
        for (const box of candidates) {
          local.copy(v).applyMatrix4(box.inverse);
          const dx = Math.abs(local.x) - box.size.x + box.r,
            dy = Math.abs(local.y) - box.size.y + box.r,
            dz = Math.abs(local.z) - box.size.z + box.r;
          const sdf =
            Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) +
            Math.min(Math.max(dx, dy, dz), 0) -
            box.r;
          if (sdf < -0.0005) {
            const key = `${wi}-${steer}-${bump}-${box.name}`;
            if (!hitMap.has(key))
              hitMap.set(key, {
                wi,
                steer,
                bump,
                part: box.name,
                position: v.toArray(),
                penetration: -sdf,
              });
          }
        }
      }
    }
const report = {
  boxCount: boxes.length,
  wheelStates: states,
  uniqueWheelSamples: wp.count,
  hits: [...hitMap.values()],
};
writeFileSync("all-solid-clearance.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    ...report,
    hits: report.hits.slice(0, 5),
    totalHits: report.hits.length,
  }),
);
if (hitMap.size) process.exitCode = 1;
