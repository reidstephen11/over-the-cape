import type { VehicleId } from './vehicle';

/**
 * Vehicles to earn (v1.06). The FJ40, the earlier short-wheelbase 4WD, the Land Rover Ninety
 * and (since v1.79) the SR5 Xtra Cab are open from the start;
 * each of the others opens with one challenge on the CREB, picked to suit the vehicle.
 * Test mode (`?dev`) opens them all.
 */
export const starterVehicles: readonly VehicleId[] = ['shortie', 'forty', 'camel', 'xtracab'];

export type LockedVehicleId = Exclude<VehicleId, 'shortie' | 'forty' | 'camel' | 'xtracab'>;

export interface VehicleChallenge {
  /** What to do, as the vehicle lists show it. */
  task: string;
  /** Said when it opens. */
  unlocked: string;
}

export const vehicleChallenges: Record<LockedVehicleId, VehicleChallenge> = {
  hilux: {
    task: 'Reach the Lions Den for the first time',
    unlocked: 'You made the Lions Den. A HiLux is waiting in the car park.',
  },
  patrol: {
    task: 'Winch the bogged Patrol out on the ridge',
    unlocked: 'The Patrol’s owner is selling up when he gets home: it’s yours to drive.',
  },
  lc79: {
    task: 'Winch the bogged LandCruiser out at Donovan’s Creek',
    unlocked: 'The LandCruiser’s owner owes you one: borrow the 79 any time.',
  },
  troopy: {
    task: 'Load all five side-trip and hidden finds in one run',
    unlocked: 'Every side trip found. The Troopy and its long-range tank are yours.',
  },
  unimog: {
    task: 'Reach the Lions Den without using the winch',
    unlocked: 'Through the whole CREB without the winch. The Army lends you its Unimog.',
  },
  ute40: {
    task: 'Finish the CREB in the Hilux',
    unlocked: 'The farm ute’s owner reckons if you got a Hilux through, you can take the old 45.',
  },
  hj60: {
    task: 'Finish the CREB in the 40 Series',
    unlocked: 'The old 40 got you through. Its big brother, a 1986 HJ60 wagon, is yours.',
  },
  mq: {
    task: 'Finish the CREB in the GQ Patrol',
    unlocked: 'The GQ’s owner keeps his old MQ hardtop in the shed. It’s yours for the Cape.',
  },
  sooty80: {
    task: 'Beat 2:00 up Big Red, 2:00 up Bob’s Hill and 3:00 down the concrete',
    unlocked: 'All three sections on time. The modified 80 Series is yours.',
  },
  rangie: {
    task: 'Finish the CREB in the Camel Trophy Land Rover',
    unlocked: 'The Camel got you through. A Lincoln Green two-door Range Rover is yours.',
  },
  perentie: {
    task: 'Army supply run: tow two fuel drums to Wujal Wujal',
    unlocked: 'Both drums delivered to Wujal Wujal. The Army’s Perentie is yours.',
  },
};

/** Target seconds for the 80 Series challenge, by timed section id. */
export const sectionTargets: Record<string, number> = {
  'big-red': 120,
  'bobs-hill': 120,
  'concrete-descent': 180,
};

/** The Army supply run: drums on the trailer, and the camp they go to. */
export const supplyRun = { drums: 2, goal: 'bloomfield-camp' } as const;

export function isLockedVehicle(id: VehicleId): id is LockedVehicleId {
  return !starterVehicles.includes(id);
}

/** Can this vehicle be driven? */
export function vehicleOpen(id: VehicleId, unlocked: readonly VehicleId[], dev = false): boolean {
  return dev || !isLockedVehicle(id) || unlocked.includes(id);
}

/** Every section best under its target. */
export function sectionTargetsMet(bests: Record<string, number>): boolean {
  return Object.entries(sectionTargets).every(([id, s]) => (bests[id] ?? Infinity) <= s);
}
