import * as THREE from "three";
import { MeshBVH, ExtendedTriangle } from "three-mesh-bvh";
import { writeFileSync } from "node:fs";
import { VehicleSuspension } from "./src/render/vehicleSuspension";
import { sooty80Tuning as t } from "./src/data/sooty80";
import {
  buildVehicleWheel,
  buildVehicleBody,
} from "./src/render/sooty80Proposal";
const body = buildVehicleBody(t, buildVehicleWheel(t)),
  part = body.getAttribute("reviewPart");
const ids: number[] = [];
for (let i = 0; i < part.count; i += 3)
  if (!(part.getX(i) & 1024)) ids.push(i, i + 1, i + 2);
body.setIndex(ids);
const bt = new MeshBVH(body, { targetLeafSize: 8 }),
  s = new VehicleSuspension(
    t,
    Array.from({ length: 11 }, () => new THREE.MeshBasicMaterial()),
    "coil",
  );
const parts = s.group.children.filter(
  (o) => o.name.startsWith("coil-") || o.name.startsWith("damper-"),
) as THREE.Mesh[];
const trees = parts.map((p) => new MeshBVH(p.geometry, { targetLeafSize: 8 }));
const hits: unknown[] = [];
let poses = 0;
for (const wi of [-1, 0, 1, 2, 3])
  for (let k = 0; k < 12; k++) {
    const h = [-0.196, -0.196, -0.196, -0.196];
    for (let i = 0; i < 4; i++) if (wi < 0 || wi === i) h[i] += k * 0.01;
    s.update(h);
    s.group.updateMatrixWorld(true);
    poses++;
    for (let j = 0; j < parts.length; j++) {
      let example: unknown;
      const hit = bt.bvhcast(trees[j], parts[j].matrixWorld, {
        intersectsTriangles: (a: ExtendedTriangle, b: ExtendedTriangle) => {
          if (!a.intersectsTriangle(b)) return false;
          example = a.getMidpoint(new THREE.Vector3()).toArray();
          return true;
        },
      });
      if (hit)
        hits.push({ wi, bump: k * 0.01, part: parts[j].name, point: example });
    }
  }
const result = {
  method:
    "All moving coil/damper surfaces versus the body, excluding only explicit spring seats and shock mounting towers",
  poses,
  hits,
};
writeFileSync(
  "suspension-body-clearance.json",
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({ ...result, hits: hits.slice(0, 8), totalHits: hits.length }),
);
if (hits.length) process.exitCode = 1;
