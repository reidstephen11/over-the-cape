import type { SideTripDef } from '../../sim/sideTrips';
import type { FlatDef, PoiDef, PropDef, TrackDef } from '../../sim/world/mapTypes';

/** Fictional stops on the shortened game map, not claims about real heritage sites. */
export const crebSideTrips: readonly SideTripDef[] = [
  {
    id: 'lost-logbook',
    name: 'The lost logbook',
    description:
      'A traveller left a weather-stained trip log at the old line camp. Pick it up and leave it in the returns box at Wujal Wujal camp. There is a fuel can set aside for whoever brings it back.',
    stops: [
      {
        id: 'collect',
        poi: 'line-camp',
        task: 'Collect the lost logbook',
        directions: 'Take the signed Line camp spur east off the ridge, after Big Red. Stop by the hut.',
      },
      {
        id: 'deliver',
        poi: 'bloomfield-camp',
        task: 'Leave the logbook in the returns box',
        directions: 'Carry it over the range to the camp beside the Bloomfield River bridge.',
      },
    ],
    reward: { jerryCans: 1 },
    rewardLabel: 'One full 20 L jerry can',
    finished: 'Logbook returned. The fuel can beside the returns box is yours: 20 L loaded.',
  },
  {
    id: 'last-pole',
    name: 'The last pole',
    description:
      'An old sketch in the linesman’s hut marks a clearing further down the abandoned line. Follow the poles, record what is left, then bring the sketch back to the hut’s survey box.',
    stops: [
      {
        id: 'sketch',
        poi: 'linesmans-hut',
        task: 'Pick up the old line sketch',
        directions: 'Take Old line west from the range top, after Bob’s Hill. Stop beside the hut.',
      },
      {
        id: 'survey',
        poi: 'last-pole-clearing',
        task: 'Record the last standing pole',
        entry:
          'Three empty insulators on the crossarm. No wire, no hum; just the wind moving the ferns below it. Marked the pole on the sketch.',
        directions: 'Follow Last pole beyond the hut. Stop at the survey board in the clearing.',
      },
      {
        id: 'return',
        poi: 'linesmans-hut',
        task: 'Return the marked sketch',
        directions: 'Drive back to the linesman’s hut and stop beside the survey box.',
      },
    ],
    reward: { plugs: 2 },
    rewardLabel: 'Two tyre plugs from the survey box',
    finished: 'Sketch returned to the survey box. Two tyre plugs loaded for the climb back out.',
  },
  {
    id: 'cape-scrapbook',
    name: 'Falls and high country',
    description:
      'Make three stops worth remembering: the gorge at Roaring Meg, the range lookout and Wujal Wujal Falls. Pull up for a few seconds at each to add a page to your trip scrapbook. Any order.',
    anyOrder: true,
    stops: [
      {
        id: 'meg',
        poi: 'roaring-meg-falls',
        task: 'Sketch Roaring Meg Falls',
        entry:
          'Brown water at the ford, white water below. From the end of the spur the creek disappears into the gorge; the noise carries back through the trees.',
        directions: 'Take the falls spur after Roaring Meg Creek. Stop at the end of the track.',
        radius: 14,
      },
      {
        id: 'range',
        poi: 'creb-lookout',
        task: 'Sketch the view from the range',
        entry:
          'A gap in the canopy opens onto fold after fold of green hills. The track drops out of sight below the bonnet. Rain is building over the next ridge.',
        directions: 'Pull off at the range lookout, just before the concrete descent.',
        radius: 12,
      },
      {
        id: 'wujal',
        poi: 'wujal-falls',
        task: 'Sketch Wujal Wujal Falls',
        entry:
          'The falls fill the view beyond the track’s end. Made a quick sketch from the car, then turned back; the water and the country beyond are left alone.',
        directions: 'Take the falls track west from the Bloomfield camp. Stay at the track’s end.',
        radius: 18,
      },
    ],
    reward: {},
    rewardLabel: 'A completed trip scrapbook',
    finished: 'Three pages filled: rainforest gorge, open range and the falls. Scrapbook complete.',
  },
];

export const lastPoleTrack: TrackDef = {
  id: 'last-pole-track',
  name: 'Last pole',
  points: [
    [-95, -85, 125.5],
    [-109, -96, 123],
    [-128, -88, 116],
    [-148, -67, 108],
    [-169, -40, 99],
    [-184, -14, 92],
    [-184, 4, 90],
  ],
  width: 3,
  shoulder: 3,
  batter: 0.5,
  smooth: 8,
  surface: 'clay',
  pinMode: 'linear',
  pinSmooth: 8,
  camber: 0.3,
  ruts: 0.07,
  rough: { bumps: 0.12, swells: 0.12, washouts: 3, washoutDepth: 0.2 },
  routeHint: 'Optional survey trip. Follow the poles to the clearing; return the sketch to the hut',
};

export const sideTripPois: PoiDef[] = [
  {
    id: 'last-pole-clearing',
    name: 'Last pole clearing',
    kind: 'landmark',
    x: -184,
    z: 4,
    radius: 16,
    note: 'An abandoned line, a survey board and a place to turn round',
  },
];

export const sideTripFlats: FlatDef[] = [
  { id: 'last-pole-clearing', x: -184, z: 4, radius: 12, blend: 12, height: 90 },
];

export const sideTripProps: PropDef[] = [
  { kind: 'noticeBox', x: 69, z: 934, headingDeg: 100 },
  { kind: 'noticeBox', x: 87, z: -658, headingDeg: 270 },
  { kind: 'noticeBox', x: -103, z: -84, headingDeg: 110 },
  { kind: 'signpost', x: 69, z: 932, headingDeg: 100, text: 'Lost logbook — Wujal camp' },
  { kind: 'signpost', x: 87, z: -660, headingDeg: 270, text: 'Returns box — logbook / fuel' },
  { kind: 'signpost', x: -101, z: -86, headingDeg: 110, text: 'Survey box / Last pole →' },
  { kind: 'powerPole', x: -125, z: -65, headingDeg: 280, lean: 9 },
  { kind: 'powerPole', x: -153, z: -47, headingDeg: 250, lean: 14 },
  { kind: 'powerPole', x: -191, z: 3, headingDeg: 240, lean: 6 },
  { kind: 'signpost', x: -176, z: 6, headingDeg: 180, text: 'Last pole — survey stop' },
  { kind: 'logSeat', x: -188, z: 10, headingDeg: 95 },
  { kind: 'fireRing', x: -184, z: 11, headingDeg: 0 },
];
