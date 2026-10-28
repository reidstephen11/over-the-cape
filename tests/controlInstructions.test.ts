import { describe, expect, it } from 'vitest';
import { controlInstruction } from '../src/data/controlInstructions';
import { crebEpisode } from '../src/data/episodes/creb';

describe('device-aware CREB tutorial instructions', () => {
  it('replaces the reported Press P card with the PS4 tool-menu action', () => {
    const note = crebEpisode.notes['orient-crawl'];
    expect(note.instruction).toBe('precision');
    const text = `${controlInstruction(note.instruction!, 'gamepad', 'playstation')} ${note.text}`;
    expect(text).toContain('Hold L1');
    expect(text).toContain('Enable precision crawl');
    expect(text).toContain('release L1');
    expect(text).not.toMatch(/\bPress P\b/);
    expect(text).toContain('Crawl holds a walking pace');
  });

  it('follows the chosen controller and restores the keyboard binding', () => {
    expect(controlInstruction('precision', 'gamepad', 'xbox')).toContain('Hold LB');
    expect(controlInstruction('precision', 'gamepad', 'generic')).toContain('Hold Button 5');
    expect(controlInstruction('precision', 'keyboard')).toBe('Press P.');
    expect(controlInstruction('precision', 'touch')).toBe('Tap 4WD, then CRAWL.');
  });

  it('gives low-range, diff-lock and winch instructions that match the actual bindings', () => {
    expect(controlInstruction('range', 'gamepad', 'playstation')).toBe('Press △.');
    expect(controlInstruction('range', 'gamepad', 'xbox')).toBe('Press Y.');
    expect(controlInstruction('locks', 'keyboard')).toContain(
      'Z to lock the front diff, then X for the rear',
    );
    expect(controlInstruction('locks', 'gamepad', 'playstation')).toContain('choose Lock front diff');
    expect(controlInstruction('locks', 'touch')).toContain('F LOCK and R LOCK');
    expect(controlInstruction('winch', 'gamepad', 'playstation')).toMatch(/R1.*D-pad ↑.*D-pad ↓/);
    expect(controlInstruction('winch', 'keyboard')).toMatch(/press E.*R winds in.*F winds out/);
    expect(controlInstruction('winch', 'touch')).toMatch(/USE.*IN.*OUT/);
  });

  it('keeps all four tutorial cards device-aware and removes fixed keys from the briefing', () => {
    for (const id of ['orient-low-range', 'orient-lockers', 'orient-crawl', 'orient-winch']) {
      const note = crebEpisode.notes[id];
      expect(note.instruction, id).toBeDefined();
      expect(note.text, id).not.toMatch(/\b[Pp]ress [A-Z]\b/);
    }
    expect(crebEpisode.briefing.join(' ')).not.toMatch(/\((?:L|P|Z, then X|E to hook)/);
  });
});
