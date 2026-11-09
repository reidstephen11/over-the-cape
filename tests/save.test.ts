import { describe, expect, it } from 'vitest';
import { highCountryMap } from './fixtures/maps/map';
import { crebEpisode } from '../src/data/episodes/creb';
import { Exploration } from '../src/sim/exploration';
import { startCheckpoint } from '../src/sim/episode';
import { defaultSettings, loadSave, unlocked, writeSave, type KeyValueStore } from '../src/sim/save/save';
import { SAVE_KEY } from '../src/core/config';
import { MemoryStore, saveData } from './helpers/saves';

describe('exploration and saving', () => {
  it('keeps the mirror preference and defaults older or invalid settings to on', () => {
    const s = new MemoryStore();
    for (const mirrors of [true, false]) {
      writeSave(saveData({ settings: { ...defaultSettings, mirrors } }), s);
      expect(loadSave(s)!.settings.mirrors).toBe(mirrors);
    }
    for (const mirrors of [undefined, null, 'false', 0]) {
      s.setItem(SAVE_KEY, JSON.stringify({ version: 1, settings: { mirrors } }));
      expect(loadSave(s)!.settings.mirrors).toBe(true);
    }
  });
  it('keeps controller preferences across saves and defaults old or invalid values to PlayStation', () => {
    const s = new MemoryStore();
    for (const controller of ['playstation', 'xbox', 'generic'] as const) {
      writeSave(saveData({ settings: { ...defaultSettings, controller } }), s);
      expect(loadSave(s)!.settings.controller).toBe(controller);
    }
    writeSave(saveData({ settings: { ...defaultSettings, touchDrive: 'pedals' } }), s);
    expect(loadSave(s)!.settings.touchDrive).toBe('pedals');
    expect(defaultSettings.touchDrive).toBe('stick');
    expect(defaultSettings.touchStickSide).toBe('left');
    writeSave(saveData({ settings: { ...defaultSettings, touchStickSide: 'right' } }), s);
    expect(loadSave(s)!.settings.touchStickSide).toBe('right');
    s.setItem('overthecape.save.v1', JSON.stringify({ version: 1, settings: { touchStickSide: 'up' } }));
    expect(loadSave(s)!.settings.touchStickSide).toBe('left');
    for (const controller of [undefined, null, 'unknown', '__proto__']) {
      s.setItem(
        'overthecape.save.v1',
        JSON.stringify({
          version: 1,
          settings: { controller },
          vehicle: 'perentie',
          episodes: { creb: { completed: true } },
        }),
      );
      const loaded = loadSave(s)!;
      expect(loaded.settings.controller).toBe('playstation');
      expect(loaded.settings.touchDrive).toBe('stick');
      expect(loaded.vehicle).toBe('perentie');
      expect(loaded.episodes.creb?.completed).toBe(true);
    }
  });

  it('keeps the gearbox setting and reads old or invalid saves as automatic', () => {
    const s = new MemoryStore();
    expect(defaultSettings.gearbox).toBe('automatic');
    for (const gearbox of ['automatic', 'manual'] as const) {
      writeSave(saveData({ settings: { ...defaultSettings, gearbox } }), s);
      expect(loadSave(s)!.settings.gearbox).toBe(gearbox);
    }
    // "Manual with clutch" (v1.35-v1.36) is shelved: such a save opens as Manual.
    s.setItem(SAVE_KEY, JSON.stringify({ version: 1, settings: { gearbox: 'clutch' }, episodes: {} }));
    expect(loadSave(s)!.settings.gearbox).toBe('manual');
    for (const gearbox of [undefined, null, 'sequential', 3, '__proto__']) {
      s.setItem(SAVE_KEY, JSON.stringify({ version: 1, settings: { gearbox }, episodes: {} }));
      expect(loadSave(s)!.settings.gearbox).toBe('automatic');
    }
  });

  it('discovers a POI once and remembers the last campsite', () => {
    const ex = new Exploration(highCountryMap.pois, { discovered: [], lastCampsite: 'river-flat-camp' });
    const hut = highCountryMap.pois.find((p) => p.id === 'mountain-hut')!;
    const first = ex.check(hut.x, hut.z);
    expect(first.discovered.map((p) => p.id)).toEqual(['mountain-hut']);
    expect(first.campsite).toBe('mountain-hut');
    expect(ex.check(hut.x, hut.z).discovered).toEqual([]);
    expect(ex.lastCampsite).toBe('mountain-hut');
  });

  it("resets discoveries to a camp's, so places found after it are new again", () => {
    const ex = new Exploration(highCountryMap.pois, { discovered: [], lastCampsite: 'river-flat-camp' });
    const hut = highCountryMap.pois.find((p) => p.id === 'mountain-hut')!;
    ex.check(hut.x, hut.z);
    ex.reset(['river-flat-camp', 'not-a-place']);
    expect([...ex.discovered]).toEqual(['river-flat-camp']);
    expect(ex.check(hut.x, hut.z).discovered.map((p) => p.id)).toEqual(['mountain-hut']);
  });

  it('keeps crawl run bests, drops malformed ones, and loads saves without them', () => {
    const s = new MemoryStore();
    writeSave(saveData({ crawlBests: { 'creek-bed': { points: 1, seconds: 31.5 } } }), s);
    expect(loadSave(s)!.crawlBests).toEqual({ 'creek-bed': { points: 1, seconds: 31.5 } });
    s.setItem(
      [...s.data.keys()][0],
      JSON.stringify({ version: 1, settings: {}, crawlBests: { a: { points: 'x' }, b: null } }),
    );
    expect(loadSave(s)!.crawlBests).toEqual({});
    s.setItem([...s.data.keys()][0], JSON.stringify({ version: 1, settings: {} }));
    expect(loadSave(s)!.crawlBests).toEqual({});
  });

  it('round-trips each episode’s progress and the camp a run restarts from', () => {
    const s = new MemoryStore();
    const checkpoint = {
      ...startCheckpoint(crebEpisode, 'roaring-meg-camp', 'shortie'),
      hour: 14.25,
      elapsed: 900,
      fuel: 31.5,
      jerryCans: 0,
      spares: 0,
      plugs: 2,
      tyres: [1, 0, 1, 1],
      tyreFault: ['none', 'sidewall', 'none', 'none'] as const,
      discovered: ['daintree-village', 'big-red'],
    };
    expect(
      writeSave(
        saveData({
          settings: { ...defaultSettings, quality: 'high' },
          episodes: {
            creb: {
              completed: true,
              bestMinutes: 41.5,
              checkpoint: { ...checkpoint, tyreFault: [...checkpoint.tyreFault] },
            },
          },
        }),
        s,
      ),
    ).toBe(true);
    const loaded = loadSave(s)!;
    expect(loaded.settings.quality).toBe('high');
    expect(loaded.episodes.creb).toEqual({
      completed: true,
      bestMinutes: 41.5,
      checkpoint: { ...checkpoint, tyreFault: [...checkpoint.tyreFault] },
    });
  });

  it('cleans up a damaged checkpoint and drops unknown episodes', () => {
    const s = new MemoryStore();
    s.setItem(
      'overthecape.save.v1',
      JSON.stringify({
        version: 1,
        settings: {},
        episode: 'moon',
        episodes: {
          creb: {
            completed: 'yes',
            checkpoint: { camp: 'lions-den', fuel: -4, spares: 1.6, tyres: [2, 'x'], tyreFault: ['burst'] },
          },
          moon: { completed: true },
        },
      }),
    );
    const loaded = loadSave(s)!;
    expect(loaded.episode).toBe('creb');
    expect(Object.keys(loaded.episodes)).toEqual(['creb']);
    const c = loaded.episodes.creb!;
    expect(c.completed).toBe(false);
    expect(c.checkpoint).toMatchObject({ camp: 'lions-den', fuel: 0, spares: 2, tyres: [1, 1, 1, 1] });
    expect(c.checkpoint!.tyreFault).toEqual(['none', 'none', 'none', 'none']);
  });

  it('always opens the CREB', () => {
    expect(unlocked(null, 'creb')).toBe(true);
    expect(unlocked(saveData(), 'creb')).toBe(true);
  });

  it('sends a save from a removed episode back to the CREB, keeping the CREB progress', () => {
    const s = new MemoryStore();
    s.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...saveData({ episodes: { creb: { completed: true } } }),
        episode: 'lakefield',
        episodes: { creb: { completed: true }, coach: { completed: true }, lakefield: { completed: false } },
      }),
    );
    const loaded = loadSave(s)!;
    expect(loaded.episode).toBe('creb');
    expect(Object.keys(loaded.episodes)).toEqual(['creb']);
    expect(loaded.episodes.creb!.completed).toBe(true);
  });

  it('never throws when storage is blocked or the save is junk', () => {
    const blocked: KeyValueStore = {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {
        throw new Error('QuotaExceeded');
      },
    };
    expect(loadSave(blocked)).toBeNull();
    expect(writeSave(saveData(), blocked)).toBe(false);
    const junk = new MemoryStore();
    junk.setItem('overthecape.save.v1', '{not json');
    expect(loadSave(junk)).toBeNull();
    expect(loadSave(null)).toBeNull();
  });

  it('ignores unknown POIs and campsites from an old save', () => {
    const ex = new Exploration(highCountryMap.pois, {
      discovered: ['nowhere', 'falls'],
      lastCampsite: 'falls',
    });
    expect([...ex.discovered]).toEqual(['falls']);
    expect(ex.lastCampsite).toBe('river-flat-camp');
  });
});
