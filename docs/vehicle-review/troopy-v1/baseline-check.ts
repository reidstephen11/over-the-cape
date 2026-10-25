import { buildTroopyBody, buildTroopyWheel } from "./src/render/troopyBody";
import { troopyTuning } from "./src/data/troopy";
const original = await import(
  `${process.env.TROOPY_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/troopyBody.ts`
);
const a = original.buildTroopyBody(
  troopyTuning,
  original.buildTroopyWheel(troopyTuning),
);
const b = buildTroopyBody(troopyTuning, buildTroopyWheel(troopyTuning));
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
