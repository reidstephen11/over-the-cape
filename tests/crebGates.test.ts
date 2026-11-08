import { describe, expect, it } from 'vitest';
import { crebGateCourse, crebGates } from '../src/data/episodes/crebGates';
import { GateCount, footprintSize } from '../src/sim/gateCount';
import { ScoredGates, type ScoredGateEvent } from '../src/sim/scoredGates';
import { Autopilot } from '../src/sim/input/autopilot';
import { driver, pathFor, holdOnRollback, DT } from './helpers/drive';
import { crebWorld } from './world';
import { vehicles } from '../src/data/vehicles';
import { ute40Tuning } from '../src/data/ute40';
import { vehicleTuning } from '../src/data/vehicle';

describe('CREB scored rock climb', () => {
  it('numbers eight real gates, wide enough for every vehicle, with room to clear the finish', () => {
    const world = crebWorld();
    const track = world.features.tracks.find((t) => t.def.id === crebGateCourse.trackId)!;
    expect(world.features.gates.map((g) => g.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const { tuning } of Object.values(vehicles)) {
      const body = footprintSize(tuning);
      expect(Math.min(...crebGates.map((g) => g.width))).toBeGreaterThan(body.halfWidth * 2 + 0.12);
      expect(track.poly.length - crebGates.at(-1)!.at).toBeGreaterThan(body.halfLength + 2.5);
    }
  });

  it('drives the whole original climb through all gates in both short and long 40s', async () => {
    const world = crebWorld();
    for (const tuning of [vehicleTuning, ute40Tuning]) {
      const s = await driver(world).scene(crebGateCourse.trackId, false, 'both', tuning);
      try {
        const c = new ScoredGates(crebGateCourse, new GateCount(world.features.gates), s.track, {});
        const pilot = new Autopilot(pathFor(s.track), 0.7);
        pilot.lowRange = true;
        const rolling = { back: false };
        let result: ScoredGateEvent | undefined;
        for (let n = 0; n < 240 * 60 && !result; n++) {
          let cmd = pilot.input(s.v, DT);
          if (!pilot.done) {
            cmd.throttle = 1;
            cmd.brake = 0;
          }
          cmd = holdOnRollback(s.v, cmd, rolling);
          cmd.toggleFrontDiff = !s.v.differentials.front;
          cmd.toggleRearDiff = !s.v.differentials.rear;
          s.inputs.set('p', cmd);
          s.sim.step(s.inputs, DT);
          const p = s.v.position,
            f = s.v.forward(),
            length = Math.hypot(f.x, f.z);
          const events = c.update({
            x: p.x,
            z: p.z,
            car: { fx: f.x / length, fz: f.z / length, ...footprintSize(tuning) },
            vehicle: tuning.id,
            tilt: s.v.tiltDeg(),
            knock: s.v.bodyContact.knock > 0,
            winch: false,
            dt: DT,
          });
          expect(
            events.find((e) => e.type === 'failed'),
            `${tuning.name} at ${n * DT}s`,
          ).toBeUndefined();
          result = events.find((e) => e.type === 'finished');
        }
        expect(result?.type, `${tuning.name}, gate ${c.gates.next}, remaining ${pilot.remaining(s.v)}`).toBe(
          'finished',
        );
        expect(c.gates.missed).toBe(0);
        expect(c.gates.passed).toBe(8);
        expect(c.best(tuning.id)).toBeDefined();
      } finally {
        s.sim.physics.free();
      }
    }
  }, 120_000);
});
