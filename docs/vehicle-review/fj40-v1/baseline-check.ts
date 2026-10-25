import { buildVehicleBody, buildVehicleWheel } from "./src/render/fj40Body";
import { vehicleTuning } from "./src/data/vehicle";
const original = await import(
  `${process.env.FJ40_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/vehicleBody.ts`
);
const a = original.buildVehicleBody(
  vehicleTuning,
  (
    await import(
      `${process.env.FJ40_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/vehicleWheel.ts`
    )
  ).buildVehicleWheel(vehicleTuning),
);
const b = buildVehicleBody(vehicleTuning, buildVehicleWheel(vehicleTuning));
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
