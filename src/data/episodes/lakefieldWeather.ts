import type { WeatherTimeline } from '../weatherTimeline';

/**
 * The first storms of the wet coming over Lakefield. It stormed overnight; the morning is
 * dry and heavy, the rain comes in about 1 pm and sets in by mid-afternoon. The North
 * Kennedy, fed by the rain up in the ranges, rises fastest: over its bar at Hann Crossing
 * the water is about 40 cm deep in the morning and too deep to drive by the deadline. The
 * Laura River, long behind by then, rises less.
 */
export const lakefieldStorm: WeatherTimeline = {
  rain: [
    [12.75, 0],
    [13.25, 0.5],
    [14, 0.8],
    [14.5, 1],
    [16.5, 1],
    [17.5, 0.6],
    [18.5, 0.3],
  ],
  ground: { before: 0.55, soakHours: 0.5, dryHours: 4 },
  creeks: {
    risePerHour: 0.4,
    maxRise: 1.4,
    fallPerHour: 0.05,
    flowPerMetre: 1.2,
    shares: { 'laura-river': 0.4 },
  },
  notes: [
    { hour: 12.75, text: 'Rain coming in — the black soil will turn to grease and the rivers will rise' },
    { hour: 14.5, text: 'Heavy rain — the North Kennedy is coming up fast' },
  ],
  forecast: 'storms from 1 pm',
};
