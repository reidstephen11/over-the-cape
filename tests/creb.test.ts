import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { perentieTuning } from '../src/data/perentie';
import { vehicleTuning } from '../src/data/vehicle';
import { trailPoint } from '../src/sim/world/crawlTrail';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { NO_WATER } from '../src/sim/world/terrain';
import { buildWorld } from '../src/sim/world/world';
import { SurfaceId } from '../src/data/surfaces';
import { addPuddles } from '../src/sim/world/puddles';
import { driveLeg, driver, runLeg } from './helpers/drive';

const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { trackOf, scene } = driver(world, wet);

describe('Episode 1: the CREB Track', () => {
  it('is a 3 km map with about 5 km of track from Daintree Village to the Lions Den', () => {
    expect(crebMap.size).toBe(3072);
    const route = [
      'upper-daintree-road',
      'daintree-crossing',
      'paddock-road',
      'big-red',
      'creb-ridge',
      'roaring-meg-climb',
      'bobs-hill',
      'range-top',
      'concrete-descent',
      'donovans-creek',
      'bloomfield-bridge',
      'bloomfield-track',
    ];
    const length = route.reduce((sum, id) => sum + trackOf(id).poly.length, 0);
    expect(length).toBeGreaterThan(4500);
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
    expect(ids.has(crebEpisode.goal)).toBe(true);
    expect(world.pois.find((p) => p.id === crebEpisode.goal)!.kind).toBe('campsite');
    expect(world.pois.filter((p) => p.kind === 'campsite').map((p) => p.id)).toEqual([
      'daintree-village',
      'roaring-meg-camp',
      'bloomfield-camp',
      'lions-den',
    ]);
    for (const id of Object.keys(crebEpisode.notes)) expect(ids.has(id), id).toBe(true);
    // Every camp's start position is on level ground, clear of the water.
    for (const camp of world.pois.filter((p) => p.reset)) {
      const r = camp.reset!;
      expect(world.terrain.slopeDegAt(r.x, r.z), camp.id).toBeLessThan(12);
      expect(world.terrain.waterSurfaceAt(r.x, r.z), camp.id).toBeNull();
    }
  });

  it('keeps every creek and river below its banks, with a shallow line across the Daintree', () => {
    const t = world.terrain;
    for (const c of world.features.creeks) {
      for (let k = 0; k < c.poly.count; k += 8) {
        const x = c.poly.xs[k];
        const z = c.poly.zs[k];
        if (!t.inBounds(x, z)) continue;
        // A little way out from each bank the ground stands above the water.
        const dx = c.poly.zs[Math.min(c.poly.count - 1, k + 1)] - z;
        const dz = x - c.poly.xs[Math.min(c.poly.count - 1, k + 1)];
        const len = Math.hypot(dx, dz) || 1;
        const out = c.halfWidth[k] + 3;
        for (const side of [-1, 1]) {
          const bx = x + (dx / len) * out * side;
          const bz = z + (dz / len) * out * side;
          // (Where two creeks meet the bank can be the other one's water, and a track's
          // ramp into a crossing can dip to the water's edge.)
          const wi = Math.round(bz + t.half) * t.res + Math.round(bx + t.half);
          if (t.inBounds(bx, bz) && t.water[wi] <= NO_WATER && world.features.trackDistance[wi] > 2)
            expect(t.heightAt(bx, bz), `${c.def.id} at ${k}`).toBeGreaterThan(c.water[k] - 0.05);
        }
      }
    }
    // Straight across the Daintree is over a metre deep; the bar downstream is about half that.
    const i = Math.round(1034 + t.half) * t.res + Math.round(-1010 + t.half);
    expect(t.water[i] - t.heights[i]).toBeGreaterThan(0.9);
    const bar = Math.round(1036 + t.half) * t.res + Math.round(-994 + t.half);
    expect(t.water[bar]).toBeGreaterThan(NO_WATER);
    expect(t.water[bar] - t.heights[bar]).toBeLessThan(0.65);
  });

  it('roughs up its roads and tracks after the wet, but not the concrete or the river crossing', () => {
    const t = world.terrain;
    const survey = (id: string) => {
      const track = trackOf(id);
      // Along the left wheel line: how sharply the ground bends (bumps), and the holes crossed.
      let bend = 0;
      let n = 0;
      let holes = 0;
      let inHole = false;
      for (let s = 15; s < track.poly.length - 15; s += 1) {
        const [a, b, c] = [s - 1, s, s + 1].map((k) => {
          const p = trailPoint(track, k, 0.75);
          return t.heightAt(p.x, p.z);
        });
        bend += Math.abs(a - 2 * b + c);
        n++;
        for (const lateral of [-0.75, 0.75]) {
          const p = trailPoint(track, s, lateral);
          const hole = t.holeAt(p.x, p.z) > 0;
          if (hole && !inHole) holes++;
          inHole = hole;
        }
      }
      return { bumps: bend / n, holes, length: track.poly.length };
    };
    const concrete = survey('concrete-descent');
    expect(concrete.holes).toBe(0);
    expect(survey('daintree-crossing').holes).toBe(0);
    for (const id of ['paddock-road', 'creb-ridge', 'bloomfield-track']) {
      const r = survey(id);
      expect(r.bumps, id).toBeGreaterThan(concrete.bumps * 2);
      // A pothole or washout in a wheel line every 50 m or so at least.
      expect(r.holes, id).toBeGreaterThan(r.length / 50);
    }
  });

  it('lays its cuttings back, so no track runs in a trench', () => {
    // Without batters, Big Red, the bypass, Bob's Hill, the range top and the concrete ran
    // between clay walls a car could climb and stick on (v0.02).
    const t = world.terrain;
    const trenches: string[] = [];
    for (const track of world.features.tracks) {
      const out = track.def.width / 2 + 3;
      for (let s = 0; s <= track.poly.length; s += 2) {
        const p = trailPoint(track, s);
        const h = (p.headingDeg * Math.PI) / 180;
        const [nx, nz] = [Math.cos(h), Math.sin(h)];
        // The road's surface, stepping over any washout or pothole right under this point.
        const road = Math.max(
          ...[-1.5, 0, 1.5].map((ds) => {
            const q = trailPoint(track, Math.min(track.poly.length, Math.max(0, s + ds)));
            return t.heightAt(q.x, q.z);
          }),
        );
        const banks = [-1, 1].map((side) => t.heightAt(p.x + nx * side * out, p.z + nz * side * out) - road);
        if (Math.min(...banks) > 1.5) trenches.push(`${track.def.id}@${s}`);
      }
    }
    expect(trenches).toEqual([]);
  });

  it("lets the Land Rover reverse up the concrete's bend without climbing the bank", async () => {
    // Where a player reversing up the descent stuck on the cutting's wall, tilted 40° (v0.02).
    const sim = new Simulation(await loadRapier(), world, wet);
    try {
      const v = sim.addVehicle(
        'p',
        sim.poseAt(10.2, -505.4, 332, perentieTuning.wheelRadius),
        perentieTuning,
      );
      const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
      for (let i = 0; i < 90; i++) sim.step(inputs, 1 / 60);
      v.toggleRange();
      // Held brake from a stop is reverse.
      inputs.set('p', { ...emptyInput(), brake: 1 });
      let tilt = 0;
      for (let i = 0; i < 7 * 60; i++) {
        sim.step(inputs, 1 / 60);
        tilt = Math.max(tilt, v.tiltDeg());
      }
      expect(tilt).toBeLessThan(30);
      expect(v.position.z).toBeGreaterThan(-494);
    } finally {
      sim.physics.free();
    }
  });

  it('has mud holes in its roads and range tracks, most of them full of water after rain', () => {
    const holes = world.features.mudHoles;
    const on = new Set(holes.map((b) => b.id.replace(/-mud-\d+$/, '')));
    for (const id of ['paddock-road', 'creb-ridge', 'bloomfield-track']) expect(on.has(id), id).toBe(true);
    expect(holes.length).toBeGreaterThan(15);
    for (const b of holes) expect(world.terrain.surfaceAt(b.x, b.z), b.id).toBe(SurfaceId.Mud);
    // The rain fills most of them (those on a slope drain at their low end), hiding the mud.
    const after = buildWorld(crebMap);
    addPuddles(after, wet);
    const deepest = (b: (typeof holes)[number]) => {
      let d = 0;
      for (let dz = -4; dz <= 4; dz++)
        for (let dx = -4; dx <= 4; dx++) d = Math.max(d, after.terrain.waterDepthAt(b.x + dx, b.z + dz));
      return d;
    };
    const wetHoles = after.features.mudHoles.map(deepest);
    expect(wetHoles.filter((d) => d > 0.05).length).toBeGreaterThan(holes.length / 2);
    expect(Math.max(...wetHoles)).toBeGreaterThan(0.3);
  });

  it('stops high range and open diffs on its wet clay climbs', async () => {
    for (const id of ['big-red', 'bobs-hill'])
      for (const tuning of [vehicleTuning, perentieTuning])
        for (const lockers of ['high', 'open'] as const) {
          const s = await scene(id, false, lockers, tuning);
          try {
            const r = await runLeg(s, s.track, false, 150);
            expect(r.done, `${id}, ${tuning.name}, ${lockers}`).toBe(false);
          } finally {
            s.sim.physics.free();
          }
        }
  }, 900_000);

  const legs: [string, 'both' | 'high', number][] = [
    ['daintree-crossing', 'both', 150],
    ['big-red', 'both', 200],
    ['big-red-bypass', 'both', 400],
    ['creb-ridge', 'both', 400],
    ['roaring-meg-climb', 'both', 300],
    ['bobs-hill', 'both', 200],
    ['concrete-descent', 'both', 300],
    ['donovans-creek', 'both', 200],
    ['bloomfield-bridge', 'high', 60],
  ];
  for (const [id, lockers, limit] of legs)
    it(`drives ${id} in the wet in the short-wheelbase 4WD`, async () => {
      const s = await scene(id, false, lockers, vehicleTuning);
      try {
        const r = await driveLeg(s, s.track, false, limit);
        expect(r.tilt).toBeLessThan(42);
        expect(s.v.condition.flood.stalled).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);

  for (const id of ['big-red', 'bobs-hill'])
    it(`drives ${id} in the wet in the Land Rover Perentie`, async () => {
      const s = await scene(id, false, 'both', perentieTuning);
      try {
        await driveLeg(s, s.track, false, 200);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);
});
