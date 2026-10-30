import type { Game } from '../core/game';

/** How long each setting is timed, and how much of the start is skipped while it settles. */
const SECONDS = 6;
const SETTLE = 1.5;

interface Mode {
  name: string;
  apply(g: Game, on: boolean): void;
}

const MODES: Mode[] = [
  { name: 'As normal', apply: () => {} },
  {
    name: 'Half resolution',
    apply: (g, on) => g.view.benchResolution(on ? 0.5 : 1),
  },
  {
    name: 'No shadows',
    apply: (g, on) => {
      g.view.renderer.shadowMap.enabled = !on;
      g.view.scene.traverse((o) => {
        const m = (o as { material?: { needsUpdate: boolean } | { needsUpdate: boolean }[] }).material;
        if (m) for (const x of Array.isArray(m) ? m : [m]) x.needsUpdate = true;
      });
    },
  },
  {
    name: 'No trees',
    apply: (g, on) => {
      const trees = g.view.vegetation.group.getObjectByName('trees');
      if (trees) trees.visible = !on;
    },
  },
  {
    name: 'No ground cover',
    apply: (g, on) => {
      for (const name of ['ground-cover', 'meadow']) {
        const o = g.view.vegetation.group.getObjectByName(name);
        if (o) o.visible = !on;
      }
    },
  },
  { name: 'As normal again', apply: () => {} },
];

/**
 * `?bench`: drives the Bloomfield Track on the autopilot and times the frames with one thing
 * turned off at a time, so a phone can show what slows it down. The results stay on screen.
 */
export class Bench {
  private mode = -1;
  private t = 0;
  private frames: number[] = [];
  private cpu: number[] = [];
  private readonly results: string[] = [];
  private readonly el: HTMLElement;
  done = false;

  constructor(private readonly g: Game) {
    this.el = document.createElement('div');
    this.el.style.cssText =
      'position:fixed;left:8px;top:8px;z-index:99999;max-width:92vw;padding:10px 12px;border-radius:8px;' +
      'background:rgba(0,0,0,0.82);color:#fff;font:13px/1.45 monospace;white-space:pre-wrap;pointer-events:none';
    document.body.appendChild(this.el);
    this.show('Phone test: starting on the Bloomfield Track…');
  }

  private show(text: string): void {
    this.el.textContent = text;
  }

  /** Call once a frame with the frame's length (s) and the game code's time in it (ms). */
  update(frameDt: number, cpuMs: number): void {
    if (this.done) return;
    // A history note stops the game on a touch screen: put it away.
    document.querySelector<HTMLElement>('.history-card.reading')?.click();
    if (this.g.loop.paused) {
      if (this.mode < 0) this.show('Phone test: press Drive to start it.');
      return;
    }
    if (this.mode < 0) {
      if (window.__game?.vehicle().engineOff) window.__game.startEngine();
      window.__game?.autopilot('bloomfield-creeks', 520, 9);
      this.start(0);
      return;
    }
    this.t += frameDt;
    if (this.t > SETTLE) {
      this.frames.push(frameDt * 1000);
      this.cpu.push(cpuMs);
    }
    if (this.t < SECONDS) {
      this.show(
        `Phone test: ${MODES[this.mode].name} (${this.mode + 1} of ${MODES.length})…\n${this.results.join('\n')}`,
      );
      return;
    }
    MODES[this.mode].apply(this.g, false);
    const sorted = [...this.frames].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1] ?? 0;
    const worst = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const cpu = [...this.cpu].sort((a, b) => a - b)[this.cpu.length >> 1] ?? 0;
    this.results.push(
      `${MODES[this.mode].name.padEnd(16)} ${(1000 / Math.max(1, median)).toFixed(0).padStart(3)} fps  ` +
        `frame ${median.toFixed(0)} ms (worst ${worst.toFixed(0)})  code ${cpu.toFixed(0)} ms`,
    );
    if (this.mode + 1 < MODES.length) {
      this.start(this.mode + 1);
      return;
    }
    this.done = true;
    window.__game?.autopilot(null);
    this.show(
      `Phone test done (${innerWidth}×${innerHeight}, pixel ratio ${devicePixelRatio}, ${this.g.settings.quality})\n` +
        `${this.results.join('\n')}\n\nPlease send a screenshot of this.`,
    );
  }

  private start(mode: number): void {
    this.mode = mode;
    this.t = 0;
    this.frames = [];
    this.cpu = [];
    MODES[mode].apply(this.g, true);
  }
}
