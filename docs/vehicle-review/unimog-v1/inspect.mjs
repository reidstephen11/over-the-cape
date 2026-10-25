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
await page.goto("http://127.0.0.1:5221/Unimog-review.html");
await page.waitForFunction(() => window.review?.ready, null, {
  timeout: 90000,
});
await page.addStyleTag({
  content: "header,nav,#mode,#note,#pose{display:none}",
});
const views = {
  "front-left": [[-7.4, 3.6, -9.2], [0, 0.95, 0.25], 38],
  "front-right": [[7.4, 3.6, -9.2], [0, 0.95, 0.25], 38],
  left: [[-11.7, 1.8, 0.3], [0, 1, 0.3], 38],
  right: [[11.7, 1.8, 0.3], [0, 1, 0.3], 38],
  "rear-left": [[-7.2, 3.7, 9], [0, 1, 0.8], 38],
  "rear-right": [[7.2, 3.7, 9], [0, 1, 0.8], 38],
  front: [[0, 1.5, -10.5], [0, 1, 0.0], 35],
  rear: [[0, 1.8, 11], [0, 1, 0.5], 35],
  top: [[0.01, 12.5, 0.3], [0, 0.7, 0.3], 38],
  underbody: [[-4, -4.8, 5.7], [0, 0.0, 0.3], 48],
  "bumper-left": [[-3.4, 1.5, -5.6], [0, 0.62, -2.7], 36],
  "bumper-right": [[3.4, 1.5, -5.6], [0, 0.62, -2.7], 36],
  "grille-uncovered": [[0.01, 1.25, -5.8], [0, 0.8, -2.94], 35],
  "lamp-guards": [[1.8, 0.65, -4.6], [0.8, 0.38, -3.18], 34],
  "cab-hatch": [[-2.7, 4.2, -3.5], [-0.1, 1.95, -0.9], 40],
  "roof-uncovered": [[-3.8, 4.6, 4.8], [0, 1.65, 1.9], 42],
  "roof-gear": [[3.7, 5.2, 3.8], [0, 2.1, 1.9], 42],
  "rear-lamps": [[2.8, 1.4, 5.5], [0.5, 0.52, 3.3], 36],
  "rear-curtain": [[-3.5, 2.9, 5.8], [0, 1.6, 3.3], 38],
  "cab-interior": [[3.1, 2.0, -0.75], [0, 1.4, -0.85], 40],
  "front-lock-left": [[-3.7, 0.9, -3.3], [-0.93, 0.25, -1.925], 45],
  "front-lock-right": [[3.7, 0.9, -3.3], [0.93, 0.25, -1.925], 45],
  "side-spare": [[-4, 1.9, 1.0], [-1.05, 1.0, 0.9], 40],
  "rear-bump": [[3.8, 0.9, 3.0], [0.93, 0.24, 1.925], 45],
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
        r.gear(name !== "grille-uncovered");
        r.canvas(name !== "roof-uncovered");
        const compressed = name.includes("lock") || name === "rear-bump";
        r.pose(
          name === "front-lock-left"
            ? 33
            : name === "front-lock-right"
              ? -33
              : 0,
          compressed ? 200 : 0,
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
writeFileSync("unimog-proposal-v1.glb", Buffer.from(bytes, "base64"));
writeFileSync(
  "inspection/render-log.json",
  JSON.stringify({ views: Object.keys(views), browserErrors: errors }, null, 2),
);
await browser.close();
if (errors.length) throw Error(errors.join("\n"));
