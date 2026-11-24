import type { WeatherTimeline } from '../weatherTimeline';

/**
 * The northern Telegraph Track's afternoon: fine at the start, showers from 3 pm and steady
 * rain from 4 pm. Nolans Brook drains the wet country upstream, so it comes up with the
 * rain; the small creeks before it rise about a third as much. A run on time reaches Nolans
 * before it has risen; a slow one finds the shoal deeper by the hour (0.1 m by 4 pm, 0.26 m
 * by 5 pm and 0.42 m by dark on the commonest day; docs/PLAN-telegraph-north.md has the table).
 */
export const telegraphNorthWeather: WeatherTimeline = {
  rain: [
    [15, 0],
    [15.5, 0.5],
    [16, 0.8],
    [17, 1],
    [18.5, 1],
    [19.5, 0.5],
  ],
  ground: { before: 0.6, soakHours: 0.5, dryHours: 6 },
  creeks: {
    risePerHour: 0.25,
    maxRise: 0.7,
    fallPerHour: 0.2,
    flowPerMetre: 1.5,
    shares: {
      'canal-creek': 0.35,
      'sam-creek': 0.35,
      'mistake-creek': 0.35,
      'cannibal-creek': 0.35,
      'cypress-creek': 0.35,
    },
  },
  notes: [
    { hour: 15, text: 'Showers coming in — Nolans Brook will rise with the rain' },
    { hour: 16, text: 'Steady rain — Nolans Brook is coming up' },
    { hour: 17.25, text: 'Nolans Brook is well up: the shoal is getting deep' },
  ],
  forecast: 'showers from 3 pm',
};
