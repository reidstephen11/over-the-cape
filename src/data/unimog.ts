import type { VehicleTuning } from './vehicle';

/**
 * Mercedes-Benz Unimog UL1700L, the Australian Army's 4-tonne cargo truck from the early
 * 1980s (the 435 series): 3.85 m wheelbase, about 1.86 m track, 12.5R20 tyres on portal
 * axles with hub reduction gears, coil springs, the 5.7 L OM352A turbo-diesel six (about
 * 124 kW and 500 Nm), an eight-speed gearbox (four field gears and four road gears) and
 * pneumatic lockers front and rear. Same local frame as the other vehicles: x right, y
 * up, z back, origin 0.12 m above the parked hubs, so the ground is about 0.68 m below it.
 */
const R = 0.56;
const HALF_TRACK = 0.93;
const HALF_BASE = 1.925;
const MOUNT_Y = 0.32;

export const unimogTuning: VehicleTuning = {
  id: 'unimog',
  name: 'Unimog UL1700L',
  // About 6.0 t empty; with two aboard, the winch, fuel and gear about 6.4 t, the tray
  // empty. The engine sits behind the front axle, so a little over half is on it. With
  // the tray empty and the heavy portal axles low down, the centre of mass is about 1.0 m
  // off the ground on a wide track: it tips at about the Land Rover's angle.
  mass: 6400,
  com: { x: 0, y: 0.3, z: -0.2 },
  inertia: { x: 23000, y: 24000, z: 5500 },
  wheelRadius: R,
  wheelWidth: 0.32,
  wheels: [
    { x: -HALF_TRACK, y: MOUNT_Y, z: -HALF_BASE, front: true },
    { x: HALF_TRACK, y: MOUNT_Y, z: -HALF_BASE, front: true },
    { x: -HALF_TRACK, y: MOUNT_Y, z: HALF_BASE, front: false },
    { x: HALF_TRACK, y: MOUNT_Y, z: HALF_BASE, front: false },
  ],
  // Long coils on axles that twist about their torque tubes: 0.12 m sag and 0.2 m of bump
  // travel above that, and more droop in low range than any of the others.
  suspensionRestLength: MOUNT_Y + 0.24,
  suspensionTravel: 0.32,
  springStiffness: 20.4,
  damperCompression: 1.6,
  damperRelaxation: 2.4,
  maxSuspensionForce: 220000,
  bodyBoxes: [
    // Ladder chassis rails high above the portal axles, and the gearbox under the cab.
    { cx: -0.45, cy: 0.14, cz: 0.15, hx: 0.06, hy: 0.11, hz: 3.25 },
    { cx: 0.45, cy: 0.14, cz: 0.15, hx: 0.06, hy: 0.11, hz: 3.25 },
    { cx: 0, cy: 0.08, cz: -0.75, hx: 0.26, hy: 0.13, hz: 0.45 },
    // Engine and the short bonnet ahead of the cab, and the sump below it.
    { cx: 0, cy: 0.62, cz: -2.3, hx: 0.62, hy: 0.42, hz: 0.66 },
    { cx: 0, cy: 0.16, cz: -2.05, hx: 0.3, hy: 0.1, hz: 0.38 },
    // The cab, from its floor over the front wheels to the roof.
    { cx: 0, cy: 1.32, cz: -0.86, hx: 1.1, hy: 0.66, hz: 0.78 },
    // Front mudguards over the wheels.
    { cx: -0.98, cy: 0.66, cz: -1.925, hx: 0.22, hy: 0.06, hz: 0.62 },
    { cx: 0.98, cy: 0.66, cz: -1.925, hx: 0.22, hy: 0.06, hz: 0.62 },
    // The dropside tray and the canvas tilt over it.
    { cx: 0, cy: 0.86, cz: 1.86, hx: 1.15, hy: 0.21, hz: 1.62 },
    { cx: 0, cy: 1.66, cz: 1.86, hx: 1.12, hy: 0.6, hz: 1.6 },
    // Bumper with the winch behind it, the spare wheel behind the cab, the rear
    // crossmember with its pintle hook, and the second spare on the left dropside.
    { cx: 0, cy: 0.38, cz: -3.08, hx: 1.1, hy: 0.15, hz: 0.12 },
    { cx: 0, cy: 1.05, cz: 0.12, hx: 0.58, hy: 0.58, hz: 0.17 },
    { cx: 0, cy: 0.2, cz: 3.42, hx: 0.95, hy: 0.1, hz: 0.08 },
    { cx: -1.39, cy: 0.95, cz: 0.85, hx: 0.17, hy: 0.56, hz: 0.56 },
  ],
  bumpRadius: 0.4,
  bodyFriction: 0.45,
  wheelImpactSpeed: 1.2,
  bodyKnockImpulse: 400,

  engine: {
    // A 5.7 L turbo-diesel six: a slow idle, most of its torque from 1400 rpm, governed at 2800.
    idleRpm: 650,
    crankSeconds: 1.5,
    crankRpm: 150,
    redlineRpm: 2800,
    torqueCurve: [
      [500, 250],
      [900, 360],
      [1400, 470],
      [1800, 505],
      [2200, 490],
      [2600, 455],
      [2800, 420],
      [3000, 90],
    ],
    airflow: 1500000,
    idleAir: 0.023,
    throttleCurve: 1.3,
    idleGovernor: 0.2,
    idleDroop: 60,
    // Like the Land Rover's diesel: little pumping loss or engine braking.
    friction: { base: 30, perRpm: 0.025, pumpingPerRpm: 0.01 },
    inertia: 1.2,
    engineBrake: 320,
    // Army user handbook: 160 L. Efficiency is independent of episode balancing.
    fuel: { tankLitres: 160, idleLitresPerHour: 1.8, efficiency: 0.38, energyMJPerLitre: 38.6 },
  },
  // The game drives the gears itself; this coupling stands in for the clutch.
  converter: { capacity: 56, stallRatio: 1.2, couplingPoint: 0.8 },
  // The road gears; the low range is the field gears below them. The axle ratio includes
  // the portal hub gears, chosen so the top road gear gives 82 km/h at 2750 rpm.
  gearbox: {
    ratios: [4.8, 2.9, 1.7, 1.0],
    reverse: 3.6,
    finalDrive: 6.83,
    efficiency: 0.85,
    upshiftRpm: { light: 1700, full: 2600 },
    downshiftRpm: { light: 1000, full: 1600 },
    shiftTime: 0.7,
  },
  ranges: {
    high: { ratio: 1.0, topSpeedKmh: 82, reverseTopKmh: 15 },
    low: { ratio: 3.85, topSpeedKmh: 22, reverseTopKmh: 8 },
  },
  openDiffLeak: 0.1,
  crawling: {
    // The pneumatic lockers engage on the move.
    diffLockMaxKmh: 15,
    frontLockSteering: 0.85,
    forwardKmh: 6,
    reverseKmh: 5,
    speedGain: 3,
    brakeGain: 1.1,
    extraDroop: 0.1,
    antiRollScale: 0.15,
    damperCompression: 2,
    damperRelaxation: 2.9,
  },
  // Big, soft tyres with a wide footprint grip a little better than the others'.
  lateralGrip: 0.88,
  rollTorqueScale: 1.0,
  antiRoll: { front: 23000, rear: 16000 },
  longitudinalGrip: 1.08,
  brakeForce: 64000,
  brakeFrontBias: 0.58,
  handbrakeForce: 19000,
  handbrakeSideGrip: 0.45,
  holdBrakeForce: 64000,
  hillStartHold: 1.5,
  dragArea: 4.2,
  steering: {
    maxAngleDeg: 33,
    minAngleDeg: 6,
    minAngleSpeed: 22,
    keyboardRiseRate: 2.2,
    keyboardReturnRate: 3.4,
    padRate: 6,
  },
  // The air cleaner breathes through a stack behind the cab's right-hand corner.
  intakeHeight: 2.3,
  intake: { x: 0.95, y: 2.3 - R - 0.12, z: 0 },
  winchMount: { x: 0, y: 0.32, z: -3.22 },
  towPoint: { x: 0, y: 0.12, z: 3.52 },
  // The pintle hook on the rear crossmember (src/render/unimogBody.ts).
  hitch: { x: 0, y: 0.11, z: 3.54 },
};
