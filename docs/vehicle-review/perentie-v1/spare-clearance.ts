import * as THREE from "three";
import { MeshBVH, ExtendedTriangle } from "three-mesh-bvh";
import { writeFileSync } from "node:fs";
import {
  buildPerentieBody,
  buildPerentieWheel,
} from "./src/render/perentieProposal";
import { perentieTuning as t } from "./src/data/perentie";
const body = buildPerentieBody(t, buildPerentieWheel(t)),
  part = body.getAttribute("reviewPart");
function subset(spare: boolean) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", body.getAttribute("position"));
  const ids: number[] = [];
  for (let i = 0; i < part.count; i += 3)
    if (spare ? part.getX(i) === 64 : ![64, 128].includes(part.getX(i)))
      ids.push(i, i + 1, i + 2);
  g.setIndex(ids);
  return g;
}
const fixed = new MeshBVH(subset(false), { targetLeafSize: 8 }),
  spare = new MeshBVH(subset(true), { targetLeafSize: 8 });
const intersections: unknown[] = [];
fixed.bvhcast(spare, new THREE.Matrix4(), {
  intersectsTriangles: (a: ExtendedTriangle, b: ExtendedTriangle) => {
    if (a.intersectsTriangle(b))
      intersections.push({
        bodyCentre: a.getMidpoint(new THREE.Vector3()).toArray(),
        spareCentre: b.getMidpoint(new THREE.Vector3()).toArray(),
      });
    return false;
  },
});
const report = {
  method:
    "Underslung spare versus non-support body triangle surfaces; cradle excluded as intended support",
  intersections,
};
writeFileSync("spare-clearance.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    count: intersections.length,
    examples: intersections.slice(0, 4),
  }),
);
if (intersections.length) process.exitCode = 1;
