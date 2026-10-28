import { describe, expect, it } from 'vitest';
import { Traffic } from '../src/sim/traffic';

const track = {
  name: 'A Troopy',
  points: [
    [0, 0],
    [0, -100],
    [0, -200],
  ] as const,
};

describe('Traffic', () => {
  it('sends a car from the far end when you reach a track end, once', () => {
    const t = new Traffic([track]);
    const [e] = t.update(0.1, { x: 0, z: 5 });
    expect(e.type).toBe('spawned');
    expect(t.cars[0].at(0)).toMatchObject({ x: 0, z: -200 });
    expect(t.cars[0].at().headingDeg).toBeCloseTo(180);
    t.cars.length = 0;
    expect(t.update(0.1, { x: 0, z: -195 })).toEqual([]);
  });

  it('stops for you on the line, and squeezes past once you pull over', () => {
    const t = new Traffic([track]);
    t.update(0.1, { x: 0, z: 0 });
    const car = t.cars[0];
    // Sit on the track 100 m up: it drives towards you and stops short.
    for (let i = 0; i < 400; i++) t.update(0.1, { x: 0, z: -100 });
    expect(car.waiting).toBe(true);
    const z = car.at().z;
    expect(z).toBeLessThan(-100 - 2);
    expect(z).toBeGreaterThan(-100 - 20);
    // Pulled off 3 m to the side, it goes by and reaches the end.
    const events = [];
    for (let i = 0; i < 400; i++) events.push(...t.update(0.1, { x: 3, z: -100 }));
    expect(events.map((e) => e.type)).toEqual(['moving', 'gone']);
    expect(t.cars).toEqual([]);
  });
});
