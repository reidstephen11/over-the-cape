import * as THREE from "three";
import { MeshBVH, ExtendedTriangle } from "three-mesh-bvh";
import { writeFileSync } from "node:fs";
import { buildTroopyBody, buildTroopyWheel } from "./src/render/troopyProposal";
import { troopyTuning as t } from "./src/data/troopy";
const body = buildTroopyBody(t, buildTroopyWheel(t)),
  part = body.getAttribute("reviewPart");
function subset(include: (id: number) => boolean) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", body.getAttribute("position"));
  const ids: number[] = [];
  for (let i = 0; i < part.count; i += 3)
    if (include(part.getX(i))) ids.push(i, i + 1, i + 2);
  g.setIndex(ids);
  return g;
}
const results = [];
for (const [id, carrier, name] of [
  [64, 128, "rear door"],
  [256, 512, "roof rack"],
] as const) {
  const fixed = new MeshBVH(
      subset((p) => (p & (id | carrier)) === 0),
      { targetLeafSize: 8 },
    ),
    spare = new MeshBVH(
      subset((p) => (p & id) !== 0),
      { targetLeafSize: 8 },
    );
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
  results.push({ name, intersections });
}
const report = {
  method:
    "Both spare wheels versus body triangle surfaces; each own carrier excluded as intended support",
  spares: results,
  intersections: results.flatMap((r) => r.intersections),
};
writeFileSync("spare-clearance.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    spares: results.map((r) => ({
      name: r.name,
      count: r.intersections.length,
      examples: r.intersections.slice(0, 3),
    })),
  }),
);
if (report.intersections.length) process.exitCode = 1;
