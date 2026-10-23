import type { MapId } from './maps';
import type { Weather } from './environment';
import type { WeatherTimeline } from './weatherTimeline';
import { coachEpisode } from './episodes/coach';
import { crebEpisode } from './episodes/creb';
import { lakefieldEpisode } from './episodes/lakefield';
import type { SurpriseSetDef } from '../sim/world/surprisePlan';
import type { StuckVehicleDef } from '../sim/stuckVehicle';
import type { VehicleId } from './vehicle';

/**
 * Episodes, south to north up Cape York. Each has its own map, a core mission, the
 * conditions the story sets and a fixed load of fuel and spares. They unlock in order.
 */
export type EpisodeId = 'creb' | 'coach' | 'lakefield';

/** Why an episode can end early. */
export type FailReason = 'time' | 'fuel' | 'tyre' | 'engine' | 'swept';

export interface EpisodeLoadout {
  /** Litres in the tank at the start. */
  fuel: number;
  /** Full 20 L jerry cans. */
  jerryCans: number;
  spares: number;
  /** Tyre plugs in the repair kit. */
  plugs: number;
}

/**
 * Someone bogged on the way, to winch out before the episode can be finished: their
 * vehicle (src/sim/stuckVehicle.ts), how it looks, and what they say once they're free.
 */
export interface RescueDef extends StuckVehicleDef {
  /** Which of the game's vehicles it is drawn as. */
  look: VehicleId;
  /** The HUD's mission line until they are out. */
  mission: string;
  /** Shown as they come free. */
  freed: { title: string; text: string };
}

export interface EpisodeDef {
  id: EpisodeId;
  number: number;
  title: string;
  /** From where to where, for menus. */
  route: string;
  mapId: MapId;
  /** The core mission, one line for the HUD. */
  mission: string;
  /** POI id that completes the mission. */
  goal: string;
  /** Time of day at the start (hours, 13.5 = 1:30 pm). */
  startHour: number;
  weather: Weather;
  /** Weather that changes through the run (a storm coming through), from `weather` at the start. */
  storm?: WeatherTimeline;
  /**
   * Miss this and the episode ends (hours), with a label for the HUD. With `until`, it
   * only holds until that place (a POI id) is reached, and the HUD shows `mission` till then.
   */
  deadline?: { hour: number; label: string; until?: string; mission?: string };
  /** Someone to winch out of a bog on the way: the goal doesn't count until they're free. */
  rescue?: RescueDef;
  /** The HUD's mission line once the rescue and the deadline are behind (the mission when absent). */
  lastLeg?: string;
  /** Game seconds per real second while driving. */
  clockRate: number;
  /** Fuel burnt per litre the engine really uses (the map shortens the distance). */
  fuelScale: number;
  loadout: EpisodeLoadout;
  /** One-off events on the way, placed afresh each run (a tree coming down, rocks off a bank). */
  surprises?: SurpriseSetDef;
  /** Paragraphs shown before the episode. */
  briefing: string[];
  /** History notes shown on reaching a place (by POI id). */
  notes: Record<string, { title: string; text: string }>;
  /** Paragraphs shown on completing the mission. */
  wrapUp: string[];
  failures: Record<FailReason, string>;
}

/** Episodes still to come: shown locked on the welcome screen. */
export interface UpcomingEpisode {
  number: number;
  title: string;
  route: string;
}

export const episodes: Record<EpisodeId, EpisodeDef> = {
  creb: crebEpisode,
  coach: coachEpisode,
  lakefield: lakefieldEpisode,
};

export const episodeOrder: readonly EpisodeId[] = ['creb', 'coach', 'lakefield'];

export const upcomingEpisodes: readonly UpcomingEpisode[] = [
  { number: 4, title: 'The Frenchmans Track', route: 'Across the Pascoe and Wenlock rivers' },
  { number: 5, title: 'Telegraph Track South', route: 'Bramwell Junction to Gunshot Creek' },
  { number: 6, title: 'Telegraph Track North', route: 'The waterfalls, the creeks and Nolans Brook' },
  { number: 7, title: 'The Tip', route: 'Over the Jardine to the northernmost point' },
];

export function isEpisodeId(x: unknown): x is EpisodeId {
  return typeof x === 'string' && x in episodes;
}

/** Hours as a clock time: 13.25 → "1:15 pm". */
export function clockTime(hour: number): string {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
