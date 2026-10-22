/**
 * Dev helper: drive up to one of a run's surprises, watch it come down and get past it.
 * Usage: npx vite-node scripts/surprise-drive.ts [seed or first-last] [shortie|camel|perentie] [event id]
 */
import { environmentFor } from '../src/data/environment';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebSurprises } from '../src/data/episodes/crebSurprises';
import { isVehicleId, vehicles } from '../src/data/vehicles';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { addPuddles } from '../src/sim/world/puddles';
import { planSurprises } from '../src/sim/world/surprisePlan';
import { buildWorld } from '../src/sim/world/world';
import { getPast } from '../tests/helpers/surprises';

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
    const r = await getPast(sim, plan, vehicles[id].tuning, (s) =>
      only ? console.log(`  ${s}`) : undefined,
    );
    console.log(
      `${String(seed).padStart(3)} ${plan.id.padEnd(30)} at ${plan.at.toFixed(0)} m: ${r.past ? 'past' : 'STUCK'} in ${r.time.toFixed(0)} s, started ${r.startedShort.toFixed(0)} m short, closest ${r.closest.toFixed(1)} m, winched ${r.winched}`,
    );
    sim.physics.free();
  }
