/**
 * Dev helper: drive the whole CREB Track episode route in one go with the autopilot and
 * report each leg. Usage: npx vite-node scripts/creb-drive.ts [shortie|camel|perentie] [clear|wet|rain] [bypass]
 */
import { environmentFor, type Weather } from '../src/data/environment';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebEpisode } from '../src/data/episodes/creb';
import { clockTime } from '../src/data/episodes';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { trailPoint } from '../src/sim/world/crawlTrail';
import { buildWorld, campsite } from '../src/sim/world/world';
import { addPuddles } from '../src/sim/world/puddles';
import { crawlStretches, crebWashout } from '../src/data/episodes/crebStretches';
import { trailProgress } from '../src/sim/world/crawlTrail';
import { PlankCrossing, WinchRecovery } from '../tests/helpers/drive';

const id = process.argv[2] ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const weather = (process.argv[3] ?? 'wet') as Weather;
const bypass = process.argv.includes('bypass');
const tuning = vehicles[id].tuning;
const DT = 1 / 60;
const deg = 180 / Math.PI;

type Mode = 'road' | 'bush' | 'crawl';
const legs: [string, Mode][] = [
  ['upper-daintree-road', 'road'],
  ['daintree-crossing', 'crawl'],
  ['paddock-road', 'road'],
  [bypass ? 'big-red-bypass' : 'big-red', 'crawl'],
  // On wet clay its steep pitch past the ridge needs low range and the lockers.
  ['creb-ridge', 'crawl'],
  // Through Roaring Meg's fast ford and up its slippery far bank.
  ['roaring-meg-climb', 'crawl'],
  ['bobs-hill', 'crawl'],
  ['range-top', 'bush'],
  ['concrete-descent', 'crawl'],
  ['donovans-creek', 'bush'],
  ['bloomfield-bridge', 'bush'],
  ['bloomfield-track', 'road'],
];

const world = buildWorld(crebMap);
const env = environmentFor({ time: 'afternoon', weather });
// After rain the mud holes fill, as in the game.
addPuddles(world, env);
const sim = new Simulation(await loadRapier(), world, env);
// The fallen tree is winched aside in play; here it is moved out of the way.
for (const d of sim.dynamics.values())
  if (d.kind === 'fallenTree') d.body.setTranslation({ x: 0, y: -500, z: 0 }, true);
const camp = campsite(world, crebMap.spawnCampsite);
const v = sim.addVehicle('p', sim.campsitePose(camp.id, tuning.wheelRadius), tuning);
// Burn fuel as the episode does, from a tank too big to run dry, to measure the trip.
sim.fuelScale = crebEpisode.fuelScale;
v.condition.fuel = 1000;
const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
for (let i = 0; i < 90; i++) sim.step(inputs, DT);

let total = 0;
for (const [trackId, mode] of legs) {
  const track = world.features.tracks.find((t) => t.def.id === trackId)!;
  let path = Array.from({ length: Math.ceil(track.poly.length / 0.5) + 1 }, (_, i) => {
    const p = trailPoint(track, Math.min(track.poly.length, i * 0.5));
    return [p.x, p.z] as [number, number];
  });
  // Taking the bypass, leave the paddock road where the bypass branches off it.
  if (bypass && trackId === 'paddock-road') {
    const b = world.features.tracks.find((t) => t.def.id === 'big-red-bypass')!;
    const [bx, bz] = [b.poly.xs[0], b.poly.zs[0]];
    let cut = path.length - 1;
    path.forEach((q, k) => {
      if (Math.hypot(q[0] - bx, q[1] - bz) < Math.hypot(path[cut][0] - bx, path[cut][1] - bz)) cut = k;
    });
    path = path.slice(0, cut + 1);
  }
  const pilot = new Autopilot(path, mode === 'road' ? 9 : mode === 'bush' ? 4.5 : 1.2);
  const zones = crawlStretches[trackId] ?? [];
  let crawl = mode === 'crawl';
  if (crawl && v.drivetrain.range === 'high' && Math.abs(v.speed) < 5) v.toggleRange();
  if (!crawl && v.drivetrain.range === 'low' && Math.abs(v.speed) < 5) v.toggleRange();
  v.precisionCrawl = crawl;
  pilot.lowRange = crawl;
  let time = 0;
  let tilt = 0;
  let tiltAt = '';
  let water = 0;
  let stuck = 0;
  // Bogged, the driver winches out to a tree ahead.
  const recovery = new WinchRecovery(sim, v, path);
  // The washout on the ridge is bridged with the planks.
  const planks = trackId === 'creb-ridge' ? new PlankCrossing(sim, v, crebWashout) : null;
  for (; time < 900; time += DT) {
    // Slow right down for the creeks and the like, and crawl through them in low range.
    if (zones.length) {
      const at = trailProgress(track, v.position.x, v.position.z).along;
      const near = zones.some(([a, b]) => at > a - 25 && at < b);
      const inside = zones.some(([a, b]) => at > a - 4 && at < b);
      pilot.targetSpeed = near ? 1.2 : 9;
      if (inside !== crawl && Math.abs(v.speed) < 4) {
        crawl = inside;
        if (crawl !== (v.drivetrain.range === 'low')) v.toggleRange();
        v.precisionCrawl = crawl;
        pilot.lowRange = crawl;
      }
    }
    let cmd = pilot.input(v, DT);
    if (pilot.done) break;
    cmd.winchIn = recovery.update(DT);
    if (crawl) {
      cmd.throttle = 1;
      cmd.brake = 0;
    }
    if (planks) cmd = planks.update(cmd, DT);
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
    stuck = Math.abs(v.speed) < 0.3 ? stuck + DT : 0;
    if (stuck > 25) break;
  }
  total += time;
  const q = v.body.rotation();
  const pitch = Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z)))) * deg;
  console.log(
    `${trackId.padEnd(22)} ${(1000 - v.condition.fuel).toFixed(1).padStart(5)} L ${pilot.done ? 'done ' : 'STUCK'} ${time.toFixed(0).padStart(4)} s  winched ${recovery.uses}  tilt ${tilt.toFixed(0)}° at ${tiltAt}  water ${water.toFixed(2)} m  ${pilot.done ? '' : `${pilot.remaining(v).toFixed(0)} m short, pitch ${pitch.toFixed(0)}°`}  flood ${v.condition.flood.stalled ? 'STALLED' : 'ok'}`,
  );
  if (!pilot.done) break;
}
console.log(
  `${id} in ${weather}: ${(total / 60).toFixed(1)} min driving, ${(1000 - v.condition.fuel).toFixed(1)} L of fuel, arriving ${clockTime(crebEpisode.startHour + (total * crebEpisode.clockRate) / 3600)}`,
);
sim.physics.free();
