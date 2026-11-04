import * as THREE from 'three';
import type { Simulation } from '../sim/sim';
import type { Vehicle } from '../sim/vehicle/vehicle';
import { v3 } from '../sim/vehicle/math';
import { anchorPoint } from '../sim/tools/anchors';
import type { ToolController } from './toolController';

/**
 * Choosing a winch anchor (moved out of `Game`, v1.52): how many are in reach, counted a
 * few times a second for the HUD and the tool menu; USE with two or more opens the chooser;
 * and a short tap or click on the view while choosing picks the one under it.
 */
export class AnchorPicker {
  /** Is there a winch anchor in reach (checked every 0.4 s)? */
  inReach = false;
  /** How many anchors are in reach. */
  count = 0;
  private check = 0;
  private tapStart: { id: number; x: number; y: number; t: number } | null = null;
  private readonly tapVec = new THREE.Vector3();
  private readonly anchorTmp = v3();

  constructor(
    private readonly sim: Pick<Simulation, 'toolsOf' | 'hitchOption' | 'findAnchors'>,
    private readonly tool: Pick<ToolController, 'mode' | 'startWinchTarget' | 'pick'>,
    private readonly vehicleId: string,
    private readonly vehicle: () => Vehicle,
    private readonly camera: THREE.Camera,
    private readonly canvas: HTMLElement,
  ) {
    canvas.addEventListener('pointerdown', (e) => {
      this.tapStart = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    });
    // A short tap that didn't drag the camera picks a winch anchor while choosing one.
    canvas.addEventListener('pointerup', (e) => {
      const s = this.tapStart;
      this.tapStart = null;
      if (!s || s.id !== e.pointerId || performance.now() - s.t > 500) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 12) return;
      this.tapAnchor(e.clientX, e.clientY, e.pointerType === 'touch');
    });
  }

  /** Each frame: recount the anchors in reach every 0.4 s. */
  update(frameDt: number): void {
    this.check -= frameDt;
    if (this.check > 0) return;
    this.check = 0.4;
    this.count = this.sim.findAnchors(this.vehicleId).length;
    this.inReach = this.count > 0;
  }

  /** Open the anchor chooser for a USE press, when there is a choice to make. */
  offerChoice(): boolean {
    const t = this.sim.toolsOf(this.vehicleId);
    if (t.winch.attached || t.planks.inReach(this.vehicle()).length > 0) return false;
    if (this.sim.hitchOption(this.vehicleId)?.kind === 'hitch') return false;
    if (this.sim.findAnchors(this.vehicleId).length < 2) return false;
    return this.tool.startWinchTarget();
  }

  /** A tap or click on the view while choosing an anchor: pick the one under it. */
  private tapAnchor(clientX: number, clientY: number, touch: boolean): void {
    const list = this.sim.toolsOf(this.vehicleId).targeting;
    if (this.tool.mode !== 'winchTarget' || !list) return;
    const rect = this.canvas.getBoundingClientRect();
    const reach = touch ? 64 : 40;
    let best = -1;
    let bestD = reach;
    list.forEach((a, i) => {
      const p = anchorPoint(a, this.anchorTmp);
      this.tapVec.set(p.x, p.y + 0.3, p.z).project(this.camera);
      if (this.tapVec.z > 1) return;
      const x = rect.left + ((this.tapVec.x + 1) / 2) * rect.width;
      const y = rect.top + ((1 - this.tapVec.y) / 2) * rect.height;
      const d = Math.hypot(x - clientX, y - clientY);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) this.tool.pick(best);
  }
}
