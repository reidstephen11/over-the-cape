import { buildVehicleBody, buildVehicleWheel } from "./src/render/camelBody";
import { camelTuning as tuning } from "./src/data/camel";
const original = await import(
  `${process.env.CAMEL_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/vehicleLooks.ts`
);
const a = original.vehicleLooks.camel.body(
  tuning,
  original.vehicleLooks.camel.wheel(tuning),
);
const b = buildVehicleBody(tuning, buildVehicleWheel(tuning));
for (const name of [
  "position",
  "normal",
  "color",
  "uv",
  "materialSlot",
  "tag",
]) {
  const x = a.getAttribute(name).array,
    y = b.getAttribute(name).array;
  if (x.length !== y.length || x.some((v: number, i: number) => v !== y[i]))
    throw Error(`Changed baseline: ${name}`);
}
console.log(
  "Every Camel baseline render attribute matches the untouched game.",
);
