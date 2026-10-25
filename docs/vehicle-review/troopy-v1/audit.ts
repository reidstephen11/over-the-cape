import * as THREE from "three";
import { writeFileSync } from "node:fs";
import { buildTroopyBody, buildTroopyWheel } from "./src/render/troopyProposal";
import {
  buildTroopyBody as baselineBody,
  buildTroopyWheel as baselineWheel,
} from "./src/render/troopyBody";
import { troopyTuning as tuning } from "./src/data/troopy";
const wheel = buildTroopyWheel(tuning),
  body = buildTroopyBody(tuning, wheel);
function inspect(g: THREE.BufferGeometry) {
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal"),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  const report = {
    vertices: p.count,
    triangles: p.count / 3,
    nonfinite: 0,
    zeroNormals: 0,
    degenerateTriangles: 0,
    contraryNormals: 0,
    examples: [] as unknown[],
    removedDegenerateTriangles: g.userData.removedDegenerateTriangles,
  };
  for (let i = 0; i < p.count; i++) {
    for (const attr of Object.values(g.attributes))
      for (let k = 0; k < attr.itemSize; k++)
        if (!Number.isFinite(attr.getComponent(i, k))) report.nonfinite++;
    if (Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) < 0.5) report.zeroNormals++;
  }
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    const face = b.sub(a).cross(c.sub(a));
    if (face.lengthSq() < 1e-20) report.degenerateTriangles++;
    else if (
      face.normalize().dot(new THREE.Vector3().fromBufferAttribute(n, i)) < -0.1
    ) {
      report.contraryNormals++;
      if (report.examples.length < 12)
        report.examples.push({
          index: i,
          position: new THREE.Vector3().fromBufferAttribute(p, i).toArray(),
          normal: new THREE.Vector3().fromBufferAttribute(n, i).toArray(),
          face: face.toArray(),
        });
    }
  }
  return report;
}
const before = baselineBody(tuning, baselineWheel(tuning));
const report = {
  body: inspect(body),
  wheel: inspect(wheel),
  originalBodyTriangles: before.getAttribute("position").count / 3,
};
writeFileSync("geometry-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
for (const r of [report.body, report.wheel])
  if (r.nonfinite + r.zeroNormals + r.degenerateTriangles + r.contraryNormals)
    process.exitCode = 1;
