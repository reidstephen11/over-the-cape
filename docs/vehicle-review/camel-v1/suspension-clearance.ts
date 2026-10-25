import * as THREE from "three";
import { MeshBVH, ExtendedTriangle } from "three-mesh-bvh";
import { writeFileSync } from "node:fs";
import { VehicleSuspension } from "./src/render/vehicleSuspension";
import { camel90Tuning as t } from "./src/data/camel90";
import { buildVehicleWheel } from "./src/render/camelWheel";
const s = new VehicleSuspension(
  t,
  Array.from({ length: 11 }, () => new THREE.MeshBasicMaterial()),
  "coil",
);
const wg = buildVehicleWheel(t),
  wt = new MeshBVH(wg, { targetLeafSize: 8 });
const parts = s.group.children.filter(
  (o) =>
    o.name.startsWith("coil-") ||
    o.name.startsWith("damper-") ||
    o.name.startsWith("radius-arm-"),
) as THREE.Mesh[];
const trees = parts.map((p) => new MeshBVH(p.geometry, { targetLeafSize: 8 }));
const hits: unknown[] = [];
let states = 0;
for (let wi = 0; wi < 4; wi++)
  for (const angle of t.wheels[wi].front
    ? Array.from({ length: 69 }, (_, i) => i - 34)
    : [0])
    for (const bump of Array.from({ length: 14 }, (_, i) => i * 0.01)) {
      states++;
      const heights = [-0.12, -0.12, -0.12, -0.12];
      heights[wi] += bump;
      s.update(heights);
      s.group.updateMatrixWorld(true);
      const hub = t.wheels[wi],
        pose = new THREE.Matrix4().makeRotationY((angle * Math.PI) / 180);
      pose.setPosition(hub.x, heights[wi], hub.z);
      for (let j = 0; j < parts.length; j++) {
        let example: unknown;
        const matrix = parts[j].matrixWorld.clone().invert().multiply(pose);
        const hit = trees[j].bvhcast(wt, matrix, {
          intersectsTriangles: (a: ExtendedTriangle, b: ExtendedTriangle) => {
            if (!a.intersectsTriangle(b)) return false;
            example = a
              .getMidpoint(new THREE.Vector3())
              .applyMatrix4(parts[j].matrixWorld)
              .toArray();
            return true;
          },
        });
        if (hit)
          hits.push({ wi, angle, bump, part: parts[j].name, point: example });
      }
    }
const result = {
  method:
    "Moving spring and damper surfaces versus tyres at every 10 mm through full bump, including each degree of steering and individual-wheel compression",
  states,
  hits,
};
writeFileSync("suspension-clearance.json", JSON.stringify(result, null, 2));
console.log(
  JSON.stringify({ ...result, hits: hits.slice(0, 8), totalHits: hits.length }),
);
if (hits.length) process.exitCode = 1;
