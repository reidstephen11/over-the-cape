/**
 * Dev helper: drive both lines of each fork on the CREB with the autopilot and compare
 * them: time, fuel, winching, cut tyres and the deepest water. Each run starts 40 m before
 * the fork on the main route and ends 30 m past where the lines meet again.
 * Usage: npx vite-node scripts/fork-drive.ts [fork id|all] [shortie|camel|perentie] [crawl|open|bush|road] [clear|wet|rain]
 */
import { environmentFor, type Weather } from '../src/data/environment';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebForks } from '../src/data/episodes/crebForks';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { buildWorld } from '../src/sim/world/world';
import { addPuddles } from '../src/sim/world/puddles';
import { forkPaths, WinchRecovery } from '../tests/helpers/drive';

const [which = 'all', id = 'shortie', style = 'crawl', weather = 'wet'] = process.argv.slice(2);
if (!isVehicleId(id)) throw new Error(`Unknown vehicle ${id}`);
const tuning = vehicles[id].tuning;
const DT = 1 / 60;
const speeds: Record<string, number> = { crawl: 1.2, open: 1.2, bush: 4.5, road: 9 };

const world = buildWorld(crebMap);
const env = environmentFor({ time: 'afternoon', weather: weather as Weather });
addPuddles(world, env);
// BASELINE=1 drives the main lines on the map without the forks, to see what they changed.
const baseline = process.env.BASELINE === '1';
const driven = baseline
  ? buildWorld({ ...crebMap, tracks: crebMap.tracks.filter((t) => !crebForks.some((f) => f.alt === t.id)) })
  : world;
if (baseline) addPuddles(driven, env);
const R = await loadRapier();

for (const fork of crebForks.filter((f) => which === 'all' || f.id === which)) {
  const paths = forkPaths(world, fork);
  const lines = baseline ? ([['main', paths.main]] as const) : ([['main', paths.main], ['alt', paths.alt]] as const);
  for (const [line, path] of lines) {
    const sim = new Simulation(R, driven, env);
    sim.damage = 'realistic';
    sim.fuelScale = crebEpisode.fuelScale;
    const [x0, z0] = path[0];
    const [x1, z1] = path[4];
    const v = sim.addVehicle(
      'p',
      sim.poseAt(x0, z0, (Math.atan2(x1 - x0, -(z1 - z0)) * 180) / Math.PI, tuning.wheelRadius),
      tuning,
    );
    v.condition.fuel = 1000;
    const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
    for (let i = 0; i < 90; i++) sim.step(inputs, DT);
    const low = style === 'crawl' || style === 'open';
    const lockers = style === 'crawl';
    if (low) {
      v.toggleRange();
      v.precisionCrawl = true;
    }
    const pilot = new Autopilot(path, speeds[style]);
    pilot.lowRange = low;
    const recovery = new WinchRecovery(sim, v, path);
    const cuts: string[] = [];
    sim.events.on('damage', (e) => {
      if (e.part === 'tyre') cuts.push(`${e.fault} (${e.cause})`);
    });
    let time = 0;
    let water = 0;
    let tilt = 0;
    let waterAt = '';
    let tiltAt = '';
    let stuck = 0;
    for (; time < 900; time += DT) {
      const cmd = pilot.input(v, DT);
      if (pilot.done) break;
      cmd.winchIn = recovery.update(DT);
      if (low) {
        cmd.throttle = 1;
        cmd.brake = 0;
      }
      for (const axle of ['front', 'rear'] as const)
        if (v.differentials[axle] !== lockers && Math.abs(v.speed) < 1.3) v.toggleDiff(axle);
      inputs.set('p', cmd);
      sim.step(inputs, DT);
      for (const w of v.wheels)
        if (w.water > water) {
          water = w.water;
          waterAt = `${v.position.x.toFixed(0)},${v.position.z.toFixed(0)}`;
        }
      if (v.tiltDeg() > tilt) {
        tilt = v.tiltDeg();
        tiltAt = `${v.position.x.toFixed(0)},${v.position.z.toFixed(0)}`;
      }
      stuck = Math.abs(v.speed) < 0.3 ? stuck + DT : 0;
      if (stuck > 40) break;
    }
    const length = path.reduce(
      (sum, p, k) => (k ? sum + Math.hypot(p[0] - path[k - 1][0], p[1] - path[k - 1][1]) : 0),
      0,
    );
    console.log(
      `${fork.id.padEnd(16)} ${line.padEnd(5)} ${id} ${style}: ${pilot.done ? 'done ' : 'STUCK'} ${length.toFixed(0).padStart(4)} m ${time.toFixed(0).padStart(4)} s  ${(1000 - v.condition.fuel).toFixed(2)} L  winched ${recovery.uses}  water ${water.toFixed(2)} m at ${waterAt}  tilt ${tilt.toFixed(0)}° at ${tiltAt}  tyres ${cuts.join(', ') || 'ok'}${pilot.done ? '' : `  ${pilot.remaining(v).toFixed(0)} m short at ${v.position.x.toFixed(0)},${v.position.z.toFixed(0)}`}${v.condition.flood.stalled ? '  STALLED' : ''}`,
    );
    sim.physics.free();
  }
}
