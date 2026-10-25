import * as THREE from "three";
import {
  VehicleBuilder,
  VehicleMaterial as M,
  BodyZone as Z,
} from "./vehicleGeometry";
const glyphs: Record<string, number[][]> = {
  G: [
    [1, 1, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [1, 0, 1, 0.5],
    [1, 0.5, 0.55, 0.5],
  ],
  Q: [
    [0, 0, 0, 1],
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [0.6, 0.3, 1.15, -0.1],
  ],
  "0": [
    [0, 0, 0, 1],
    [0, 1, 1, 1],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
  ],
  "6": [
    [1, 1, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [1, 0, 1, 0.5],
    [1, 0.5, 0, 0.5],
  ],
  "-": [[0.15, 0.5, 0.85, 0.5]],
};
export function plateText(
  b: VehicleBuilder,
  text: string,
  x: number,
  y: number,
  z: number,
  facing: -1 | 1,
): void {
  const color = new THREE.Color("#202326"),
    w = 0.029,
    h = 0.057,
    pitch = 0.045;
  for (let i = 0; i < text.length; i++)
    for (const [ax, ay, bx, by] of glyphs[text[i]]) {
      const start = (i - (text.length - 1) / 2) * pitch;
      b.rod(
        { x: x + facing * (start + (ax - 0.5) * w), y: y + (ay - 0.5) * h, z },
        { x: x + facing * (start + (bx - 0.5) * w), y: y + (by - 0.5) * h, z },
        0.0027,
        color,
        M.Rubber,
        facing < 0 ? Z.Front : Z.Rear,
      );
    }
}
