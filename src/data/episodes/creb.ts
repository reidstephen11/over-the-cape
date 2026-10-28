import type { EpisodeDef } from '../episodes';
import { crebSurprises } from './crebSurprises';
import { crebStorm } from './crebWeather';

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
  // A storm comes through in the afternoon (src/data/episodes/crebWeather.ts).
  storm: crebStorm,
  deadline: { hour: 18.25, label: 'Dark at 6:15 pm' },
  // Game seconds per real second. The afternoon is 5¾ hours, so this leaves time to stop
  // and winch. Getting stuck or swept is what fails the day, not the clock.
  clockRate: 4.5,
  // The map is about 6.6 km of the real trip's 100-odd km. Scaled so a clean run finishes
  // on the fuel in the tank; the jerry can is there for a recovery, not the plan.
  fuelScale: 6,
  loadout: { fuel: 50, jerryCans: 1, spares: 2, plugs: 3 },
  // After the wet, dead trees come down and cuttings shed rocks: where, each run decides.
  surprises: crebSurprises,
  briefing: [
    'The CREB Track runs north from the Daintree River through World Heritage rainforest to Wujal Wujal on the Bloomfield River. The Cairns Regional Electricity Board — the CREB — cut it as the service track for the power line to Cooktown. The line has since moved further inland, and the track is left to four-wheel drives.',
    'It only opens once the wet season is over and the damage has been repaired, and heavy rain can close it again. It rained overnight: the red clay on the climbs will be slippery.',
    'The road out of the village is an orientation. The signs take the controls one at a time: low range (L) on the first ramp, the diff locks (Z, then X) on the pinch after it, precision crawl (P) over the rock step, then the winch (E to hook, R and F to wind) in the bog before the river. After that the track stops being a lesson.',
    'Storms are forecast from about 3 pm. Once the rain sets in the clay gets greasier and the creeks rise and run faster the longer it rains. There is time to winch out of a bog. What ends the day is getting stuck for good, or stopping in a crossing and being swept. A clean run finishes on the fuel in the tank.',
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
    'orient-low-range': {
      title: 'Low range',
      text: 'Press L. Low range multiplies the gearing so the engine can creep instead of stalling. This first ramp is the place to learn it: high range spins the wheels on the wet clay. Come at it straight, in low range, and let it pull.',
    },
    'orient-lockers': {
      title: 'Diff locks',
      text: 'Press Z to lock the rear diff, then X for the front. They only engage below a walking pace. An open diff sends the drive to the wheel that slips; locked, both wheels on the axle have to turn together. This pinch needs both.',
    },
    'orient-crawl': {
      title: 'Precision crawl',
      text: 'Press P. Crawl holds a walking pace: hold the throttle and it creeps, let go and it stops. Walk the wheels up the step. Come at it in high range and you bang the lip.',
    },
    'orient-winch': {
      title: 'The winch',
      text: 'The bog is across the road. Stop in it, press E and pick the tree ahead, then R to wind in (F winds out). A tree stands at either end. The same winch pulls a fallen tree aside later on the range.',
    },
    'big-red': {
      title: 'Big Red',
      text: 'The hardest climb on the CREB: red clay that turns to grease in the wet. Low range, both lockers, precision crawl, and keep the wheels on the crown. The left gutter is dug out — drop a wheel in it and the belly grounds. The west line is longer, with a bog and a pinch as steep as this face.',
    },
    'paddock-gap': {
      title: 'Plank gap',
      text: 'A channel cut across the road, too wide to drive. Stop short, lay the planks in line with the wheels and crawl over in low range. Recall planks in the tool menu puts them back on the rack for the next gap.',
    },
    'ridge-washout': {
      title: 'Washout',
      text: 'Water running off the range in the wet has cut a channel across the track, too wide and deep to drive over. The same planks as on the paddock road: stop short, lay them in line with the wheels, and crawl over in low range. Recall planks once you are well past.',
    },
    'bloomfield-gap': {
      title: 'Another gap',
      text: 'The Bloomfield Track is cut the same way. Planks across, low range, then recall them. The creeks either side of it are the other lesson: slow down before the water and do not stop in it.',
    },
    'roaring-meg-ledge': {
      title: 'Rock ledge',
      text: 'A step of rock about a metre high across the climb. Low range, both lockers and a slow crawl walk the wheels up it. Spin them on the rock and you will cut the tyres.',
    },
    'range-sideling': {
      title: 'Sideling',
      text: 'The track sidles round the hill here, leaning out towards the drop. Taken fast on wet clay, the car slides down towards the edge. Crawl across, keep to the high side and never turn downhill.',
    },
    'bloomfield-creeks': {
      title: 'Creek crossings',
      text: 'After the wet, creeks off the hills run fast across the Bloomfield Track. Slow right down before the water and keep moving once you are in it: stop in the current and it pushes the car downstream, into the scour hole below the ford.',
    },
    'ridge-bog': {
      title: 'Bog in the saddle',
      text: 'The track drops into a hollow the rain drains into and can’t get out of: deep, sticky mud under the water, across the road. The winch is the way through. The chicken track round the west side stays out of the mud, then climbs back up off-camber over a ledge: longer, and not the easy way.',
    },
    'bobs-hill': {
      title: 'Bob’s Hill',
      text: 'About halfway along the CREB, and to many drivers the hardest part of it: steep, rutted and rocky. Spinning the wheels on rock can cut a tyre, so creep up in low range.',
    },
    'line-camp': {
      title: 'Old line camp',
      text: 'A rough hut off the ridge, left from the days when this track served the power line to Cooktown. Someone has left a tin of tyre plugs on a crate by the door: pull up beside it to load them.',
    },
    'linesmans-hut': {
      title: 'Linesman’s hut',
      text: 'Old poles lean in the scrub down this flank, without their wires, and the track follows them to a hut. There’s a full jerry can on a crate by the door. The climb back up to the main track is greasy clay: low range.',
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
