import { saveData } from './helpers/saves';
import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { camelTuning } from '../src/data/camel';
import { SurfaceId } from '../src/data/surfaces';
import { vehicleTuning } from '../src/data/vehicle';
import { vehicleOrder, vehicles } from '../src/data/vehicles';
import { VehicleModel } from '../src/render/vehicleModel';
import { loadSave, writeSave, type KeyValueStore } from '../src/sim/save/save';
import { makeScene } from './helpers/scenes';

describe('Camel Trophy Land Rover 90', () => {
  it('is a short coil-sprung Ninety with a diesel, a five-speed and the wheel on the left', () => {
    const { id, name, wheels, intake, intakeHeight, gearbox, engine } = camelTuning;
    expect([id, name]).toEqual(['camel', 'Camel Trophy Land Rover 90']);
    expect(vehicleOrder).toContain('camel');
    // 2.36 m wheelbase and about 1.49 m track.
    expect(Math.max(...wheels.map((w) => w.z)) - Math.min(...wheels.map((w) => w.z))).toBeCloseTo(2.36, 2);
    expect(Math.max(...wheels.map((w) => w.x)) * 2).toBeCloseTo(1.486, 2);
    expect(gearbox.ratios).toHaveLength(5);
    expect(engine.redlineRpm).toBeLessThan(4500);
    // Left-hand drive: the driver, the wheel and the dials sit left of centre.
    const cabin = vehicles.camel.cabin;
    expect(cabin.eye.x).toBeLessThan(0);
    expect(cabin.steeringWheel.centre.x).toBeLessThan(0);
    expect(cabin.dials.speed.x).toBeLessThan(0);
    // The snorkel head is about 2 m off the ground, beside the left windscreen pillar.
    expect(intakeHeight).toBeGreaterThan(1.9);
    expect(intake.y + camelTuning.wheelRadius + 0.12).toBeCloseTo(intakeHeight, 1);
    expect(intake.x).toBeLessThan(-0.8);
  });

  it('wades water that would drown the plain short-wheelbase 4WD', async () => {
    // Water 1.5 m deep everywhere: over the wing-height intake, under the snorkel head.
    const ground = { surfaceAt: () => SurfaceId.Water, waterSurfaceAt: () => 1.5 };
    for (const [tuning, floods] of [
      [vehicleTuning, true],
      [camelTuning, false],
    ] as const) {
      const s = await makeScene({ tuning, ground });
      s.run(12, {});
      expect(s.vehicle.condition.flood.stalled, tuning.name).toBe(floods);
      s.physics.world.free();
    }
  });

  it('is drawn in Sandglow yellow with black trim and the snorkel at its air intake', () => {
    const model = new VehicleModel(camelTuning);
    const plain = new VehicleModel(vehicleTuning);
    expect(model.root.name).toBe('camel-trophy-land-rover-90');
    const geometry = model.body.geometry;
    const pos = geometry.getAttribute('position'),
      col = geometry.getAttribute('color');
    expect(pos.count).toBeGreaterThan(plain.body.geometry.getAttribute('position').count);
    let yellow = 0,
      ink = 0,
      nearIntake = 0;
    const t = camelTuning.intake;
    const sandglow = new Color('#C7973F'),
      trim = new Color('#242824');
    for (let i = 0; i < pos.count; i++) {
      const [r, g, b] = [col.getX(i), col.getY(i), col.getZ(i)];
      if (Math.hypot(r - sandglow.r, g - sandglow.g, b - sandglow.b) < 0.03) yellow++;
      if (Math.hypot(r - trim.r, g - trim.g, b - trim.b) < 0.02) ink++;
      if (Math.hypot(pos.getX(i) - t.x, pos.getY(i) - t.y, pos.getZ(i) - t.z) < 0.1) nearIntake++;
    }
    expect(yellow).toBeGreaterThan(5000);
    expect(ink).toBeGreaterThan(1000);
    expect(nearIntake).toBeGreaterThan(20);
    model.dispose();
    plain.dispose();
  });

  it('is remembered in the save', () => {
    const data = new Map<string, string>();
    const s: KeyValueStore = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
    writeSave(saveData({ vehicle: 'camel' }), s);
    expect(loadSave(s)!.vehicle).toBe('camel');
  });
});
