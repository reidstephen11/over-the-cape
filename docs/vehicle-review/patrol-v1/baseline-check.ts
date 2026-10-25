import { buildPatrolBody, buildPatrolWheel } from "./src/render/patrolBody";
import { patrolTuning } from "./src/data/patrol";
const original = await import(
  `${process.env.PATROL_GAME_SOURCE ?? "/workspace/vehicle-review/over-the-cape-source"}/src/render/patrolBody.ts`
);
const a = original.buildPatrolBody(
  patrolTuning,
  original.buildPatrolWheel(patrolTuning),
);
const b = buildPatrolBody(patrolTuning, buildPatrolWheel(patrolTuning));
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
