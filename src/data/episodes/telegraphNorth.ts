import type { EpisodeDef } from '../episodes';
import { telegraphNorthWeather } from './telegraphNorthWeather';

/**
 * Episode 3, the northern Telegraph Track: the Bamaga Road turn-off to Nolans Brook
 * (docs/PLAN-telegraph-north.md). Where the southern episode is steep banks, this one is
 * water: a deep crossing with a right and a wrong way out, a log bridge with logs missing,
 * and Nolans Brook, which rises with the afternoon's rain. History is kept to what the
 * sources in docs/HISTORY.md say.
 */
export const telegraphNorthEpisode: EpisodeDef = {
  id: 'telegraphNorth',
  number: 3,
  title: 'The Telegraph Track North',
  route: 'The Bamaga Road turn-off to Nolans Brook',
  mapId: 'telegraphNorth',
  mission: 'Cross Nolans Brook before the rain lifts it',
  goal: 'nolans-camp',
  // Early afternoon, fine. The rain comes from 3 pm (telegraphNorthWeather.ts), and how much
  // water is in the creeks to begin with is rolled per run (src/data/trackConditions.ts).
  startHour: 13.5,
  weather: 'clear',
  storm: telegraphNorthWeather,
  deadline: {
    hour: 18.25,
    label: 'Dark at 6:15 pm',
    graceHours: 1,
    graceNote: 'Dark, and Nolans Brook is still rising: reach its north bank by 7:15 pm',
  },
  // A clean run of about 15 minutes reaches Nolans Brook a little after 3 pm, as the first
  // showers arrive and before the brook has risen. From 4 pm every ten minutes lost is
  // nearly another 0.2 m of water over the shoal on the commonest day.
  clockRate: 7,
  // A scripted clean run of the whole route (tests/telegraphNorthDrive.test.ts) burns about
  // 11 L at this scale in the short 40: 16 L is that and nearly a half more.
  fuelScale: 12,
  loadout: { fuel: 16, jerryCans: 0, spares: 1, plugs: 2 },
  conditions: {
    dry: {
      briefing:
        'Late in the dry: the creeks are low and Nolans Brook is as shallow as it gets. Showers are forecast from mid-afternoon all the same.',
      creekRise: -0.1,
    },
    reopened: {
      briefing:
        'Early in the dry: the creeks are running and the sand is damp. Rain is forecast from mid-afternoon, and Nolans Brook rises with it.',
      creekRise: 0,
    },
    wet: {
      briefing:
        'Only just open after the wet: every creek is up, and Nolans Brook is already deep over its shoal. The rain from mid-afternoon will lift it further: do not lose time.',
      creekRise: 0.15,
    },
  },
  timedSections: ['canal-creek', 'nolans-brook'],
  briefing: [
    'The northern half of the old Telegraph Track: nearly two kilometres from the Bamaga Road turn-off north to Nolans Brook, across six creeks. The steep banks are behind you. Up here the trouble is water.',
    'Canal Creek is deep, with a right and a wrong way out. Cypress Creek is crossed on an old log bridge with logs missing. Nolans Brook, the last, is wide and deep over soft sand: the line is hard to the right.',
    'There is one camp, at Cannibal Creek about halfway. The load is lean: fuel for a clean run and a little over, no jerry cans, one spare and two tyre plugs.',
    'Rain is forecast from mid-afternoon, and Nolans Brook rises with it. Get there early and it is a wade; get there late and it will drown an engine with no snorkel.',
  ],
  notes: {
    'bamaga-turnoff': {
      title: 'The northern track',
      text: 'The northern section of the old Telegraph Track runs from the Bamaga Road to the Jardine River. Most traffic drives it south to north, and there are few places to pass.',
    },
    'canal-creek': {
      title: 'Canal Creek',
      text: 'A deep crossing of clear blue water. The old way out, to the right, has been washed out into gullies. The way out now is a winding one to the left: cross on the shelf, turn left along the foot of the far bank, and follow it up.',
    },
    'sam-creek': {
      title: 'Sam Creek',
      text: 'An easy crossing, with clear swimming holes downstream of it.',
    },
    'mistake-creek': {
      title: 'Mistake Creek',
      text: 'A steep, eroded way in, but straightforward from the bottom. Low range and crawl. The bank has washed away on the right, so keep left of the hole; there is a rut under the left wheels and a ledge of rock half-way down.',
    },
    'cannibal-camp': {
      title: 'Cannibal Creek',
      text: 'An easy crossing with camping beside it. This is the only camp on the track: from here on, a failure brings you back to this spot.',
    },
    'cypress-creek': {
      title: 'Cypress Creek',
      text: 'Crossed on a rickety old log bridge that has seen better days. Logs are missing: a hole on the right, then one on the left, then a narrow one down the middle to straddle. Line the car up before you drive on, and crawl. There is no way through the creek below.',
    },
    'long-drive': {
      title: 'The long drive',
      text: 'A long run of soft sand with whoops in it before the last crossing. Keep the tyres at 18 psi and keep it moving. Two thirds along, a bog lies across the right of the track: keep the left wheels on the firm edge.',
    },
    'nolans-brook': {
      title: 'Nolans Brook',
      text: 'Also called Bridge Creek: the bridge fell apart long ago, and this is now the biggest obstacle south of the Jardine River. Up to a metre and a half of water over a soft sandy bottom. The hard right line is usually shallower, with a firmer bottom: go in, turn hard right onto the shoal, then straight across on it to the way out. Crawl, so the car pushes no bow wave, and hold it against the current, which pushes you left, off the shoal.',
    },
  },
  wrapUp: [
    'You’re across Nolans Brook with a dry engine. From here the track runs on north to the old ford on the Jardine River. Before the ferry, vehicles drove across that river, 140 metres wide; the old crossing is closed now.',
  ],
  failures: {
    time: 'Past seven, and Nolans Brook is too high to cross in the dark.',
    fuel: 'Out of fuel, and no jerry cans on board.',
    tyre: 'A tyre is flat and there’s nothing left to fix it with.',
    engine: 'The engine has taken in water and is wrecked.',
    swept: 'The current took the vehicle.',
  },
};
