import { describe, expect, it } from 'vitest';
import { frenchmansMap } from '../src/data/episodes/frenchmansMap';
import { frenchmansEpisode } from '../src/data/episodes/frenchmans';
import { buildWorld } from '../src/sim/world/world';
import { unlocked } from '../src/sim/save/save';
import { saveData } from './helpers/saves';
import { episodeWeatherAt } from '../src/data/weatherTimeline';
import { trailers } from '../src/data/trailers';
import { vehicles } from '../src/data/vehicles';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { headingOf } from '../src/sim/vehicle/math';
import { pathFor, WinchRecovery } from './helpers/drive';

const world = buildWorld(frenchmansMap);

/** Drive a physical loaded No. 5, with a deliberate choice of line and recovery equipment. */
async function tow(trackId: string, offset = 0, winch = false, careful = true, hour = 12) {
  const track = world.features.tracks.find((t) => t.def.id === trackId)!;
  const path = pathFor(track).map((p, i, points): [number, number] => {
    const s = i * 0.5;
    const shift = offset * Math.max(0, Math.min(1, (s - 50) / 25, (230 - s) / 25));
    const next = points[Math.min(i + 1, points.length - 1)];
    const dx = next[0] - p[0],
      dz = next[1] - p[1];
    const length = Math.hypot(dx, dz) || 1;
    return [p[0] - (dz * shift) / length, p[1] + (dx * shift) / length];
  });
  const sim = new Simulation(
    await loadRapier(),
    world,
    episodeWeatherAt(hour, frenchmansEpisode.weather, frenchmansEpisode.storm).env,
  );
  const tuning = vehicles.perentie.tuning;
  const v = sim.addVehicle(
    'p',
    sim.poseAt(
      path[0][0],
      path[0][1],
      headingOf(path[1][0] - path[0][0], path[1][1] - path[0][1]),
      tuning.wheelRadius,
    ),
    tuning,
  );
  const trailer = sim.addTrailer('load', trailers.no5, 'p');
  trailer.loadDrums(2);
  const inputs = new Map([['p', { ...emptyInput(), handbrake: true }]]);
  const step = () => sim.step(inputs, 1 / 60);
  for (let i = 0; i < 120; i++) step();
  if (careful) v.toggleRange();
  const ridge = trackId === 'heath-ridge';
  v.precisionCrawl = (ridge || trackId === 'heath-bog') && careful;
  if (ridge && careful) {
    v.toggleDiff('front');
    v.toggleDiff('rear');
  }
  const pilot = new Autopilot(path, careful ? (ridge ? 1.2 : 1.6) : 6);
  pilot.lowRange = careful;
  // Rig the line before entering the deep bowl rather than waiting for a trailer to tip.
  const recovery = winch ? new WinchRecovery(sim, v, path, 0) : null;
  let stalled = 0;
  let lastPosition = { ...v.position };
  try {
    for (let i = 0; i < 600 * 60 && !pilot.done && trailer.drums === 2; i++) {
      const input = pilot.input(v, 1 / 60);
      if (!careful) input.toggleRange = false;
      if (recovery) input.winchIn = recovery.update(1 / 60);
      inputs.set('p', input);
      step();
      if (i % 120 === 0) {
        stalled =
          Math.hypot(v.position.x - lastPosition.x, v.position.z - lastPosition.z) < 0.4 ? stalled + 2 : 0;
        lastPosition = { ...v.position };
        if (!winch && stalled > 35) break;
      }
      if (i % 600 === 0) await new Promise((resolve) => setImmediate(resolve));
    }
    return {
      done: pilot.done,
      drums: trailer.drums,
      winched: recovery?.uses ?? 0,
      position: { ...v.position },
      tilt: trailer.tiltDeg(),
      remaining: pilot.remaining(v),
    };
  } finally {
    sim.physics.free();
  }
}

describe('Frenchmans route', () => {
  it('unlocks after Lakefield and leaves room to park a loaded vehicle and trailer at each camp', () => {
    expect(unlocked(null, 'frenchmans')).toBe(false);
    expect(unlocked(saveData({ episodes: { lakefield: { completed: true } } }), 'frenchmans')).toBe(true);
    for (const camp of world.pois.filter((p) => p.kind === 'campsite')) {
      expect(camp.radius).toBeGreaterThanOrEqual(24);
      expect(world.terrain.waterSurfaceAt(camp.x, camp.z)).toBeNull();
    }
    expect(world.pois.some((p) => p.id === frenchmansEpisode.goal)).toBe(true);
  });

  it('does not leave a step or a steep cross-slope at the shared approach joins', () => {
    const terrain = world.terrain;
    for (const [x, z] of [
      [-2550, 20],
      [-2250, 20],
      [-140, 0],
      [310, 0],
    ]) {
      const before = terrain.heightAt(x - 2, z);
      const after = terrain.heightAt(x + 2, z);
      expect(Math.abs(after - before) / 4, `grade at ${x}`).toBeLessThan(0.25);
      expect(
        Math.abs(terrain.heightAt(x, z - 0.7) - terrain.heightAt(x, z + 0.7)) / 1.4,
        `cross-slope at ${x}`,
      ).toBeLessThan(0.15);
    }
  });

  it('has a deep hole on the straight Pascoe line and a shallow route around it', () => {
    expect(world.terrain.waterDepthAt(100, 0)).toBeGreaterThan(1.4);
    expect(world.terrain.waterDepthAt(100, 8)).toBeLessThan(0.8);
  });

  it('gets the loaded Army trailer through the rutted climb when the driver uses its right-hand line', async () => {
    expect(await tow('heath-ridge', 0.65)).toMatchObject({ done: true, drums: 2 });
  });

  it('offers a firm but winding alternative to the deep bog', async () => {
    const run = await tow('heath-firm-loop');
    expect(run, JSON.stringify(run)).toMatchObject({ done: true, drums: 2 });
  });

  it('the ordinary high-range approach through the ruts cannot substitute for a careful crawl', async () => {
    const run = await tow('heath-ridge', 0, false, false);
    expect(run.done).toBe(false);
    expect(run.remaining).toBeGreaterThan(150);
  });

  it('offers a winching line through the wet bog but punishes a rushed loaded tow', async () => {
    expect((await tow('heath-bog', 0, false, false, 16.5)).done).toBe(false);
    const recovered = await tow('heath-bog', 0, true, true, 16.5);
    expect(recovered, JSON.stringify(recovered)).toMatchObject({ done: true, drums: 2 });
    expect(recovered.winched).toBeGreaterThan(0);
  });
});
