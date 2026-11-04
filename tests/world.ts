import { highCountryMap } from './fixtures/maps/map';
import { ironbarkParkMap } from './fixtures/maps/park';
import { crawlerCreekMap } from './fixtures/maps/crawlerCreek';
import { crebMap } from '../src/data/episodes/crebMap';
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
