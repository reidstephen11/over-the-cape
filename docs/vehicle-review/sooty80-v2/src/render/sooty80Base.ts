import * as THREE from "three";
import type { VehicleTuning } from "../data/vehicle";
import { buildBodyCore } from "./sooty80Proposal";
export { buildVehicleWheel } from "./sooty80Wheel";
export function buildVehicleBody(t: VehicleTuning, w: THREE.BufferGeometry) {
  return buildBodyCore(t, w, false);
}
export const buildBaseBody = buildVehicleBody;
export function buildEmptyPlank() {
  const g = new THREE.BufferGeometry();
  for (const [name, size] of [
    ["position", 3],
    ["normal", 3],
    ["color", 3],
    ["uv", 2],
    ["materialSlot", 1],
    ["tag", 1],
  ] as const)
    g.setAttribute(name, new THREE.Float32BufferAttribute([], size));
  return g;
}
