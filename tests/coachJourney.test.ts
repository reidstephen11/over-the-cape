import { expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { coachEpisode } from '../src/data/episodes/coach';
import { coachMap } from '../src/data/episodes/coachMap';
import type { VehicleId } from '../src/data/vehicle';
import { vehicles } from '../src/data/vehicles';
import { applyCheckpoint, EpisodeRun, startCheckpoint } from '../src/sim/episode';
import { Autopilot } from '../src/sim/input/autopilot';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { buildWorld } from '../src/sim/world/world';
import { DT, pathFor } from './helpers/drive';

const world = buildWorld(coachMap);
const goal = world.pois.find((p) => p.id === coachEpisode.goal)!;

/** Continuous drives: no teleporting between obstacles or refilling the tank. */
for (const id of Object.keys(vehicles) as VehicleId[]) {
  const vehicle = vehicles[id];
  it(`crosses the compact range in the ${vehicle.tuning.name} with the episode load`, async () => {
    const sim = new Simulation(
      await loadRapier(),
      world,
      environmentAt(coachEpisode.startHour, coachEpisode.weather),
    );
    try {
      const tuning = vehicle.tuning;
      const v = sim.addVehicle('p', sim.campsitePose(coachMap.spawnCampsite, tuning.wheelRadius), tuning);
      const checkpoint = startCheckpoint(coachEpisode, coachMap.spawnCampsite, id);
      applyCheckpoint(v, checkpoint);
      sim.damage = 'realistic';
      sim.fuelScale = coachEpisode.fuelScale;
      const run = new EpisodeRun(coachEpisode, checkpoint, true);
      const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
      for (let i = 0; i < 90; i++) sim.step(inputs, DT);
      const direct = id === 'shortie' || id === 'perentie';
      const legs: [string, 'road' | 'ridge' | 'crawl'][] = [
        ['range-foot', 'road'],
        [direct ? 'climb-middle' : 'climb-bypass', direct ? 'crawl' : 'road'],
        ['range-top-south', 'ridge'],
        [direct ? 'big-step-line' : 'east-bypass', direct ? 'crawl' : 'road'],
        ['range-top-north', 'ridge'],
        ['range-descent', 'crawl'],
        ['range-exit-road', 'road'],
      ];
      let worstTilt = 0;
      for (const [trackId, mode] of legs) {
        const track = world.features.tracks.find((t) => t.def.id === trackId)!;
        inputs.set('p', { ...emptyInput(), brake: 1, handbrake: true });
        for (let i = 0; i < 90; i++) {
          sim.step(inputs, DT);
          run.tick(DT);
        }
        if (v.drivetrain.range === 'high') v.toggleRange();
        for (const axle of ['front', 'rear'] as const) if (!v.differentials[axle]) v.toggleDiff(axle);
        v.precisionCrawl = mode === 'crawl';
        const pilot = new Autopilot(pathFor(track), mode === 'road' ? 4.5 : 2.5);
        pilot.lowRange = true;
        let seconds = 0;
        for (let step = 0; seconds < 900; seconds += DT, step++) {
          if (step % 600 === 599) await new Promise((resolve) => setImmediate(resolve));
          const command = pilot.input(v, DT);
          if (pilot.done) break;
          if (mode === 'crawl') {
            command.throttle = 1;
            command.brake = 0;
          }
          inputs.set('p', command);
          sim.step(inputs, DT);
          run.tick(DT);
          worstTilt = Math.max(worstTilt, v.tiltDeg());
        }
        expect(pilot.done, `${id}: ${trackId}`).toBe(true);
      }
      expect(worstTilt).toBeLessThan(48);
      expect(v.condition.fuel).toBeGreaterThan(0);
      expect(run.check(v, 'realistic', goal)).toBe('complete');
      console.info(`${id}: ${(run.elapsed / 60).toFixed(1)} min, ${v.condition.fuel.toFixed(1)} L left`);
      // The direct route is a short session even with conservative scripted driving.
      if (direct) expect(run.elapsed / 60).toBeLessThan(15);
    } finally {
      sim.physics.free();
    }
  }, 900_000);
}
