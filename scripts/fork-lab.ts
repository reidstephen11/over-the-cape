/** Dev probe: drive one line of a CREB fork as the fork test does (`driveFork`), with a log every 2 s. npx vite-node scripts/fork-lab.ts <fork id> <main|alt> [vehicle id] */
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebForks } from '../src/data/episodes/crebForks';
import { crebMap } from '../src/data/episodes/crebMap';
import { vehicleTuning, type VehicleId } from '../src/data/vehicle';
import { vehicles } from '../src/data/vehicles';
import { buildWorld } from '../src/sim/world/world';
import { trailProgress } from '../src/sim/world/crawlTrail';
import { driveFork, forkPaths } from '../tests/helpers/drive';

const forkId = process.argv[2] ?? 'shallow-crossing';
const line = (process.argv[3] ?? 'main') as 'main' | 'alt';
const tuning = process.argv[4] ? vehicles[process.argv[4] as VehicleId].tuning : vehicleTuning;
const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const fork = crebForks.find((f) => f.id === forkId)!;
const paths = forkPaths(world, fork);
const main = world.features.tracks.find((t) => t.def.id === fork.main)!;
const t = world.terrain;
let last = -1;
const r = await driveFork(world, wet, paths[line], tuning, 400, (sim, v, time) => {
  if (Math.floor(time / 2) === last) return;
  last = Math.floor(time / 2);
  const near = trailProgress(main, v.position.x, v.position.z);
  const ws = v.wheels.map(
    (w) => `${w.surface}/${w.spin.toFixed(2)}/${sim.churn.at(w.contactPoint.x, w.contactPoint.z).toFixed(2)}`,
  );
  const winch = sim.toolsOf('p').winch;
  console.log(
    `t=${time.toFixed(0).padStart(3)} along=${near.along.toFixed(1).padStart(7)} off=${near.distance.toFixed(2)} v=${v.speed.toFixed(2)} slope=${t.slopeDegAt(v.position.x, v.position.z).toFixed(0)} thr=${v.throttle.toFixed(2)} brk=${v.brake.toFixed(1)} winch=${winch.attached ? `on ${winch.length.toFixed(0)}m` : 'off'} tyres=${v.condition.tyreFault.join(',')} wheels(surf/spin/churn)=${ws.join(' ')}`,
  );
});
console.log(
  `${forkId} ${line} ${tuning.id}: done=${r.done} remaining=${r.remaining.toFixed(1)} time=${r.time.toFixed(0)} winched=${r.winched} cuts=${r.cuts} stalled=${r.stalled}`,
);
