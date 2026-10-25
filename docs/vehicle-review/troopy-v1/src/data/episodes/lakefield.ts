import type { EpisodeDef } from '../episodes';
import { STOCKMAN_BOG } from './lakefieldMap';
import { lakefieldStorm } from './lakefieldWeather';

/**
 * Episode 3, Lakefield. The first episode told from the grandparent's 1986 diary (SPEC
 * §2a); the diary and the stockman are made up, the history is kept to what the sources in
 * docs/HISTORY.md say. The map shortens the distances (src/data/episodes/lakefieldMap.ts).
 */
export const lakefieldEpisode: EpisodeDef = {
  id: 'lakefield',
  number: 3,
  title: 'Lakefield',
  route: 'Laura to Musgrave through Lakefield National Park',
  mapId: 'lakefield',
  mission: 'Winch out the stockman, then over Hann Crossing before the river rises',
  goal: 'musgrave',
  // The end of November: the first storms of the wet are coming over. A late start from
  // Laura, after the night's storm.
  startHour: 11,
  weather: 'wet',
  storm: lakefieldStorm,
  // The North Kennedy is over the bar at Hann Crossing by about 3 pm
  // (src/data/episodes/lakefieldWeather.ts); across it, there's no hurry.
  deadline: {
    hour: 15,
    label: 'Hann Crossing goes under about 3 pm',
    until: 'hann-camp',
    mission: 'Over Hann Crossing before the river covers the bar',
  },
  lastLeg: 'On to Musgrave',
  // Game seconds per real second: the autopilot, stopping a minute for the stockman, takes
  // 13 minutes to the crossing and gets there at 2 pm, an hour in hand; a careful driver
  // who takes a few minutes over the winching gets there with half an hour or so.
  clockRate: 14,
  // The map is about 6.8 km of the real trip's 200-odd km; fuel burns to match the real
  // distance. A clean run uses more than the tank holds, so the jerry can goes in on the way.
  fuelScale: 18,
  loadout: { fuel: 50, jerryCans: 1, spares: 2, plugs: 3 },
  rescue: {
    id: 'stockman',
    name: 'Stockman’s Land Cruiser',
    look: 'shortie',
    x: STOCKMAN_BOG.x,
    z: STOCKMAN_BOG.z,
    // He slid off the road's east side going round a wet patch, and sits nose to it.
    headingDeg: 270,
    sink: 0.32,
    freeAfter: 6,
    breakout: 2500,
    drag: 2000,
    mission: 'Find the stockman and winch him out of the bog',
    freed: {
      title: 'The stockman',
      text: '“Good on you. I’ve been sitting in that since yesterday arvo. I’ll clean the mud out of her and follow you up. Don’t hang about at the Hann: with this rain in the ranges she’ll be over the bar by the middle of the afternoon.”',
    },
  },
  briefing: [
    'From the diary, Friday 28 November 1986: “Laura. The first storm of the season came through last night, and the man at the store reckons the park will be shut for the wet any day now. A stockman set out north for Musgrave yesterday in his old Land Cruiser and hasn’t turned up. If he’s bogged on the plains he’ll be there yet. It’s the Hann that worries me: rain up in the ranges brings the North Kennedy up fast, and once it’s over the bar it can stay up for weeks.”',
    'Lakefield National Park was declared in 1979 over two old cattle stations, Laura and Lakefield, after about a hundred years of grazing. It closes every wet season, because the rain makes its roads impassable.',
    'Cross the Laura River at Old Laura homestead and follow the road north over the black soil plains to Lakefield. Find the stockman and winch him out, then get over Hann Crossing on the North Kennedy before the river covers the bar, and go on to Musgrave.',
    'Storms are forecast from about 1 pm. Off the road the black soil turns to grease once it is wet, so keep to the road.',
  ],
  notes: {
    'laura-river': {
      title: 'The Laura River',
      text: 'Sand on both banks and a shallow run of water between. Keep moving: stop in the sand and the wheels dig themselves in.',
    },
    'old-laura': {
      title: 'Old Laura homestead',
      text: 'In October 1879 Peter McDermott and Fergus O’Beirne applied for a run on the lower Laura River. The house that stands here is thought to date from about 1902. The station was sold in 1966 and its homestead left empty; the Queensland Government bought it in 1978, and in 1986 work began to restore the house.',
    },
    'black-soil': {
      title: 'The black soil plains',
      text: 'Off the road the flat country is black soil: baked hard and cracked in the dry, and in the wet a grease that swallows a wheel. The road is firmer. Keep to it, and go through its wet patches rather than round them.',
    },
    lakefield: {
      title: 'Lakefield',
      text: 'Lakefield was taken up as a grazing property in about 1878. The old timber and iron homestead was the hub of the cattle station in the early 1900s, and was left in the early 1960s when a new homestead was built. In 1978 the Queensland Government bought Lakefield and Laura stations, and in 1979 they became Lakefield National Park.',
    },
    stockman: {
      title: 'Bogged',
      text: 'The stockman’s Land Cruiser is down to its axles in black soil beside the road. Stop on the road facing him, hook the winch to his bull bar and winch him in. Stay on the firm road: your tyres there are the anchor.',
    },
    'hann-south': {
      title: 'Hann Crossing',
      text: 'The road crosses the North Kennedy over a bar where the river runs shallow. Rain up in the ranges brings it up quickly, and once it is over the bar the crossing is shut until it goes down. Take it slowly and keep to the bar.',
    },
  },
  wrapUp: [
    'From the diary: “Made Musgrave in the rain, with the stockman an hour behind us.”',
    'Musgrave was built in the 1880s as a station on the telegraph line north from Laura to Thursday Island, and named after Sir Anthony Musgrave, the governor of Queensland. Its office closed in 1929 and the building became a cattle station’s homestead. It is now a roadhouse, and on the Queensland Heritage Register.',
    'In 2011 Lakefield was handed back to its Traditional Owners. It is now Rinyirru (Lakefield) National Park, run by them and the Queensland Government together.',
  ],
  failures: {
    time: 'The North Kennedy came up over the bar before you got across. Hann Crossing is shut until the river goes down, and with the wet coming that could be weeks.',
    fuel: 'Out of fuel, with no jerry cans left.',
    tyre: 'A tyre is flat and there’s nothing left to fix it with.',
    engine: 'The engine is wrecked.',
    swept: 'The North Kennedy took the vehicle off the bar.',
  },
};
