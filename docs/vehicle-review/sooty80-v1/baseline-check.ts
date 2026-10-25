import { sooty80Tuning as t } from "./src/data/sooty80";
import { buildVehicleBody, buildVehicleWheel } from "./src/render/sooty80Base";
const g = buildVehicleBody(t, buildVehicleWheel(t));
const id = g.getAttribute("reviewPart");
if (!id || id.array.some((x: number) => (x & 7) !== 0))
  throw Error("Body study unexpectedly contains external touring equipment");
if (t.wheels[0].z !== -1.425 || t.wheels[2].z !== 1.425)
  throw Error("Wrong 80 Series wheelbase");
console.log(
  "New body-only comparison: correct 2.85 m wheelbase and no bullbar, roof equipment or rear carrier. No game-model baseline is claimed.",
);
