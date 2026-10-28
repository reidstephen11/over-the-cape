import { SAVE_KEY } from '../../core/config';
import type { CrawlBests } from '../crawlRuns';
import type { Checkpoint } from '../episode';
import type { TyreFault } from '../vehicle/condition';
import type { VehicleId } from '../../data/vehicle';
import { isVehicleId } from '../../data/vehicles';
import { episodeOrder, isEpisodeId, type EpisodeId } from '../../data/episodes';
import { isTimeOfDay, isWeather, type Conditions } from '../../data/environment';
import { isDamageMode, type DamageMode } from '../../data/damage';
import { readDeliveryState } from '../trailerState';

export interface Settings {
  quality: 'low' | 'medium' | 'high';
  masterVolume: number;
  engineVolume: number;
  ambienceVolume: number;
  units: 'kmh' | 'mph';
  /** Mechanical damage, and with it how an episode can end: off, mild or realistic. */
  damage: DamageMode;
}

/** How far you've got in one episode. */
export interface EpisodeProgress {
  completed: boolean;
  /** Quickest finish, in minutes of driving. */
  bestMinutes?: number;
  /** Highest finish score, out of 1000 (src/sim/runScore.ts). */
  bestScore?: number;
  /** A run under way: where it restarts from (the last camp reached). */
  checkpoint?: Checkpoint | null;
}

export interface SaveData {
  version: 1;
  settings: Settings;
  /** The vehicle last driven. */
  vehicle: VehicleId;
  /** The episode last chosen on the welcome screen. */
  episode: EpisodeId;
  episodes: Partial<Record<EpisodeId, EpisodeProgress>>;
  /** Replaying a finished episode in chosen conditions (null: the story's own). */
  replay: Conditions | null;
  /** Best scored run per crawl trail. */
  crawlBests?: CrawlBests;
}

export const defaultSettings: Settings = {
  quality: 'medium',
  masterVolume: 0.8,
  engineVolume: 0.8,
  ambienceVolume: 0.7,
  units: 'kmh',
  damage: 'mild',
};

/** Minimal storage interface so tests can pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function store(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Accessing localStorage itself can throw when storage is blocked.
    return null;
  }
}

function clamp01(x: unknown, fallback: number): number {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : fallback;
}

const num = (x: unknown, fallback = 0): number =>
  typeof x === 'number' && Number.isFinite(x) ? x : fallback;

/** Read the save; any problem (blocked storage, bad JSON, old data) gives null. */
export function loadSave(s: KeyValueStore | null = store()): SaveData | null {
  try {
    const raw = s?.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SaveData>;
    if (data.version !== 1) return null;
    const st = (data.settings ?? {}) as Partial<Settings>;
    const episodes: Partial<Record<EpisodeId, EpisodeProgress>> = {};
    if (data.episodes && typeof data.episodes === 'object')
      for (const [id, p] of Object.entries(data.episodes))
        if (isEpisodeId(id)) episodes[id] = readProgress(p);
    const replay = data.replay as Partial<Conditions> | null | undefined;
    return {
      version: 1,
      settings: {
        quality: st.quality === 'low' || st.quality === 'high' ? st.quality : 'medium',
        masterVolume: clamp01(st.masterVolume, defaultSettings.masterVolume),
        engineVolume: clamp01(st.engineVolume, defaultSettings.engineVolume),
        ambienceVolume: clamp01(st.ambienceVolume, defaultSettings.ambienceVolume),
        units: st.units === 'mph' ? 'mph' : 'kmh',
        damage: isDamageMode(st.damage) ? st.damage : defaultSettings.damage,
      },
      vehicle: isVehicleId(data.vehicle) ? data.vehicle : 'shortie',
      episode: isEpisodeId(data.episode) ? data.episode : episodeOrder[0],
      episodes,
      replay:
        replay && isTimeOfDay(replay.time) && isWeather(replay.weather)
          ? { time: replay.time, weather: replay.weather }
          : null,
      crawlBests: readBests(data.crawlBests),
    };
  } catch {
    return null;
  }
}

function readProgress(raw: unknown): EpisodeProgress {
  const p = (raw ?? {}) as Partial<EpisodeProgress>;
  const best = num(p.bestMinutes, NaN);
  const score = num(p.bestScore, NaN);
  return {
    completed: p.completed === true,
    ...(Number.isFinite(best) ? { bestMinutes: best } : {}),
    ...(Number.isFinite(score) ? { bestScore: score } : {}),
    checkpoint: readCheckpoint(p.checkpoint),
  };
}

const faults: readonly TyreFault[] = ['none', 'puncture', 'sidewall'];

function readCheckpoint(raw: unknown): Checkpoint | null {
  const c = raw as Partial<Checkpoint> | null | undefined;
  if (!c || typeof c.camp !== 'string') return null;
  const four = <T>(arr: unknown, ok: (x: unknown) => x is T, fallback: T): T[] =>
    [0, 1, 2, 3].map((i) => (Array.isArray(arr) && ok(arr[i]) ? arr[i] : fallback));
  return {
    camp: c.camp,
    hour: num(c.hour, 12),
    elapsed: Math.max(0, num(c.elapsed)),
    fuel: Math.max(0, num(c.fuel)),
    jerryCans: Math.max(0, Math.round(num(c.jerryCans))),
    spares: Math.max(0, Math.round(num(c.spares))),
    plugs: Math.max(0, Math.round(num(c.plugs))),
    tyres: four(c.tyres, (x): x is number => typeof x === 'number' && Number.isFinite(x), 1).map((h) =>
      Math.min(1, Math.max(0, h)),
    ),
    tyreFault: four(c.tyreFault, (x): x is TyreFault => faults.includes(x as TyreFault), 'none'),
    discovered: strings(c.discovered),
    // Saves from before v0.09 have none.
    taken: strings(c.taken),
    // Saves from before surprises: any fixed seed keeps a restart the same as the run.
    seed: Math.max(1, Math.floor(Math.abs(num(c.seed, 1)))),
    surprises: strings(c.surprises),
    // Saves from before rescues: nobody had been pulled out.
    rescued: c.rescued === true,
    ...(c.delivery ? { delivery: readDeliveryState(c.delivery) } : {}),
  };
}

const strings = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];

function readBests(raw: unknown): CrawlBests {
  const out: CrawlBests = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const b = v as { points?: unknown; seconds?: unknown } | null;
    if (b && typeof b.points === 'number' && typeof b.seconds === 'number' && Number.isFinite(b.seconds))
      out[id] = { points: b.points, seconds: b.seconds };
  }
  return out;
}

/** Episodes open to play: the first, and each one after a finished episode. */
export function unlocked(save: SaveData | null, id: EpisodeId): boolean {
  const i = episodeOrder.indexOf(id);
  return i <= 0 || save?.episodes[episodeOrder[i - 1]]?.completed === true;
}

/** Write the save. Returns false (and never throws) if storage is unavailable. */
export function writeSave(data: SaveData, s: KeyValueStore | null = store()): boolean {
  try {
    if (!s) return false;
    s.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
