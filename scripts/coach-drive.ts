/**
 * Drive the compact range chapter and report each leg.
 * Usage: npx vite-node scripts/coach-drive.ts [vehicle] [clear|wet|rain] [oldcoach|bypass] [eastern]
 */
import { environmentAt, isWeather } from '../src/data/environment';
import { coachMap } from '../src/data/episodes/coachMap';
import { coachEpisode } from '../src/data/episodes/coach';
import { applyCheckpoint, startCheckpoint } from '../src/sim/episode';
import { clockTime } from '../src/data/episodes';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { buildWorld, campsite } from '../src/sim/world/world';
import { pathFor, WinchRecovery } from '../tests/helpers/drive';

const id = process.argv[2] ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const weather = isWeather(process.argv[3]) ? process.argv[3] : coachEpisode.weather;
const has = (a: string) => process.argv.includes(a);
const tuning = vehicles[id].tuning;
const DT = 1 / 60;
const deg = 180 / Math.PI;

type Mode = 'road' | 'ridge' | 'crawl';
const legs: [string, Mode][] = [
  ['range-foot', 'road'],
  [
    has('oldcoach') ? 'climb-old-coach' : has('bypass') ? 'climb-bypass' : 'climb-middle',
    has('bypass') && !has('oldcoach') ? 'road' : 'crawl',
  ],
  ['range-top-south', 'ridge'],
  [has('eastern') ? 'east-bypass' : 'big-step-line', has('eastern') ? 'road' : 'crawl'],
  ['range-top-north', 'ridge'],
  ['range-descent', 'crawl'],
  ['range-exit-road', 'road'],
];

const world = buildWorld(coachMap);
const env = environmentAt(coachEpisode.startHour, weather);
const sim = new Simulation(await loadRapier(), world, env);
const camp = campsite(world, coachMap.spawnCampsite);
const v = sim.addVehicle('p', sim.campsitePose(camp.id, tuning.wheelRadius), tuning);
// Start with the actual episode load, so a run cannot hide a fuel problem.
sim.fuelScale = coachEpisode.fuelScale;
applyCheckpoint(v, startCheckpoint(coachEpisode, camp.id, id));
const startingFuel = v.condition.fuel;
sim.damage = 'realistic';
const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
for (let i = 0; i < 90; i++) sim.step(inputs, DT);

let total = 0;
let complete = true;
for (const [trackId, mode] of legs) {
  const track = world.features.tracks.find((t) => t.def.id === trackId)!;
  const path = pathFor(track);
  const base = mode === 'road' ? 4.5 : mode === 'ridge' ? 2.5 : 1.2;
  const pilot = new Autopilot(path, base);
  const crawl = mode === 'crawl';
  inputs.set('p', { ...emptyInput(), brake: 1, handbrake: true });
  for (let i = 0; i < 90; i++) sim.step(inputs, DT);
  total += 90 * DT;
  if (v.drivetrain.range === 'high') v.toggleRange();
  v.precisionCrawl = crawl;
  pilot.lowRange = true;
  pilot.holdLowOnClimbs = true;
  let time = 0;
  let tilt = 0;
  let tiltAt = '';
  let water = 0;
  let stuck = 0;
  const track4: { x: number; z: number }[] = [];
  const recovery = new WinchRecovery(sim, v, path);
  for (; time < 900; time += DT) {
    const cmd = pilot.input(v, DT);
    if (pilot.done) break;
    cmd.winchIn = recovery.update(DT);
    if (crawl) {
      cmd.throttle = 1;
      cmd.brake = 0;
    }
    for (const axle of ['front', 'rear'] as const) {
      if (!v.differentials[axle] && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
    }
    inputs.set('p', cmd);
    sim.step(inputs, DT);
    if (v.tiltDeg() > tilt) {
      tilt = v.tiltDeg();
      tiltAt = `${v.position.x.toFixed(0)},${v.position.z.toFixed(0)}`;
    }
    for (const w of v.wheels) water = Math.max(water, w.water);
    // Stuck: under half a metre of progress in the last 4 s (rocking on the spot counts).
    track4.push({ x: v.position.x, z: v.position.z });
    if (track4.length > 240) track4.shift();
    const ago = track4[0];
    stuck = Math.hypot(v.position.x - ago.x, v.position.z - ago.z) < 0.5 ? stuck + DT : 0;
    if (stuck > 25) break;
  }
  total += time;
  const q = v.body.rotation();
  const pitch = Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z)))) * deg;
  console.log(
    `${trackId.padEnd(22)} ${(startingFuel - v.condition.fuel).toFixed(1).padStart(5)} L ${pilot.done ? 'done ' : 'STUCK'} ${time.toFixed(0).padStart(4)} s  winched ${recovery.uses}  tilt ${tilt.toFixed(0)}° at ${tiltAt}  water ${water.toFixed(2)} m  ${pilot.done ? '' : `${pilot.remaining(v).toFixed(0)} m short, pitch ${pitch.toFixed(0)}°`}`,
  );
  if (!pilot.done) {
    complete = false;
    break;
  }
}
console.log(
  `${id} in ${weather}: ${(total / 60).toFixed(1)} min driving, ${(startingFuel - v.condition.fuel).toFixed(1)} L of fuel, arriving ${clockTime(coachEpisode.startHour + (total * coachEpisode.clockRate) / 3600)}`,
);
const goal = world.pois.find((p) => p.id === coachEpisode.goal)!;
const arrived = Math.hypot(v.position.x - goal.x, v.position.z - goal.z) < goal.radius;
console.log(`Goal reached: ${arrived}, fuel left: ${v.condition.fuel.toFixed(1)} L`);
sim.physics.free();
if (!complete || !arrived || v.condition.fuel <= 0) process.exitCode = 1;
