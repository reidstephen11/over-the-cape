/**
 * Dev helper: drive the whole Lakefield episode route in one go with the autopilot, stopping
 * to winch the stockman out on the way, and report each leg. The clock and the weather run
 * as in the episode, so the rivers rise as they would.
 * Usage: npx vite-node scripts/lakefield-drive.ts [vehicle]
 */
import { lakefieldEpisode as E } from '../src/data/episodes/lakefield';
import { lakefieldMap } from '../src/data/episodes/lakefieldMap';
import { clockTime } from '../src/data/episodes';
import { episodeWeatherAt } from '../src/data/weatherTimeline';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { trailProgress } from '../src/sim/world/crawlTrail';
import { prepareFlood } from '../src/sim/world/flood';
import { addPuddles } from '../src/sim/world/puddles';
import { buildWorld, campsite } from '../src/sim/world/world';
import { pathFor, WinchRecovery } from '../tests/helpers/drive';

const id = process.argv[2] ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const tuning = vehicles[id].tuning;
const DT = 1 / 60;
const rescue = E.rescue!;

type Mode = 'road' | 'bush';
const legs: [string, Mode][] = [
  ['laura-road', 'road'],
  ['laura-river-crossing', 'bush'],
  ['old-laura-road', 'road'],
  ['plains-road', 'road'],
  ['lakefield-road', 'road'],
  ['hann-crossing', 'bush'],
  ['musgrave-road', 'road'],
];

const world = buildWorld(lakefieldMap);
let hour = E.startHour;
const weather = () => episodeWeatherAt(hour, E.weather, E.storm);
addPuddles(world, weather().env);
prepareFlood(world, E.storm!);
const sim = new Simulation(await loadRapier(), world, weather().env);
const stuck = sim.addStuckVehicle(rescue);
const camp = campsite(world, lakefieldMap.spawnCampsite);
const v = sim.addVehicle('p', sim.campsitePose(camp.id, tuning.wheelRadius), tuning);
sim.fuelScale = E.fuelScale;
v.condition.fuel = 1000;
const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
const step = () => {
  sim.step(inputs, DT);
  hour += (DT * E.clockRate) / 3600;
  if (Math.round(hour * 3600) % 60 < 20) {
    const w = weather();
    sim.setWeather(w.env, w.creekRise, w.flowScale);
  }
};
for (let i = 0; i < 90; i++) step();

let total = 0;
for (const [trackId, mode] of legs) {
  const track = world.features.tracks.find((t) => t.def.id === trackId)!;
  const path = pathFor(track);
  const base = mode === 'road' ? 9 : 4.5;
  const pilot = new Autopilot(path, base);
  pilot.holdLowOnClimbs = true;
  const recovery = new WinchRecovery(sim, v, path);
  // The stockman: stop on the road level with him and winch him out.
  const bogAlong = trailProgress(track, rescue.x, rescue.z);
  let rescueTime = 0;
  let time = 0;
  let water = 0;
  let stuckFor = 0;
  const last: { x: number; z: number }[] = [];
  for (; time < 1200; time += DT) {
    const at = trailProgress(track, v.position.x, v.position.z).along;
    if (!stuck.freed && bogAlong.distance < 40 && at > bogAlong.along - 6) {
      // Stop, hook on and winch.
      const t0 = sim.time;
      inputs.set('p', { ...emptyInput(), brake: 1 });
      for (let i = 0; i < 120; i++) step();
      const a = sim.findAnchors('p').find((x) => x.id === `stuck:${rescue.id}`);
      if (!a) throw new Error('The stockman is out of reach');
      sim.attachTo('p', a);
      for (let i = 0; i < 60 * 60 && !stuck.freed; i++) {
        inputs.set('p', { ...emptyInput(), winchIn: true });
        step();
      }
      // Time to stop, get out, hook on and back in: about a minute.
      rescueTime = sim.time - t0 + 60;
      hour += (60 * E.clockRate) / 3600;
      console.log(
        `  stockman ${stuck.freed ? 'out' : 'STILL BOGGED'} after ${rescueTime.toFixed(0)} s at ${clockTime(hour)}`,
      );
    }
    const cmd = pilot.input(v, DT);
    if (pilot.done) break;
    cmd.winchIn = recovery.update(DT);
    for (const axle of ['front', 'rear'] as const) {
      const want = stuckFor > 4;
      if (v.differentials[axle] !== want && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
    }
    inputs.set('p', cmd);
    step();
    for (const w of v.wheels) water = Math.max(water, w.water);
    last.push({ x: v.position.x, z: v.position.z });
    if (last.length > 240) last.shift();
    stuckFor = Math.hypot(v.position.x - last[0].x, v.position.z - last[0].z) < 0.5 ? stuckFor + DT : 0;
    if (stuckFor > 25) break;
  }
  total += time + rescueTime;
  console.log(
    `${trackId.padEnd(22)} ${(1000 - v.condition.fuel).toFixed(1).padStart(5)} L ${pilot.done ? 'done ' : 'STUCK'} ${time.toFixed(0).padStart(4)} s  winched ${recovery.uses}  water ${water.toFixed(2)} m  at ${clockTime(hour)}  rise ${weather().creekRise.toFixed(2)} m${pilot.done ? '' : `  ${pilot.remaining(v).toFixed(0)} m short`}`,
  );
  if (!pilot.done) break;
}
console.log(
  `${id}: ${(total / 60).toFixed(1)} min driving, ${(1000 - v.condition.fuel).toFixed(1)} L, arriving ${clockTime(hour)}`,
);
sim.physics.free();
