/**
 * Dev helper: drive up to one of a run's surprises, watch it come down and get past it.
 * Reports the time and fuel it took from 120 m short to 12 m past, against the same stretch
 * driven without it at the route drive's bush pace.
 * Usage: npx vite-node scripts/surprise-drive.ts [seed or first-last] [shortie|camel|perentie] [event id]
 */
import { environmentFor } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { Autopilot } from '../src/sim/input/autopilot';
import { DT, WinchRecovery } from '../tests/helpers/drive';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebSurprises } from '../src/data/episodes/crebSurprises';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { addPuddles } from '../src/sim/world/puddles';
import { planSurprises } from '../src/sim/world/surprisePlan';
import { buildWorld } from '../src/sim/world/world';
import { approachStart, CRAWLED, getPast } from '../tests/helpers/surprises';

const [lo, hi] = (process.argv[2] ?? '1').split('-').map(Number);
const id = process.argv[3] ?? 'shortie';
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const only = process.argv[4];
const world = buildWorld(crebMap);
const env = environmentFor({ time: 'afternoon', weather: 'wet' });
addPuddles(world, env);
const R = await loadRapier();
for (let seed = lo; seed <= (hi ?? lo); seed++)
  for (const plan of planSurprises(world, crebSurprises, seed)) {
    const plans = planSurprises(world, crebSurprises, seed);
    if (only && plan.id !== only) continue;
    const sim = new Simulation(R, world, env);
    sim.addSurprises(plans);
    sim.fuelScale = crebEpisode.fuelScale;
    const r = await getPast(
      sim,
      plan,
      vehicles[id].tuning,
      (s) => (only ? console.log(`  ${s}`) : undefined),
      120,
      4.5,
      1000,
    );
    const fuel = 1000 - sim.vehicles.get('p')!.condition.fuel;
    const plain = plainDrive(plan.track, plan.at);
    console.log(
      `${String(seed).padStart(3)} ${plan.id.padEnd(30)} at ${plan.at.toFixed(0)} m: ${r.past ? 'past' : 'STUCK'} in ${r.time.toFixed(0)} s, started ${r.startedShort.toFixed(0)} m short, closest ${r.closest.toFixed(1)} m, winched ${r.winched}, ${fuel.toFixed(2)} L; without it ${plain.time.toFixed(0)} s, ${plain.fuel.toFixed(2)} L`,
    );
    sim.physics.free();
  }

/** The same stretch without the surprise, at the route drive's bush pace, winching out of bogs. */
function plainDrive(trackId: string, at: number) {
  const sim = new Simulation(R, world, env);
  sim.fuelScale = crebEpisode.fuelScale;
  const track = world.features.tracks.find((t) => t.def.id === trackId)!;
  const from = approachStart(world, track, at, 120);
  const start = trailPoint(track, from);
  const v = sim.addVehicle(
    'p',
    sim.poseAt(start.x, start.z, start.headingDeg, vehicles[id as 'shortie'].tuning.wheelRadius),
    vehicles[id as 'shortie'].tuning,
  );
  v.condition.fuel = 1000;
  const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
  for (let i = 0; i < 90; i++) sim.step(inputs, DT);
  const path: [number, number][] = [];
  for (let s = from; s <= Math.min(track.poly.length, at + 30); s += 0.5) {
    const p = trailPoint(track, s);
    path.push([p.x, p.z]);
  }
  // Crawling the range as the route drive does.
  const crawl = CRAWLED.has(trackId);
  const pilot = new Autopilot(path, crawl ? 1.2 : 4.5);
  if (crawl) {
    v.toggleRange();
    v.precisionCrawl = true;
    pilot.lowRange = true;
  }
  const recovery = new WinchRecovery(sim, v, path);
  let time = 0;
  let stuck = 0;
  for (; time < 400; time += DT) {
    if (trailProgress(track, v.position.x, v.position.z).along > at + 12) break;
    const cmd = pilot.input(v, DT);
    cmd.winchIn = recovery.update(DT);
    for (const axle of ['front', 'rear'] as const) {
      const want = crawl || stuck > 4;
      if (v.differentials[axle] !== want && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
    }
    if (stuck > 4 && v.drivetrain.range === 'high') {
      v.toggleRange();
      pilot.lowRange = true;
    }
    inputs.set('p', cmd);
    sim.step(inputs, DT);
    stuck = Math.abs(v.speed) < 0.3 ? stuck + DT : 0;
  }
  const fuel = 1000 - v.condition.fuel;
  sim.physics.free();
  return { time, fuel };
}
