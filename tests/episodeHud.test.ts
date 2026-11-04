import { describe, expect, it } from 'vitest';
import { episodeHud } from '../src/core/hudState';
import { clockTime, episodes } from '../src/data/episodes';

const def = Object.values(episodes)[0];
const run = (hour: number, timed = true, left = (def.deadline?.hour ?? 0) - hour) => ({
  timed,
  hour,
  hoursLeft: () => (timed ? left : Infinity),
  missionLine: () => 'Reach the camp',
});

describe('episode HUD block', () => {
  it('before dark: the clock, the deadline label and the dial hours', () => {
    const d = def.deadline!;
    expect(episodeHud(run(14), def)).toEqual({
      title: `Episode ${def.number} · ${def.title}`,
      mission: 'Reach the camp',
      clock: clockTime(14),
      deadline: d.label,
      urgent: false,
      hour: 14,
      darkHour: d.hour,
      finishHour: d.hour + (d.graceHours ?? 0),
    });
  });

  it('after dark: the grace time to finish by, and urgent', () => {
    const d = def.deadline!;
    const h = episodeHud(run(d.hour + 0.2), def);
    expect(h.deadline).toBe(`Dark · by ${clockTime(d.hour + (d.graceHours ?? 0))}`);
    expect(h.urgent).toBe(true);
  });

  it('a replay with the clock stopped shows no clock or deadline', () => {
    expect(episodeHud(run(14, false), def)).toMatchObject({
      clock: '',
      deadline: '',
      urgent: false,
      hour: null,
      darkHour: null,
      finishHour: null,
    });
  });
});
