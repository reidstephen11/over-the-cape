import type { GateDef } from '../../sim/world/mapTypes';
import type { GateCourseDef } from '../../sim/scoredGates';

export const crebGateCourse: GateCourseDef = {
  id: 'knoll-rock-climb',
  name: 'Knoll rock climb',
  trackId: 'knoll-rock-climb',
};

/** Same climb and rock geometry: gates test placement through its eight pitches. */
export const crebGates: GateDef[] = [6, 23, 41, 59, 78, 97, 115, 130].map((at, k) => ({
  n: k + 1,
  trackId: crebGateCourse.trackId,
  at,
  width: 3.6,
}));
