import { episodeOrder } from '../data/episodes';
import type { SaveData } from '../sim/save/save';
import type { LaunchChoice } from './game';

/**
 * The welcome screen's starting choice: the episode and vehicle chosen last time,
 * carrying on from its last camp if a run is under way.
 */
export function choiceFromSave(save: SaveData | null): LaunchChoice {
  const episode = save?.episode ?? episodeOrder[0];
  return {
    episode,
    vehicle: save?.vehicle ?? 'shortie',
    resume: !!save?.episodes[episode]?.checkpoint,
    replay: save?.episodes[episode]?.completed ? (save.replay ?? null) : null,
  };
}
