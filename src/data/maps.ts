import type { MapDef } from '../sim/world/mapTypes';
import { coachMap } from './episodes/coachMap';
import { crebMap } from './episodes/crebMap';

/** One map per episode, in story order. */
export type MapId = 'creb' | 'coach';

export interface MapEntry {
  def: MapDef;
  /** One line for menus. */
  blurb: string;
}

export const maps: Record<MapId, MapEntry> = {
  creb: {
    def: crebMap,
    blurb: 'Daintree Village to the Lions Den on the old powerline service track through the rainforest.',
  },
  coach: {
    def: coachMap,
    blurb: 'Maytown to Laura on the old coach road over the Conglomerate Range.',
  },
};

export const mapOrder: readonly MapId[] = ['creb', 'coach'];

export function isMapId(x: unknown): x is MapId {
  return typeof x === 'string' && x in maps;
}
