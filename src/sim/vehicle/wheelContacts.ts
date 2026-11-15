import type RAPIER from '@dimforge/rapier3d-compat';
import type { VehicleTuning } from '../../data/vehicle';
import type { Physics } from '../physics';
import { dot, rotate, v3 } from './math';

/**
 * Ground just ahead of (or behind) a tyre standing more than this many tyre radii above the
 * ground under it is a wall the tyre meets, not ground it rolls up onto (v2.01): the far
 * edge of a hole the wheel has dropped into. Measured from the tyre's bottom where it is
 * now, which the footprint already lifts onto a ledge it is climbing, so the CREB's ledges
 * (about a radius and a quarter, on climbs of up to 30°) stay climbable.
 */
export const WALL_STEP = 1.5;
/**
 * The same for a tyre hanging free, with nothing under it (v2.01): a wheel that has dropped
 * into a hole. The suspension only lets it hang so far, so the hole's far edge stands about
 * a radius above it; a real tyre would sit far lower and meet a wall. A tyre climbing a ledge
 * keeps its footing on the footprint, so this never applies to it.
 */
export const WALL_STEP_HANGING = 0.8;
/** Walls are only looked for at a crawl, below this speed (m/s), so a wheel in the air off a bump at speed never meets one. */
export const WALL_SPEED = 3;
/** The wall check's rays start this far above the wheel's mounting point (m). */
const WALL_LIFT = 1.2;

/**
 * Samples the round tyre footprint so a downward ray finds logs before the hub reaches them,
 * and looks along it for a wall: the far edge of a hole a wheel has dropped into (v2.01).
 */
export class WheelContacts {
  /**
   * Per wheel: +1 a wall ahead of the tyre along its rolling direction, -1 behind it, 0 none.
   * Set by `update`; the vehicle stops that corner moving into it.
   */
  readonly walls = new Int8Array(4);
  /** Per wheel: the rolling direction's sine and cosine about +y (the steering angle), for the wall's push. */
  readonly steerSin = new Float32Array(4);
  readonly steerCos = new Float32Array(4);
  /** Per wheel, this step: how far the ground at the tyre's edges stands above its bottom (m; for tests and tuning). */
  readonly wallRise = new Float32Array(4);
  private readonly ray: RAPIER.Ray;
  private readonly local = v3();
  private readonly samples: { offset: number; rise: number }[];
  /** Offsets along the rolling direction the wall check looks at: the tyre's leading and trailing edges. */
  private readonly wallSamples: number[];

  constructor(
    private readonly physics: Physics,
    private readonly tuning: VehicleTuning,
  ) {
    this.ray = new physics.R.Ray(v3(), v3());
    const r = tuning.wheelRadius;
    this.wallSamples = [0.9, -0.9].map((fraction) => r * fraction);
    this.samples = [0, -0.25, 0.25, -0.5, 0.5, -0.75, 0.75, -0.95, 0.95].map((fraction) => ({
      offset: r * fraction,
      rise: r * (1 - Math.sqrt(1 - fraction * fraction)),
    }));
  }

  update(
    body: RAPIER.RigidBody,
    controller: RAPIER.DynamicRayCastVehicleController,
    filter: number,
    wheelX: readonly number[],
    /** Look for walls this step (a crawl, with the car on its other wheels). */
    lookForWalls = false,
    /** Which wheels touched the ground last step. */
    grounded: readonly boolean[] = [],
  ): void {
    const t = this.tuning;
    const p = body.translation();
    const q = body.rotation();
    rotate(q, 0, -1, 0, this.ray.dir);
    this.walls.fill(0);
    this.wallRise.fill(0);
    for (let i = 0; i < t.wheels.length; i++) {
      const w = t.wheels[i];
      const steer = controller.wheelSteering(i) ?? 0;
      // The probe can stay on the authored wheel line while that line is inside the
      // cambered tyre's tread. Only move it when the rolling beam pulls the tread away.
      // This avoids shifting a tuned rock/pothole contact by a few millimetres each step.
      const halfTread = t.wheelWidth / 2;
      const contactX = Math.max(wheelX[i] - halfTread, Math.min(wheelX[i] + halfTread, w.x));
      // Along the wheel's rolling direction: (0, 0, 1) turned by the steering angle about +y.
      const sx = Math.sin(steer);
      const sz = Math.cos(steer);
      this.steerSin[i] = sx;
      this.steerCos[i] = sz;
      let bestLength = Infinity;
      let offset = 0;
      let rise = 0;
      const reach = (controller.wheelSuspensionRestLength(i) ?? t.suspensionRestLength) + t.wheelRadius;
      // The wall check measures from where the tyre is now: hanging in a hole, or lifted by
      // the footprint onto the ledge it is climbing.
      const wallFrom = controller.wheelSuspensionLength(i) ?? t.suspensionRestLength;
      const wallStep = (grounded[i] === false ? WALL_STEP_HANGING : WALL_STEP) * t.wheelRadius;
      for (const sample of this.samples) {
        rotate(
          q,
          contactX + sx * sample.offset,
          w.y + sample.rise,
          w.z + sz * sample.offset,
          this.ray.origin,
        );
        this.ray.origin.x += p.x;
        this.ray.origin.y += p.y;
        this.ray.origin.z += p.z;
        const hit = this.physics.world.castRayAndGetNormal(
          this.ray,
          reach,
          true,
          this.physics.R.QueryFilterFlags.EXCLUDE_SENSORS,
          filter,
          undefined,
          body,
        );
        // Extend a grounded wheel's contact patch; a hub over a deep drop must still
        // lose support rather than reaching sideways across the void to the far lip.
        if (sample.offset === 0 && !hit) break;
        // Near-vertical faces belong to the solid bump stops, not suspension support.
        if (!hit || dot(hit.normal, this.ray.dir) > -0.65) continue;
        const length = hit.timeOfImpact - t.wheelRadius;
        if (length < bestLength - 0.001) {
          bestLength = length;
          offset = sample.offset;
          rise = sample.rise;
        }
      }
      // The wall check: from well above the wheel, so the rays come down onto the far edge of
      // a hole even when the car has tipped into it and the hub is below that edge. Ground at
      // the tyre's leading edge higher than the tyre's bottom by WALL_STEP radii is a wall.
      if (lookForWalls)
        for (const sample of this.wallSamples) {
          rotate(q, contactX + sx * sample, w.y + WALL_LIFT, w.z + sz * sample, this.ray.origin);
          this.ray.origin.x += p.x;
          this.ray.origin.y += p.y;
          this.ray.origin.z += p.z;
          const hit = this.physics.world.castRay(
            this.ray,
            reach + WALL_LIFT,
            true,
            this.physics.R.QueryFilterFlags.EXCLUDE_SENSORS,
            filter,
            undefined,
            body,
          );
          if (hit)
            this.wallRise[i] = Math.max(
              this.wallRise[i],
              wallFrom - (hit.timeOfImpact - WALL_LIFT - t.wheelRadius),
            );
          if (hit && wallFrom - (hit.timeOfImpact - WALL_LIFT - t.wheelRadius) > wallStep) {
            this.walls[i] = sample > 0 ? 1 : -1;
            break;
          }
        }
      // The profile rise keeps suspension length measured at the hub rather than the sample.
      this.local.x = contactX + sx * offset;
      this.local.y = w.y + rise;
      this.local.z = w.z + sz * offset;
      controller.setWheelChassisConnectionPointCs(i, this.local);
    }
  }
}
