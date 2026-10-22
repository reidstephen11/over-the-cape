import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { perentieTuning } from '../src/data/perentie';
import { vehicleTuning } from '../src/data/vehicle';
import { applyCheckpoint, checkpointAt, EpisodeRun, startCheckpoint } from '../src/sim/episode';
import { Finds } from '../src/sim/finds';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadSave, writeSave } from '../src/sim/save/save';
import { trailPoint } from '../src/sim/world/crawlTrail';
import { buildWorld } from '../src/sim/world/world';
import { DT, driveLeg, driver } from './helpers/drive';
import { MemoryStore, saveData } from './helpers/saves';

const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { trackOf, scene } = driver(world, wet);
const finds = crebMap.finds ?? [];

describe('Finds off the CREB’s main line', () => {
  it('puts a jerry can and tyre plugs at the end of two side tracks, by their huts', () => {
    expect(finds.map((f) => f.id)).toEqual(['line-camp-plugs', 'linesmans-jerry-can']);
    for (const [trackId, findId] of [
      ['line-camp-track', 'line-camp-plugs'],
      ['linesmans-track', 'linesmans-jerry-can'],
    ]) {
      const t = trackOf(trackId);
      const end = trailPoint(t, t.poly.length);
      const f = finds.find((x) => x.id === findId)!;
      // The end of the track is in reach of the find.
      expect(Math.hypot(end.x - f.x, end.z - f.z), trackId).toBeLessThan(f.radius);
      // Each side track starts on the main line, at the main line's height.
      const start = trailPoint(t, 0);
      const main = world.features.tracks.find(
        (m) =>
          m !== t &&
          !m.def.id.endsWith('-track') &&
          Array.from({ length: m.poly.count }, (_, k) => k).some(
            (k) => Math.hypot(m.poly.xs[k] - start.x, m.poly.zs[k] - start.z) < 1,
          ),
      );
      expect(main, trackId).toBeDefined();
      expect(Math.abs(world.terrain.heightAt(start.x, start.z) - t.profile[0]), trackId).toBeLessThan(0.3);
    }
    // Nothing to find on the main line itself: every find is well off it.
    const route = ['creb-ridge', 'range-top'].map(trackOf);
    for (const f of finds)
      for (const r of route)
        for (let k = 0; k < r.poly.count; k++)
          expect(Math.hypot(r.poly.xs[k] - f.x, r.poly.zs[k] - f.z), f.id).toBeGreaterThan(f.radius + 30);
  });

  it('loads a find once, only when stopped beside it, and puts it back from a checkpoint', async () => {
    const s = await scene('linesmans-track', true, 'both', vehicleTuning);
    try {
      const f = new Finds(finds);
      const c = s.v.condition;
      c.jerryCans = 1;
      // Parked at the end of the track, beside the hut.
      expect(f.near(s.v.position.x, s.v.position.z)).toMatchObject({ inReach: true });
      const moving = s.v.speed;
      expect(Math.abs(moving)).toBeLessThan(0.6);
      expect(f.update(s.v)?.id).toBe('linesmans-jerry-can');
      expect(c.jerryCans).toBe(2);
      expect(f.update(s.v)).toBeNull();
      expect(c.jerryCans).toBe(2);
      expect(f.near(s.v.position.x, s.v.position.z)).toBeNull();

      // A camp reached after loading it keeps it; restarting from a camp before puts it back.
      const run = new EpisodeRun(crebEpisode, startCheckpoint(crebEpisode, 'daintree-village'), true);
      const before = checkpointAt('roaring-meg-camp', run, s.v, [], []);
      const after = checkpointAt('bloomfield-camp', run, s.v, [], f.taken);
      expect(after.taken).toEqual(['linesmans-jerry-can']);
      f.reset(before.taken);
      applyCheckpoint(s.v, { ...before, jerryCans: 1 });
      expect(f.taken.size).toBe(0);
      expect(f.update(s.v)?.id).toBe('linesmans-jerry-can');
      expect(c.jerryCans).toBe(2);
    } finally {
      s.sim.physics.free();
    }
  });

  it('does not load a find while driving past it', async () => {
    const s = await scene('line-camp-track', true, 'high', vehicleTuning);
    try {
      const f = new Finds(finds);
      const plugs = s.v.condition.plugs;
      s.v.body.setLinvel({ x: 3, y: 0, z: 0 }, true);
      s.sim.step(new Map([['p', emptyInput()]]), DT);
      expect(Math.abs(s.v.speed)).toBeGreaterThan(0.6);
      expect(f.update(s.v)).toBeNull();
      expect(s.v.condition.plugs).toBe(plugs);
    } finally {
      s.sim.physics.free();
    }
  });

  it('keeps what was taken in the save, and reads old saves as nothing taken', () => {
    const store = new MemoryStore();
    const checkpoint = { ...startCheckpoint(crebEpisode, 'roaring-meg-camp'), taken: ['line-camp-plugs'] };
    writeSave(saveData({ episodes: { creb: { completed: false, checkpoint } } }), store);
    expect(loadSave(store)?.episodes.creb?.checkpoint?.taken).toEqual(['line-camp-plugs']);
    const old: Partial<typeof checkpoint> = { ...checkpoint };
    delete old.taken;
    writeSave(
      saveData({ episodes: { creb: { completed: false, checkpoint: old as typeof checkpoint } } }),
      store,
    );
    expect(loadSave(store)?.episodes.creb?.checkpoint?.taken).toEqual([]);
  });

  for (const tuning of [vehicleTuning, perentieTuning])
    for (const id of ['line-camp-track', 'linesmans-track'])
      it(`drives ${id} out and back in the wet in the ${tuning.name}`, async () => {
        for (const back of [false, true]) {
          const s = await scene(id, back, 'both', tuning);
          try {
            const r = await driveLeg(s, s.track, back, 200);
            expect(r.tilt, `${id} ${back ? 'back' : 'out'}`).toBeLessThan(30);
          } finally {
            s.sim.physics.free();
          }
        }
      }, 300_000);
});
