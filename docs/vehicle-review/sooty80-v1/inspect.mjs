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
await page.goto("http://127.0.0.1:5261/Sooty80-review.html");
await page.waitForFunction(() => window.review?.ready, null, {
  timeout: 90000,
});
await page.addStyleTag({
  content: "header,nav,#mode,#note,#pose{display:none}",
});
const views = {
  "front-left": [[-5.6, 2.9, -7.0], [0, 0.65, 0.05], 38],
  "front-right": [[5.6, 2.9, -7.0], [0, 0.65, 0.05], 38],
  left: [[-9.1, 1.3, 0.1], [0, 0.65, 0.25], 38],
  right: [[9.1, 1.3, 0.1], [0, 0.65, 0.25], 38],
  "rear-left": [[-5.5, 2.9, 7.0], [0, 0.65, 0.2], 38],
  "rear-right": [[5.5, 2.9, 7.0], [0, 0.65, 0.2], 38],
  front: [[0, 1.0, -7.8], [0, 0.55, 0.0], 35],
  rear: [[0, 1.1, 8.2], [0, 0.65, 0.6], 35],
  top: [[0.01, 9.6, 0.3], [0, 0.4, 0.3], 38],
  underbody: [[-3.2, -3.8, 4.3], [0, 0, 0.3], 48],
  "bar-left": [[-2.8, 1.1, -4.8], [0, 0.46, -1.9], 34],
  "bar-right": [[2.8, 1.1, -4.8], [0, 0.46, -1.9], 34],
  "grille-uncovered": [[0.01, 0.85, -4.9], [0, 0.56, -2.1], 35],
  "bonnet-detail": [[-2.6, 2.0, -4.5], [0, 0.8, -1.5], 38],
  "roof-uncovered": [[-3.3, 3.7, -1.8], [0, 1.0, 1.0], 42],
  "roof-gear": [[3.1, 3.8, 2.5], [0, 1.65, 1.1], 42],
  "rack-feet": [[2.3, 2.0, 0.45], [0.68, 1.4, 0.45], 40],
  "rear-lamps": [[2.7, 1.0, 4.4], [0.15, 0.42, 2.47], 36],
  "rear-door": [[3, 1.7, 4.7], [0.1, 0.8, 2.47], 38],
  "rear-carrier-hidden": [[2.6, 1.5, 5.0], [0, 0.65, 2.47], 38],
  "cab-interior": [[2.6, 1.25, -0.25], [0, 0.8, -0.35], 38],
  "front-lock-left": [[-2.7, 0.45, -2.7], [-0.71, 0.12, -1.425], 45],
  "front-lock-right": [[2.7, 0.45, -2.7], [0.71, 0.12, -1.425], 45],
  "rear-bump": [[2.9, 0.55, 2.7], [0.7, 0.1, 1.425], 45],
  snorkel: [[2.5, 1.8, -2.2], [0.94, 1.12, -0.88], 34],
  "roof-lamps": [[0, 2.0, -3.4], [0, 1.53, -0.76], 35],
  "recovery-boards": [[-2.2, 3.0, 2.8], [0, 1.59, 1.12], 38],
  "scrub-rail-joins": [[2.7, 1.0, -2.5], [0.98, 0.35, -1.0], 36],
};
const selected = process.argv.slice(2);
mkdirSync("inspection", { recursive: true });
for (const [name, [eye, target, fov]] of Object.entries(views)) {
  if (selected.length && !selected.includes(name)) continue;
  await page.evaluate(
    ({ name, eye, target, fov }) => {
      const r = window.review;
      r.batch(() => {
        r.select("proposed");
        r.inspection(name === "underbody");
        r.bar(!name.includes("uncovered"));
        r.rack(name !== "roof-uncovered");
        r.gear(name !== "rear-carrier-hidden");
        r.canvas(name !== "roof-uncovered");
        const compressed = name.includes("lock") || name === "rear-bump";
        r.pose(
          name === "front-lock-left"
            ? 34
            : name === "front-lock-right"
              ? -34
              : 0,
          compressed ? 110 : 0,
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
writeFileSync("sooty80-proposal-v1.glb", Buffer.from(bytes, "base64"));
writeFileSync(
  "inspection/render-log.json",
  JSON.stringify(
    {
      views: Object.keys(views),
      browserErrors: errors,
      renderedThisRun: selected.length ? selected : Object.keys(views),
    },
    null,
    2,
  ),
);
await browser.close();
if (errors.length) throw Error(errors.join("\n"));
