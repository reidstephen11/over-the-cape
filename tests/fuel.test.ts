import { describe, expect, it } from 'vitest';
import { crebEpisode } from '../src/data/episodes/creb';
import { vehicleLoadout, vehicleOrder, vehicles } from '../src/data/vehicles';
import { applyCheckpoint, startCheckpoint } from '../src/sim/episode';
import { measureFuel } from './helpers/fuel';
import { makeScene } from './helpers/scenes';

describe('vehicle fuel', () => {
  it('never starts or restores more fuel than the real tank holds, including when changing vehicle', async () => {
    const fullTroopy = { ...startCheckpoint(crebEpisode, 'start', 'troopy'), fuel: 180 };
    for (const id of vehicleOrder) {
      const tuning = vehicles[id].tuning;
      const tank = tuning.engine.fuel.tankLitres;
      expect(vehicleLoadout({ ...crebEpisode.loadout, fuel: 1000 }, id).fuel).toBe(tank);
      const scene = await makeScene({ tuning });
      try {
        applyCheckpoint(scene.vehicle, fullTroopy);
        expect(scene.vehicle.condition.fuel).toBe(tank);
        expect(vehicleLoadout(crebEpisode.loadout, id).fuel).toBeLessThanOrEqual(tank);
      } finally {
        scene.physics.world.free();
      }
    }
  });

  // Broad consumption bands for these loaded, equipped vehicles on level dirt. They
  // catch unit errors and inflated idle burn, without claiming a certified road cycle.
  const cases = [
    ['shortie', 14, 23],
    ['camel', 14, 23],
    ['perentie', 8, 15],
    ['hilux', 9, 16],
    ['unimog', 20, 30],
    ['troopy', 11, 19],
    ['patrol', 10, 18],
    ['lc79', 13, 24],
    ['sooty80', 12, 24],
  ] as const;
  it.each(cases)(
    '%s uses plausible idle and light-road fuel before episode scaling',
    async (id, min, max) => {
      const t = vehicles[id].tuning;
      const result = await measureFuel(t, id === 'unimog' ? 40 : 60);
      expect(result.idleLitresPerHour).toBeGreaterThanOrEqual(t.engine.fuel.idleLitresPerHour);
      expect(result.idleLitresPerHour).toBeLessThan(t.engine.fuel.idleLitresPerHour + 0.6);
      expect(result.litresPer100Km).toBeGreaterThan(min);
      expect(result.litresPer100Km).toBeLessThan(max);
      expect(result.averageKmh).toBeGreaterThan(id === 'unimog' ? 34 : 50);
      expect(result.averageKmh).toBeLessThan(id === 'unimog' ? 40 : 60);
    },
  );
});
