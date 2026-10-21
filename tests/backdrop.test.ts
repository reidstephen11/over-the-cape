import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { createBackdrop } from '../src/render/sky';
import { maps } from '../src/data/maps';
import { highCountryMap } from './fixtures/maps/map';
import { ironbarkParkMap } from './fixtures/maps/park';

/** The nearest any part of the backdrop comes to the middle of the map, seen from above. */
function innerRadius(seed: number, size: number): number {
  const mesh = createBackdrop(seed, size);
  mesh.updateMatrixWorld();
  const pos = mesh.geometry.getAttribute('position');
  const v = new Vector3();
  let min = Infinity;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    min = Math.min(min, Math.hypot(v.x, v.z));
  }
  return min;
}

describe('backdrop hills', () => {
  it("stay outside every map's corners", () => {
    for (const def of [...Object.values(maps).map((m) => m.def), highCountryMap, ironbarkParkMap]) {
      const corner = (def.size / 2) * Math.SQRT2;
      expect(innerRadius(def.seed, def.size), def.name).toBeGreaterThan(corner + 300);
    }
  });

  it('keep their 4WD Simulator size on maps up to 1.5 km', () => {
    expect(innerRadius(1, 1536)).toBeCloseTo(1500, 0);
    expect(innerRadius(1, 768)).toBeCloseTo(1500, 0);
    // The CREB's 3 km map once had the nearest ring cutting through its corners.
    expect(innerRadius(1, 3072)).toBeCloseTo(3000, 0);
  });
});
