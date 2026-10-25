import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
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
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5211/Perentie-review.html");
await page.waitForFunction(() => window.review?.ready, null, {
  timeout: 90000,
});
await page.addStyleTag({
  content: "header,nav,#mode,#note,#pose{display:none}",
});
const views = {
  "front-left": [[-5.4, 2.4, -6.8], [0, 0.65, 0.25], 38],
  "front-right": [[5.4, 2.4, -6.8], [0, 0.65, 0.25], 38],
  left: [[-8.8, 1, 0], [0, 0.65, 0.25], 38],
  right: [[8.8, 1, 0], [0, 0.65, 0.25], 38],
  "rear-left": [[-5, 2.7, 6.8], [0, 0.75, 0.6], 38],
  "rear-right": [[5, 2.7, 6.8], [0, 0.75, 0.6], 38],
  front: [[0, 0.9, -7], [0, 0.5, -0.3], 35],
  rear: [[0, 1, 7.5], [0, 0.75, 0.6], 35],
  top: [[0.01, 8.5, 0], [0, 0.2, 0], 38],
  underbody: [[-3, -3.6, 4], [0, -0.05, 0], 48],
  "bar-left": [[-2.8, 0.9, -4.6], [0, 0.35, -1.65], 34],
  "bar-right": [[2.8, 0.9, -4.6], [0, 0.35, -1.65], 34],
  "grille-uncovered": [[0.01, 0.8, -4.8], [0, 0.34, -1.92], 35],
  "bonnet-uncovered": [[-2.4, 1.9, -4.4], [0, 0.7, -1.4], 38],
  "roof-uncovered": [[-2.7, 3.3, -2.2], [0, 1.15, 0.6], 42],
  "roof-gear": [[3.2, 3.8, 2.2], [0, 1.3, 0.7], 42],
  "rear-lamps": [[2.3, 1.1, 4.5], [0.4, 0.5, 2.3], 36],
  "rear-doors": [[-2.6, 1.9, 4.7], [0, 0.8, 2.3], 38],
  "cab-interior": [[2.5, 1.3, -0.3], [0, 0.85, -0.35], 38],
  "front-lock-left": [[-2.6, 0.4, -2.7], [-0.743, 0.1, -1.397], 45],
  "front-lock-right": [[2.6, 0.4, -2.7], [0.743, 0.1, -1.397], 45],
  "canvas-side": [[3.1, 1.7, 1.5], [0.6, 1.15, 1], 44],
  "bonnet-tools": [[-1.6, 2.1, -2.8], [0, 0.69, -1.4], 38],
  "rear-bump": [[2.8, 0.5, 2.7], [0.743, 0.1, 1.397], 45],
};
mkdirSync("inspection", { recursive: true });
for (const [name, [eye, target, fov]] of Object.entries(views)) {
  await page.evaluate(
    ({ name, eye, target, fov }) => {
      const r = window.review;
      r.batch(() => {
        r.select("proposed");
        r.inspection(name === "underbody");
        r.bar(!name.includes("uncovered"));
        r.rack(name !== "roof-uncovered");
        r.gear(name !== "bonnet-uncovered");
        r.canvas(name !== "roof-uncovered");
        const compressed = name.includes("lock") || name === "rear-bump";
        r.pose(
          name === "front-lock-left"
            ? 31
            : name === "front-lock-right"
              ? -31
              : 0,
          compressed ? 150 : 0,
        );
        r.setCamera(eye, target, fov);
      });
    },
    { name, eye, target, fov },
  );
  await page.screenshot({ path: `inspection/${name}.png` });
  console.log("Rendered", name);
}
await page.evaluate(() => {
  const r = window.review;
  r.bar(true);
  r.gear(true);
  r.canvas(true);
  r.rack(true);
  r.pose(0, 0);
  r.inspection(false);
  r.view("hero");
});
const bytes = await page.evaluate(async () => {
  const data = new Uint8Array(await window.review.exportModel());
  let s = "";
  for (let i = 0; i < data.length; i += 8192)
    s += String.fromCharCode(...data.subarray(i, i + 8192));
  return btoa(s);
});
writeFileSync("perentie-proposal-v1.glb", Buffer.from(bytes, "base64"));
writeFileSync(
  "inspection/render-log.json",
  JSON.stringify({ views: Object.keys(views), browserErrors: errors }, null, 2),
);
await browser.close();
if (errors.length) throw Error(errors.join("\n"));
