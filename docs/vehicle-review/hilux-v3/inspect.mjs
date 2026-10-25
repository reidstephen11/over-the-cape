import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 860 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log(e.message);
});
await page.goto("http://127.0.0.1:5185/Hilux-review.html");
await page.waitForFunction(() => window.review?.ready, null, {
  timeout: 90000,
});
await page.addStyleTag({
  content: "header,nav,#mode,#note,#pose{display:none}",
});
const views = {
  "front-left": [[-5.4, 2.4, -6.8], [0, 0.35, 0], 38],
  "front-right": [[5.4, 2.4, -6.8], [0, 0.35, 0], 38],
  left: [[-8.6, 0.8, 0], [0, 0.35, 0], 38],
  right: [[8.6, 0.8, 0], [0, 0.35, 0], 38],
  "rear-left": [[-5, 2.5, 6.5], [0, 0.3, 0.3], 38],
  "rear-right": [[5, 2.5, 6.5], [0, 0.3, 0.3], 38],
  front: [[0, 0.7, -7], [0, 0.35, -0.3], 35],
  rear: [[0, 0.8, 7], [0, 0.35, 0.3], 35],
  top: [[0.01, 8, 0], [0, 0.2, 0], 38],
  underbody: [[-3, -3.5, 4], [0, -0.05, 0], 48],
  "front-joins": [[-2.8, 0.9, -4.6], [0, 0.3, -1.85], 34],
  "right-joins": [[2.8, 0.9, -4.6], [0, 0.3, -1.85], 34],
  "roof-seams": [[-2.7, 2.2, -2.9], [0, 0.9, -0.25], 38],
  "rear-lamps": [[2.1, 0.9, 4], [0.4, 0.25, 2.25], 36],
  "bed-floor": [[-2.4, 3.4, 3.4], [0, 0.4, 1.35], 42],
  "cab-interior": [[-2.7, 1.1, -0.3], [0, 0.65, -0.3], 42],
  "bonnet-uncovered": [[-2.4, 1.6, -4.3], [0, 0.5, -1.7], 38],
  "front-wheel-lock": [[-2.5, 0.18, -2.6], [-0.65, 0.1, -1.4], 45],
};
mkdirSync("inspection", { recursive: true });
for (const [name, [eye, target, fov]] of Object.entries(views)) {
  await page.evaluate(
    ({ name, eye, target, fov }) => {
      const r = window.review;
      r.select("proposed");
      r.inspection(name === "underbody");
      r.bar(name !== "bonnet-uncovered");
      for (const w of r.models.proposed.wheels) w.pivot.rotation.y = 0;
      if (name === "front-wheel-lock") {
        for (const w of r.models.proposed.wheels.slice(0, 2)) {
          w.pivot.rotation.y = (31 * Math.PI) / 180;
          w.pivot.position.y = -0.01;
        }
      } else
        for (const w of r.models.proposed.wheels) w.pivot.position.y = -0.12;
      r.models.proposed.suspension.update(
        r.models.proposed.wheels.map((w) => w.pivot.position.y),
      );
      r.setCamera(eye, target, fov);
    },
    { name, eye, target, fov },
  );
  await page.screenshot({ path: `inspection/${name}.png` });
  console.log("Inspected render:", name);
}
await page.evaluate(() => {
  const r = window.review;
  r.inspection(false);
  r.bar(true);
  for (const w of r.models.proposed.wheels) {
    w.pivot.rotation.y = 0;
    w.pivot.position.y = -0.12;
  }
  r.view("hero");
});
const bytes = await page.evaluate(async () => {
  const data = new Uint8Array(await window.review.exportModel());
  let s = "";
  for (let i = 0; i < data.length; i += 8192)
    s += String.fromCharCode(...data.subarray(i, i + 8192));
  return btoa(s);
});
writeFileSync("hilux-proposal-v3.glb", Buffer.from(bytes, "base64"));
writeFileSync(
  "inspection/render-log.json",
  JSON.stringify({ views: Object.keys(views), errors }, null, 2),
);
console.log("Export complete", errors);
await browser.close();
if (errors.length) process.exitCode = 1;
