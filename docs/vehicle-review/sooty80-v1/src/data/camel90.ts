import { camelTuning } from "./camel";
import type { VehicleTuning } from "./vehicle";
import { vehicles, type CabinLayout } from "./vehicles";
export const camel90Tuning: VehicleTuning = {
  ...camelTuning,
  name: "1986 Camel Trophy Land Rover Ninety",
  wheelRadius: 0.405,
  wheelWidth: 0.205,
  wheels: camelTuning.wheels.map((w) => ({
    ...w,
    x: Math.sign(w.x) * 0.743,
    z: Math.sign(w.z) * 1.18,
  })),
};
const c = vehicles.perentie.cabin;
const mirror = (p: { x: number; y: number; z: number }) => ({
  ...p,
  x: -p.x,
  z: p.z + 0.08,
});
export const camel90Cabin: CabinLayout = {
  ...c,
  eye: mirror(c.eye),
  dialZ: c.dialZ + 0.08,
  dials: {
    speed: { ...c.dials.speed, x: -c.dials.speed.x },
    rpm: { ...c.dials.rpm, x: -c.dials.rpm.x },
    oil: { ...c.dials.oil, x: -c.dials.oil.x },
  },
  lamps: { ...c.lamps, xs: c.lamps.xs.map((x) => -x), z: c.lamps.z + 0.08 },
  handbrake: {
    ...c.handbrake,
    base: mirror(c.handbrake.base),
    tip: mirror(c.handbrake.tip),
  },
  steeringWheel: {
    ...c.steeringWheel,
    centre: mirror(c.steeringWheel.centre),
    columnBase: mirror(c.steeringWheel.columnBase),
    ratio: 22,
  },
};
