import { describe, expect, it } from 'vitest';
import { frenchmansMap } from '../src/data/episodes/frenchmansMap';
import { frenchmansEpisode } from '../src/data/episodes/frenchmans';
import { buildWorld } from '../src/sim/world/world';
import { unlocked } from '../src/sim/save/save';
import { saveData } from './helpers/saves';

const world = buildWorld(frenchmansMap);

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
      [1660, 0],
      [2110, 0],
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
});
