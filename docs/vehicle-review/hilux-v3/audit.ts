import * as THREE from "three";
import { writeFileSync } from "node:fs";
import { buildHiluxBody, buildHiluxWheel } from "./src/render/hiluxProposal";
import { hiluxTuning as tuning } from "./src/data/hilux";
const wheel = buildHiluxWheel(tuning),
  g = buildHiluxBody(tuning, wheel);
const p = g.getAttribute("position"),
  n = g.getAttribute("normal"),
  slots = g.getAttribute("materialSlot");
const report: any = {
  vertices: p.count,
  triangles: p.count / 3,
  nonfinite: 0,
  zeroNormals: 0,
  degenerateTriangles: 0,
  backwardsNormals: 0,
  backwardsExamples: [],
  tyrePanelIntersections: [],
  tyreInnerWellIntersections: [],
  solidIntersections: [],
  wheelStates: 0,
  minInnerWellClearance: Infinity,
};
const a = new THREE.Vector3(),
  b = new THREE.Vector3(),
  c = new THREE.Vector3();
for (let i = 0; i < p.count; i++) {
  for (const attr of [p, n])
    for (let j = 0; j < 3; j++)
      if (!Number.isFinite(attr.getComponent(i, j))) report.nonfinite++;
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
    report.backwardsNormals++;
    if (report.backwardsExamples.length < 15)
      report.backwardsExamples.push({
        i,
        slot: slots.getX(i),
        position: [p.getX(i), p.getY(i), p.getZ(i)],
        normal: [n.getX(i), n.getY(i), n.getZ(i)],
        face: face.toArray(),
      });
  }
}
const wp = wheel.getAttribute("position");
const solidHits = new Map<
  string,
  { part: string; wi: number; steer: number; bump: number; vertices: number }
>();

for (let wi = 0; wi < 4; wi++)
  for (const steer of tuning.wheels[wi].front
    ? Array.from({ length: 63 }, (_, i) => i - 31)
    : [0])
    for (const bump of Array.from({ length: 12 }, (_, i) => i * 0.01)) {
      report.wheelStates++;
      const hub = tuning.wheels[wi],
        side = Math.sign(hub.x),
        rot = new THREE.Matrix4().makeRotationY((steer * Math.PI) / 180),
        v = new THREE.Vector3();
      let panelHits = 0,
        wellHits = 0;
      for (let i = 0; i < wp.count; i++) {
        v.fromBufferAttribute(wp, i).applyMatrix4(rot);
        v.x += hub.x;
        v.y += -0.12 + bump;
        v.z += hub.z;
        const outer = Math.abs(v.x),
          dz = v.z - hub.z;
        const opening = Math.max(
          -0.02,
          Math.sqrt(Math.max(0, 0.47 ** 2 - dz ** 2)) - 0.1,
        );
        if (outer > 0.79 && outer < 0.846 && v.y > opening + 0.003 && v.y < 0.6)
          panelHits++;
        for (const solid of g.userData.clearanceSolids) {
          if (
            v.x > solid.min[0] &&
            v.x < solid.max[0] &&
            v.y > solid.min[1] &&
            v.y < solid.max[1] &&
            v.z > solid.min[2] &&
            v.z < solid.max[2]
          ) {
            const key = `${wi},${steer},${bump},${solid.name}`;
            const hit = solidHits.get(key) ?? {
              part: solid.name,
              wi,
              steer,
              bump,
              vertices: 0,
            };
            hit.vertices++;
            solidHits.set(key, hit);
          }
        }
        const box = g.userData.innerWells[wi];
        if (
          v.y > box.min[1] &&
          v.y < box.max[1] &&
          v.z > box.min[2] &&
          v.z < box.max[2]
        )
          report.minInnerWellClearance = Math.min(
            report.minInnerWellClearance,
            side > 0 ? v.x - box.max[0] : box.min[0] - v.x,
          );
        if (
          v.x > box.min[0] &&
          v.x < box.max[0] &&
          v.y > box.min[1] &&
          v.y < box.max[1] &&
          v.z > box.min[2] &&
          v.z < box.max[2]
        )
          wellHits++;
      }
      if (panelHits)
        report.tyrePanelIntersections.push({
          wi,
          steer,
          bump,
          vertices: panelHits,
        });
      if (wellHits)
        report.tyreInnerWellIntersections.push({
          wi,
          steer,
          bump,
          vertices: wellHits,
        });
    }
report.solidIntersections = [...solidHits.values()];
report.auditedSolids = g.userData.clearanceSolids;
// Top-down rays must strike the bonnet and wing skins at representative points, from both sides.
const mesh = new THREE.Mesh(
  g,
  new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
);
mesh.updateMatrixWorld();
const ray = new THREE.Raycaster();
report.topSurfaceMisses = [];
for (let z = -2.1; z < -0.98; z += 0.08)
  for (let x = -0.82; x <= 0.82; x += 0.04) {
    if (Math.abs(Math.abs(x) - 0.74) < 0.012) continue;
    ray.set(new THREE.Vector3(x, 2, z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(mesh).find((h) => h.point.y > 0.55);
    if (!hit) report.topSurfaceMisses.push({ x, z });
  }
g.computeBoundingBox();
report.bounds = g.boundingBox?.getSize(new THREE.Vector3()).toArray();
report.innerWells = g.userData.innerWells;
report.removedDegenerateTriangles = g.userData.removedDegenerateTriangles;
report.bonnetTopology = g.userData.bonnetTopology;
writeFileSync("geometry-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));

const failures =
  report.solidIntersections.length +
  report.nonfinite +
  report.zeroNormals +
  report.degenerateTriangles +
  report.backwardsNormals +
  report.tyrePanelIntersections.length +
  report.tyreInnerWellIntersections.length +
  report.topSurfaceMisses.length +
  Object.values(report.bonnetTopology).reduce((a: number, b: any) => a + b, 0);
if (failures) process.exitCode = 1;
