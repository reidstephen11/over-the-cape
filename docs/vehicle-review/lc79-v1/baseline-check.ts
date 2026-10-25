import { buildLc79Body, buildLc79Wheel } from "./src/render/lc79Body";
import { lc79Tuning } from "./src/data/lc79";
const original = await import(
  `${process.env.LC79_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/lc79Body.ts`
);
const a = original.buildLc79Body(
  lc79Tuning,
  original.buildLc79Wheel(lc79Tuning),
);
const b = buildLc79Body(lc79Tuning, buildLc79Wheel(lc79Tuning));
for (const key of [
  "position",
  "normal",
  "color",
  "uv",
  "materialSlot",
  "tag",
]) {
  const x = a.getAttribute(key).array,
    y = b.getAttribute(key).array;
  if (x.length !== y.length || x.some((v: number, i: number) => v !== y[i]))
    throw Error(`Changed baseline: ${key}`);
}
console.log("Every baseline render attribute matches the untouched game.");
