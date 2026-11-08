import { describe, expect, it } from 'vitest';
import { crebEpisode } from '../src/data/episodes/creb';
import { crebMap } from '../src/data/episodes/crebMap';
import { crebSideTrips } from '../src/data/episodes/crebSideTrips';
import { startCheckpoint } from '../src/sim/episode';
import { loadSave, writeSave } from '../src/sim/save/save';
import { SideTrips } from '../src/sim/sideTrips';
import { MemoryStore, saveData } from './helpers/saves';

function stop(trips: SideTrips, poiId: string, seconds = 3, parked = true) {
  const poi = crebMap.pois.find((p) => p.id === poiId)!;
  return trips.update(seconds, poi.x, poi.z, parked);
}

describe('Optional CREB side trips', () => {
  it('requires collection before delivery, a continuous stop, and pays only once', () => {
    const trips = new SideTrips(crebSideTrips, crebMap.pois);
    expect(stop(trips, 'bloomfield-camp', 10)).toBeNull();
    expect(stop(trips, 'line-camp', 2)).toBeNull();
    expect(stop(trips, 'line-camp', 1, false)).toBeNull();
    expect(stop(trips, 'line-camp', 2)).toBeNull();
    expect(stop(trips, 'line-camp', 1)).toMatchObject({ complete: false, stop: { id: 'collect' } });
    const delivery = stop(trips, 'bloomfield-camp');
    expect(delivery).toMatchObject({ complete: true, trip: { reward: { jerryCans: 1 } } });
    expect(stop(trips, 'bloomfield-camp', 20)).toBeNull();
    expect(stop(trips, 'line-camp', 20)).toBeNull();
    expect(trips.journal()[0].complete).toBe(true);
  });

  it('requires the full survey out and back, not just a visit to the hut', () => {
    const trips = new SideTrips(crebSideTrips, crebMap.pois);
    expect(stop(trips, 'last-pole-clearing', 10)).toBeNull();
    expect(stop(trips, 'linesmans-hut')).toMatchObject({ complete: false });
    expect(stop(trips, 'linesmans-hut', 10)).toBeNull();
    expect(stop(trips, 'last-pole-clearing')).toMatchObject({ complete: false });
    expect(stop(trips, 'linesmans-hut')).toMatchObject({ complete: true, trip: { reward: { plugs: 2 } } });
    expect(trips.journal()[1].stops[1].entry).toContain('insulators');
  });

  it('records scenic stops in any order, retains their pages, and resets partial dwell on leaving', () => {
    const trips = new SideTrips(crebSideTrips, crebMap.pois);
    stop(trips, 'wujal-falls');
    stop(trips, 'creb-lookout', 2);
    trips.update(1, 500, 500, true);
    expect(stop(trips, 'creb-lookout', 2)).toBeNull();
    expect(stop(trips, 'creb-lookout', 1)).toMatchObject({ complete: false });
    expect(trips.journal()[2].stops[1].entry).toContain('canopy');
    expect(stop(trips, 'roaring-meg-falls')).toMatchObject({ complete: true });
    expect(trips.journal()[2].stops.every((s) => s.done)).toBe(true);
  });

  it('restores camp progress, puts later jobs back, and rejects skipped stages in damaged saves', () => {
    const trips = new SideTrips(crebSideTrips, crebMap.pois);
    stop(trips, 'line-camp');
    const camp = [...trips.done];
    stop(trips, 'bloomfield-camp');
    trips.reset(camp);
    expect(trips.journal()[0].complete).toBe(false);
    expect(stop(trips, 'bloomfield-camp')).toMatchObject({ complete: true });
    trips.reset(['unknown/stop', 'lost-logbook/deliver', 'cape-scrapbook/wujal']);
    expect([...trips.done]).toEqual(['cape-scrapbook/wujal']);
    expect(trips.prompt(76, 936)?.progress).toBe(0);
  });

  it('round-trips optional progress and accepts older checkpoints without it', () => {
    const store = new MemoryStore();
    const checkpoint = startCheckpoint(crebEpisode, 'roaring-meg-camp', 'shortie');
    checkpoint.sideTrips = ['lost-logbook/collect', 'cape-scrapbook/meg'];
    writeSave(saveData({ episodes: { creb: { completed: false, checkpoint } } }), store);
    expect(loadSave(store)?.episodes.creb?.checkpoint?.sideTrips).toEqual(checkpoint.sideTrips);
    delete checkpoint.sideTrips;
    writeSave(saveData({ episodes: { creb: { completed: false, checkpoint } } }), store);
    expect(loadSave(store)?.episodes.creb?.checkpoint?.sideTrips).toBeUndefined();
  });
});
