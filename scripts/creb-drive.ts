/**
 * Dev helper: drive the whole CREB Track episode route in one go with the autopilot and
 * report each leg. Usage: npx vite-node scripts/creb-drive.ts [shortie|camel|perentie|hilux|unimog] [clear|wet|rain|storm] [bypass] [chicken] [shortcut] [shallow]
 * (the last three take the other line at each fork; see src/data/episodes/crebForks.ts). 'storm' (the
 * default) is the episode's own weather: wet, with its afternoon storm following the clock.
 */
import { environmentFor, type Weather } from '../src/data/environment';
import { episodeWeatherAt } from '../src/data/weatherTimeline';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebForks } from '../src/data/episodes/crebForks';
import { clockTime } from '../src/data/episodes';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { buildWorld, campsite } from '../src/sim/world/world';
import { addPuddles } from '../src/sim/world/puddles';
import { prepareFlood } from '../src/sim/world/flood';
import { crawlStretches } from '../src/data/episodes/crebStretches';
import { PlankCrossing, pathFor, WinchRecovery } from '../tests/helpers/drive';

const id = process.argv[2] ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const weatherArg = process.argv[3] ?? 'storm';
const storm = weatherArg === 'storm' ? crebEpisode.storm : undefined;
const weather = (storm ? crebEpisode.weather : weatherArg) as Weather;
const bypass = process.argv.includes('bypass');
const forkArgs: Record<string, string> = {
  chicken: 'chicken-track',
  shortcut: 'steep-shortcut',
  shallow: 'shallow-crossing',
};
const forks = crebForks.filter((f) =>
  Object.entries(forkArgs).some(([a, id]) => id === f.id && process.argv.includes(a)),
);
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
const env = storm
  ? episodeWeatherAt(crebEpisode.startHour, weather, storm).env
  : environmentFor({ time: 'afternoon', weather });
// After rain the mud holes fill, as in the game.
addPuddles(world, env);
if (storm) prepareFlood(world, storm);
const sim = new Simulation(await loadRapier(), world, env);
const hourAt = (seconds: number) => crebEpisode.startHour + (seconds * crebEpisode.clockRate) / 3600;
/** The storm follows the clock, as in the game (every few game minutes). */
let weatherHour = -1;
const followStorm = (hour: number) => {
  if (!storm || Math.abs(hour - weatherHour) < 0.05) return;
  weatherHour = hour;
  const w = episodeWeatherAt(hour, weather, storm);
  sim.setWeather(w.env, w.creekRise, w.flowScale);
};
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
  // Taking the other line at a fork on this leg.
  for (const fork of forks.filter((f) => f.main === trackId)) {
    const alt = world.features.tracks.find((t) => t.def.id === fork.alt)!;
    const from = trailProgress(track, alt.poly.xs[0], alt.poly.zs[0]).along;
    const to = trailProgress(track, alt.poly.xs[alt.poly.count - 1], alt.poly.zs[alt.poly.count - 1]).along;
    path = [
      ...path.slice(0, Math.floor(from / 0.5)),
      ...pathFor(alt),
      ...path.slice(Math.ceil(to / 0.5) + 1),
    ];
  }
  const pilot = new Autopilot(path, mode === 'road' ? 9 : mode === 'bush' ? 4.5 : 1.2);
  const zones = crawlStretches[trackId] ?? [];
  let crawl = mode === 'crawl';
  if (crawl && v.drivetrain.range === 'high' && Math.abs(v.speed) < 5) v.toggleRange();
  if (!crawl && v.drivetrain.range === 'low' && Math.abs(v.speed) < 5) v.toggleRange();
  v.precisionCrawl = crawl;
  pilot.lowRange = crawl;
  pilot.holdLowOnClimbs = true;
  let time = 0;
  let tilt = 0;
  let tiltAt = '';
  let water = 0;
  let stuck = 0;
  const track4: { x: number; z: number }[] = [];
  // Bogged, the driver winches out to a tree ahead.
  const recovery = new WinchRecovery(sim, v, path);
  // Every plank gap on this leg: the ridge washout, and the ones cut across the roads.
  const gaps = world.map.gullies
    .map((g) => ({ g, at: trailProgress(track, g.x, g.z) }))
    .filter(
      (h) => h.at.distance < track.def.width / 2 + 2 && h.at.along > 8 && h.at.along < track.poly.length - 8,
    )
    .sort((a, b) => a.at.along - b.at.along)
    .map((h) => h.g);
  let gapAt = 0;
  // Armed from the start of the leg, so it can stop short. Creating it only once the
  // car is close lets a crawl fall into the cut before the boards go down.
  let planks: PlankCrossing | null = gaps.length ? new PlankCrossing(sim, v, gaps[0]) : null;
  for (; time < 900; time += DT) {
    followStorm(hourAt(total + time));
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
    if (planks) {
      cmd = planks.update(cmd, DT);
      if (planks.placed) {
        const at = trailProgress(track, gaps[gapAt].x, gaps[gapAt].z).along;
        const along = trailProgress(track, v.position.x, v.position.z).along;
        if (along > at + 8) {
          sim.recallPlanks(v.id);
          gapAt++;
          planks = gapAt < gaps.length ? new PlankCrossing(sim, v, gaps[gapAt]) : null;
        }
      }
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
  const startedAt = clockTime(hourAt(total));
  total += time;
  const q = v.body.rotation();
  const pitch = Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z)))) * deg;
  console.log(
    `${trackId.padEnd(22)} ${startedAt.padStart(8)} ${(1000 - v.condition.fuel).toFixed(1).padStart(5)} L ${pilot.done ? 'done ' : 'STUCK'} ${time.toFixed(0).padStart(4)} s  winched ${recovery.uses}  tilt ${tilt.toFixed(0)}° at ${tiltAt}  water ${water.toFixed(2)} m  ${pilot.done ? '' : `${pilot.remaining(v).toFixed(0)} m short at ${v.position.x.toFixed(0)},${v.position.z.toFixed(0)}, pitch ${pitch.toFixed(0)}°`}  flood ${v.condition.flood.stalled ? 'STALLED' : 'ok'}`,
  );
  if (!pilot.done) break;
}
console.log(
  `${id} in ${storm ? 'the storm' : weather}: ${(total / 60).toFixed(1)} min driving, ${(1000 - v.condition.fuel).toFixed(1)} L of fuel, arriving ${clockTime(hourAt(total))}${storm ? `, the creeks ${(sim.creeks.rise * 100).toFixed(0)} cm up` : ''}`,
);
sim.physics.free();
