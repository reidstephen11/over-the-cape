import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { FarLand, HORIZON_RINGS, Horizon } from '../src/render/horizon';
import { lateAfternoon } from '../src/data/environment';
import { crebMap } from '../src/data/episodes/crebMap';
import { testWorld } from './world';

describe('the CREB horizon', () => {
  const def = crebMap.horizon!;
  const land = new FarLand(def, crebMap.seed);

  it('keeps the real peaks at full height', () => {
    for (const id of [
      'thornton-peak',
      'pieter-botte',
      'mt-finnigan',
      'tablelands',
      'mt-demi',
      'black-mountain',
    ]) {
      const hill = def.hills.find((h) => h.id === id)!;
      expect(land.sample(hill.x, hill.z).ground, id).toBeGreaterThan(hill.height);
    }
  });

  it('puts the Coral Sea to the east and land to the west', () => {
    for (let z = -3000; z <= 3000; z += 500) {
      expect(land.sample(3600, z).sea, `east at ${z}`).toBe(1);
      expect(land.sample(-3600, z).sea, `west at ${z}`).toBe(0);
    }
  });

  it('runs the Daintree and the Bloomfield out to the sea', () => {
    for (const id of ['daintree-mouth', 'bloomfield-mouth']) {
      const v = def.valleys.find((d) => d.id === id)!;
      const mouth = v.points[v.points.length - 1];
      const s = land.sample(mouth.x, mouth.z);
      expect(s.river + s.sea, id).toBeGreaterThan(0.9);
      expect(s.ground, id).toBeLessThan(1);
    }
  });

  it('bares Black Mountain’s black granite and Thornton Peak’s grey top', () => {
    const black = def.hills.find((h) => h.id === 'black-mountain')!;
    const thornton = def.hills.find((h) => h.id === 'thornton-peak')!;
    expect(land.sample(black.x, black.z)).toMatchObject({ rock: 1, granite: 'black' });
    expect(land.sample(thornton.x, thornton.z)).toMatchObject({ rock: 1, granite: 'grey' });
    // Its lower slopes, down towards the sea, are rainforest.
    expect(land.sample(thornton.x + thornton.radius * 0.6, thornton.z).rainforest).toBeGreaterThan(0.9);
  });
});

describe('the horizon mesh', () => {
  const world = testWorld();
  const horizon = new Horizon(world.map, world.terrain, lateAfternoon);
  const pos = horizon.mesh.geometry.getAttribute('position');
  const index = horizon.mesh.geometry.getIndex()!;
  const ringSize = pos.count / HORIZON_RINGS.length;
  const hx = world.map.width / 2;
  const hz = world.map.length / 2;
  /** Distance outside the map, seen from above. */
  const outside = (x: number, z: number) =>
    Math.hypot(Math.max(0, Math.abs(x) - hx), Math.max(0, Math.abs(z) - hz));

  it('lies outside the map', () => {
    for (let i = 0; i < pos.count; i++) {
      const out = outside(pos.getX(i), pos.getZ(i));
      const inside = Math.min(hx - Math.abs(pos.getX(i)), hz - Math.abs(pos.getZ(i)));
      expect(out > 0 || inside < 1e-6, `vertex ${i}`).toBe(true);
    }
  });

  it('starts just under the map’s edge, so no gap shows between them', () => {
    for (let i = 0; i < ringSize; i++) {
      const j = (i + 1) % ringSize;
      const [x0, z0, x1, z1] = [pos.getX(i), pos.getZ(i), pos.getX(j), pos.getZ(j)];
      const steps = Math.ceil(Math.hypot(x1 - x0, z1 - z0));
      for (let k = 0; k <= steps; k++) {
        const t = steps ? k / steps : 0;
        const ground = world.terrain.heightAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t);
        const y = pos.getY(i) + (pos.getY(j) - pos.getY(i)) * t;
        expect(y, `edge at ${x0}, ${z0}`).toBeLessThan(ground);
      }
    }
  });

  it('draws the farthest land first, so nearer land covers it', () => {
    let last = Infinity;
    for (let t = 0; t < index.count; t += 3) {
      const ring = Math.min(...[0, 1, 2].map((k) => Math.floor(index.getX(t + k) / ringSize)));
      expect(ring).toBeLessThanOrEqual(last);
      last = ring;
    }
  });

  it('faces up', () => {
    const n = horizon.mesh.geometry.getAttribute('normal');
    const v = new Vector3();
    let up = 0;
    for (let i = ringSize; i < n.count; i++) if (v.fromBufferAttribute(n, i).y > 0) up++;
    expect(up).toBe(n.count - ringSize);
  });

  it('is drawn behind the world without depth', () => {
    expect(horizon.mesh.renderOrder).toBeLessThan(0);
    expect(horizon.mesh.frustumCulled).toBe(false);
    expect((horizon.mesh.material as { depthWrite: boolean }).depthWrite).toBe(false);
  });
});
