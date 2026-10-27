import type { EpisodeDef } from '../episodes';
import type { WeatherTimeline } from '../weatherTimeline';

export const frenchmansStorm: WeatherTimeline = {
  rain: [
    [10, 0],
    [13, 0],
    [14, 0.35],
    [16, 0.45],
    [18.25, 0.2],
  ],
  ground: { before: 0.3, soakHours: 1, dryHours: 4 },
  creeks: { risePerHour: 0.08, maxRise: 0.35, fallPerHour: 0.1, flowPerMetre: 0.8 },
  notes: [{ hour: 13.5, text: 'Rain on the heath — slow down for the load and watch the rivers' }],
  forecast: 'showers from early afternoon',
};

/** The diary, delivery and camps are fictional. Route sources are in docs/HISTORY.md. */
export const frenchmansEpisode: EpisodeDef = {
  id: 'frenchmans',
  number: 4,
  title: 'The Frenchmans Track',
  route: 'Telegraph Road to Portland Road, over the Wenlock and Pascoe rivers',
  mapId: 'frenchmans',
  mission: 'Deliver both drums of diesel to the Portland Road camp',
  goal: 'fuel-camp',
  delivery: { drums: 2 },
  startHour: 10,
  weather: 'clear',
  storm: frenchmansStorm,
  deadline: { hour: 18.25, label: 'The camp needs its diesel before 6:15 pm' },
  clockRate: 12,
  fuelScale: 9,
  loadout: { fuel: 50, jerryCans: 1, spares: 2, plugs: 3 },
  briefing: [
    'From the diary, Sunday 30 November 1986: “Two drums of diesel for a camp out towards Portland Road. They need the pump running by this evening. We’ve got the trailer loaded, but there are two rivers and a fair bit of rough country between us and them.”',
    'Take Frenchmans Track east from Telegraph Road, cross the Wenlock, then the Pascoe, and park the trailer at the fuel camp with both 200 L drums still aboard before 6:15 pm. The camp and this delivery are part of the story.',
    'The 6×4 box trailer is on the civilian vehicles; the Land Rover and Unimog take the Army No. 5. It is heavy and has no brakes. Use low range on the banks and leave room to straighten up before reversing.',
    'Corrugations at speed loosen the load. Stop and use Tools to tighten the straps when warned. A tip can spill the drums: stop beside a loose drum with the upright trailer nearby and choose Load loose drum. Sealed drums float and drift in the rivers.',
    'On Realistic a hard hit can puncture a trailer tyre. Stop alongside it and use Repair trailer tyre; it uses a plug or a spare from the car. Camps patch punctures. Camps keep the trailer, its load and loose drums where you left them, including an unhitched trailer.',
  ],
  notes: {
    wenlock: {
      title: 'The Wenlock River',
      text: 'The first of the two river crossings heading east. Stay on the sandy bar, keep a steady pace, and allow for the trailer following behind. The deep water beside the line can lift a trailer and carry it downstream.',
    },
    heath: {
      title: 'The wet heath',
      text: 'The track crosses sand, mud and rough woodland. A loaded trailer can tip if you rush a turn. Slow down over the corrugations and check the load straps before they work loose.',
    },
    pascoe: {
      title: 'The Pascoe River',
      text: 'The western bank is steep and rocky. Select low range before the descent, line up with the shallow bar and keep away from the dark water downstream. The trailer needs the same careful line as the car.',
    },
    'pascoe-camp': {
      title: 'Before the Pascoe',
      text: 'A clearing to check tyres and load straps before the descent. You can unhitch to inspect or winch a difficult section, but you will need to bring the trailer and both drums through to finish the job.',
    },
  },
  wrapUp: [
    'Both drums are at the camp. The pump can run tonight, and the trailer has made it over the Wenlock and the Pascoe.',
    'From the diary: “Diesel delivered. A cup of tea while they got the pump going, then we spread the map on the bonnet. Next comes the Telegraph Track.”',
  ],
  failures: {
    time: 'The camp needed its diesel before evening. Try again from the last camp, with more care over the rough ground and less time lost on the banks.',
    fuel: 'The tank is dry and there are no jerry cans left. The delivery drums belong to the camp. Restart from the last camp.',
    tyre: 'A tyre cannot be repaired with the supplies left. Restart from the last camp and take the rough sections more slowly.',
    engine:
      'The engine is wrecked. Restart from the last camp and keep to the shallow line through the river.',
    swept:
      'The current took the vehicle. Restart from camp and stay on the shallow bar, with enough speed to keep moving.',
  },
};
