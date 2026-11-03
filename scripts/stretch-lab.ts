/** Dev probe: the stretch test's drive with a log. npx vite-node scripts/stretch-lab.ts <track> <from> <to> [vehicle id] [stopAt] */
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { vehicleTuning, type VehicleId } from '../src/data/vehicle';
import { vehicles } from '../src/data/vehicles';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { Autopilot } from '../src/sim/input/autopilot';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { buildWorld } from '../src/sim/world/world';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { DT } from '../tests/helpers/drive';

const trackId = process.argv[2];
const from = Number(process.argv[3]);
const to = Number(process.argv[4]);
const tuning =
  process.argv[5] && process.argv[5] !== '-' ? vehicles[process.argv[5] as VehicleId].tuning : vehicleTuning;
const stopAt = process.argv[6] !== undefined ? Number(process.argv[6]) : undefined;
const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const sim = new Simulation(await loadRapier(), world, wet);
sim.damage = 'realistic';
const track = world.features.tracks.find((t) => t.def.id === trackId)!;
const start = trailPoint(track, from);
const v = sim.addVehicle(
  'p',
  sim.poseAt(start.x, start.z, start.headingDeg + (to < from ? 180 : 0), tuning.wheelRadius),
  tuning,
);
const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
for (let i = 0; i < 90; i++) sim.step(inputs, DT);
v.toggleRange();
v.precisionCrawl = true;
const path: [number, number][] = [];
const step = to > from ? 0.5 : -0.5;
for (let s = from; step > 0 ? s <= to : s >= to; s += step) {
  const p = trailPoint(track, s);
  path.push([p.x, p.z]);
}
const pilot = new Autopilot(path, 0.7);
pilot.lowRange = true;
let [time, stopped, last] = [0, 0, -1];
const t = world.terrain;
for (let n = 0; time < 120; time += DT, n++) {
  const command = pilot.input(v, DT);
  if (pilot.done) break;
  command.throttle = 1;
  command.brake = 0;
  const along = trailProgress(track, v.position.x, v.position.z).along;
  if (stopAt !== undefined && stopped < 20 && Math.abs(along - stopAt) < 1) {
    Object.assign(command, { throttle: 0, brake: 1, steer: 0 });
    stopped += DT;
  }
  for (const axle of ['front', 'rear'] as const)
    if (v.differentials[axle] !== true && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
  inputs.set('p', command);
  sim.step(inputs, DT);
  if (Math.floor(time) !== last) {
    last = Math.floor(time);
    const near = trailProgress(track, v.position.x, v.position.z);
    const ws = v.wheels.map((w) => `${w.surface}/${w.water.toFixed(2)}`);
    console.log(
      `t=${time.toFixed(0).padStart(3)} along=${near.along.toFixed(1)} dev=${near.distance.toFixed(2)} x=${v.position.x.toFixed(1)} z=${v.position.z.toFixed(1)} v=${v.speed.toFixed(2)} afloat=${v.afloat.toFixed(2)} swept=${v.swept.toFixed(1)} cur=${v.current.x.toFixed(2)},${v.current.z.toFixed(2)} h=${t.heightAt(v.position.x, v.position.z).toFixed(2)} stopped=${stopped.toFixed(0)} wheels(surf/water)=${ws.join(' ')}`,
    );
  }
}
console.log(
  trackId,
  tuning.id,
  'done',
  pilot.done,
  'remaining',
  pilot.remaining(v).toFixed(1),
  'deviation max?',
  'swept',
  v.swept.toFixed(1),
  'flooded',
  v.condition.flood.stalled,
);
sim.physics.free();
