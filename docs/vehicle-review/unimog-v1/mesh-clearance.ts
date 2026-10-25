import * as THREE from "three";
import { MeshBVH, ExtendedTriangle } from "three-mesh-bvh";
import { writeFileSync } from "node:fs";
import { buildUnimogBody, buildUnimogWheel } from "./src/render/unimogProposal";
import { unimogTuning as tuning } from "./src/data/unimog";
const wheel = buildUnimogWheel(tuning),
  body = buildUnimogBody(tuning, wheel);
const bodyTree = new MeshBVH(body, { targetLeafSize: 8 }),
  wheelTree = new MeshBVH(wheel, { targetLeafSize: 8 });
const pose = new THREE.Matrix4(),
  rotation = new THREE.Quaternion(),
  scale = new THREE.Vector3(1, 1, 1),
  up = new THREE.Vector3(0, 1, 0);
const hits: unknown[] = [];
let states = 0;
const exhaustive = process.argv.includes("--full");
for (let wi = 0; wi < 4; wi++)
  for (const deg of tuning.wheels[wi].front
    ? exhaustive
      ? Array.from({ length: 67 }, (_, i) => i - 33)
      : [-33, 0, 33]
    : [0])
    for (const bump of exhaustive
      ? Array.from({ length: 21 }, (_, i) => i * 0.01)
      : [0, 0.1, 0.2]) {
      states++;
      const hub = tuning.wheels[wi];
      pose.compose(
        new THREE.Vector3(hub.x, -0.12 + bump, hub.z),
        rotation.setFromAxisAngle(up, (deg * Math.PI) / 180),
        scale,
      );
      let example: unknown;
      const hit = bodyTree.bvhcast(wheelTree, pose, {
        intersectsTriangles: (
          a: ExtendedTriangle,
          b: ExtendedTriangle,
          indexA: number,
          indexB: number,
        ) => {
          if (!a.intersectsTriangle(b)) return false;
          example = {
            wi,
            deg,
            bump,
            bodyTriangle: indexA,
            wheelTriangle: indexB,
            bodyCentre: a.getMidpoint(new THREE.Vector3()).toArray(),
          };
          return true;
        },
      });
      if (hit) hits.push(example);
    }
const report = {
  method: "Triangle-surface intersections using two BVHs",
  bodyTriangles: body.index!.count / 3,
  wheelTriangles: wheel.index!.count / 3,
  states,
  intersections: hits,
};
writeFileSync(
  exhaustive ? "mesh-clearance-full.json" : "mesh-clearance-extremes.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    ...report,
    intersections: hits.slice(0, 12),
    totalIntersections: hits.length,
  }),
);
if (hits.length) process.exitCode = 1;
