import {
  buildHiluxBody as snapshotBody,
  buildHiluxWheel as snapshotWheel,
} from "./src/render/hiluxBody";
const { buildHiluxBody: gameBody, buildHiluxWheel: gameWheel } = await import(
  `${process.env.HILUX_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/hiluxBody.ts`
);
import { hiluxTuning } from "./src/data/hilux";
const before = gameBody(hiluxTuning, gameWheel(hiluxTuning));
const after = snapshotBody(hiluxTuning, snapshotWheel(hiluxTuning));
for (const name of [
  "position",
  "normal",
  "color",
  "uv",
  "materialSlot",
  "tag",
]) {
  const a = before.getAttribute(name).array,
    b = after.getAttribute(name).array;
  if (a.length !== b.length || a.some((x, i) => x !== b[i]))
    throw Error(`Comparison baseline changed: ${name}`);
}
console.log(
  "Comparison baseline: every rendered attribute is identical to the game model",
);
