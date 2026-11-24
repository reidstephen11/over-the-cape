import { highCountryMap } from './fixtures/maps/map';
import { ironbarkParkMap } from './fixtures/maps/park';
import { crawlerCreekMap } from './fixtures/maps/crawlerCreek';
import { crebMap } from '../src/data/episodes/crebMap';
import { telegraphMap } from '../src/data/episodes/telegraphMap';
import { telegraphNorthMap } from '../src/data/episodes/telegraphNorthMap';
import { telegraphNorthEpisode } from '../src/data/episodes/telegraphNorth';
import { telegraphNorthWeather } from '../src/data/episodes/telegraphNorthWeather';
import { conditionById, conditionFor, stormFor } from '../src/data/trackConditions';
import { prepareFlood } from '../src/sim/world/flood';
import { buildWorld, type World } from '../src/sim/world/world';

let cached: World | null = null;
let park: World | null = null;
let creek: World | null = null;
let creb: World | null = null;

/** Shared world for tests (generation takes a couple of seconds). */
export function testWorld(): World {
  cached ??= buildWorld(highCountryMap);
  return cached;
}

/** Ironbark 4WD Park, shared the same way. */
export function parkWorld(): World {
  park ??= buildWorld(ironbarkParkMap);
  return park;
}

/** Crawler Creek, shared the same way. */
export function crawlerCreekWorld(): World {
  creek ??= buildWorld(crawlerCreekMap);
  return creek;
}

/**
 * The CREB Track, shared the same way. With the forks pool each test file has its own copy,
 * so this saves a build only within a file. A test that adds puddles restores the water after.
 */
export function crebWorld(): World {
  creb ??= buildWorld(crebMap);
  return creb;
}

let telegraph: World | null = null;

/** The Telegraph Track, shared the same way. */
export function telegraphWorld(): World {
  telegraph ??= buildWorld(telegraphMap);
  return telegraph;
}

let telegraphNorth: World | null = null;

/**
 * The northern Telegraph Track, shared the same way. Its creeks rise with the afternoon's
 * rain, so the world is made ready for the wettest day's storm, as the game does.
 */
export function telegraphNorthWorld(): World {
  if (!telegraphNorth) {
    telegraphNorth = buildWorld(telegraphNorthMap);
    const wet = conditionFor(conditionById('wet'), telegraphNorthEpisode.conditions);
    prepareFlood(telegraphNorth, stormFor(telegraphNorthWeather, wet));
  }
  return telegraphNorth;
}
