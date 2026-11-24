import type { MapDef } from '../sim/world/mapTypes';
import { crebMap } from './episodes/crebMap';
import { telegraphMap } from './episodes/telegraphMap';
import { telegraphNorthMap } from './episodes/telegraphNorthMap';

/** One map per episode, in story order. */
export type MapId = 'creb' | 'telegraph' | 'telegraphNorth';

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
  telegraph: {
    def: telegraphMap,
    blurb:
      'Bramwell Junction to Gunshot Creek on the Old Telegraph Track: short, sandy and cut by steep creeks.',
  },
  telegraphNorth: {
    def: telegraphNorthMap,
    blurb:
      'The Bamaga Road turn-off to Nolans Brook on the northern Old Telegraph Track: deep crossings and a log bridge.',
  },
};

export const mapOrder: readonly MapId[] = ['creb', 'telegraph', 'telegraphNorth'];

export function isMapId(x: unknown): x is MapId {
  return typeof x === 'string' && x in maps;
}
