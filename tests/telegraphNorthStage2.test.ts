import { describe, expect, it } from 'vitest';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import { telegraphNorthMap } from '../src/data/episodes/telegraphNorthMap';
import {
  ELIOT_FALLS_X,
  ELIOT_STOP,
  ELIOT_TURNOFF,
  FRUIT_BAT_FORK,
  FRUIT_BAT_STOP,
  TWIN_FALLS_X,
  northLevels,
} from '../src/data/episodes/telegraphNorthRoute';
import { SurfaceId, surfaces } from '../src/data/surfaces';
import { SideTrips } from '../src/sim/sideTrips';
import { strandedPose } from '../src/sim/stranded';
import { trailPoint, trailProgress } from '../src/sim/world/crawlTrail';
import { planSurprises } from '../src/sim/world/surprisePlan';
import { steepest } from './helpers/drive';
import { telegraphNorthWorld } from './world';

/**
 * The northern Telegraph Track, stage 2 (v2.21): the two turn-offs to the falls, a 4WD coming
 * the other way, a traveller drowned in Nolans Brook, and a dead tree down on the long drive.
 */
const world = telegraphNorthWorld();
const t = world.terrain;
const ep = telegraphNorthEpisode;
const track = (id: string) => world.features.tracks.find((x) => x.def.id === id)!;
const creek = (id: string) => telegraphNorthMap.creeks.find((c) => c.id === id)!;

describe('the northern Telegraph Track, stage 2: the falls', () => {
  it('forks right to Fruit Bat Falls soon after the turn-off, and right again to Eliot and Twin Falls just before Canal Creek', () => {
    const road = track('turnoff-road');
    for (const [id, at, stop] of [
      ['fruit-bat-track', FRUIT_BAT_FORK, FRUIT_BAT_STOP],
      ['eliot-track', ELIOT_TURNOFF, ELIOT_STOP],
    ] as const) {
      const side = track(id);
      // It starts on the main track, where the plan says.
      const start = trailPoint(side, 0);
      const on = trailProgress(road, start.x, start.z);
      expect(on.distance, id).toBeLessThan(0.5);
      expect(Math.abs(on.along - at), id).toBeLessThan(2);
      // It goes east: to the right of a car heading north.
      const end = trailPoint(side, side.poly.length);
      expect(end.x - start.x, id).toBeGreaterThan(100);
      expect(Math.hypot(end.x - stop[0], end.z - stop[1]), id).toBeLessThan(1);
      // Easy sand: nowhere steeper than 8° over 5 m, and dry all the way.
      expect(steepest(side, 5), id).toBeLessThan(8);
      for (let s = 0; s <= side.poly.length; s += 2) {
        const p = trailPoint(side, s);
        expect(t.waterDepthAt(p.x, p.z), `${id} at ${s}`).toBe(0);
      }
    }
    // Fruit Bat's fork is in the first quarter of the road; the Eliot turn-off is in its last 30 m.
    expect(FRUIT_BAT_FORK).toBeLessThan(road.poly.length / 4);
    expect(road.poly.length - ELIOT_TURNOFF).toBeLessThan(30);
    expect(road.poly.length - ELIOT_TURNOFF).toBeGreaterThan(8);
    // 215 m and 160 m of side track: a detour of about 750 m there and back for both.
    expect(track('fruit-bat-track').poly.length).toBeGreaterThan(190);
    expect(track('fruit-bat-track').poly.length).toBeLessThan(240);
    expect(track('eliot-track').poly.length).toBeGreaterThan(140);
    expect(track('eliot-track').poly.length).toBeLessThan(180);
  });

  it('drops Fruit Bat’s creek 2.2 m over a wide lip into a pool, in sight of the stop, and never across the track', () => {
    const c = creek('fruit-bat-creek');
    const lip = c.points.findIndex((p) => p.water === northLevels.fruitBatTop);
    const pool = c.points[lip + 1];
    expect(c.points[lip].water - pool.water).toBeCloseTo(2.2, 1);
    expect(Math.hypot(pool.x - c.points[lip].x, pool.z - c.points[lip].z)).toBeLessThan(8);
    // Wide: 24 m across at the lip, 26 m of pool.
    expect(c.points[lip].halfWidth).toBeGreaterThanOrEqual(11);
    expect(pool.halfWidth).toBeGreaterThanOrEqual(12);
    // The pool is deep enough to swim in and the water above the falls is ankle to knee deep.
    expect(t.waterDepthAt(pool.x, pool.z - 8)).toBeGreaterThan(1.2);
    expect(t.waterDepthAt(c.points[lip].x, c.points[lip].z + 6)).toBeLessThan(0.7);
    // The stop is on dry ground above the pool, 15 to 40 m from the falls and from the pool's middle.
    const [sx, sz] = FRUIT_BAT_STOP;
    expect(t.waterDepthAt(sx, sz)).toBe(0);
    expect(t.heightAt(sx, sz) - pool.water).toBeGreaterThan(1.5);
    const toFalls = Math.hypot(pool.x - sx, pool.z - sz);
    expect(toFalls).toBeGreaterThan(15);
    expect(toFalls).toBeLessThan(40);
    // The creek stays east of the main route everywhere.
    for (const p of c.points) expect(p.x).toBeGreaterThan(200);
    // It takes the small creeks' share of the rain's rise.
    expect(ep.storm!.creeks!.shares!['fruit-bat-creek']).toBe(0.35);
  });

  it('puts Eliot Falls and Twin Falls on Canal Creek above the crossing, either side of the camping area, and leaves the crossing as it was', () => {
    const c = creek('canal-creek');
    const level = (x: number) => c.points.find((p) => p.x === x)!.water;
    const eliot = level(ELIOT_FALLS_X[0]) - level(ELIOT_FALLS_X[1]);
    const twin = level(TWIN_FALLS_X[0]) - level(TWIN_FALLS_X[1]);
    expect(eliot).toBeCloseTo(1.1, 1);
    expect(twin).toBeCloseTo(1.15, 1);
    for (const [a, b] of [ELIOT_FALLS_X, TWIN_FALLS_X]) expect(a - b).toBeLessThanOrEqual(5);
    // The stop is between the two falls, on dry ground on the south bank, 20 to 45 m from each.
    const [sx, sz] = ELIOT_STOP;
    expect(sx).toBeGreaterThan(TWIN_FALLS_X[0]);
    expect(sx).toBeLessThan(ELIOT_FALLS_X[1]);
    expect(t.waterDepthAt(sx, sz)).toBe(0);
    for (const [a] of [ELIOT_FALLS_X, TWIN_FALLS_X]) {
      const p = c.points.find((q) => q.x === a)!;
      const d = Math.hypot(p.x - sx, p.z - sz);
      expect(d).toBeGreaterThan(20);
      expect(d).toBeLessThan(45);
    }
    // The water above the falls stays below the plain.
    expect(level(520)).toBeLessThan(40 - 0.5);
    // At the crossing the creek's level and the shelf's depth are what they were.
    expect(c.points.find((p) => p.x === 0)!.water).toBe(northLevels.canal);
    expect(t.waterDepthAt(-0.5, 612)).toBeGreaterThan(0.5);
    expect(t.waterDepthAt(-0.5, 612)).toBeLessThan(0.7);
    expect(t.heightAt(-0.5, 612) + t.waterDepthAt(-0.5, 612)).toBeCloseTo(northLevels.canal, 1);
  });

  it('has a place, a note, a sign and a side trip stop for each, and pays one tyre plug for both', () => {
    for (const id of ['fruit-bat-falls', 'eliot-twin-falls']) {
      const poi = telegraphNorthMap.pois.find((p) => p.id === id)!;
      expect(poi.kind).toBe('landmark');
      expect(ep.notes[id], id).toBeDefined();
    }
    expect(ep.notes['fruit-bat-falls'].text).toMatch(/[Dd]ay access only/);
    expect(ep.notes['eliot-twin-falls'].text).toMatch(/just before Canal Creek/);
    const signs = telegraphNorthMap.props.filter((p) => p.kind === 'signpost').map((p) => p.text ?? '');
    expect(signs.some((s) => /Fruit Bat Falls — day use only/.test(s))).toBe(true);
    expect(signs.some((s) => /Eliot and Twin Falls/.test(s))).toBe(true);
    const trips = ep.sideTrips ?? [];
    expect(trips).toHaveLength(1);
    expect(trips[0].anyOrder).toBe(true);
    expect(trips[0].stops.map((s) => s.poi)).toEqual(['fruit-bat-falls', 'eliot-twin-falls']);
    expect(trips[0].reward).toEqual({ plugs: 1 });
    // Parked at each stop for three seconds, in either order, completes it.
    const run = new SideTrips(trips, telegraphNorthMap.pois);
    const stopAt = ([x, z]: readonly [number, number]) => {
      let done = null;
      for (let k = 0; k < 40 && !done; k++) done = run.update(0.1, x, z, true);
      return done;
    };
    expect(stopAt(ELIOT_STOP)?.complete).toBe(false);
    expect(stopAt(FRUIT_BAT_STOP)?.complete).toBe(true);
    // Not on the main route: driving the track itself never offers either stop.
    const fresh = new SideTrips(trips, telegraphNorthMap.pois);
    const road = track('turnoff-road');
    for (let s = 0; s <= road.poly.length; s += 2) {
      const p = trailPoint(road, s);
      expect(fresh.prompt(p.x, p.z), `at ${s}`).toBeNull();
    }
  });
});

describe('the northern Telegraph Track, stage 2: other travellers and a tree down', () => {
  it('sends a 4WD south along the sand between Sam Creek and Mistake Creek', () => {
    expect(ep.traffic?.map((x) => x.track)).toEqual(['sam-mistake']);
    const line = track('sam-mistake');
    expect(line.poly.length).toBeGreaterThan(150);
    // Dry all the way: it never has to ford.
    for (let s = 0; s <= line.poly.length; s += 3) {
      const p = trailPoint(line, s);
      expect(t.waterDepthAt(p.x, p.z)).toBe(0);
    }
  });

  it('leaves a drowned HiLux in Nolans Brook’s old straight line, in reach of the shoal, paying a jerry can', () => {
    const drowned = ep.stranded ?? [];
    expect(drowned).toHaveLength(1);
    const d = drowned[0];
    expect(d.reward).toEqual({ jerryCans: 1 });
    const def = world.map.tracks.find((x) => x.id === d.track)!;
    const pose = strandedPose(
      d,
      def.points.map(([x, z]) => [x, z] as const),
    );
    // In 1.1 to 1.4 m of water at the start of the commonest day: over the bonnet, under the roof.
    const depth = t.waterDepthAt(pose.x, pose.z);
    expect(depth).toBeGreaterThan(1.1);
    expect(depth).toBeLessThan(1.4);
    // On the old straight line across (x = 0), off the shoal's line by more than a car's length.
    expect(Math.abs(pose.x)).toBeLessThan(2);
    const line = track('nolans-brook');
    expect(trailProgress(line, pose.x, pose.z).distance).toBeGreaterThan(6);
    // In the winch's reach (29 m) from the shoal where the line turns, and from the near bank.
    for (const [x, z] of [
      [3, -855],
      [8.5, -860],
      [0, -848],
    ])
      expect(Math.hypot(pose.x - x, pose.z - z)).toBeLessThan(20);
    // Pulled its 6 m towards the shoal it is in water a wheel can stand in.
    const rad = (pose.headingDeg * Math.PI) / 180;
    const out = [pose.x + Math.sin(rad) * d.freeAfter, pose.z - Math.cos(rad) * d.freeAfter] as const;
    expect(t.waterDepthAt(out[0], out[1])).toBeLessThan(0.75);
  });

  it('drops one dead tree a run across the long drive, clear of the bog and of the water', () => {
    const line = track('long-drive');
    const bog = telegraphNorthMap.bogs[0];
    const seen = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const plan = planSurprises(world, ep.surprises!, seed);
      expect(plan, `seed ${seed}`).toHaveLength(1);
      expect(plan[0].kind).toBe('treefall');
      const on = trailProgress(line, plan[0].x, plan[0].z);
      expect(on.distance).toBeLessThan(12);
      expect(on.along).toBeGreaterThan(40);
      expect(on.along).toBeLessThan(215);
      expect(Math.hypot(plan[0].x - bog.x, plan[0].z - bog.z)).toBeGreaterThan(bog.radiusZ + 14);
      expect(t.waterDepthAt(plan[0].x, plan[0].z)).toBe(0);
      seen.add(plan[0].site);
    }
    // Not always the same stretch.
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('the northern Telegraph Track, stage 2: a soft bed under Nolans Brook (v2.22)', () => {
  const soft = (x: number, z: number) => t.surfaceAt(x, z) === SurfaceId.SoftBed;

  it('makes soft sand under water softer than dry river sand, and slippery', () => {
    const bed = surfaces[SurfaceId.SoftBed];
    expect(bed.rollingResistance).toBeGreaterThan(surfaces[SurfaceId.Sand].rollingResistance);
    expect(bed.sink).toBeGreaterThan(surfaces[SurfaceId.Sand].sink);
    expect(bed.grip).toBeLessThan(surfaces[SurfaceId.Water].grip);
    // Water washes the car on it, as on any creek bed.
    expect(bed.dirtRate).toBe(surfaces[SurfaceId.Water].dirtRate);
  });

  it('keeps the shoal firm, both right lines on it, and everything else in the brook soft', () => {
    expect(creek('nolans-brook').softBed).toBe(true);
    // The track's own line, wheel to wheel, wherever it is in the water.
    const line = track('nolans-brook');
    for (let s = 0; s <= line.poly.length; s += 0.5)
      for (const side of [-0.8, 0, 0.8]) {
        const p = trailPoint(line, s, side);
        if (t.waterDepthAt(p.x, p.z) > 0) expect(soft(p.x, p.z), `track at ${s} m, ${side}`).toBe(false);
      }
    // The marked line (v2.20): along the bank to the rock's line, then straight across.
    for (let x = 3; x <= 18; x += 1) expect(soft(x, -857.5), `x ${x}`).toBe(false);
    for (let z = -858; z >= -890; z -= 1)
      for (const x of [17.2, 18, 18.8]) expect(soft(x, z), `${x}, ${z}`).toBe(false);
    // Off the shoal: the old straight line, the deep middle downstream, and upstream of the shoal.
    for (const [x, z] of [
      [-1, -866],
      [0, -875],
      [-8, -866],
      [6, -872],
      [27, -872],
      [-60, -866],
    ])
      expect(soft(x, z), `${x}, ${z}`).toBe(true);
    // The drowned HiLux is on it.
    const d = ep.stranded![0];
    const pose = strandedPose(
      d,
      world.map.tracks.find((x) => x.id === d.track)!.points.map(([x, z]) => [x, z] as const),
    );
    expect(soft(pose.x, pose.z)).toBe(true);
  });

  it('leaves every other creek firm under water: a soft bed is asked for creek by creek', () => {
    for (const c of telegraphNorthMap.creeks)
      if (c.id !== 'nolans-brook') expect(c.softBed, c.id).toBeUndefined();
    // Every soft cell on the map is in Nolans Brook's reach (z from -905 to -835 where the track crosses).
    let softCells = 0;
    for (let i = 0; i < t.surface.length; i++) {
      if (t.surface[i] !== SurfaceId.SoftBed) continue;
      softCells++;
      const z = Math.floor(i / t.resX) - t.halfZ;
      expect(z).toBeLessThan(-820);
      expect(z).toBeGreaterThan(-920);
    }
    expect(softCells).toBeGreaterThan(5000);
    // Canal Creek's shelf and the fords are the firm bed they were.
    expect(t.surfaceAt(-0.5, 612)).toBe(SurfaceId.Water);
    expect(t.surfaceAt(6, 612)).toBe(SurfaceId.Water);
  });
});
