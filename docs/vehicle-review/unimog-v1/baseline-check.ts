import { buildUnimogBody, buildUnimogWheel } from "./src/render/unimogBody";
import { unimogTuning } from "./src/data/unimog";
const original = await import(
  `${process.env.UNIMOG_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/unimogBody.ts`
);
const a = original.buildUnimogBody(
  unimogTuning,
  original.buildUnimogWheel(unimogTuning),
);
const b = buildUnimogBody(unimogTuning, buildUnimogWheel(unimogTuning));
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
