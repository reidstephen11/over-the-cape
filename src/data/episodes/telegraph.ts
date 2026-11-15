import type { EpisodeDef } from '../episodes';
import { telegraphWeather } from './telegraphWeather';

/**
 * Episode 2, the Telegraph Track: Bramwell Junction to Gunshot Creek on the southern Old
 * Telegraph Track (docs/PLAN-telegraph.md). Shorter than the CREB and harder: five creeks
 * cut into a sandy plain, one camp, and a lean load. History is kept to what the sources
 * in docs/HISTORY.md say.
 */
export const telegraphEpisode: EpisodeDef = {
  id: 'telegraph',
  number: 2,
  title: 'The Telegraph Track',
  route: 'Bramwell Junction to Gunshot Creek',
  mapId: 'telegraph',
  mission: 'Get across Gunshot Creek before dark',
  goal: 'gunshot-camp',
  // Mid-afternoon in the dry season. How much water is in the creeks is rolled per run
  // (src/data/trackConditions.ts, with this episode's own numbers below).
  startHour: 15,
  weather: 'clear',
  storm: telegraphWeather,
  deadline: {
    hour: 18.25,
    label: 'Dark at 6:15 pm',
    graceHours: 1,
    graceNote: 'Dark. Keep going on the headlights: reach Gunshot’s north bank by 7:15 pm',
  },
  // A clean run of about 13 minutes uses about half the daylight: the creeks, not the
  // clock, should end most failed runs.
  clockRate: 7,
  // A scripted clean run of the whole route (tests/telegraphDrive.test.ts) burns about
  // 12 L at this scale in the short 40 and a little less in the LC79: 16 L is that and a
  // third more. The thirstiest vehicles (the Unimog) have little to spare.
  fuelScale: 12,
  loadout: { fuel: 16, jerryCans: 0, spares: 1, plugs: 2 },
  // The creeks' current follows their level (flowPerMetre in telegraphWeather.ts): low and
  // slow in the dry roll, high and fast in the wet.
  conditions: {
    dry: {
      briefing:
        'Late in the dry: the clay on the creek banks has dried hard and the creeks are low and slow.',
      creekRise: -0.12,
    },
    reopened: {
      briefing:
        'Early in the dry: the clay on the banks is still damp and greasy, and the creeks are running.',
      creekRise: 0,
    },
    wet: {
      briefing:
        'Only just open after the wet: the clay is slick, the creeks are high and fast, and Ducie’s middle will take a car.',
      creekRise: 0.2,
    },
  },
  timedSections: ['palm-creek', 'gunshot-chute'],
  // A 4WD coming the other way on the sand between Palm Creek and Ducie (v1.99).
  traffic: [{ track: 'palm-ducie', name: 'A Troopy', look: 'troopy' }],
  // A driver bogged in the sand beside the track before Bertie. Winching them out costs
  // time and pays little: one tyre plug (v1.99).
  stranded: [
    {
      id: 'bertie-hilux',
      name: 'Bogged HiLux',
      look: 'hilux',
      track: 'dulhunty-bertie',
      at: 0.45,
      side: 'right',
      off: 8,
      sink: 0.3,
      freeAfter: 5,
      breakout: 2500,
      drag: 2000,
      reward: { plugs: 1 },
      freed: {
        title: 'The HiLux',
        text: '“Cheers. Tried to go round a soft patch and found a softer one. All I can spare is a plug: you’ll want it for Bertie.”',
      },
    },
  ],
  // A dead tree down across the track in the gallery forest by a creek, where there is no
  // way round it but the winch (v1.99). One a run, at a spot the run's seed picks.
  surprises: {
    sites: [
      { id: 'ducie-forest', kind: 'treefall', track: 'palm-ducie', from: 262, to: 292 },
      { id: 'bertie-forest', kind: 'treefall', track: 'dulhunty-bertie', from: 246, to: 264 },
    ],
    treefalls: 1,
    rockfalls: 0,
  },
  bypass: { poi: 'gunshot-bypass', penalty: 250, label: 'Took the Gunshot bypass' },
  briefing: [
    'This one is short and hard: about two kilometres of the old Telegraph Track from Bramwell Junction north to Gunshot Creek, across five creeks that have cut their beds metres below the sandy plain. Every crossing is a steep way in, water, and a steep way out.',
    'There is one camp, on the Dulhunty River about halfway. Fail before it and you start again from the junction.',
    'The load is lean: fuel for a clean run and a little over, no jerry cans, one spare and two tyre plugs.',
    'Gunshot is the finale: three ways down its bank, the Chute, the Staircase and the Slot. A bypass to the right goes round it all, at a cost. Get across before dark.',
  ],
  notes: {
    'bramwell-junction': {
      title: 'The Telegraph Line',
      text: 'John Bradford led the survey for the line in 1883, and it opened in 1887, linking Laura with Thursday Island. Its poles were galvanised cast iron, made to carry a single wire. It closed in 1987, replaced by microwave transmission; the wire and then the poles came down, and many were reused in stockyards, gates and sheds. The poles leaning beside the track are the few left standing.',
    },
    'palm-creek': {
      title: 'Palm Creek',
      text: 'The first big obstacle on the Telegraph Track: a steep drop in, and a way out that is hard work once the clay has softened. The chute in is too narrow to turn in. Low range, both lockers, straddle the rut, then cross it square. Out: the main climb has a step of rock at the lip and marked rocks above it to winch to. The line to the left is less steep, but leans you towards the creek.',
    },
    'ducie-creek': {
      title: 'Ducie Creek',
      text: 'Moderately deep, and wide. Straight across it is over a metre deep in the middle and running. Drivers hug the bank on the left before turning back across to the exit: go in, turn left along the shallow edge of the near bank, then back to the right across the middle to the far side.',
    },
    'the-sand': {
      title: 'The sand',
      text: 'Soft white sand with whoops in it. Let the tyres down to 18 psi before you start, and keep it moving: high pressures dig in. About halfway a washout is too wide to drive. Stop short, lay the planks across in line with the wheels and crawl over.',
    },
    'dulhunty-camp': {
      title: 'Dulhunty River',
      text: 'Shallow falls and camping beside the river. This is the only camp on the track: from here on, a failure brings you back to this spot.',
    },
    'dulhunty-river': {
      title: 'The shelf',
      text: 'Three ledges of rock down to a shelf at the head of the falls. Work down them one wheel at a time, then keep to the shelf: the current pushes you towards the falls, and off its downstream edge the rock drops away. The old way out has become a slide of pale grey clay. Low range, both lockers, and there is a marked rock above it.',
    },
    'bertie-creek': {
      title: 'Bertie Creek',
      text: 'A run up the creek and a dogleg out, to keep clear of the deep holes in its rock. Here the track runs up the bed itself, and the holes show as darker water. A wheel in one hangs the car on its belly. Crawl and weave between them; at one point the line puts a hole between your wheels.',
    },
    'gunshot-fork': {
      title: 'Gunshot turn-off',
      text: 'The turn-off to the right bypasses Gunshot: easy sand round to the north bank. It always gets you there, but it costs a big part of your score. Straight on is Gunshot.',
    },
    'gunshot-bypass': {
      title: 'Gunshot bypass',
      text: 'The long way round. It gets you to Gunshot’s north bank, but the run loses points for it.',
    },
    'gunshot-creek': {
      title: 'Gunshot Creek',
      text: 'Pale clay and white sand, cut by washouts. Three ways down the bank. Straight ahead, the Chute drops over a band of rock into the creek, near vertical: low range, wheels dead straight, crawl over the lip and let the nose drop; fast or crooked, it rolls the car. To the right, the Staircase: steep clay over two ledges of rock, leaning you towards the creek. To the left, the Slot: a narrow rut that twists the car as one wheel drops and another lifts. Below all three, a bog along the bed, then a clay climb out with marked rocks at the top.',
    },
  },
  wrapUp: [
    'You’re across Gunshot. The line you followed carried a single wire from Laura to Thursday Island for a hundred years, from 1887 until it closed in 1987.',
  ],
  failures: {
    time: 'Past seven and still short of Gunshot’s north bank. Not a track to drive in the dark.',
    fuel: 'Out of fuel, and no jerry cans on board.',
    tyre: 'A tyre is flat and there’s nothing left to fix it with.',
    engine: 'The engine is wrecked.',
    swept: 'The current took the vehicle.',
  },
};
