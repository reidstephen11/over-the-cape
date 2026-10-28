import type { VehicleTuning } from '../data/vehicle';
import type RAPIER from '@dimforge/rapier3d-compat';
import { STUCK_RIDE_HEIGHT } from '../sim/stuckVehicle';
import { createCondition } from '../sim/vehicle/condition';
import { VehicleModel } from './vehicleModel';

/**
 * Someone else's vehicle, bogged (src/sim/stuckVehicle.ts) or coming the other way
 * (src/sim/traffic.ts), drawn as one of the game's
 * vehicles: caked in mud, wheels still, following its body as it comes out of the bog.
 */
export class StuckVehicleView {
  readonly model: VehicleModel;

  constructor(
    private readonly stuck: { readonly body: RAPIER.RigidBody },
    tuning: VehicleTuning,
  ) {
    this.model = new VehicleModel(tuning);
    // Wheels sit their radius above the ground under the body, as it rests on them.
    const y = tuning.wheelRadius - STUCK_RIDE_HEIGHT;
    for (const w of this.model.wheels) w.pivot.position.y = y;
    this.model.suspension.update(this.model.wheels.map((w) => w.pivot.position.y));
    const c = createCondition();
    c.dirt = { front: 0.8, sides: 0.9, rear: 0.7, wheels: 1 };
    c.mudShare = 1;
    this.model.applyCondition(c);
    this.update();
  }

  update(): void {
    const p = this.stuck.body.translation();
    const q = this.stuck.body.rotation();
    this.model.root.position.set(p.x, p.y, p.z);
    this.model.root.quaternion.set(q.x, q.y, q.z, q.w);
  }
}
