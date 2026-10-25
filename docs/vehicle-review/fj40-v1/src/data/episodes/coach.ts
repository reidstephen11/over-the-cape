import type { EpisodeDef } from '../episodes';

/**
 * Episode 2, the Old Coach Road. History is kept to what the sources in docs/HISTORY.md
 * say; the map shortens the distances (src/data/episodes/coachMap.ts).
 */
export const coachEpisode: EpisodeDef = {
  id: 'coach',
  number: 2,
  title: 'The Old Coach Road',
  route: 'Maytown to Laura through the Palmer River goldfields',
  mapId: 'coach',
  mission: 'Through Maytown to Laura before dark',
  goal: 'laura',
  // August, the middle of the dry: the road is open and the rivers are low. A late start
  // from the Palmer, with dark at 6:30 pm.
  startHour: 10,
  weather: 'clear',
  deadline: { hour: 18.5, label: 'Dark at 6:30 pm' },
  // Game seconds per real second: the day (8½ hours) passes in half an hour of driving, so a
  // careful run arrives in the late afternoon, and a lot of time stuck runs into the dark.
  clockRate: 17,
  // The map is about 8.6 km of the real trip's 70-odd km; fuel burns to match the real
  // distance. A clean run uses more than the tank holds, so the jerry can goes in on the way.
  fuelScale: 13,
  loadout: { fuel: 50, jerryCans: 1, spares: 2, plugs: 3 },
  briefing: [
    'Gold was found on the Palmer River in 1873, and the rush was on. Maytown grew up as the centre of the field, and from about 1877 a road was cut north from it over the Conglomerate Range to Laura. From 1880 Cobb & Co ran coaches on it.',
    'It is the middle of the dry season. The rivers are down to shallow runs of water over wide beds of soft sand, and the old road is rock, dust and the washouts the last wet left behind. There is no fuel between here and Laura.',
    'Cross the Palmer River to the ruins of Maytown, then take the coach road north over the North Palmer River and the Conglomerate Range, down to the Little Laura River and into Laura. Get there before dark.',
  ],
  notes: {
    'palmer-camp': {
      title: 'The Palmer River',
      text: 'In 1873 a prospecting party led by James Venture Mulligan found payable gold on the Palmer River, and the rush was on. Before the year was out a track had been blazed to the field from Cooktown, on the coast, and the diggers came up it.',
    },
    'palmer-crossing': {
      title: 'Crossing the Palmer',
      text: 'In the dry the Palmer is a shallow channel wandering across a wide bed of soft sand. Keep moving: stop in the sand and the wheels dig themselves in.',
    },
    maytown: {
      title: 'Maytown',
      text: 'Maytown began as a diggers’ camp late in 1873 and was first called Edwardstown. By 1875 it was the field’s administrative and business centre, and it came to have one of the largest Chinese populations in Australia. The school closed in 1925, and by 1945 the town was all but deserted. What is left is the stone kerbing along Leslie Street, the baker’s oven, the cemetery, and a hut rebuilt in Duff Street.',
    },
    'north-palmer': {
      title: 'North Palmer River',
      text: 'Before it crosses the North Palmer the old road divides in two, and both ways have been kept: one was the crossing when the river was up. Today you can go straight through the soft sand, or take the other line upstream over a bar of rock.',
    },
    'range-face': {
      title: 'Conglomerate Range',
      text: 'The road’s builders eased its grades and built walls and drains to hold it, but rain and the wheels of the coaches cut into the soft sandstone. There are three ways up the face: the middle line goes straight up over bands of rock (low range, both lockers, and don’t spin the wheels on the rock); the old coach road slants up to the west, worn into deep ruts; the bypass winds round to the east.',
    },
    'hotel-site': {
      title: 'Hotel site',
      text: 'Along the old road are the sites of its hotels and staging posts, Chalmer’s, Patrick’s and Ned’s hotels among them, with the remains of gold workings and of Chinese market gardens.',
    },
    'big-step': {
      title: 'The big step',
      text: 'The road drops into a sandy gully and climbs out over a metre of bare sandstone. Low range and a steady crawl, or take the eastern track round it.',
    },
    'range-descent': {
      title: 'The descent',
      text: 'The descent off the Conglomerate Range is where the coach wheels and the rain cut deepest into the soft sandstone. The road drops through its harder bands: low range, first gear, and let the engine hold you back.',
    },
    'little-laura': {
      title: 'Little Laura River',
      text: 'Sand on both banks and a shallow run of water between. Keep it moving, as at the Palmer.',
    },
  },
  wrapUp: [
    'You made Laura. The road you came in on was entered on the Queensland Heritage Register in 1992 for its cuttings and its drainage, and stretches of it are still as they were built.',
    'The sandstone escarpments round Laura hold a large body of Aboriginal rock art, the Quinkan paintings, named for the spirit figures in them. Quinkan Country was added to the National Heritage List in 2018.',
  ],
  failures: {
    time: 'Dark caught you short of Laura. The coach road is no place to be picking a line over rock by headlights.',
    fuel: 'Out of fuel, with no jerry cans left.',
    tyre: 'A tyre is flat and there’s nothing left to fix it with.',
    engine: 'The engine is wrecked.',
    swept: 'The current took the vehicle.',
  },
};
