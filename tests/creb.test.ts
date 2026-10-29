import { describe, expect, it } from 'vitest';
import { camelTuning } from '../src/data/camel';
import { environmentAt, lateAfternoon } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { hiluxTuning } from '../src/data/hilux';
import { perentieTuning } from '../src/data/perentie';
import { troopyTuning } from '../src/data/troopy';
import { patrolTuning } from '../src/data/patrol';
import { lc79Tuning } from '../src/data/lc79';
import { unimogTuning } from '../src/data/unimog';
import { vehicleTuning } from '../src/data/vehicle';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { emptyInput } from '../src/sim/input/vehicleInput';
import { loadRapier } from '../src/sim/physics';
import { Simulation } from '../src/sim/sim';
import { NO_WATER } from '../src/sim/world/terrain';
import { buildWorld } from '../src/sim/world/world';
import { SurfaceId } from '../src/data/surfaces';
import { addPuddles } from '../src/sim/world/puddles';
import { winchTuning } from '../src/data/tools';
import { crebWashout } from '../src/data/episodes/crebStretches';
import { Autopilot } from '../src/sim/input/autopilot';
import { DT, driveLeg, driver, runLeg } from './helpers/drive';

const world = buildWorld(crebMap);
const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
const { trackOf, scene } = driver(world, wet);
const dry = driver(world, lateAfternoon);

describe('Episode 1: the CREB Track', () => {
  it('is a long, narrow map with about 6.5 km of track from Daintree Village to the Lions Den', () => {
    expect([crebMap.width, crebMap.length]).toEqual([1280, 6144]);
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
    expect(length).toBeGreaterThan(6300);
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

  it('matches its terrain collider to the ground all along the strip', async () => {
    const R = await loadRapier();
    const sim = new Simulation(R, world, wet);
    try {
      sim.step(new Map(), 1 / 60);
      let worst = 0;
      for (let k = 0; k < 300; k++) {
        // Off the 1 m grid lines, where a ray straight down can slip between the cells.
        const x = ((k * 37) % 1000) - 500 + 0.37;
        const z = ((k * 1201) % 5800) - 2900 + 0.61;
        const hit = sim.physics.world.castRay(
          new R.Ray({ x, y: 1000, z }, { x: 0, y: -1, z: 0 }),
          2000,
          true,
          undefined,
          undefined,
          undefined,
          undefined,
          (c) => c.handle === sim.physics.terrainCollider?.handle,
        );
        worst = Math.max(worst, Math.abs(1000 - (hit?.timeOfImpact ?? 0) - world.terrain.heightAt(x, z)));
      }
      expect(worst).toBeLessThan(0.01);
    } finally {
      sim.physics.free();
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
          const wi = t.index(bx, bz);
          if (t.inBounds(bx, bz) && t.water[wi] <= NO_WATER && world.features.trackDistance[wi] > 2)
            expect(t.heightAt(bx, bz), `${c.def.id} at ${k}`).toBeGreaterThan(c.water[k] - 0.05);
        }
      }
    }
    // Straight across the Daintree is over a metre deep; along the weaving line over the bar
    // downstream it is little more than half that.
    const i = t.index(-25, 2238);
    expect(t.water[i] - t.heights[i]).toBeGreaterThan(0.9);
    const crossing = trackOf('daintree-crossing');
    let wettest = 0;
    for (let s = 0; s <= crossing.poly.length; s += 0.5) {
      const p = trailPoint(crossing, s);
      wettest = Math.max(wettest, t.waterDepthAt(p.x, p.z));
    }
    expect(wettest).toBeGreaterThan(0.5);
    expect(wettest).toBeLessThan(0.85);
  });

  it('strews the bar with boulders and scour holes across the straight line, leaving a line between them', () => {
    const t = world.terrain;
    const crossing = trackOf('daintree-crossing');
    // The straight line over the bar, from where the track meets the water to where it leaves.
    const wet = Array.from({ length: Math.ceil(crossing.poly.length) }, (_, s) =>
      trailPoint(crossing, s),
    ).filter((p) => t.waterDepthAt(p.x, p.z) > 0.05);
    const [a, b] = [wet[0], wet[wet.length - 1]];
    const hazards = [
      ...crebMap.boulders.map((r) => ({ x: r.x, z: r.z, size: r.radius })),
      ...crebMap.creeks
        .find((c) => c.id === 'daintree')!
        .holes!.map((h) => ({ x: h.x, z: h.z, size: h.radius })),
    ];
    const onStraight = hazards.filter((h) => {
      const u =
        ((h.x - a.x) * (b.x - a.x) + (h.z - a.z) * (b.z - a.z)) / ((b.x - a.x) ** 2 + (b.z - a.z) ** 2);
      if (u < 0 || u > 1) return false;
      return Math.hypot(a.x + (b.x - a.x) * u - h.x, a.z + (b.z - a.z) * u - h.z) < h.size + 0.9;
    });
    expect(onStraight.length).toBeGreaterThanOrEqual(3);
    // The weaving line keeps a car's width and more clear of every one.
    for (const h of hazards) {
      if (Math.hypot(h.x - 10, h.z - 2238) > 40) continue;
      const near = trailProgress(crossing, h.x, h.z).distance - h.size;
      expect(near, `${h.x}, ${h.z}`).toBeGreaterThan(2);
    }
    // The holes are deeper than the bar round them.
    for (const h of crebMap.creeks.find((c) => c.id === 'daintree')!.holes!)
      expect(t.waterDepthAt(h.x, h.z)).toBeGreaterThan(0.95);
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
        // (A mud hole is a hollow by design.)
        const bog = world.features.mudHoles.some((b) => Math.hypot(b.x - p.x, b.z - p.z) < b.radiusZ + 3);
        if (Math.min(...banks) > 1.5 && !bog) trenches.push(`${track.def.id}@${s}`);
      }
    }
    expect(trenches).toEqual([]);
  });

  it("lets the Land Rover reverse up the concrete's bend without climbing a wall", async () => {
    // Where a player reversing up the descent stuck on the cutting's wall, tilted 40° (v0.02).
    const sim = new Simulation(await loadRapier(), world, wet);
    try {
      const v = sim.addVehicle('p', sim.poseAt(-68, -411, 312, perentieTuning.wheelRadius), perentieTuning);
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
      // Reversing straight while the track bends, it runs up onto the laid-back bank, tilting
      // with the climb, but not onto a wall: before v0.04 it reached 40°.
      expect(tilt).toBeLessThan(35);
      // ...and gets back up the track past where it stuck.
      const descent = trackOf('concrete-descent');
      expect(
        trailProgress(descent, -68, -411).along - trailProgress(descent, v.position.x, v.position.z).along,
      ).toBeGreaterThan(11);
    } finally {
      sim.physics.free();
    }
  });

  it('has mud holes in its roads and range tracks, and holds water in the saddle bog after rain', () => {
    const holes = [...world.features.mudHoles, ...world.map.bogs];
    const on = new Set(holes.map((b) => b.id.replace(/-mud-\d+$/, '')));
    for (const id of ['paddock-road', 'creb-ridge', 'bloomfield-track', 'upper-daintree-road'])
      expect(on.has(id), id).toBe(true);
    // The saddle still has its hollow, and the roads carry authored bogs as well.
    expect(holes.length).toBeGreaterThan(8);
    for (const b of holes)
      expect(world.terrain.surfaceAt(b.x, b.z), b.id).toBe(b.deep ? SurfaceId.BlackSoil : SurfaceId.Mud);
    // The rain fills most of them (those on a slope drain at their low end), hiding the mud.
    const after = buildWorld(crebMap);
    addPuddles(after, wet);
    const deepest = (b: (typeof holes)[number]) => {
      let d = 0;
      for (let dz = -4; dz <= 4; dz++)
        for (let dx = -4; dx <= 4; dx++) d = Math.max(d, after.terrain.waterDepthAt(b.x + dx, b.z + dz));
      return d;
    };
    // The saddle holds water. The long stretch below camp sits on a grade and drains.
    // Authored road bogs are not filled here: puddles only see generated mud holes.
    const deepWater = after.features.mudHoles.filter((b) => b.deep).map((b) => deepest(b));
    expect(deepWater.length).toBeGreaterThan(0);
    expect(deepWater.every((d) => d > 0.3)).toBe(true);
  });

  it('makes deep bogs of the hollows, lays long boggy stretches, and plants a tree to winch from by each', () => {
    const holes = world.features.mudHoles;
    const deep = holes.filter((b) => b.deep);
    // The saddle is still a real hollow. The road bogs are dug across the wheel lines.
    expect(deep.some((b) => b.id.startsWith('creb-ridge'))).toBe(true);
    for (const b of deep) {
      expect(b.depth, b.id).toBeGreaterThan(0.55);
      // A hollow: the ground all round stands above it.
      for (let q = 0; q < 8; q++) {
        const a = (q / 8) * Math.PI * 2;
        const ring = world.terrain.heightAt(b.x + Math.cos(a) * 18, b.z + Math.sin(a) * 18);
        expect(ring, b.id).toBeGreaterThan(world.terrain.heightAt(b.x, b.z));
      }
    }
    for (const b of world.map.bogs) {
      expect(b.deep, b.id).toBe(true);
      // Creek-bank bogs are sticky but shallower, so a locked crawl can just get through.
      expect(b.depth, b.id).toBeGreaterThan(b.id.includes('-creek-') ? 0.3 : 0.6);
      // Authored bogs are not planted with trees by the shared scatter, so a marked boulder
      // stands in reach. Creek-bank bogs share the far-bank rock within the 30 m cable.
      const reach = b.id.includes('-creek-') ? winchTuning.cableLength : 16;
      const anchor = world.scatter.rocks.find(
        (r) => r.anchor && r.solid && Math.hypot(r.x - b.x, r.z - b.z) < reach,
      );
      expect(anchor, b.id).toBeDefined();
    }
    // Long stretches are chains of hollows along the track, 25 m and more.
    const long = holes.filter((b) => !b.deep && b.radiusZ < 6 && b.winchTrees);
    expect(long.length).toBeGreaterThanOrEqual(2);
    for (const b of holes.filter((h) => h.winchTrees)) {
      const trees = world.scatter.trees.filter(
        (t) => t.solid && Math.hypot(t.x - b.x, t.z - b.z) < b.radiusZ + winchTuning.cableLength - 8,
      );
      expect(trees.length, b.id).toBeGreaterThan(0);
    }
  });

  it('is boggy black soil off the tracks over most of the flat ground, but not on them, their banks or at camp', () => {
    const t = world.terrain;
    const f = world.features;
    let soil = 0;
    let flat = 0;
    for (let z = -2600; z <= 2600; z += 3)
      for (let x = -300; x <= 300; x += 3) {
        const i = t.index(x, z);
        if (f.trackDistance[i] < 7 || f.creekDistance[i] < 3 || t.slopeDegAt(x, z) > 10) continue;
        flat++;
        if (t.surface[i] === SurfaceId.BlackSoil) soil++;
        // Along the tracks and their banks the ground is firm.
      }
    expect(soil / flat).toBeGreaterThan(0.6);
    for (const track of f.tracks)
      for (let s = 0; s <= track.poly.length; s += 5) {
        const p = trailPoint(track, s);
        expect(
          t.surfaceAt(p.x, p.z) === SurfaceId.BlackSoil &&
            ![...world.features.mudHoles, ...world.map.bogs].some(
              (b) => b.deep && Math.hypot(b.x - p.x, b.z - p.z) < Math.max(b.radiusX, b.radiusZ) + 2,
            ),
          `${track.def.id}@${s}`,
        ).toBe(false);
        for (const side of [-1, 1]) {
          const q = trailPoint(track, s, side * (track.def.width / 2 + 3));
          if (t.waterDepthAt(q.x, q.z) > 0) continue;
          // A road bog is wider than the shoulders, so its black soil reaches the bank sample.
          if (
            world.map.bogs.some((b) => Math.hypot(b.x - q.x, b.z - q.z) < Math.max(b.radiusX, b.radiusZ) + 2)
          )
            continue;
          expect(t.surfaceAt(q.x, q.z), `${track.def.id}@${s} bank`).not.toBe(SurfaceId.BlackSoil);
        }
      }
    for (const camp of world.pois.filter((p) => p.reset))
      expect(t.surfaceAt(camp.reset!.x, camp.reset!.z), camp.id).not.toBe(SurfaceId.BlackSoil);
  });

  it('plants marked winch rocks along Big Red, just right of the crown and ahead of each pinch', () => {
    const track = trackOf('big-red');
    for (const along of [62, 88, 128, 152]) {
      const p = trailPoint(track, along);
      const rock = world.scatter.rocks.find(
        (r) => r.anchor && r.solid && Math.hypot(r.x - p.x, r.z - p.z) < 6,
      );
      expect(rock, `along ${along}`).toBeDefined();
      const at = trailProgress(track, rock!.x, rock!.z);
      expect(at.along, `along ${along}`).toBeGreaterThan(along - 4);
      expect(at.distance, `along ${along}`).toBeGreaterThan(3);
      expect(at.distance, `along ${along}`).toBeLessThan(6);
    }
  });

  it('climbs Big Red in the dry in the Camel Trophy Ninety in low range with both lockers, without boiling', async () => {
    const s = await dry.scene('big-red', false, 'both', camelTuning);
    try {
      await driveLeg(s, s.track, false, 200);
      expect(s.v.condition.engineHeat).toBeLessThan(0.85);
    } finally {
      s.sim.physics.free();
    }
  }, 300_000);

  it('stops the Camel Trophy Ninety on Big Red in high range in the dry', async () => {
    const s = await dry.scene('big-red', false, 'high', camelTuning);
    try {
      const r = await runLeg(s, s.track, false, 90);
      expect(r.done).toBe(false);
      expect(r.remaining).toBeGreaterThan(60);
    } finally {
      s.sim.physics.free();
    }
  }, 300_000);

  it('winches the Camel Trophy Ninety up Big Red from a stall on either pinch', async () => {
    const track = trackOf('big-red');
    for (const from of [40, 110]) {
      const sim = new Simulation(await loadRapier(), world, lateAfternoon);
      try {
        const start = trailPoint(track, from);
        const v = sim.addVehicle(
          'p',
          sim.poseAt(start.x, start.z, start.headingDeg, camelTuning.wheelRadius),
          camelTuning,
        );
        const inputs = new Map([['p', { ...emptyInput(), brake: 1, handbrake: true }]]);
        for (let i = 0; i < 90; i++) sim.step(inputs, DT);
        v.toggleRange();
        v.precisionCrawl = true;
        for (const axle of ['front', 'rear'] as const) if (!v.differentials[axle]) v.toggleDiff(axle);
        const along0 = trailProgress(track, v.position.x, v.position.z).along;
        const anchors = sim.findAnchors('p');
        expect(anchors.length, `${from} m: USE finds nothing in cable range`).toBeGreaterThan(0);
        const best = sim.toolsOf('p').bestAnchor(v, anchors);
        expect(best, `${from} m`).toBeTruthy();
        const at = trailProgress(track, best!.point.x, best!.point.z);
        expect(at.along, `${from} m: USE should pick a rock ahead`).toBeGreaterThan(along0 + 8);
        expect(best!.point.y, `${from} m`).toBeGreaterThan(v.position.y);
        sim.attachTo('p', best!);
        expect(sim.toolsOf('p').winch.attached).toBe(true);
        for (let t = 0; t < 18; t += DT) {
          for (const axle of ['front', 'rear'] as const) if (!v.differentials[axle]) v.toggleDiff(axle);
          inputs.set('p', { ...emptyInput(), throttle: 1, winchIn: true });
          sim.step(inputs, DT);
        }
        const along1 = trailProgress(track, v.position.x, v.position.z).along;
        expect(
          along1 - along0,
          `${from} m: winch advanced ${(along1 - along0).toFixed(1)} m`,
        ).toBeGreaterThan(6);
      } finally {
        sim.physics.free();
      }
    }
  }, 180_000);

  it('creeps Big Red on the crown in low range with both lockers, and stalls in the left gutter or in high range', async () => {
    const driveLine = async (lateral: number, lockers: 'both' | 'high', limit: number) => {
      const s = await scene('big-red', false, lockers, vehicleTuning);
      try {
        const high = lockers === 'high';
        const path: [number, number][] = [];
        for (let along = 0; along <= s.track.poly.length; along += 0.5) {
          const p = trailPoint(s.track, along, lateral);
          path.push([p.x, p.z]);
        }
        const pilot = new Autopilot(path, high ? 1.5 : 0.7);
        pilot.lowRange = !high;
        let time = 0;
        for (let step = 0; time < limit; time += DT, step++) {
          if (step % 600 === 599) await new Promise((resolve) => setImmediate(resolve));
          const command = pilot.input(s.v, DT);
          if (pilot.done) break;
          if (!high) {
            command.throttle = 1;
            command.brake = 0;
          }
          for (const axle of ['front', 'rear'] as const)
            if (s.v.differentials[axle] !== s.lockers[axle]) s.v.toggleDiff(axle);
          s.inputs.set('p', command);
          s.sim.step(s.inputs, DT);
        }
        return { done: pilot.done, remaining: pilot.remaining(s.v) };
      } finally {
        s.sim.physics.free();
      }
    };
    const crown = await driveLine(0, 'both', 180);
    expect(crown.done, `crown stopped ${crown.remaining.toFixed(0)} m short`).toBe(true);
    // A line drifted onto the left gutter high-centres before the steepest of the face.
    const gutter = await driveLine(-1.15, 'both', 90);
    expect(gutter.done).toBe(false);
    expect(gutter.remaining).toBeGreaterThan(60);
    const high = await driveLine(0, 'high', 90);
    expect(high.done).toBe(false);
    expect(high.remaining).toBeGreaterThan(60);
  }, 300_000);

  it('stops high range and open diffs on its wet clay climbs', async () => {
    for (const id of ['big-red', 'bobs-hill'])
      for (const tuning of [
        vehicleTuning,
        perentieTuning,
        hiluxTuning,
        troopyTuning,
        patrolTuning,
        lc79Tuning,
      ])
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
    ['creb-ridge', 'both', 700],
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
        // Bogged in a deep bog, it winches out to a tree ahead; it bridges the ridge's washout.
        const planks = id === 'creb-ridge' ? crebWashout : undefined;
        const r = await driveLeg(s, s.track, false, limit, true, planks);
        // The rock ledge out of Roaring Meg pitches the car up to 43°.
        expect(r.tilt).toBeLessThan(id === 'roaring-meg-climb' ? 45 : 42);
        expect(s.v.condition.flood.stalled).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }, 300_000);

  it('stops the Unimog in high range on its wet clay climbs, and on Big Red with open diffs', async () => {
    for (const [id, lockers] of [
      ['big-red', 'high'],
      ['big-red', 'open'],
      ['bobs-hill', 'high'],
    ] as const) {
      const s = await scene(id, false, lockers, unimogTuning);
      try {
        const r = await runLeg(s, s.track, false, 150);
        expect(r.done, `${id}, ${lockers}`).toBe(false);
      } finally {
        s.sim.physics.free();
      }
    }
  }, 900_000);

  it("climbs Bob's Hill in the wet in the Unimog in low range with open diffs, where the others need both lockers", async () => {
    const s = await scene('bobs-hill', false, 'open', unimogTuning);
    try {
      await driveLeg(s, s.track, false, 200);
    } finally {
      s.sim.physics.free();
    }
  }, 300_000);

  for (const tuning of [perentieTuning, hiluxTuning, unimogTuning, troopyTuning, patrolTuning, lc79Tuning])
    for (const id of ['big-red', 'bobs-hill'])
      it(`drives ${id} in the wet in the ${tuning.name}`, async () => {
        const s = await scene(id, false, 'both', tuning);
        try {
          await driveLeg(s, s.track, false, 200);
        } finally {
          s.sim.physics.free();
        }
      }, 300_000);
});
