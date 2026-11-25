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
  // Stage 2 (v2.21). A 4WD coming south on the sand between Sam Creek and Mistake Creek:
  // most traffic drives the track south to north, and there are few places to pass.
  traffic: [{ track: 'sam-mistake', name: 'A Patrol', look: 'patrol' }],
  // A traveller who took Nolans Brook straight across and drowned the engine, sitting in
  // the old line in about 1.3 m of water. Winching them back to the shoal costs time while
  // the brook rises, and pays a jerry can of fuel they can no longer use.
  stranded: [
    {
      id: 'nolans-drowned',
      name: 'Drowned HiLux',
      look: 'hilux',
      track: 'nolans-brook',
      at: 0.3,
      side: 'left',
      off: 9,
      sink: 0.2,
      freeAfter: 6,
      breakout: 3200,
      drag: 2600,
      reward: { jerryCans: 1 },
      freed: {
        title: 'The HiLux',
        text: '“Went straight across, like the track on the map. It stopped right where you found it. Take the jerry can off the back: it’s no use to this engine now.”',
      },
    },
  ],
  // The falls: two turn-offs to the right before Canal Creek. Both cost time, and the brook
  // is rising.
  sideTrips: [
    {
      id: 'northern-falls',
      name: 'The falls',
      description:
        'Two turn-offs to the right before Canal Creek lead to swimming holes: Fruit Bat Falls, soon after the start, and Eliot and Twin Falls, just before the creek. Pull up for a few seconds at each, in either order. Every minute spent here is a minute for Nolans Brook to rise.',
      anyOrder: true,
      stops: [
        {
          id: 'fruit-bat',
          poi: 'fruit-bat-falls',
          task: 'Stop at Fruit Bat Falls',
          directions:
            'Take the fork to the right soon after the Bamaga Road turn-off. Stop at the end of the track, above the pool.',
          radius: 14,
          entry:
            'A wide blue-green pool under a low cascade the whole width of the creek. Day visitors only, and nobody here yet. Too early in the trip for a swim, with the brook still to cross.',
        },
        {
          id: 'eliot-twin',
          poi: 'eliot-twin-falls',
          task: 'Stop at Eliot and Twin Falls',
          directions: 'Turn right just before Canal Creek. Stop at the camping area between the falls.',
          radius: 14,
          entry:
            'Falls upstream and falls downstream of the camping area, with clear pools between. Tents under the trees and wet towels on every bull bar. Canal Creek’s crossing is five minutes back the way we came.',
        },
      ],
      reward: { plugs: 1 },
      rewardLabel: 'A tyre plug from a traveller at the falls',
      finished:
        'Both falls seen. A traveller packing up beside you hands over a spare tyre plug: “You’ll want it before I do.”',
    },
  ],
  // A dead tree down across the long drive, at a spot the run's seed picks.
  surprises: {
    sites: [
      { id: 'long-drive-south', kind: 'treefall', track: 'long-drive', from: 50, to: 120 },
      { id: 'long-drive-middle', kind: 'treefall', track: 'long-drive', from: 130, to: 205 },
    ],
    treefalls: 1,
    rockfalls: 0,
  },
  briefing: [
    'The northern half of the old Telegraph Track: nearly two kilometres from the Bamaga Road turn-off north to Nolans Brook, across six creeks. The steep banks are behind you. Up here the trouble is water.',
    'Canal Creek is deep, with a right and a wrong way out. Cypress Creek is crossed on an old log bridge with logs missing. Nolans Brook, the last, is wide and deep over soft sand: the line is hard to the right.',
    'There is one camp, at Cannibal Creek about halfway. The load is lean: fuel for a clean run and a little over, no jerry cans, one spare and two tyre plugs. Two turn-offs to the right before Canal Creek go to the falls: they cost time. Pull off the track for anyone coming the other way.',
    'Rain is forecast from mid-afternoon, and Nolans Brook rises with it. Get there early and it is a wade; get there late and it will drown an engine with no snorkel.',
  ],
  notes: {
    'bamaga-turnoff': {
      title: 'The northern track',
      text: 'The northern section of the old Telegraph Track runs from the Bamaga Road to the Jardine River. Most traffic drives it south to north, and there are few places to pass.',
    },
    'fruit-bat-falls': {
      title: 'Fruit Bat Falls',
      text: 'A swimming spot reached by a fork to the right off the start of the northern track. Day access only, to a wide blue-green pool and a cascade.',
    },
    'eliot-twin-falls': {
      title: 'Eliot and Twin Falls',
      text: 'The turn-off for Eliot, Twin and Indian Head Falls is just before Canal Creek. There are several falls and swimming areas here, with plenty of camping: one of the best swimming and photography spots on the Telegraph Track.',
    },
    'canal-creek': {
      title: 'Canal Creek',
      text: 'A deep crossing of clear blue water. The old way out, to the right, has been washed out into gullies. The way out now is a winding one to the left. Take low range and crawl. The shelf to cross on is the paler water, straight ahead: drive in between the two rocks at the water’s edge, aim at the sign on the far bank, then turn left along the foot of the bank and follow it up. Either side of the shelf it is deep.',
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
      text: 'A long run of soft sand with whoops in it before the last crossing. Keep the tyres at 18 psi and keep it moving. Two thirds along, a bog lies across the right of the track: keep the left wheels on the firm edge. There is a rock to winch to before it and another past it, both on the left.',
    },
    'nolans-brook': {
      title: 'Nolans Brook',
      text: 'Also called Bridge Creek: the bridge fell apart long ago, and this is now the biggest obstacle south of the Jardine River. Up to a metre and a half of water over a soft sandy bottom. The hard right line is usually shallower, with a firmer bottom: drive into the water first, then turn hard right and keep to the shallows along the bank as far as the big rock at the water’s edge, then turn and drive straight at the sign on the far bank. Crawl, so the car pushes no bow wave, and hold it against the current, which pushes you left, off the shoal.',
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
