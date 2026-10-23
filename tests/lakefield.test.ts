import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { lakefieldEpisode as E } from '../src/data/episodes/lakefield';
import { lakefieldMap } from '../src/data/episodes/lakefieldMap';
import { SurfaceId } from '../src/data/surfaces';
import { vehicleTuning } from '../src/data/vehicle';
import { weatherAt } from '../src/data/weatherTimeline';
import { checkpointAt, EpisodeRun, startCheckpoint } from '../src/sim/episode';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { loadSave, writeSave } from '../src/sim/save/save';
import { Simulation } from '../src/sim/sim';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { NO_WATER } from '../src/sim/world/terrain';
import { buildWorld } from '../src/sim/world/world';
import { DT, driveLeg, driver } from './helpers/drive';
import { MemoryStore, saveData } from './helpers/saves';

const world = buildWorld(lakefieldMap);
const morning = environmentAt(E.startHour, E.weather);
const { trackOf, scene } = driver(world, morning);
const rescue = E.rescue!;

/** The route north. */
const route = [
  'laura-road',
  'laura-river-crossing',
  'old-laura-road',
  'plains-road',
  'lakefield-road',
  'hann-crossing',
  'musgrave-road',
];

/** A parked vehicle on the Lakefield road level with the stockman, facing him. */
async function besideTheBog(env = environmentAt(14, 'rain')) {
  const sim = new Simulation(await loadRapier(), world, env);
  const stuck = sim.addStuckVehicle(rescue);
  const road = trackOf('lakefield-road');
  const along = trailProgress(road, rescue.x, rescue.z).along;
  const p = trailPoint(road, along - 3);
  const v = sim.addVehicle('p', sim.poseAt(p.x, p.z, 75, vehicleTuning.wheelRadius), vehicleTuning);
  const inputs = new Map([['p', { ...emptyInput(), brake: 1 }]]);
  for (let i = 0; i < 120; i++) sim.step(inputs, DT);
  return { sim, stuck, v, inputs, road, start: { ...v.body.translation() } };
}

describe('Episode 3: Lakefield', () => {
  it('is a long, narrow map with about 7 km of road from Laura to Musgrave', () => {
    expect([lakefieldMap.width, lakefieldMap.length]).toEqual([1280, 7168]);
    const length = route.reduce((sum, id) => sum + trackOf(id).poly.length, 0);
    expect(length).toBeGreaterThan(6500);
    // Each leg starts where the one before it ends, at the same height.
    for (let k = 0; k + 1 < route.length; k++) {
      const a = trackOf(route[k]);
      const b = trackOf(route[k + 1]);
      const end = trailPoint(a, a.poly.length);
      const start = trailPoint(b, 0);
      expect(Math.hypot(end.x - start.x, end.z - start.z), route[k]).toBeLessThan(0.01);
      expect(Math.abs(a.profile[a.profile.length - 1] - b.profile[0]), route[k]).toBeLessThan(0.15);
    }
  });

  it('has its goal, camps and history notes on the map', () => {
    const ids = new Set(world.pois.map((p) => p.id));
    expect(world.pois.find((p) => p.id === E.goal)!.kind).toBe('campsite');
    expect(world.pois.filter((p) => p.kind === 'campsite').map((p) => p.id)).toEqual([
      'laura',
      'old-laura',
      'lakefield',
      'hann-camp',
      'musgrave',
    ]);
    for (const id of Object.keys(E.notes)) expect(ids.has(id), id).toBe(true);
    expect(ids.has(E.deadline!.until!)).toBe(true);
    for (const camp of world.pois.filter((p) => p.reset)) {
      const r = camp.reset!;
      expect(world.terrain.slopeDegAt(r.x, r.z), camp.id).toBeLessThan(12);
      expect(world.terrain.waterSurfaceAt(r.x, r.z), camp.id).toBeNull();
      // Camps are firm ground, not black soil.
      expect(world.terrain.surfaceAt(r.x, r.z), camp.id).not.toBe(SurfaceId.BlackSoil);
    }
  });

  it('keeps its rivers below their banks: sand at the Laura, a shallow bar at Hann Crossing', () => {
    const t = world.terrain;
    for (const c of world.features.creeks) {
      for (let k = 0; k < c.poly.count; k += 8) {
        const x = c.poly.xs[k];
        const z = c.poly.zs[k];
        if (!t.inBounds(x, z)) continue;
        const dx = c.poly.zs[Math.min(c.poly.count - 1, k + 1)] - z;
        const dz = x - c.poly.xs[Math.min(c.poly.count - 1, k + 1)];
        const len = Math.hypot(dx, dz) || 1;
        for (const side of [-1, 1]) {
          const bx = x + (dx / len) * (c.halfWidth[k] + 3) * side;
          const bz = z + (dz / len) * (c.halfWidth[k] + 3) * side;
          const wi = t.index(bx, bz);
          if (t.inBounds(bx, bz) && t.water[wi] <= NO_WATER && world.features.trackDistance[wi] > 2)
            expect(t.heightAt(bx, bz), `${c.def.id} at ${k}`).toBeGreaterThan(c.water[k] - 0.05);
        }
      }
    }
    const crossing = (id: string) => {
      const track = trackOf(id);
      let sand = 0;
      let deepest = 0;
      for (let s = 0; s <= track.poly.length; s += 1) {
        const p = trailPoint(track, s);
        if (t.surfaceAt(p.x, p.z) === SurfaceId.Sand) sand++;
        deepest = Math.max(deepest, t.waterDepthAt(p.x, p.z));
      }
      return { sand, deepest };
    };
    const laura = crossing('laura-river-crossing');
    expect(laura.sand).toBeGreaterThan(20);
    expect(laura.deepest).toBeGreaterThan(0.15);
    expect(laura.deepest).toBeLessThan(0.5);
    // In the morning the bar is under about 40 cm; either side of it the river is deep.
    const hann = crossing('hann-crossing');
    expect(hann.deepest).toBeGreaterThan(0.3);
    expect(hann.deepest).toBeLessThan(0.5);
    const kennedy = world.features.creeks.find((c) => c.def.id === 'north-kennedy')!;
    const p = trailPoint(trackOf('hann-crossing'), trackOf('hann-crossing').poly.length / 2);
    expect(t.waterDepthAt(p.x + 30, p.z)).toBeGreaterThan(1.2);
    expect(kennedy.def.bars!.length).toBe(1);
  });

  it('raises the North Kennedy over its bar by the deadline', () => {
    const storm = E.storm!;
    const bar = 0.4;
    // Still a wade at 2 pm, about when a run on time gets there; too deep by the deadline.
    expect(bar + weatherAt(storm, 14).creekRise).toBeLessThan(0.7);
    expect(bar + weatherAt(storm, E.deadline!.hour).creekRise).toBeGreaterThan(0.85);
    // The Laura River, behind by then, rises less.
    expect(storm.creeks.shares!['laura-river']).toBeLessThan(0.5);
  });

  it('lays black soil off the road across the plains, and keeps the road itself firm', () => {
    const t = world.terrain;
    for (const id of ['plains-road', 'lakefield-road']) {
      const road = trackOf(id);
      let soil = 0;
      let tried = 0;
      for (let s = 50; s < road.poly.length - 50; s += 25) {
        const p = trailPoint(road, s);
        expect(t.surfaceAt(p.x, p.z), `${id} at ${s}`).not.toBe(SurfaceId.BlackSoil);
        for (const side of [-1, 1]) {
          const h = (p.headingDeg * Math.PI) / 180;
          const x = p.x + Math.cos(h) * 16 * side;
          const z = p.z + Math.sin(h) * 16 * side;
          tried++;
          if (t.surfaceAt(x, z) === SurfaceId.BlackSoil) soil++;
        }
      }
      expect(soil / tried, id).toBeGreaterThan(0.5);
    }
  });

  it('bogs the stockman off the road, nose to it, within reach of a winch on the road', async () => {
    const road = trackOf('lakefield-road');
    const near = trailProgress(road, rescue.x, rescue.z);
    // Off the road and its shoulder, but close.
    expect(near.distance).toBeGreaterThan(road.def.width / 2 + road.def.shoulder + 4);
    expect(near.distance).toBeLessThan(22);
    expect(world.terrain.surfaceAt(rescue.x, rescue.z)).toBe(SurfaceId.BlackSoil);
    const { sim, stuck } = await besideTheBog();
    try {
      expect(sim.findAnchors('p').some((a) => a.id === `stuck:${rescue.id}` && a.kind === 'vehicle')).toBe(
        true,
      );
      expect(stuck.freed).toBe(false);
      expect(stuck.sinkNow()).toBeCloseTo(rescue.sink, 5);
      // A pull the bog holds against doesn't shift it.
      const from = { x: rescue.x - 20, y: 0, z: rescue.z };
      for (let i = 0; i < 120; i++) stuck.pull(rescue.breakout * 0.9, from, DT);
      expect(stuck.moved).toBe(0);
    } finally {
      sim.physics.free();
    }
  });

  it('winches the stockman out from the road in the rain, the brakes holding the short 4WD on the road', async () => {
    const { sim, stuck, v, inputs, road, start } = await besideTheBog();
    try {
      const freed: string[] = [];
      sim.events.on('rescued', ({ id }) => freed.push(id));
      sim.attachTo(
        'p',
        sim.findAnchors('p').find((a) => a.id === `stuck:${rescue.id}`)!,
      );
      for (let i = 0; i < 40 * 60 && !stuck.freed; i++) {
        inputs.set('p', { ...emptyInput(), winchIn: true });
        sim.step(inputs, DT);
      }
      expect(stuck.freed).toBe(true);
      expect(freed).toEqual([rescue.id]);
      expect(stuck.sinkNow()).toBe(0);
      // He comes out towards the road and stops clear of it; his driver unhooks the line.
      expect(
        trailProgress(road, stuck.body.translation().x, stuck.body.translation().z).distance,
      ).toBeGreaterThan(road.def.width / 2 + 2);
      expect(sim.toolsOf('p').winch.attached).toBe(false);
      // The car was dragged a little towards him, but is still on the road.
      const p = v.body.translation();
      expect(Math.hypot(p.x - start.x, p.z - start.z)).toBeLessThan(6);
      expect(trailProgress(road, p.x, p.z).distance).toBeLessThan(road.def.width / 2 + road.def.shoulder);
      // Once out, he stays put: winching on just pulls the car towards him.
      const at = { ...stuck.body.translation() };
      sim.attachTo(
        'p',
        sim.findAnchors('p').find((a) => a.id === `stuck:${rescue.id}`)!,
      );
      for (let i = 0; i < 120; i++) {
        inputs.set('p', { ...emptyInput(), winchIn: true });
        sim.step(inputs, DT);
      }
      expect(stuck.body.translation().x).toBeCloseTo(at.x, 5);
    } finally {
      sim.physics.free();
    }
  }, 120_000);

  it('only finishes with the stockman out, and only holds the deadline until over Hann Crossing', async () => {
    const { sim, v } = await besideTheBog();
    try {
      const goal = world.pois.find((p) => p.id === E.goal)!;
      const start = startCheckpoint(E, 'laura', 'shortie');
      expect(start.rescued).toBe(false);
      const run = new EpisodeRun(E, start, true);
      expect(run.missionLine()).toBe(rescue.mission);
      v.teleport(sim.poseAt(goal.x, goal.z, 0));
      expect(run.check(v, 'off', goal)).toBeNull();
      run.rescued = true;
      expect(run.missionLine()).toBe(E.deadline!.mission);
      expect(run.hoursLeft()).toBeCloseTo(E.deadline!.hour - E.startHour, 5);
      // At the camp on the north bank the river can do what it likes.
      run.reach('hann-camp');
      expect(run.hoursLeft()).toBe(Infinity);
      expect(run.missionLine()).toBe(E.lastLeg);
      run.hour = 20;
      expect(run.check(v, 'off', goal)).toBe('complete');

      // A camp keeps the stockman out, and a restart from it (or a save) brings that back.
      const camp = checkpointAt('hann-camp', run, v, ['hann-camp']);
      expect(camp.rescued).toBe(true);
      const again = new EpisodeRun(E, start, true);
      again.restart(camp);
      expect([again.rescued, again.deadlineMet]).toEqual([true, true]);
      again.restart(start);
      expect([again.rescued, again.deadlineMet]).toEqual([false, false]);
      const store = new MemoryStore();
      writeSave(saveData({ episodes: { lakefield: { completed: false, checkpoint: camp } } }), store);
      expect(loadSave(store)!.episodes.lakefield!.checkpoint!.rescued).toBe(true);
      // A save from before rescues: nobody was out.
      writeSave(
        saveData({ episodes: { lakefield: { completed: false, checkpoint: { camp: 'x' } as never } } }),
        store,
      );
      expect(loadSave(store)!.episodes.lakefield!.checkpoint!.rescued).toBe(false);
      // Other episodes have no one to rescue.
      const creb = new EpisodeRun({ ...E, rescue: undefined }, start, true);
      expect(creb.rescued).toBe(true);
    } finally {
      sim.physics.free();
    }
  }, 60_000);

  for (const id of ['laura-river-crossing', 'hann-crossing'])
    it(`drives ${id} in the short-wheelbase 4WD in the morning`, async () => {
      const s = await scene(id, false, 'high', vehicleTuning);
      try {
        const r = await driveLeg(s, s.track, false, 300);
        expect(r.tilt).toBeLessThan(30);
        expect(s.v.condition.flood.stalled).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);
});
