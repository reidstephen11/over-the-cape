/**
 * Dev helper: park on the Lakefield road beside the stockman's bog, hook the winch to his
 * Land Cruiser and winch him out, reporting how far each vehicle moves and the pull.
 * Usage: npx vite-node scripts/rescue-lab.ts [vehicle] [clear|wet|rain]
 */
import { environmentAt, type Weather } from '../src/data/environment';
import { lakefieldEpisode } from '../src/data/episodes/lakefield';
import { lakefieldMap } from '../src/data/episodes/lakefieldMap';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { buildWorld } from '../src/sim/world/world';

const id = process.argv[2] ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const weather = (process.argv[3] ?? 'rain') as Weather;
const tuning = vehicles[id].tuning;
const rescue = lakefieldEpisode.rescue!;
const world = buildWorld(lakefieldMap);
const sim = new Simulation(await loadRapier(), world, environmentAt(14, weather));
const stuck = sim.addStuckVehicle(rescue);
// On the road, level with the bog, facing it.
const road = world.features.tracks.find((t) => t.def.id === 'lakefield-road')!;
let best = 0;
for (let k = 0; k < road.poly.count; k++)
  if (Math.abs(road.poly.zs[k] - rescue.z) < Math.abs(road.poly.zs[best] - rescue.z)) best = k;
const v = sim.addVehicle(
  'p',
  sim.poseAt(road.poly.xs[best], road.poly.zs[best] + 3, 75, tuning.wheelRadius),
  tuning,
);
const DT = 1 / 60;
const inputs = new Map([['p', { ...emptyInput(), brake: 1 }]]);
for (let i = 0; i < 120; i++) sim.step(inputs, DT);
const start = { ...v.body.translation() };
console.log(
  'wheels on',
  v.wheels.map((w) => world.terrain.surfaceAt(w.contactPoint.x, w.contactPoint.z)).join(','),
  'wetness',
  sim.env.wetness,
);
let freedAt = -1;
sim.events.on('rescued', () => (freedAt = sim.time));
const anchors = sim.findAnchors('p');
const a = anchors.find((x) => x.id.startsWith('stuck:'));
if (!a) throw new Error(`No anchor; ${anchors.length} others`);
sim.attachTo('p', a);
for (let t = 0; t < 40; t += DT) {
  inputs.set('p', { ...emptyInput(), winchIn: true });
  sim.step(inputs, DT);
  if (Math.round(t * 60) % 120 === 0) {
    const p = v.body.translation();
    console.log(
      `${t.toFixed(0).padStart(3)} s  pull ${(sim.toolsOf('p').winch.tension / 1000).toFixed(1)} kN  stockman ${stuck.moved.toFixed(2)} m sunk ${stuck.sinkNow().toFixed(2)}  us ${Math.hypot(p.x - start.x, p.z - start.z).toFixed(2)} m`,
    );
  }
  if (stuck.freed && freedAt > 0 && sim.time > freedAt + 2) break;
}
console.log(`${id} in ${weather}: ${stuck.freed ? `freed after ${freedAt.toFixed(1)} s` : 'NOT FREED'}`);
sim.physics.free();
