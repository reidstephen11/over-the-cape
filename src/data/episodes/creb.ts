import type { EpisodeDef } from '../episodes';

/**
 * Episode 1, the CREB Track. History is kept to what the sources in docs/HISTORY.md say;
 * the map shortens the distances (src/data/episodes/crebMap.ts).
 */
export const crebEpisode: EpisodeDef = {
  id: 'creb',
  number: 1,
  title: 'The CREB Track',
  route: 'Daintree Village to the Lions Den Hotel',
  mapId: 'creb',
  mission: 'Reach the Lions Den Hotel before dark',
  goal: 'lions-den',
  // June: the track has just reopened after the wet, and it rained overnight.
  startHour: 12.5,
  weather: 'wet',
  deadline: { hour: 18.25, label: 'Dark at 6:15 pm' },
  // Game seconds per real second: the afternoon (5¾ hours) passes in 43 minutes of driving,
  // so a careful run that winches out of the bogs arrives in the last of the light.
  clockRate: 8,
  // The map is about 6.6 km of the real trip's 100-odd km; fuel burns to match the real
  // distance. A clean run uses more than the tank holds, so the jerry can goes in on the way.
  fuelScale: 8.5,
  loadout: { fuel: 50, jerryCans: 1, spares: 1, plugs: 3 },
  briefing: [
    'The CREB Track runs north from the Daintree River through World Heritage rainforest to Wujal Wujal on the Bloomfield River. The Cairns Regional Electricity Board — the CREB — cut it as the service track for the power line to Cooktown. The line has since moved further inland, and the track is left to four-wheel drives.',
    'It only opens once the wet season is over and the damage has been repaired, and heavy rain can close it again. It rained overnight: the red clay on the climbs will be slippery.',
    'Cross the Daintree River, climb the range on the old powerline track, come down to the Bloomfield River at Wujal Wujal and follow the Bloomfield Track north to the Lions Den Hotel. Get there before dark.',
  ],
  notes: {
    'daintree-village': {
      title: 'Daintree Village',
      text: 'George Elphinstone Dalrymple named the Daintree River in December 1873, after the geologist Richard Daintree, who never came here. Dalrymple reported stands of red cedar, and timber cutters followed, floating logs down the river to the coast. By 1888 the cedar was nearly gone and the trade had collapsed. The village grew up as the cutters’ base.',
    },
    'daintree-crossing': {
      title: 'Daintree River crossing',
      text: 'The river is wide here and can be a metre deep in the middle. Don’t drive straight across: a gravel bar curves downstream and keeps the water shallower. After the wet it is strewn with boulders and scoured into holes, so weave a line between them and take it slowly. Saltwater crocodiles live in this river, so don’t get out to walk the crossing.',
    },
    'big-red': {
      title: 'Big Red',
      text: 'To many drivers the hardest climb on the CREB: straight up red clay that turns to grease in the wet. Low range, both lockers and a steady throttle — or take the bypass round the west side.',
    },
    'ridge-bog': {
      title: 'Bog in the saddle',
      text: 'The track drops into a hollow the rain drains into and can’t get out of: deep, sticky mud under the water. Push through and you will likely need the winch. The chicken track round the west side is longer and rough, leaning across the hill, but it stays out of the mud.',
    },
    'bobs-hill': {
      title: 'Bob’s Hill',
      text: 'About halfway along the CREB, and to many drivers the hardest part of it: steep, rutted and rocky. Spinning the wheels on rock can cut a tyre, so creep up in low range.',
    },
    'creb-lookout': {
      title: 'The range lookout',
      text: 'In 1983 the council began bulldozing a road through the rainforest from Cape Tribulation to Bloomfield. Protesters blockaded the work that December and again in 1984. The road was finished, but the fight drew the country’s attention, and in 1988 the rainforests of the Wet Tropics were inscribed on the World Heritage list, ending commercial logging in them.',
    },
    'the-concrete': {
      title: 'The concrete',
      text: 'The long descent towards Wujal Wujal is so steep that its worst pinches are concreted, with grooves cut across them for grip. Low range, first gear, and let the engine hold you back.',
    },
    'steep-shortcut': {
      title: 'Steep shortcut',
      text: 'Where the concrete swings west, a rough line runs straight down the spur over rock ledges. It saves time, but go down it in low range at a crawl: drop off a ledge too fast and the rock can cut a tyre.',
    },
    'donovans-crossing': {
      title: 'Donovan’s Creek',
      text: 'The last creeks on the CREB run crystal clear over rock. Check the depth and the far bank before you drive in.',
    },
    'bloomfield-camp': {
      title: 'Wujal Wujal',
      text: 'The Lutheran Church set up a mission on the Bloomfield River in 1886, and the Kuku Nyungkal people still living on their country were moved onto it. In 1979 Kuku Yalanji people began to resettle here, and the place took the name Wujal Wujal.',
    },
    'wujal-falls': {
      title: 'Wujal Wujal Falls',
      text: 'Wujal Wujal is usually translated as “many falls”. Upstream of the community the Bloomfield River drops about 40 metres over the falls. They are a sacred women’s place for the community: look from the track and leave the water alone.',
    },
    'little-annan': {
      title: 'Little Annan River',
      text: 'The road fords the river where it is deepest and fastest. Downstream, where it widens, a gravel bar keeps the water about half as deep: a longer way round along the south bank, but a safer one when the river is up.',
    },
  },
  wrapUp: [
    'You made the Lions Den. The hotel was built in 1875 beside the junction of Mungumby Creek and the Little Annan River, for the tin and gold miners working the country round the Annan. It stayed in the same family until 1964.',
    'In December 2023 floodwater from the Annan rose more than three metres inside the hotel. It was rebuilt and reopened five months later.',
  ],
  failures: {
    time: 'Dark caught you short of the Lions Den. The CREB is no place to be finding the track at night.',
    fuel: 'Out of fuel, with no jerry cans left.',
    tyre: 'A tyre is flat and there’s nothing left to fix it with.',
    engine: 'The engine is wrecked.',
    swept: 'The current took the vehicle.',
  },
};
