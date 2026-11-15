import type { WeatherTimeline } from '../weatherTimeline';

/**
 * The Telegraph Track's afternoon: the dry season, so no rain comes. A timeline is still
 * set so the run's track conditions (src/data/trackConditions.ts) reach the ground's
 * wetness and the creeks' levels, as the CREB's storm does.
 */
export const telegraphWeather: WeatherTimeline = {
  rain: [[12, 0]],
  ground: { before: 0.7, soakHours: 0.4, dryHours: 6 },
  // No rain, so the creeks never rise; maxRise is not 0, which would divide by zero.
  creeks: { risePerHour: 0, maxRise: 0.01, fallPerHour: 0.3, flowPerMetre: 2 },
  notes: [],
  forecast: 'fine',
};
