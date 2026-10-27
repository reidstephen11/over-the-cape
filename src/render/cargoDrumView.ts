import * as THREE from 'three';
import { DRUM } from '../data/trailers';
import type { CargoDrum } from '../sim/cargoDrum';
import { patchFog } from './fog';

/** A dropped delivery drum, in the same blue as the drums on the trailer. */
export class CargoDrumView {
  readonly root = new THREE.Group();
  private readonly material = patchFog(
    new THREE.MeshStandardMaterial({ color: '#2F4F7A', roughness: 0.6, metalness: 0.25 }),
  );
  constructor(readonly drum: CargoDrum) {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(DRUM.radius, DRUM.radius, DRUM.height, 20),
      this.material,
    );
    body.castShadow = true;
    this.root.add(body);
    for (const y of [-0.14, 0.14]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(DRUM.radius + 0.005, 0.012, 5, 20), this.material);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = y;
      this.root.add(hoop);
    }
    this.update();
  }
  update(): void {
    this.root.position.copy(this.drum.body.translation());
    this.root.quaternion.copy(this.drum.body.rotation());
  }
  dispose(): void {
    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.material.dispose();
  }
}
