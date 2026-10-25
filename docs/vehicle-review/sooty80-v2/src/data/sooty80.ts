import { patrolTuning } from "./patrol";
import type { VehicleTuning } from "./vehicle";
import { vehicles, type CabinLayout } from "./vehicles";
export const PARKED_Y = -0.196;
export const sooty80Tuning: VehicleTuning = {
  ...patrolTuning,
  name: "Sooty MkII-inspired 80 Series",
  wheelRadius: 0.4445,
  wheelWidth: 0.315,
  wheels: patrolTuning.wheels.map((w) => ({
    ...w,
    x: Math.sign(w.x) * 0.835,
    z: Math.sign(w.z) * 1.425,
  })),
  suspensionRestLength: 0.636,
  suspensionTravel: 0.23,
  steering: { ...patrolTuning.steering, maxAngleDeg: 34 },
};
const c = vehicles.patrol.cabin;
export const sooty80Cabin: CabinLayout = {
  ...c,
  dialY: 0.77,
  dialZ: -0.6,
  lamps: { ...c.lamps, y: 0.7, z: -0.59 },
  steeringWheel: {
    ...c.steeringWheel,
    centre: { x: 0.43, y: 0.79, z: -0.37 },
    columnBase: { x: 0.43, y: 0.51, z: -0.7 },
  },
  handbrake: {
    kind: "lever",
    base: { x: 0.19, y: 0.31, z: 0.11 },
    tip: { x: 0.19, y: 0.47, z: -0.03 },
    travel: 0.6,
  },
};
