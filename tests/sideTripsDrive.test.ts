import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebSideTrips } from '../src/data/episodes/crebSideTrips';
import { vehicleTuning } from '../src/data/vehicle';
import { buildWorld } from '../src/sim/world/world';
import { driveLeg, driver, steepest } from './helpers/drive';

const world = buildWorld(crebMap);
const { scene, trackOf } = driver(world, environmentAt(13, 'wet'));

describe('Last pole survey detour', () => {
  it('connects to the hut, has a turning clearing and reachable stops on dry land', () => {
    const track = trackOf('last-pole-track');
    expect(track.poly.xs[0]).toBeCloseTo(-95);
    expect(track.poly.zs[0]).toBeCloseTo(-85);
    expect(steepest(track)).toBeLessThan(20);
    for (const trip of crebSideTrips)
      for (const stop of trip.stops) {
        const poi = world.pois.find((p) => p.id === stop.poi)!;
        expect(poi, stop.poi).toBeDefined();
        // Each objective has drivable land in reach; the falls are viewed from the spur.
        const onTrack = world.features.tracks.some((t) =>
          Array.from({ length: t.poly.count }, (_, i) => i).some(
            (i) => Math.hypot(t.poly.xs[i] - poi.x, t.poly.zs[i] - poi.z) < (stop.radius ?? 10),
          ),
        );
        const inClearing = crebMap.flats.some(
          (flat) =>
            Math.hypot(flat.x - poi.x, flat.z - poi.z) < flat.radius &&
            world.terrain.slopeDegAt(poi.x, poi.z) < 15,
        );
        expect(onTrack || inClearing, stop.poi).toBe(true);
      }
    expect(world.terrain.slopeDegAt(-184, 4)).toBeLessThan(10);
    expect(world.terrain.waterDepthAt(-184, 4)).toBe(0);
  });

  for (const back of [false, true])
    it(`drives the new spur ${back ? 'back to the hut' : 'to the clearing'} in the wet`, async () => {
      const s = await scene('last-pole-track', back, 'both', vehicleTuning);
      try {
        const result = await driveLeg(s, s.track, back, 160);
        expect(result.tilt).toBeLessThan(30);
      } finally {
        s.sim.physics.free();
      }
    }, 120_000);
});
