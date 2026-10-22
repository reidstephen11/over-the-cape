import type { WeatherTimeline } from '../weatherTimeline';

/**
 * The CREB's afternoon storm. It rained overnight; showers come in at 3 pm, when a run on
 * schedule is coming over Bob's Hill, and turn to heavy rain from 4:30 as it runs north
 * up the Bloomfield Track, easing at dusk. The clay greases up and the creeks rise and run
 * faster the longer it rains, so the Little Annan, the last crossing, is about 15 cm up at
 * 5 pm and over 20 cm up by 5:45.
 */
export const crebStorm: WeatherTimeline = {
  rain: [
    [15, 0],
    [15.33, 0.6],
    [16.5, 0.7],
    [17, 1],
    [17.75, 1],
    [18.25, 0.4],
    [18.75, 0],
  ],
  ground: { before: 0.7, soakHours: 0.4, dryHours: 3 },
  creeks: { risePerHour: 0.15, maxRise: 0.5, fallPerHour: 0.3, flowPerMetre: 2 },
  notes: [
    { hour: 15, text: 'Rain coming in — the clay will turn greasy and the creeks will rise' },
    { hour: 16.75, text: 'Heavy rain — the creeks are coming up fast' },
    { hour: 18, text: 'The rain is easing, but the creeks are still high' },
  ],
  forecast: 'storms from 3 pm',
};
