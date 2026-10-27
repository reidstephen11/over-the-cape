import type { EpisodeDef } from '../episodes';

/**
 * Episode 2: the range crossing between Maytown and Laura.
 * The diary and camps are fictional; historical claims are sourced in docs/HISTORY.md.
 */
export const coachEpisode: EpisodeDef = {
  id: 'coach',
  number: 2,
  title: 'The Old Coach Road',
  route: 'Across the Conglomerate Range, between Maytown and Laura',
  mapId: 'coach',
  mission: 'Cross the range and reach the camp below the north face',
  goal: 'range-exit',
  startHour: 9,
  weather: 'clear',
  // A short morning on the range, with time to stop and choose a line.
  clockRate: 4,
  fuelScale: 6,
  loadout: { fuel: 50, jerryCans: 1, spares: 2, plugs: 3 },
  briefing: [
    'From your grandparent’s diary, 26 November 1986: “Left Maytown this morning. At the foot of the range I walked ahead and came back wondering whether we ought to turn round. Three tracks up the same hill. I chose a wheel line, put it in low, and tried not to look at the whole climb at once.”',
    'The old road runs from Maytown to Laura through the Palmer goldfields. Cobb & Co began regular coach services on it in 1880. This chapter concentrates on the Conglomerate Range; the diary carries the journey from Maytown to the start, and from the far side on to Laura.',
    'Choose the steep middle line over sandstone, the rutted coach line to the west, or the longer gravel bypass to the east. Stop at the hotel site on the ridge to save progress, then tackle the big step or its eastern track and descend to camp.',
    'Allow about 10–15 minutes for the direct route, longer for exploring or recovery. There is no deadline. Use low range, both lockers and a steady crawl on the rock; on the descent let the engine hold you back. Stop and reconsider your line if a wheel starts spinning.',
  ],
  notes: {
    'range-camp': {
      title: 'The diary: below the range',
      text: '“Maytown behind us, Laura somewhere over those hills.” Beside the entry is a pencil sketch of three ways up: straight over the rock, left into the old ruts, or the long way round to the right. “We stopped here to put everything loose away.”',
    },
    'range-face': {
      title: 'Conglomerate Range',
      text: 'The road’s builders eased its grades and built walls and drains, but rain and coach wheels cut into the soft sandstone. The middle line needs low range and both lockers. The old coach line climbs through ruts to the west; the gravel bypass winds round to the east. Pick a line before the first ledge.',
    },
    'hotel-site': {
      title: 'Hotel site',
      text: 'The old road had hotels and staging posts, with gold workings and Chinese market gardens nearby. This camp represents one of those stops. Your progress is saved here. In the diary: “On top at last. We boiled the billy and I went back to look at the hill. It looked worse from up here.”',
    },
    'big-step': {
      title: 'The big step',
      text: 'A sandy gully leads to a metre of bare sandstone. Approach slowly in low range with both lockers and keep the wheels climbing together. The signed eastern track goes round it. There is time to back off and choose again.',
    },
    'range-descent': {
      title: 'The descent',
      text: 'Coach wheels and rain wore deep into the sandstone on the descent from the range. Select low range before the drop, straighten up for the rock bands and let the engine hold you back. The camp is below the last ledge.',
    },
  },
  wrapUp: [
    'The range is behind you. In the diary: “Stopped below the last drop with everything still where we had tied it. I had been thinking about that hill all morning. Now I could think about Laura.”',
    'The connecting road to Laura passes in the diary. The coach road was entered on the Queensland Heritage Register in 1992 for its cuttings and drainage. Beyond it lie the sandstone escarpments and Quinkan rock art of the Laura country.',
    'The next chapter leaves Laura for Lakefield and Musgrave. For now, you have crossed the stretch your grandparent nearly turned back from.',
  ],
  failures: {
    time: 'Stop at camp and try the range again in daylight.',
    fuel: 'Out of fuel, with no jerry cans left.',
    tyre: 'A tyre is flat and there’s nothing left to fix it with.',
    engine: 'The engine is wrecked.',
    swept: 'The current took the vehicle.',
  },
};
