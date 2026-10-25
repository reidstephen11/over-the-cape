import {
  buildPerentieBody,
  buildPerentieWheel,
} from "./src/render/perentieBody";
import { perentieTuning } from "./src/data/perentie";
const original = await import(
  `${process.env.PERENTIE_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/perentieBody.ts`
);
const a = original.buildPerentieBody(
  perentieTuning,
  original.buildPerentieWheel(perentieTuning),
);
const b = buildPerentieBody(perentieTuning, buildPerentieWheel(perentieTuning));
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
