import { describe, expect, it } from 'vitest';
import { environmentAt } from '../src/data/environment';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { perentieTuning } from '../src/data/perentie';
import { SurfaceId, sweptTuning } from '../src/data/surfaces';
import { vehicleTuning } from '../src/data/vehicle';
import { WaterCurrent } from '../src/sim/world/current';
import type { CreekInfo } from '../src/sim/world/features';
import { densify } from '../src/sim/world/polyline';
import { buildWorld } from '../src/sim/world/world';
import { makeScene } from './helpers/scenes';
import { Autopilot } from '../src/sim/input/autopilot';
import { DT, driveLeg, driver, pathFor } from './helpers/drive';

/** A straight creek 20 m wide from `from` to `to`, running at 2 m/s mid-channel. */
function creek(from: [number, number], to: [number, number]): CreekInfo {
  const poly = densify([from, to], 1);
  const fill = (x: number) => new Float32Array(poly.count).fill(x);
  return {
    def: { id: 'c', name: 'Creek', points: [] },
    poly,
    water: fill(0),
    halfWidth: fill(10),
    flow: fill(2),
  };
}

/** Flat ground under water `depth` deep, running east at `flow` m/s. */
function river(depth: number, flow: number) {
  return {
    surfaceAt: () => SurfaceId.Water,
    waterSurfaceAt: () => depth,
    waterFlowAt: (_x: number, _z: number, out: { x: number; z: number }) => {
      out.x = flow;
      out.z = 0;
      return out;
    },
  };
}

describe('running water', () => {
  it('runs down each creek from its first point to its last, fastest mid-channel', () => {
    const current = new WaterCurrent([creek([0, 0], [100, 0]), creek([0, 100], [0, 300])]);
    const mid = current.at(50, 0);
    expect(mid.x).toBeCloseTo(2, 2);
    expect(mid.z).toBeCloseTo(0, 2);
    const edge = current.at(50, 9);
    expect(edge.x).toBeGreaterThan(0.9);
    expect(edge.x).toBeLessThan(mid.x - 0.5);
    // Dry ground beside it and far away is still.
    expect(current.at(50, 12).x).toBe(0);
    expect(current.at(500, 500)).toEqual({ x: 0, z: 0 });
    // The second creek runs south.
    expect(current.at(0, 200).z).toBeCloseTo(2, 2);
  });

  it('pushes a vehicle crossing it: the tail swings downstream in water over the hubs', async () => {
    const drive = async (depth: number, flow: number) => {
      const s = await makeScene({ ground: river(depth, flow) });
      const v = s.vehicle;
      s.run(10, { throttle: 0.4 });
      const f = v.forward();
      const r = { yaw: Math.atan2(f.x, -f.z) * (180 / Math.PI), north: -v.position.z, swept: v.swept };
      s.physics.world.free();
      return r;
    };
    // Shallow water barely moves it; over the hubs the current swings it round and holds it back.
    const shallow = await drive(0.3, 2);
    const still = await drive(0.55, 0);
    const running = await drive(0.55, 2);
    expect(Math.abs(shallow.yaw)).toBeLessThan(8);
    expect(Math.abs(still.yaw)).toBeLessThan(1);
    expect(Math.abs(running.yaw)).toBeGreaterThan(12);
    expect(running.north).toBeLessThan(still.north - 3);
    expect(running.swept).toBe(0);
  });

  it('lifts the vehicle off its tyres in deep water, and a current then carries it away', async () => {
    for (const tuning of [vehicleTuning, perentieTuning]) {
      const s = await makeScene({ tuning, ground: river(1.3, 0) });
      const v = s.vehicle;
      s.run(6, {});
      // Still water lifts it but leaves it where it is.
      expect(v.afloat, tuning.name).toBeGreaterThan(sweptTuning.lift);
      expect(v.swept).toBe(0);
      s.physics.world.free();

      const r = await makeScene({ tuning, ground: river(1.3, 2) });
      const x0 = r.vehicle.position.x;
      let swept = 0;
      for (let t = 0; t < 10 && swept < sweptTuning.seconds; t += 0.5) {
        r.run(0.5, {});
        swept = r.vehicle.swept;
      }
      expect(swept, tuning.name).toBeGreaterThanOrEqual(sweptTuning.seconds);
      expect(r.vehicle.position.x - x0, tuning.name).toBeGreaterThan(3);
      r.physics.world.free();
    }
  });
});

describe('running water on the CREB', () => {
  const world = buildWorld(crebMap);
  const wet = environmentAt(crebEpisode.startHour, crebEpisode.weather);
  const { scene } = driver(world, wet);

  it('runs the Daintree east past the crossing, fast enough to push a vehicle off the line', () => {
    const current = new WaterCurrent(world.features.creeks);
    // Mid-river and on the gravel bar.
    for (const [x, z] of [
      [-1010, 1034],
      [-992, 1036],
    ]) {
      const f = current.at(x, z);
      expect(f.x).toBeGreaterThan(1.7);
      expect(Math.abs(f.z)).toBeLessThan(0.2);
    }
    // Out on the track either side it's dry.
    expect(current.at(-1010, 1075)).toEqual({ x: 0, z: 0 });
  });

  it('pushes the short-wheelbase 4WD downstream on the deep line, and it gets across on the bar', async () => {
    const s = await scene('daintree-crossing', false, 'high', vehicleTuning);
    try {
      // Straight across the deep middle: the current swings it round and shoves it downstream.
      const path = pathFor(s.track).filter(([, z]) => z >= 1068);
      for (let z = 1067.5; z >= 985; z -= 0.5) path.push([-1010, z]);
      const pilot = new Autopilot(path, 3);
      let downstream = 0;
      for (let t = 0; t < 40 && !pilot.done; t += DT) {
        s.inputs.set('p', pilot.input(s.v, DT));
        s.sim.step(s.inputs, DT);
        if (s.v.position.z < 1068) downstream = Math.max(downstream, s.v.position.x + 1010);
      }
      expect(downstream).toBeGreaterThan(6);
    } finally {
      s.sim.physics.free();
    }
    const b = await scene('daintree-crossing', false, 'high', vehicleTuning);
    try {
      // On the bar: across, but steering into the current.
      const r = await driveLeg(b, b.track, false, 120);
      expect(r.water).toBeLessThan(0.7);
      expect(b.v.swept).toBe(0);
    } finally {
      b.sim.physics.free();
    }
  }, 300_000);
});
