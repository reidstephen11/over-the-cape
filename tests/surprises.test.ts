import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebSurprises } from '../src/data/episodes/crebSurprises';
import { perentieTuning } from '../src/data/perentie';
import { vehicleTuning } from '../src/data/vehicle';
import { checkpointAt, EpisodeRun, startCheckpoint } from '../src/sim/episode';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { loadSave, writeSave } from '../src/sim/save/save';
import { Simulation } from '../src/sim/sim';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { addPuddles } from '../src/sim/world/puddles';
import { piecePose, planDuration, planSurprises, type SurprisePlan } from '../src/sim/world/surprisePlan';
import { buildWorld } from '../src/sim/world/world';
import { DT } from './helpers/drive';
import { MemoryStore, saveData } from './helpers/saves';
import { getPast } from './helpers/surprises';

const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
addPuddles(world, wet);
const R = await loadRapier();
const trackOf = (id: string) => world.features.tracks.find((t) => t.def.id === id)!;
const SEED = 1;

function simWith(plans: SurprisePlan[], happened: string[] = []) {
  const sim = new Simulation(R, world, wet);
  sim.addSurprises(plans, happened);
  return sim;
}

/** Every piece's position, rounded to the millimetre. */
function poses(sim: Simulation, id: string) {
  return [...sim.dynamics.values()]
    .filter((o) => o.id.startsWith(`${id}:`))
    .map((o) => {
      const p = o.body.translation();
      return [p.x, p.y, p.z].map((n) => Math.round(n * 1000) / 1000);
    });
}

function xzAt(track: ReturnType<typeof trackOf>, at: number): [number, number, number] {
  const p = trailPoint(track, at);
  return [p.x, p.z, p.headingDeg];
}

function park(sim: Simulation, x: number, z: number, headingDeg: number) {
  const v = sim.addVehicle('p', sim.poseAt(x, z, headingDeg));
  const inputs = new Map([['p', { ...emptyInput(), handbrake: true }]]);
  return { v, step: (n: number) => Array.from({ length: n }, () => sim.step(inputs, DT)) };
}

describe('Surprises on the CREB', () => {
  it("gives each run two tree falls and a rockfall on different stretches, clear of the route's own obstacles, varying with the seed", () => {
    const spots = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const plans = planSurprises(world, crebSurprises, seed);
      expect(plans.filter((p) => p.kind === 'treefall')).toHaveLength(2);
      expect(plans.filter((p) => p.kind === 'rockfall')).toHaveLength(1);
      expect(new Set(plans.map((p) => p.site)).size).toBe(3);
      for (const p of plans) {
        const site = crebSurprises.sites.find((s) => s.id === p.site)!;
        expect(p.at).toBeGreaterThanOrEqual(site.from);
        expect(p.at).toBeLessThanOrEqual(site.to);
        for (const q of plans) if (q !== p) expect(Math.hypot(q.x - p.x, q.z - p.z)).toBeGreaterThan(140);
        spots.add(`${p.site}@${Math.round(p.at / 10)}`);
        // Clear of each stretch's own obstacle: the washout, the rock ledge, the sideling.
        for (const g of world.map.gullies) expect(Math.hypot(g.x - p.x, g.z - p.z)).toBeGreaterThan(50);
        const def = trackOf(p.track).def;
        for (const r of def.rockySteps ?? []) expect(Math.abs(r.at - p.at)).toBeGreaterThan(50);
        if (def.cant)
          expect(p.at < def.cant[0][0] - 40 || p.at > def.cant[def.cant.length - 1][0] + 40).toBe(true);
      }
      // The same seed, the same run.
      expect(planSurprises(world, crebSurprises, seed)).toEqual(plans);
    }
    // Every stretch comes up, at many different spots.
    for (const s of crebSurprises.sites) expect([...spots].some((k) => k.startsWith(`${s.id}@`))).toBe(true);
    expect(spots.size).toBeGreaterThan(60);
  });

  it('drops each tree across the whole track, clear of trees, mud holes and water', () => {
    for (let seed = 1; seed <= 60; seed++)
      for (const plan of planSurprises(world, crebSurprises, seed)) {
        if (plan.kind !== 'treefall') continue;
        const trunk = plan.pieces[0];
        if (trunk.kind !== 'trunk') throw new Error('not a trunk');
        const track = trackOf(plan.track);
        const hw = track.def.width / 2;
        // Lying down, from its foot to its tip: it spans the track from edge to edge.
        const sides = [0, trunk.length].map((d) => {
          const x = trunk.base.x + trunk.fx * d;
          const z = trunk.base.z + trunk.fz * d;
          const t = trailProgress(track, x, z);
          const c = trailPoint(track, t.along);
          const n = trailPoint(track, t.along, 1);
          return (x - c.x) * (n.x - c.x) + (z - c.z) * (n.z - c.z);
        });
        expect(Math.min(...sides)).toBeLessThan(-hw - 1);
        expect(Math.max(...sides)).toBeGreaterThan(hw + 1);
        for (let d = 0; d <= trunk.length; d += 0.5) {
          const x = trunk.base.x + trunk.fx * d;
          const z = trunk.base.z + trunk.fz * d;
          for (const t of world.treeGrid.near(x, z, 3))
            expect(Math.hypot(t.x - x, t.z - z)).toBeGreaterThan(t.trunkRadius + trunk.radius);
        }
        for (const b of world.features.mudHoles)
          expect(Math.hypot(b.x - plan.x, b.z - plan.z)).toBeGreaterThan(Math.max(b.radiusX, b.radiusZ) + 14);
        const i =
          Math.round(plan.z + world.terrain.halfZ) * world.terrain.resX +
          Math.round(plan.x + world.terrain.halfX);
        expect(world.features.creekDistance[i]).toBeGreaterThanOrEqual(22);
      }
  });

  it('brings each rockfall down from a bank onto the track, leaving a way past', () => {
    for (let seed = 1; seed <= 60; seed++)
      for (const plan of planSurprises(world, crebSurprises, seed)) {
        if (plan.kind !== 'rockfall') continue;
        const track = trackOf(plan.track);
        const rocks = plan.pieces.flatMap((p) => (p.kind === 'rock' ? [p] : []));
        expect(rocks.length).toBeGreaterThanOrEqual(2);
        const big = rocks.filter((r) => r.rx > 0.4);
        expect(big).toHaveLength(2);
        const lateral = (x: number, z: number) => {
          const t = trailProgress(track, x, z);
          const c = trailPoint(track, t.along);
          const n = trailPoint(track, t.along, 1);
          return (x - c.x) * (n.x - c.x) + (z - c.z) * (n.z - c.z);
        };
        for (const r of big) {
          const start = world.terrain.heightAt(r.start.x, r.start.z);
          const end = world.terrain.heightAt(r.end.x, r.end.z);
          // From up the bank onto the track's bank half, never across the far half.
          expect(start).toBeGreaterThan(end);
          const side = Math.sign(lateral(r.start.x, r.start.z));
          expect(side * lateral(r.end.x, r.end.z) - Math.max(r.rx, r.rz)).toBeGreaterThan(0.2);
        }
      }
  });

  it('starts once as the car comes along the track, never landing on it, and can be got past in both vehicles', async () => {
    const plans = planSurprises(world, crebSurprises, SEED);
    expect(plans.map((p) => p.kind).sort()).toEqual(['rockfall', 'treefall', 'treefall']);
    for (const tuning of [vehicleTuning, perentieTuning])
      for (const plan of plans) {
        const sim = simWith(plans);
        const r = await getPast(sim, plan, tuning);
        const where = `${tuning.name} at ${plan.id}`;
        expect(r.starts, where).toBe(1);
        expect(r.startedShort, where).toBeGreaterThan(40);
        expect(r.closest, where).toBeGreaterThan(20);
        expect(r.past, where).toBe(true);
        expect(r.time, where).toBeLessThan(240);
        expect(sim.surprises!.happened()).toEqual([plan.id]);
        sim.physics.free();
      }
  });

  it('starts sooner at speed, with room to stop', () => {
    const plans = planSurprises(world, crebSurprises, SEED);
    const plan = plans.find((p) => p.kind === 'treefall' && p.track === 'bloomfield-track')!;
    const track = trackOf(plan.track);
    for (const speed of [5, 12, 18]) {
      const sim = simWith(plans);
      let started = NaN;
      sim.events.on('surprise', (e) => {
        if (e.phase === 'started') started = plan.at - trailProgress(track, v.position.x, v.position.z).along;
      });
      const { v, step } = park(sim, ...xzAt(track, plan.at - 200));
      // Carried along the track at a steady speed.
      for (let s = plan.at - 200; s < plan.at && Number.isNaN(started); s += speed * DT) {
        const p = trailPoint(track, s);
        v.teleport(sim.poseAt(p.x, p.z, p.headingDeg));
        const f = v.forward();
        v.body.setLinvel({ x: f.x * speed, y: 0, z: f.z * speed }, true);
        step(1);
      }
      const reach = Math.max(45, speed * (planDuration(plan) + 2) + 18);
      expect(started, `${speed} m/s`).toBeGreaterThan(reach - speed * DT * 2 - 1);
      expect(started, `${speed} m/s`).toBeLessThan(Math.max(70, reach) + 1);
      // Even without braking, it is down well before the car gets there.
      expect(started - speed * planDuration(plan), `${speed} m/s`).toBeGreaterThan(18);
      sim.physics.free();
    }
  });

  it('never lands on the car: it stays clear of it until the car has moved away', () => {
    const plans = planSurprises(world, crebSurprises, SEED);
    const plan = plans.find((p) => p.kind === 'treefall')!;
    const trunk = plan.pieces[0];
    if (trunk.kind !== 'trunk') throw new Error('not a trunk');
    const sim = simWith(plans);
    // Parked right where it will land.
    const mid = trunk.length / 2;
    const { v, step } = park(sim, trunk.base.x + trunk.fx * mid, trunk.base.z + trunk.fz * mid, 0);
    step(180);
    const before = v.body.translation();
    sim.surprises!.trigger(plan.id);
    step(Math.ceil((planDuration(plan) + 2) / DT));
    const after = v.body.translation();
    // Settling on its tyres, not shoved by a falling trunk.
    expect(Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z)).toBeLessThan(0.3);
    expect(sim.surprises!.phaseOf(plan.id)).toBe('falling');
    // Moved on, it comes down solid.
    const t = trailProgress(trackOf(plan.track), plan.x, plan.z);
    const away = trailPoint(trackOf(plan.track), t.along - 25);
    v.teleport(sim.poseAt(away.x, away.z, away.headingDeg));
    step(5);
    expect(sim.surprises!.phaseOf(plan.id)).toBe('down');
    sim.physics.free();
  });

  it('happens the same way again after a restart from camp', () => {
    const plans = planSurprises(world, crebSurprises, SEED);
    const sim = simWith(plans);
    const { step } = park(sim, 0, 2600, 0);
    const steps = (plan: SurprisePlan) => Math.ceil((planDuration(plan) + 1) / DT);
    const landed = plans.map((plan) => {
      sim.surprises!.trigger(plan.id);
      step(steps(plan));
      expect(sim.surprises!.phaseOf(plan.id)).toBe('down');
      return poses(sim, plan.id);
    });
    // Back at a camp reached after the first had happened: it stays, the others wait again.
    sim.surprises!.reset([plans[0].id]);
    expect(sim.surprises!.happened()).toEqual([plans[0].id]);
    // (It has settled a little more since.)
    poses(sim, plans[0].id).forEach((p, i) =>
      p.forEach((n, j) => expect(Math.abs(n - landed[0][i][j])).toBeLessThan(0.3)),
    );
    for (const plan of plans.slice(1)) {
      expect(sim.surprises!.phaseOf(plan.id)).toBe('waiting');
      const start = plan.pieces.map((p) => {
        const q = piecePose(p, 0, (x, z) => world.terrain.heightAt(x, z));
        return [q.x, q.y, q.z].map((n) => Math.round(n * 1000) / 1000);
      });
      expect(poses(sim, plan.id)).toEqual(start);
    }
    // And they come down where they did before.
    plans.slice(1).forEach((plan, k) => {
      sim.surprises!.trigger(plan.id);
      step(steps(plan));
      const again = poses(sim, plan.id);
      again.forEach((p, i) => p.forEach((n, j) => expect(n).toBeCloseTo(landed[k + 1][i][j], 1)));
    });
    sim.physics.free();
    // Continuing from a save, those that had happened are down where they landed.
    const fresh = simWith(plans, [plans[0].id]);
    expect(fresh.surprises!.phaseOf(plans[0].id)).toBe('down');
    poses(fresh, plans[0].id).forEach((p, i) =>
      p.forEach((n, j) => expect(n).toBeCloseTo(landed[0][i][j], 0)),
    );
    fresh.physics.free();
  });

  it('keeps the run seed and what has happened in camp checkpoints and saves', () => {
    const start = startCheckpoint(crebEpisode, 'daintree-village', 'shortie', 1234);
    expect(start).toMatchObject({ seed: 1234, surprises: [] });
    expect(startCheckpoint(crebEpisode, 'daintree-village', 'shortie').seed).not.toBe(
      startCheckpoint(crebEpisode, 'daintree-village', 'shortie').seed,
    );
    const run = new EpisodeRun(crebEpisode, start, true);
    const sim = new Simulation(R, world, wet);
    const v = sim.addVehicle('p', sim.poseAt(0, 2600, 0));
    const cp = checkpointAt('roaring-meg-camp', run, v, [], [], ['treefall-ridge-south']);
    expect(cp).toMatchObject({ seed: 1234, surprises: ['treefall-ridge-south'] });
    const store = new MemoryStore();
    writeSave(saveData({ episodes: { creb: { completed: false, checkpoint: cp } } }), store);
    expect(loadSave(store)!.episodes.creb!.checkpoint).toMatchObject({
      seed: 1234,
      surprises: ['treefall-ridge-south'],
    });
    // A checkpoint saved before surprises existed gets a fixed seed.
    writeSave(
      saveData({ episodes: { creb: { completed: false, checkpoint: { camp: 'x' } as never } } }),
      store,
    );
    expect(loadSave(store)!.episodes.creb!.checkpoint).toMatchObject({ seed: 1, surprises: [] });
    sim.physics.free();
  });
});
