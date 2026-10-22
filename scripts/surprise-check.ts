/**
 * Dev helper: list the surprises the CREB's runs get for a range of seeds, and any stretch
 * that never finds a spot. Usage: npx vite-node scripts/surprise-check.ts [seeds]
 */
import { crebMap } from '../src/data/episodes/crebMap';
import { crebSurprises } from '../src/data/episodes/crebSurprises';
import { buildWorld } from '../src/sim/world/world';
import { planSurprises } from '../src/sim/world/surprisePlan';

const seeds = Number(process.argv[2] ?? 40);
const world = buildWorld(crebMap);
const used = new Map<string, number>();
const t0 = performance.now();
for (let seed = 1; seed <= seeds; seed++) {
  const plans = planSurprises(world, crebSurprises, seed);
  for (const p of plans) used.set(p.site, (used.get(p.site) ?? 0) + 1);
  if (seed <= 12)
    console.log(
      seed,
      plans
        .map((p) => `${p.id}@${p.at.toFixed(0)} (${p.x.toFixed(0)},${p.z.toFixed(0)}) x${p.pieces.length}`)
        .join('  '),
    );
  const trees = plans.filter((p) => p.kind === 'treefall').length;
  const rocks = plans.length - trees;
  if (trees !== crebSurprises.treefalls || rocks !== crebSurprises.rockfalls)
    console.log(`seed ${seed}: only ${trees} tree falls and ${rocks} rockfalls`);
}
console.log(`${((performance.now() - t0) / seeds).toFixed(1)} ms a plan`);
for (const s of crebSurprises.sites) console.log(s.id.padEnd(20), used.get(s.id) ?? 0);
