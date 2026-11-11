import type * as THREE from 'three';
import type { Vec3 } from '../sim/vehicle/math';
import type { VehicleId, VehicleTuning } from '../data/vehicle';
import { buildVehicleBody } from './vehicleBody';
import { buildVehicleWheel } from './vehicleWheel';
import { buildFj40GlbBody, buildFj40GlbWheel, fj40GlbActive, fj40GlbHeadlamps } from './fj40Glb';
import { buildRackPlank } from './vehicleEquipment';
import { WIDEN as PATROL_WIDEN, buildPatrolBody, buildPatrolPlank, buildPatrolWheel } from './patrolBody';
import { buildPerentieBody, buildPerentiePlank, buildPerentieWheel } from './perentieBody';
import { buildCamelBody, buildCamelPlank } from './camelBody';
import { buildCamelWheel } from './camelWheel';
import { buildHiluxBody, buildHiluxPlank, buildHiluxWheel } from './hiluxBody';
import { buildUnimogBody, buildUnimogPlank, buildUnimogWheel } from './unimogBody';
import { buildTroopyBody, buildTroopyPlank, buildTroopyWheel } from './troopyBody';
import { LC79_DRIVING_LAMPS, buildLc79Body, buildLc79Plank, buildLc79Wheel } from './lc79Body';
import { buildVehicleBody as buildSooty80Body, buildRackPlank as buildSooty80Plank } from './sooty80Body';
import { buildVehicleWheel as buildSooty80Wheel } from './sooty80Wheel';
import { buildHj60Body, buildHj60Plank, buildHj60Wheel } from './hj60Body';
import { UTE_NOSE, buildUte40Body, buildUte40Plank, buildUte40Wheel } from './ute40Body';
import { NOSE as MQ_NOSE, buildMqBody, buildMqPlank, buildMqWheel } from './mqBody';
import { buildRangieBody, buildRangiePlank, buildRangieWheel } from './rangieBody';
import { RANGIE_DRIVING_LAMPS } from './rangieGear';
import { buildXtracabBody, buildXtracabPlank, buildXtracabWheel } from './xtracabBody';
import { F as XTRACAB_NOSE, XTRACAB_DRIVING_LAMPS } from './xtracabLayout';
import type { SuspensionLayout } from './vehicleSuspension';

/** How each vehicle is drawn: its body, wheels, carried planks, paint and springs. */
export interface VehicleLook {
  name: string;
  body(tuning: VehicleTuning, wheel: THREE.BufferGeometry): THREE.BufferGeometry;
  wheel(tuning: VehicleTuning): THREE.BufferGeometry;
  plank(index: number): THREE.BufferGeometry;
  paint: { roughness: number; metalness: number; clearcoat: number; clearcoatRoughness: number };
  springs: 'leaf' | 'coil';
  suspension?: SuspensionLayout;
  /** Lens centres: the headlamps, and any driving lamps that come on with high beam. */
  lamps: { head: readonly Vec3[]; roof?: readonly Vec3[] };
}

const fortySeriesHeadlamps: Vec3[] = [
  { x: -0.427, y: 0.515, z: -1.7 },
  { x: 0.427, y: 0.515, z: -1.7 },
];

export const vehicleLooks: Record<VehicleId, VehicleLook> = {
  sooty80: {
    name: 'sooty-mkii-80-series',
    body: buildSooty80Body,
    wheel: buildSooty80Wheel,
    plank: buildSooty80Plank,
    paint: { roughness: 0.68, metalness: 0.06, clearcoat: 0.08, clearcoatRoughness: 0.7 },
    springs: 'coil',
    suspension: { coilInboard: 0.42, radiusArmAxleX: 0.36, radiusArmChassisX: 0.4, rearDamperOffset: -0.1 },
    lamps: {
      head: [-0.6, 0.6].map((x) => ({ x, y: 0.455, z: -2.09 })),
      roof: [
        ...[-0.225, 0.225].map((x) => ({ x, y: 0.545, z: -2.33 })),
        ...[-0.5, 0, 0.5].map((x) => ({ x, y: 1.535, z: -0.27 })),
      ],
    },
  },
  shortie: {
    name: '40-series-4wd',
    // fj40-blender-test: the Blender GLB when it has loaded (?fj40=code for the code body).
    body: (t, w) => (fj40GlbActive() ? buildFj40GlbBody(t, w) : buildVehicleBody(t, w)),
    wheel: (t) => (fj40GlbActive() ? buildFj40GlbWheel(t) : buildVehicleWheel(t)),
    plank: buildRackPlank,
    paint: { roughness: 0.39, metalness: 0.14, clearcoat: 0.7, clearcoatRoughness: 0.24 },
    springs: 'leaf',
    get lamps() {
      const glb = fj40GlbActive() ? fj40GlbHeadlamps() : [];
      return { head: glb.length === 2 ? glb : fortySeriesHeadlamps };
    },
  },
  ute40: {
    name: 'ute40-farm-ute',
    body: buildUte40Body,
    wheel: buildUte40Wheel,
    plank: buildUte40Plank,
    // Old white enamel gone chalky: little gloss left.
    paint: { roughness: 0.55, metalness: 0.06, clearcoat: 0.2, clearcoatRoughness: 0.5 },
    springs: 'leaf',
    lamps: {
      // The 40's headlamps, moved forward with the cab.
      head: fortySeriesHeadlamps.map((p) => ({ ...p, z: UTE_NOSE - 0.02 })),
      // The three spotlights on the bull bar's hoop come on with high beam.
      roof: [-0.26, 0, 0.26].map((x) => ({ x, y: 1.02, z: UTE_NOSE - 0.125 })),
    },
  },
  camel: {
    name: 'camel-trophy-land-rover-90',
    body: buildCamelBody,
    wheel: buildCamelWheel,
    plank: buildCamelPlank,
    paint: { roughness: 0.39, metalness: 0.14, clearcoat: 0.7, clearcoatRoughness: 0.24 },
    springs: 'coil',
    lamps: {
      head: [
        { x: -0.626, y: 0.467, z: -1.84 },
        { x: 0.626, y: 0.467, z: -1.84 },
      ],
      roof: [-0.61, -0.27, 0.27, 0.61].map((x) => ({ x, y: 1.84, z: -0.74 })),
    },
  },
  rangie: {
    name: 'range-rover-two-door',
    body: buildRangieBody,
    wheel: buildRangieWheel,
    plank: buildRangiePlank,
    // Solid single-stage paint kept polished: a little more gloss than the 60's.
    paint: { roughness: 0.38, metalness: 0.07, clearcoat: 0.55, clearcoatRoughness: 0.28 },
    springs: 'coil',
    suspension: { coilInboard: 0.4, radiusArmAxleX: 0.34, radiusArmChassisX: 0.4, rearDamperOffset: -0.08 },
    lamps: {
      head: [-0.56, 0.56].map((x) => ({ x, y: 0.335, z: -2.026 })),
      // The two driving lamps on the bar come on with high beam.
      roof: RANGIE_DRIVING_LAMPS,
    },
  },
  perentie: {
    name: 'land-rover-110-perentie',
    body: buildPerentieBody,
    wheel: buildPerentieWheel,
    plank: buildPerentiePlank,
    // Army enamel is flat: no clearcoat and a dull sheen.
    paint: { roughness: 0.72, metalness: 0.05, clearcoat: 0, clearcoatRoughness: 1 },
    springs: 'coil',
    lamps: {
      head: [
        { x: -0.625, y: 0.39, z: -2.042 },
        { x: 0.625, y: 0.39, z: -2.042 },
      ],
    },
  },
  hilux: {
    name: 'hilux-single-cab',
    body: buildHiluxBody,
    wheel: buildHiluxWheel,
    plank: buildHiluxPlank,
    // Single-stage enamel: some gloss, a little worn.
    paint: { roughness: 0.42, metalness: 0.08, clearcoat: 0.45, clearcoatRoughness: 0.32 },
    springs: 'leaf',
    lamps: {
      head: [
        { x: -0.6, y: 0.416, z: -2.21 },
        { x: 0.6, y: 0.416, z: -2.21 },
      ],
    },
  },
  xtracab: {
    name: 'hilux-sr5-xtra-cab',
    body: buildXtracabBody,
    wheel: buildXtracabWheel,
    plank: buildXtracabPlank,
    // Gloss black under a clear coat.
    paint: { roughness: 0.3, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.18 },
    springs: 'leaf',
    lamps: {
      head: [-0.575, 0.575].map((x) => ({ x, y: 0.41, z: XTRACAB_NOSE - 0.022 })),
      // The four round lamps on the roll bar and the two on the front hoop come on with high beam.
      roof: XTRACAB_DRIVING_LAMPS,
    },
  },
  unimog: {
    name: 'unimog-ul1700l',
    body: buildUnimogBody,
    wheel: buildUnimogWheel,
    plank: buildUnimogPlank,
    // Army enamel, as on the Perentie.
    paint: { roughness: 0.72, metalness: 0.05, clearcoat: 0, clearcoatRoughness: 1 },
    springs: 'coil',
    lamps: {
      head: [
        { x: -0.86, y: 0.3, z: -2.966 },
        { x: 0.86, y: 0.3, z: -2.966 },
      ],
    },
  },
  hj60: {
    name: 'hj60-wagon',
    body: buildHj60Body,
    wheel: buildHj60Wheel,
    plank: buildHj60Plank,
    // Solid single-stage enamel with some gloss left.
    paint: { roughness: 0.42, metalness: 0.06, clearcoat: 0.45, clearcoatRoughness: 0.32 },
    springs: 'leaf',
    lamps: { head: [-0.625, 0.625].map((x) => ({ x, y: 0.385, z: -2.04 })) },
  },
  mq: {
    name: 'mq-patrol-hardtop',
    body: buildMqBody,
    wheel: buildMqWheel,
    plank: buildMqPlank,
    // Solid single-stage enamel with some gloss left, as on the HJ60.
    paint: { roughness: 0.42, metalness: 0.06, clearcoat: 0.45, clearcoatRoughness: 0.32 },
    springs: 'leaf',
    lamps: { head: [-0.6, 0.6].map((x) => ({ x, y: 0.35, z: MQ_NOSE + 0.016 })) },
  },
  troopy: {
    name: 'troop-carrier',
    body: buildTroopyBody,
    wheel: buildTroopyWheel,
    plank: buildTroopyPlank,
    // Factory white enamel with a little gloss left.
    paint: { roughness: 0.45, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.35 },
    springs: 'leaf',
    lamps: {
      head: [
        { x: -0.6, y: 0.56, z: -2.224 },
        { x: 0.6, y: 0.56, z: -2.224 },
      ],
    },
  },
  patrol: {
    name: 'gq-patrol',
    body: buildPatrolBody,
    wheel: buildPatrolWheel,
    plank: buildPatrolPlank,
    paint: { roughness: 0.36, metalness: 0.08, clearcoat: 0.6, clearcoatRoughness: 0.28 },
    springs: 'coil',
    lamps: {
      head: [
        { x: -0.645 * PATROL_WIDEN, y: 0.48, z: -2.3 },
        { x: 0.645 * PATROL_WIDEN, y: 0.48, z: -2.3 },
      ],
      // The two driving lamps under the bull bar's top rail come on with high beam.
      roof: [
        { x: -0.19 * PATROL_WIDEN, y: 0.645, z: -2.417 },
        { x: 0.19 * PATROL_WIDEN, y: 0.645, z: -2.417 },
      ],
    },
  },
  lc79: {
    name: 'lc79-single-cab',
    body: buildLc79Body,
    wheel: buildLc79Wheel,
    plank: buildLc79Plank,
    // Factory paint with a fresh clear coat.
    paint: { roughness: 0.38, metalness: 0.06, clearcoat: 0.6, clearcoatRoughness: 0.25 },
    // Coils at both ends since the conversion.
    springs: 'coil',
    lamps: {
      head: [
        { x: -0.58, y: 0.68, z: -2.39 },
        { x: 0.58, y: 0.68, z: -2.39 },
      ],
      // The driving lamps on the bar come on with high beam.
      roof: LC79_DRIVING_LAMPS,
    },
  },
};
