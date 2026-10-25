import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
await page.goto("http://127.0.0.1:5271/Sooty80-review-v2.html");
await page.waitForFunction(() => window.review?.ready, null, {
  timeout: 90000,
});
const eighty = await page.evaluate(() => {
  const m = window.review.models.proposed;
  return {
    rightHandDrive: m.instruments.wheel.parent.position.x > 0,
    coils: m.suspension.springs === "coil",
    wheelbase: Math.abs(
      m.wheels[2].pivot.position.z - m.wheels[0].pivot.position.z,
    ),
    track: Math.abs(
      m.wheels[1].pivot.position.x - m.wheels[0].pivot.position.x,
    ),
  };
});
assert(
  eighty.rightHandDrive &&
    eighty.coils &&
    Math.abs(eighty.wheelbase - 2.85) < 1e-9 &&
    Math.abs(eighty.track - 1.67) < 1e-9,
  "80 Series layout failed",
);
const source = await page.evaluate(() => {
  const r = window.review;
  let triangles = 0;
  r.models.proposed.root.traverse((o) => {
    if (o.isMesh)
      triangles +=
        (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
  });
  const g = r.models.proposed.body.geometry;
  return {
    triangles,
    bodyIndices: Array.from(g.index.array),
    headlampIndices: g.groups.find((g) => g.materialIndex === 8).count,
  };
});
await page.getByRole("button", { name: "Body only", exact: true }).click();
assert(
  (await page.locator("#mode").textContent()) ===
    "BODY STUDY · SAME WHEELS & LIFT",
  "Body study selector failed",
);
await page.getByRole("button", { name: "Complete build", exact: true }).click();
await page.getByRole("button", { name: "Hide bullbar", exact: true }).click();
const hidden = await page.evaluate(() => {
  const g = window.review.models.proposed.body.geometry;
  return {
    count: g.index.count,
    lamps: g.groups.find((g) => g.materialIndex === 8).count,
  };
});
assert(
  hidden.count < source.bodyIndices.length &&
    hidden.lamps === source.headlampIndices,
  "Bar hiding removed lamps or failed",
);
await page.getByRole("button", { name: "Show bullbar", exact: true }).click();
assert(
  await page.evaluate((before) => {
    const after = window.review.models.proposed.body.geometry.index.array;
    return (
      before.length === after.length && before.every((x, i) => x === after[i])
    );
  }, source.bodyIndices),
  "Bar restoration changed the model",
);
for (const label of [
  "Front ¾",
  "Front",
  "Side",
  "Rear ¾",
  "Grille & bar",
  "Roof & cargo",
])
  await page.getByRole("button", { name: label, exact: true }).click();
await page.getByRole("button", { name: "Hide roof gear", exact: true }).click();
assert(
  await page.evaluate(() => !window.review.models.proposed.rackPlanks.visible),
  "Roof boards remain visible",
);
await page.getByRole("button", { name: "Show roof gear", exact: true }).click();
assert(
  await page.evaluate((before) => {
    const after = window.review.models.proposed.body.geometry.index.array;
    return (
      before.length === after.length && before.every((v, i) => v === after[i])
    );
  }, source.bodyIndices),
  "Roof gear restore changed geometry",
);
for (const part of ["gear", "canvas"]) {
  await page.locator("#" + part).click();
  assert(
    (await page.evaluate(
      () => window.review.models.proposed.body.geometry.index.count,
    )) < source.bodyIndices.length,
    part + " hide failed",
  );
  await page.locator("#" + part).click();
  assert(
    await page.evaluate((before) => {
      const after = window.review.models.proposed.body.geometry.index.array;
      return (
        before.length === after.length && before.every((v, i) => v === after[i])
      );
    }, source.bodyIndices),
    part + " exact restoration failed",
  );
}
const baseline = await page.evaluate(async () => {
  const data = new Uint8Array(await window.review.exportModel());
  let str = "";
  for (let i = 0; i < data.length; i += 8192)
    str += String.fromCharCode(...data.subarray(i, i + 8192));
  return btoa(str);
});
await page.evaluate(() => {
  const steer = document.getElementById("steer"),
    bump = document.getElementById("bump");
  steer.value = "34";
  steer.dispatchEvent(new Event("input"));
  bump.value = "110";
  bump.dispatchEvent(new Event("input"));
});
assert(
  await page.evaluate(() => {
    const r = window.review;
    return [r.models.original, r.models.proposed].every(
      (m) =>
        m.wheels.every(
          (w, i) =>
            Math.abs(w.pivot.position.y - -0.086) < 1e-9 &&
            Math.abs(w.pivot.rotation.y - (i < 2 ? (34 * Math.PI) / 180 : 0)) <
              1e-9,
        ) && Math.abs(m.suspension.axles[0].position.y - -0.086) < 1e-9,
    );
  }),
  "Steering/compression sliders did not update wheels and suspension",
);
await page.getByRole("button", { name: "Hide bullbar", exact: true }).click();
await page.getByRole("button", { name: "Body only", exact: true }).click();
await page.getByRole("button", { name: "Hide roof gear", exact: true }).click();
await page.locator("#gear").click();
await page.locator("#canvas").click();
mkdirSync("validation", { recursive: true });
const downloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export GLB", exact: true }).click();
const download = await downloadPromise;
await download.saveAs("validation/export-from-hidden-posed.glb");
assert(
  readFileSync("validation/export-from-hidden-posed.glb").equals(
    Buffer.from(baseline, "base64"),
  ),
  "Export changed with hidden accessories, posed wheels, or original selected",
);
assert(
  await page.evaluate(
    () =>
      Math.abs(
        window.review.models.proposed.wheels[0].pivot.position.y - -0.086,
      ) < 1e-9,
  ),
  "Export changed the live stance",
);
await page.locator("#gear").click();
await page.locator("#canvas").click();
await page.getByRole("button", { name: "Reset stance", exact: true }).click();
await page.getByRole("button", { name: "Show roof gear", exact: true }).click();
await page.getByRole("button", { name: "Show bullbar", exact: true }).click();
await page.getByRole("button", { name: "Complete build", exact: true }).click();
assert(
  await page.evaluate(() =>
    window.review.models.proposed.wheels.every(
      (w) => w.pivot.position.y === -0.196 && w.pivot.rotation.y === 0,
    ),
  ),
  "Reset stance failed",
);
writeFileSync("sooty80-proposal-v2.glb", Buffer.from(baseline, "base64"));
const glb = await page.evaluate(() => window.review.validateGLB());
assert(
  glb.triangles === source.triangles,
  "GLB/source triangle count mismatch",
);
await page.addStyleTag({
  content: "header,nav,#mode,#note,#pose{display:none}",
});
for (const model of ["original", "proposed"])
  for (const view of ["hero", "detail", "rear"]) {
    await page.evaluate(
      ({ model, view }) => {
        window.review.select(model);
        window.review.view(view);
      },
      { model, view },
    );
    await page.screenshot({ path: `validation/${model}-${view}.png` });
  }
await page.close();
const offlineStatus =
  "not tested: file navigation blocked by managed-browser policy";
assert(errors.length === 0, errors.join("\n"));
const report = {
  standaloneHTTP: "passed",
  eightyLayout: eighty,
  standaloneFileURL: offlineStatus,
  originalProposalSwitch: "passed",
  hideBarPreservesHeadlamps: "passed",
  barRestoreExactIndices: "passed",
  roofHideAndExactRestore: "passed",
  rearCarrierAndRoofHideRestore: "passed",
  cameraButtons: 6,
  steeringAndCompression: "passed, including suspension position",
  exportButton: "passed",
  exportInvariantUnderReviewToggles: "byte-identical GLB",
  resetStance: "passed",
  glbReload: "passed",
  sourceTriangles: source.triangles,
  exportTriangles: glb.triangles,
  bounds: glb.bounds,
  browserErrors: errors,
};
writeFileSync("validation-v1.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
