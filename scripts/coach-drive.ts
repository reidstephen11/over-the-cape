/**
 * Dev helper: drive the whole Old Coach Road episode route in one go with the autopilot and
 * report each leg. Usage: npx vite-node scripts/coach-drive.ts [vehicle] [clear|wet|rain] [rocky] [oldcoach|bypass] [eastern]
 * (the last three take the other lines at the North Palmer, up the range and at the big step)
 */
import { environmentAt, type Weather } from '../src/data/environment';
import { coachMap } from '../src/data/episodes/coachMap';
import { coachEpisode } from '../src/data/episodes/coach';
import { clockTime } from '../src/data/episodes';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { trailProgress } from '../src/sim/world/crawlTrail';
import { buildWorld, campsite } from '../src/sim/world/world';
import { pathFor, WinchRecovery } from '../tests/helpers/drive';

const id = process.argv[2] ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const weather = (process.argv[3] ?? coachEpisode.weather) as Weather;
const has = (a: string) => process.argv.includes(a);
const tuning = vehicles[id].tuning;
const DT = 1 / 60;
const deg = 180 / Math.PI;

type Mode = 'road' | 'bush' | 'crawl';
const legs: [string, Mode][] = [
  ['palmer-camp-road', 'bush'],
  ['palmer-crossing', 'bush'],
  ['maytown-road', 'bush'],
  ['coach-road-south', 'road'],
  [has('rocky') ? 'north-palmer-rocky' : 'north-palmer-sand', 'bush'],
  ['range-foot', 'road'],
  [has('oldcoach') ? 'climb-old-coach' : has('bypass') ? 'climb-bypass' : 'climb-middle', 'crawl'],
  ['range-top-south', 'bush'],
  [has('eastern') ? 'east-bypass' : 'big-step-line', has('eastern') ? 'bush' : 'crawl'],
  ['range-top-north', 'bush'],
  ['range-descent', 'crawl'],
  ['coach-road-north', 'road'],
  ['little-laura-crossing', 'bush'],
  ['laura-road', 'road'],
];
/** Stretches of a road leg (metres along) to take slowly: the sandy creek beds. */
const slow: Record<string, ReadonlyArray<readonly [number, number]>> = {
  'coach-road-north': coachMap.tracks.find((t) => t.id === 'coach-road-north')?.sand ?? [],
};

const world = buildWorld(coachMap);
const env = environmentAt(coachEpisode.startHour, weather);
const sim = new Simulation(await loadRapier(), world, env);
const camp = campsite(world, coachMap.spawnCampsite);
const v = sim.addVehicle('p', sim.campsitePose(camp.id, tuning.wheelRadius), tuning);
// Burn fuel as the episode does, from a tank too big to run dry, to measure the trip.
sim.fuelScale = coachEpisode.fuelScale;
v.condition.fuel = 1000;
const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
for (let i = 0; i < 90; i++) sim.step(inputs, DT);

let total = 0;
for (const [trackId, mode] of legs) {
  const track = world.features.tracks.find((t) => t.def.id === trackId)!;
  const path = pathFor(track);
  const base = mode === 'road' ? 9 : mode === 'bush' ? 4.5 : 1.2;
  const pilot = new Autopilot(path, base);
  const crawl = mode === 'crawl';
  if (crawl && v.drivetrain.range === 'high' && Math.abs(v.speed) < 5) v.toggleRange();
  if (!crawl && v.drivetrain.range === 'low' && Math.abs(v.speed) < 5) v.toggleRange();
  v.precisionCrawl = crawl;
  pilot.lowRange = crawl;
  pilot.holdLowOnClimbs = true;
  const zones = slow[trackId] ?? [];
  let time = 0;
  let tilt = 0;
  let tiltAt = '';
  let water = 0;
  let stuck = 0;
  const track4: { x: number; z: number }[] = [];
  const recovery = new WinchRecovery(sim, v, path);
  for (; time < 900; time += DT) {
    if (zones.length) {
      const at = trailProgress(track, v.position.x, v.position.z).along;
      pilot.targetSpeed = zones.some(([a, b]) => at > a - 30 && at < b) ? 4.5 : base;
    }
    const cmd = pilot.input(v, DT);
    if (pilot.done) break;
    cmd.winchIn = recovery.update(DT);
    if (crawl) {
      cmd.throttle = 1;
      cmd.brake = 0;
    }
    for (const axle of ['front', 'rear'] as const) {
      const want = crawl || stuck > 4;
      if (v.differentials[axle] !== want && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
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
    `${trackId.padEnd(22)} ${(1000 - v.condition.fuel).toFixed(1).padStart(5)} L ${pilot.done ? 'done ' : 'STUCK'} ${time.toFixed(0).padStart(4)} s  winched ${recovery.uses}  tilt ${tilt.toFixed(0)}° at ${tiltAt}  water ${water.toFixed(2)} m  ${pilot.done ? '' : `${pilot.remaining(v).toFixed(0)} m short, pitch ${pitch.toFixed(0)}°`}`,
  );
  if (!pilot.done) break;
}
console.log(
  `${id} in ${weather}: ${(total / 60).toFixed(1)} min driving, ${(1000 - v.condition.fuel).toFixed(1)} L of fuel, arriving ${clockTime(coachEpisode.startHour + (total * coachEpisode.clockRate) / 3600)}`,
);
sim.physics.free();
