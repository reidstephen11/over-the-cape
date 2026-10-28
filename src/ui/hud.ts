import { controllers, defaultController, type ControllerType } from '../data/controllers';
import { icons, type PoiIcon } from './icons';
import { cameraPresets, type CameraPreset } from '../data/camera';
import {
  CrawlGauges,
  formatSpeed,
  phoneTiltRisk,
  type GaugeMode,
  type GaugeState,
  type SpeedUnits,
} from './crawlGauges';
import type { HeadlightMode } from '../data/headlights';
import { railItems, touchNotice, warningView, type RailItem } from './alerts';
import { VehicleGauges, type VehicleGaugeState } from './vehicleGauges';

/** Phone mission line (clock + place) stays this long, then folds away. Tap the strip to see it again. */
export const MISSION_FADE_MS = 4500;

/** Labels already printed on the on-screen buttons. A prompt with only these keys repeats them. */
const TOUCH_BUTTON_KEYS = new Set([
  'USE',
  'GAS',
  'BRAKE',
  'HAND',
  'TOOLS',
  'LOW',
  'MAP',
  'II',
  'LIGHTS',
  'IN',
  'OUT',
  'UPRIGHT',
  'BACK',
]);

/** True when every key in a touch prompt is already a button, so the badge can be dropped. */
export function echoesTouchButton(keys: string): boolean {
  const parts = keys.split(' / ');
  return parts.length > 0 && parts.every((part) => TOUCH_BUTTON_KEYS.has(part));
}

export interface Prompt {
  /** Key or button glyphs, e.g. "E" or "Hold J". */
  keys: string;
  text: string;
  /** 0..1 progress ring (hold actions). */
  progress?: number;
}

export interface CompassPoi {
  id: string;
  kind: PoiIcon;
  /** Bearing from the player (degrees, 0 = north). */
  bearing: number;
}

/** The episode's mission and clock (top left). */
export interface EpisodeHud {
  title: string;
  mission: string;
  /** "2:35 pm" (empty when the clock is stopped for a replay). */
  clock: string;
  deadline: string;
  /** Under half an hour of game time left. */
  urgent: boolean;
}

/** Fuel and what's on board to fix and refill with. */
export interface SuppliesHud extends VehicleGaugeState {
  jerryCans: number;
  spares: number;
  plugs: number;
}

/** The trailer line beside the supplies. */
export interface TrailerHud {
  name: string;
  /** Drums of diesel on board, the trailer's mass with its load (kg) and the most it may weigh. */
  drums: number;
  kg: number;
  limit: number;
  overloaded: boolean;
  /** On the back, over on its side, come round against the car, or standing unhitched `distance` m away. */
  state: 'towing' | 'tipped' | 'jackknifed' | 'left';
  distance: number;
}

export interface HudState {
  gauges: GaugeState;
  /** A trailer on the back, or one left standing (null: none). */
  trailer?: TrailerHud | null;
  episode: EpisodeHud | null;
  supplies: SuppliesHud | null;
  /** Gates on a gate trail: the next one to drive (0 before the first), and the lap so far. */
  gates: GateState | null;
  /** A scored crawl run in progress. */
  run: { name: string; seconds: number; points: number } | null;
  /** Camera heading (degrees, 0 = north). */
  heading: number;
  pois: CompassPoi[];
  range: 'high' | 'low';
  frontLocked: boolean;
  rearLocked: boolean;
  precisionCrawl: boolean;
  /** The park brake is on. */
  parkBrake: boolean;
  /** Headlights: a green lamp for low beam, a blue one for high beam, as on the dash. */
  lights: HeadlightMode;
  courseHint: { title: string; text: string; controls: string } | null;
  planksCarried: number;
  planksTotal: number;
  winchAttached: boolean;
  /** 0 = fine, 1 = flooding (warning), 2 = stalled. */
  engine: 0 | 1 | 2;
  /**
   * Mechanical damage, when anything is damaged: engine health and each corner's (the
   * worse of its tyre and suspension), 1 = as new. Wheels in the vehicle's order, with
   * which are front and which are on the left.
   */
  damage: { engine: number; corners: { health: number; front: boolean; left: boolean }[] } | null;
  prompts: Prompt[];
}

/**
 * In-game HUD (SPEC §9): compass strip (top centre), status cluster (bottom left),
 * context prompts (bottom centre), and messages and discovery cards in the top right
 * corner, out of the view of the track ahead. Plain DOM; mostly-clear screen.
 */
export class Hud {
  readonly el: HTMLElement;
  private controller: ControllerType = defaultController;
  onCameraReset: (() => void) | null = null;
  onCameraPreset: (() => void) | null = null;
  private readonly compass: HTMLCanvasElement;
  private readonly cctx: CanvasRenderingContext2D;
  private readonly status: HTMLElement;
  private readonly rangeEl: HTMLElement;
  private readonly speedEl: HTMLElement;
  private readonly gearEl: HTMLElement;
  private readonly parkEl: HTMLElement;
  private readonly lightsEl: HTMLElement;
  private readonly damageEl: HTMLElement;
  private lastDamageKey = '';
  private readonly driveButtons: HTMLButtonElement[];
  private readonly courseHint: HTMLElement;
  private readonly planksEl: HTMLElement;
  private readonly winchEl: HTMLElement;
  private readonly engineEl: HTMLElement;
  private readonly promptsEl: HTMLElement;
  private readonly alertRail: HTMLElement;
  private readonly alertsEl: HTMLElement;
  private readonly noticesEl: HTMLElement;
  private readonly toasts: HTMLElement;
  /** When a touch warning was first shown, so an advisory can shrink after a few seconds. */
  private readonly alertSeen = new Map<string, number>();
  /** Tapped chips stay open until this time. */
  private readonly alertExpanded = new Map<string, number>();
  private lastAlertKey = '';
  private readonly discovery: HTMLElement;
  private readonly cameraHelpEl: HTMLElement;
  private readonly cameraHint: HTMLElement;
  private readonly cameraResetKey: HTMLElement;
  private readonly cameraPresetButton: HTMLButtonElement;
  private readonly gauges: CrawlGauges;
  private readonly runEl: HTMLElement;
  private readonly gateEl: HTMLElement;
  private readonly missionEl: HTMLElement;
  private readonly suppliesPanel: HTMLElement;
  private readonly vehicleGauges: VehicleGauges;
  private readonly suppliesEl: HTMLElement;
  private readonly trailerEl: HTMLElement;
  private lastTrailerKey = '';
  private lastMissionKey = '';
  private lastMissionPlace = '';
  private missionRevealUntil = 0;
  private lastSuppliesKey = '';
  /** Crawl gauges: 'auto' shows them in low range, precision crawl or the driver's seat. */
  gaugeMode: GaugeMode = 'auto';
  /** Speed units from the settings, for the status strip and the crawl gauges. */
  set units(u: SpeedUnits) {
    this.gauges.units = u;
  }
  get units(): SpeedUnits {
    return this.gauges.units;
  }
  /** Set by the game: the driver's-seat camera is in use. */
  cockpitView = false;
  private lastCompassKey = '';
  private lastPromptKey = '';
  private readonly iconImages = new Map<string, HTMLImageElement>();

  constructor(root: HTMLElement, driveAction: (action: 'frontDiff' | 'rearDiff' | 'precision') => void) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="compass paper"><canvas width="840" height="76"></canvas></div>
      <div class="hud-readout">
      <div class="status paper">
        <div class="status-range" title="Transfer range">H</div>
        <div class="status-speed" title="Speed and gear"><span class="status-speed-value">0.0 km/h</span><span class="status-gear">1</span></div>
        <button type="button" class="status-drive" data-drive="frontDiff" aria-label="Front differential lock" aria-pressed="false" title="Front diff lock: Z / L1 menu">F OPEN</button>
        <button type="button" class="status-drive" data-drive="rearDiff" aria-label="Rear differential lock" aria-pressed="false" title="Rear diff lock: X / L1 menu">R OPEN</button>
        <button type="button" class="status-drive" data-drive="precision" aria-label="Precision crawl" aria-pressed="false" title="Precision crawl: P / L1 menu. Hold throttle for walking pace.">CRAWL</button>
        <div class="status-park" title="Handbrake on: Space / □">P</div>
        <div class="status-item status-lights" title="Headlights: N / L1 menu">${icons.headlight}</div>
        <div class="status-item status-damage" title="Damage"></div>
        <div class="status-item status-planks" title="Recovery planks on board">${icons.planks}<span class="status-label">Planks</span><span class="status-planks-count">2/2</span></div>
        <div class="status-item status-winch" title="Winch attached">${icons.winch}</div>
        <div class="status-item status-engine" title="Engine flooding">${icons.engine}</div>
      </div>
      <div class="supplies paper hidden">
        <div class="supplies-footer">
        <div class="status-item status-supplies"></div>
        <div class="status-item status-trailer hidden">${icons.trailer}<span class="trailer-text"></span><span class="trailer-kg"></span></div>
        </div>
      </div>
      <div class="mission paper hidden"><small></small><strong></strong><span class="mission-clock"></span></div>
      <div class="course-hint paper hidden"><strong></strong><span></span><small></small></div>
      </div>
      <div class="prompts"></div>
      <div class="alert-rail" aria-live="polite"><div class="alerts"></div></div>
      <div class="camera-help paper">
        <span class="camera-hint">Drag to orbit · Scroll to zoom</span>
        <button type="button" class="camera-preset" aria-label="Camera view" title="Cycle wheel-placement views: C / hold L1 + click right stick">View<span class="camera-preset-name">: <span>Follow</span></span> <kbd>C</kbd></button>
        <button type="button" class="camera-reset" aria-label="Reset view" title="Return behind the vehicle"><span class="camera-reset-label">Reset view</span><span class="camera-reset-icon" aria-hidden="true">⟲</span> <kbd>V</kbd></button>
      </div>
      <div class="gate-count paper hidden"></div>
      <div class="crawl-run paper hidden"><strong></strong><span class="crawl-run-time"></span><span class="crawl-run-points"></span></div>
      <div class="notices"><div class="discovery"></div><div class="toasts"></div></div>`;
    root.appendChild(this.el);
    this.gauges = new CrawlGauges(this.el);
    this.runEl = this.el.querySelector('.crawl-run') as HTMLElement;
    this.missionEl = this.el.querySelector('.mission') as HTMLElement;
    this.suppliesPanel = this.el.querySelector('.supplies') as HTMLElement;
    this.vehicleGauges = new VehicleGauges(this.suppliesPanel);
    this.suppliesPanel.prepend(this.vehicleGauges.el);
    this.vehicleGauges.el.addEventListener('click', (e) => {
      if (!document.body.classList.contains('touch-mode')) return;
      if (!(e.target as HTMLElement).closest('.vehicle-strip')) return;
      e.stopPropagation();
      this.vehicleGauges.toggleOpen();
      this.missionRevealUntil = performance.now() + MISSION_FADE_MS;
      this.lastMissionKey = '';
    });
    this.suppliesEl = this.el.querySelector('.status-supplies') as HTMLElement;
    this.trailerEl = this.el.querySelector('.status-trailer') as HTMLElement;
    this.gateEl = this.el.querySelector('.gate-count') as HTMLElement;
    this.compass = this.el.querySelector('.compass canvas') as HTMLCanvasElement;
    this.cctx = this.compass.getContext('2d') as CanvasRenderingContext2D;
    this.status = this.el.querySelector('.status') as HTMLElement;
    this.rangeEl = this.el.querySelector('.status-range') as HTMLElement;
    this.speedEl = this.el.querySelector('.status-speed-value') as HTMLElement;
    this.gearEl = this.el.querySelector('.status-gear') as HTMLElement;
    this.parkEl = this.el.querySelector('.status-park') as HTMLElement;
    this.lightsEl = this.el.querySelector('.status-lights') as HTMLElement;
    this.damageEl = this.el.querySelector('.status-damage') as HTMLElement;
    this.driveButtons = [...this.el.querySelectorAll<HTMLButtonElement>('[data-drive]')];
    this.courseHint = this.el.querySelector('.course-hint') as HTMLElement;
    for (const button of this.driveButtons)
      button.addEventListener('click', () => {
        driveAction(button.dataset.drive as 'frontDiff' | 'rearDiff' | 'precision');
        button.blur();
      });
    this.planksEl = this.el.querySelector('.status-planks-count') as HTMLElement;
    this.winchEl = this.el.querySelector('.status-winch') as HTMLElement;
    this.engineEl = this.el.querySelector('.status-engine') as HTMLElement;
    this.promptsEl = this.el.querySelector('.prompts') as HTMLElement;
    this.alertRail = this.el.querySelector('.alert-rail') as HTMLElement;
    this.alertsEl = this.el.querySelector('.alerts') as HTMLElement;
    this.noticesEl = this.el.querySelector('.notices') as HTMLElement;
    this.toasts = this.el.querySelector('.toasts') as HTMLElement;
    this.alertRail.addEventListener('click', (e) => {
      const hit = (e.target as HTMLElement).closest<HTMLElement>('.alert.minimised');
      const id = hit?.dataset.id;
      if (!id) return;
      this.alertExpanded.set(id, performance.now() + 5000);
      this.lastAlertKey = '';
    });
    this.discovery = this.el.querySelector('.discovery') as HTMLElement;
    this.cameraHelpEl = this.el.querySelector('.camera-help') as HTMLElement;
    this.cameraHint = this.el.querySelector('.camera-hint') as HTMLElement;
    this.cameraResetKey = this.el.querySelector('.camera-reset kbd') as HTMLElement;
    this.cameraPresetButton = this.el.querySelector('.camera-preset') as HTMLButtonElement;
    this.cameraPresetButton.addEventListener('click', () => {
      this.onCameraPreset?.();
      this.cameraPresetButton.blur();
    });
    this.el.querySelector('.camera-reset')?.addEventListener('click', (e) => {
      this.onCameraReset?.();
      // Return keyboard control to driving after a pointer click (Space is handbrake).
      if ((e as MouseEvent).detail > 0) (e.currentTarget as HTMLButtonElement).blur();
    });
    for (const k of ['campsite', 'viewpoint', 'landmark', 'feature'] as const) {
      const img = new Image();
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
        icons[k]
          .replace('currentColor', '#3B2A1E')
          .replace(/currentColor/g, '#3B2A1E')
          .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '),
      )}`;
      this.iconImages.set(k, img);
    }
  }

  setVisible(v: boolean): void {
    this.el.classList.toggle('hidden', !v);
  }

  setControllerType(controller: ControllerType): void {
    this.controller = controller;
    const p = controllers[controller];
    const labels: Record<string, string> = {
      frontDiff: `Front diff lock: Z / ${p.toolMenu} menu`,
      rearDiff: `Rear diff lock: X / ${p.toolMenu} menu`,
      precision: `Precision crawl: P / ${p.toolMenu} menu. Hold throttle for walking pace.`,
    };
    for (const button of this.driveButtons) {
      button.title = labels[button.dataset.drive ?? ''] ?? button.title;
    }
    this.parkEl.title = `Handbrake on: Space / ${p.handbrake}`;
    this.lightsEl.title = `Headlights: N / ${p.toolMenu} menu`;
    this.cameraPresetButton.title = `Cycle wheel-placement views: C / hold ${p.toolMenu} + ${p.cameraReset}`;
  }

  cameraHelp(
    device: 'keyboard' | 'gamepad' | 'touch',
    visible: boolean,
    driving: boolean,
    preset: CameraPreset,
  ): void {
    this.cameraHelpEl.hidden = !visible;
    const hint =
      device === 'keyboard'
        ? 'Drag to orbit · Scroll to zoom'
        : device === 'touch'
          ? 'Drag the view to look around'
          : `Right stick to orbit${driving ? ' · D-pad ←/→ to zoom' : ''}`;
    if (this.cameraHint.textContent !== hint) this.cameraHint.textContent = hint;
    const key = device === 'keyboard' ? 'V' : controllers[this.controller].cameraReset;
    if (this.cameraResetKey.textContent !== key) this.cameraResetKey.textContent = key;
    this.cameraPresetButton.hidden = !driving;
    this.cameraPresetButton.querySelector('.camera-preset-name span')!.textContent =
      cameraPresets[preset].label;
    this.cameraPresetButton.querySelector('kbd')!.textContent =
      device === 'keyboard'
        ? 'C'
        : `${controllers[this.controller].toolMenu} + ${controllers[this.controller].cameraReset}`;
  }

  update(s: HudState): void {
    this.el.classList.toggle('cockpit', this.cockpitView);
    this.drawCompass(s);
    const touch = document.body.classList.contains('touch-mode');
    const showGauges =
      this.gaugeMode === 'on' ||
      (this.gaugeMode === 'auto' &&
        (touch ? phoneTiltRisk(s.gauges) : s.range === 'low' || s.precisionCrawl || this.cockpitView));
    this.gauges.visible = showGauges;
    if (showGauges) this.gauges.update(s.gauges);
    // On a phone held upright the panels below make room for these (see styles.css).
    this.el.classList.toggle('with-gauges', showGauges);
    this.el.classList.toggle('with-progress', !!s.gates || !!s.run);
    this.runEl.classList.toggle('hidden', !s.run);
    // The gate count sits where a scored run's clock goes; the run takes the place while it lasts.
    this.gateEl.classList.toggle('hidden', !s.gates || !!s.run);
    if (s.gates) {
      const text = gateText(s.gates);
      if (this.gateEl.textContent !== text) this.gateEl.textContent = text;
      this.gateEl.classList.toggle('missed', s.gates.missed > 0 || s.gates.flags > 0);
    }
    if (s.run) {
      this.runEl.querySelector('strong')!.textContent = s.run.name;
      this.runEl.querySelector('.crawl-run-time')!.textContent = clock(s.run.seconds);
      this.runEl.querySelector('.crawl-run-points')!.textContent =
        s.run.points === 0 ? 'clean' : `${s.run.points} pt${s.run.points === 1 ? '' : 's'}`;
    }
    this.rangeEl.textContent = s.range === 'high' ? 'H' : 'L';
    // Speed and gear, unless the crawl gauges already show them (the dash does in the driver's seat).
    this.status.classList.toggle('with-speed', !showGauges);
    const speed = formatSpeed(s.gauges.speedKmh, this.units);
    if (this.speedEl.textContent !== speed) this.speedEl.textContent = speed;
    if (this.gearEl.textContent !== s.gauges.gear) this.gearEl.textContent = s.gauges.gear;
    this.rangeEl.classList.toggle('low', s.range === 'low');
    this.parkEl.classList.toggle('shown', s.parkBrake);
    this.lightsEl.classList.toggle('shown', s.lights !== 'off');
    this.lightsEl.classList.toggle('high', s.lights === 'high');
    this.drawDamage(s.damage);
    const active = [s.frontLocked, s.rearLocked, s.precisionCrawl];
    this.driveButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(active[index]));
      if (index < 2) button.textContent = `${index === 0 ? 'F' : 'R'} ${active[index] ? 'LOCK' : 'OPEN'}`;
    });
    this.courseHint.classList.toggle('hidden', !s.courseHint);
    if (s.courseHint) {
      this.courseHint.querySelector('strong')!.textContent = s.courseHint.title;
      this.courseHint.querySelector('span')!.textContent = s.courseHint.text;
      this.courseHint.querySelector('small')!.textContent = s.courseHint.controls;
    }
    this.planksEl.textContent = `${s.planksCarried}/${s.planksTotal}`;
    this.drawMission(s.episode, touch);
    this.drawSupplies(s.supplies);
    this.drawTrailer(s.trailer ?? null);
    this.winchEl.classList.toggle('shown', s.winchAttached);
    this.engineEl.classList.toggle('shown', s.engine > 0);
    this.engineEl.classList.toggle('stalled', s.engine === 2);
    this.status.dataset.engine = String(s.engine);
    // Warnings leave the banner stack on a phone; what you can do (winch, handbrake) stays.
    const prompts = touch ? s.prompts.filter((p) => p.keys !== '!') : s.prompts;
    const key = `${touch ? 't' : 'd'}:${prompts.map((p) => `${p.keys}|${p.text}|${p.progress?.toFixed(2) ?? ''}`).join('#')}`;
    if (key !== this.lastPromptKey) {
      this.lastPromptKey = key;
      this.promptsEl.innerHTML = '';
      for (const p of prompts) {
        const el = document.createElement('div');
        el.className = 'prompt paper';
        if (touch && echoesTouchButton(p.keys)) el.classList.add('prompt-echo');
        const k = document.createElement('span');
        k.className = 'key';
        k.textContent = p.keys;
        if (p.progress !== undefined) k.style.setProperty('--progress', `${Math.round(p.progress * 100)}%`);
        el.append(k, document.createTextNode(` ${p.text}`));
        this.promptsEl.appendChild(el);
      }
    }
    this.drawAlerts(
      touch,
      s.prompts.filter((p) => p.keys === '!'),
    );
  }

  /**
   * Phone warnings and notices share a short rail under the compass. A keyboard or a pad
   * keeps the warnings in the prompt stack and the notices in the top right.
   */
  private drawAlerts(touch: boolean, warnings: Prompt[]): void {
    const parent = touch ? this.alertRail : this.noticesEl;
    if (this.toasts.parentElement !== parent) parent.appendChild(this.toasts);
    if (!touch) {
      if (this.alertsEl.childElementCount > 0) this.alertsEl.replaceChildren();
      this.alertRail.classList.remove('full');
      this.lastAlertKey = '';
      return;
    }
    const now = performance.now();
    const views = warnings.map((p) => warningView(p.text));
    const ids = new Set(views.map((v) => v.id));
    for (const id of [...this.alertSeen.keys()]) if (!ids.has(id)) this.alertSeen.delete(id);
    for (const id of [...this.alertExpanded.keys()]) {
      if (!ids.has(id) || (this.alertExpanded.get(id) ?? 0) <= now) this.alertExpanded.delete(id);
    }
    for (const v of views) if (!this.alertSeen.has(v.id)) this.alertSeen.set(v.id, now);
    const items = railItems(views, now, this.alertSeen, this.alertExpanded);
    const key = items.map((i) => `${i.id}|${i.text}|${i.minimised}`).join('#');
    this.alertRail.classList.toggle('full', items.length >= 2);
    if (key === this.lastAlertKey) return;
    this.lastAlertKey = key;
    this.alertsEl.replaceChildren();
    for (const item of items) this.alertsEl.appendChild(alertElement(item));
  }

  private drawMission(e: EpisodeHud | null, touch: boolean): void {
    const now = performance.now();
    const place = e ? `${e.mission}|${e.urgent}` : '';
    if (place !== this.lastMissionPlace) {
      this.lastMissionPlace = place;
      this.missionRevealUntil = now + MISSION_FADE_MS;
    }
    const faded = touch && !!e && !e.urgent && now > this.missionRevealUntil;
    this.vehicleGauges.setClock(e?.clock ?? '');
    const key = e ? `${e.title}|${e.mission}|${e.clock}|${e.deadline}|${e.urgent}|${faded}` : `:${faded}`;
    if (key === this.lastMissionKey) return;
    this.lastMissionKey = key;
    this.missionEl.classList.toggle('hidden', !e || faded);
    if (!e) return;
    this.missionEl.querySelector('small')!.textContent = e.title;
    this.missionEl.querySelector('strong')!.textContent = e.mission;
    const clock = this.missionEl.querySelector('.mission-clock') as HTMLElement;
    clock.textContent = e.clock ? `${e.clock}${e.deadline ? ` · ${e.deadline}` : ''}` : '';
    clock.classList.toggle('urgent', e.urgent);
  }

  private drawSupplies(s: SuppliesHud | null): void {
    this.suppliesPanel.classList.toggle('hidden', !s);
    if (!s) return;
    this.vehicleGauges.update(s);
    const key = `${s.jerryCans}|${s.spares}|${s.plugs}`;
    if (key === this.lastSuppliesKey) return;
    this.lastSuppliesKey = key;
    this.suppliesEl.innerHTML = `<span title="Jerry cans (20 L each)">${icons.fuel}×${s.jerryCans}</span><span title="Spare wheels">${icons.tyre}×${s.spares}</span><span title="Tyre plugs">${icons.plug}×${s.plugs}</span>`;
  }

  private drawTrailer(t: TrailerHud | null): void {
    // Left standing, the distance moves in 5 m steps so the line doesn't flicker.
    const far = t ? Math.max(5, Math.round(t.distance / 5) * 5) : 0;
    const key = t ? `${t.state}|${t.drums}|${t.kg}|${t.overloaded}|${far}` : '';
    if (key === this.lastTrailerKey) return;
    this.lastTrailerKey = key;
    this.trailerEl.classList.toggle('hidden', !t);
    if (!t) return;
    const load = t.drums > 0 ? `${t.drums} drum${t.drums === 1 ? '' : 's'}` : 'Empty';
    const text: Record<TrailerHud['state'], string> = {
      towing: load,
      jackknifed: 'Jackknifed',
      tipped: 'On its side',
      left: `Left ${far} m away`,
    };
    this.trailerEl.querySelector('.trailer-text')!.textContent = text[t.state];
    this.trailerEl.querySelector('.trailer-kg')!.textContent = t.state === 'towing' ? `· ${t.kg} kg` : '';
    this.trailerEl.classList.toggle(
      'warn',
      t.state === 'jackknifed' || (t.state === 'towing' && t.overloaded),
    );
    this.trailerEl.classList.toggle('bad', t.state === 'tipped');
    this.trailerEl.classList.toggle('left', t.state === 'left');
    this.trailerEl.title =
      t.state === 'left'
        ? 'Trailer standing unhitched: back up to its coupling to hitch it'
        : `${t.name}: ${t.drums > 0 ? `${load.toLowerCase()} of diesel, ` : 'empty, '}${t.kg} of ${t.limit} kg${t.overloaded ? ' (overloaded)' : ''}`;
  }

  /** A small car seen from above: each corner and the engine coloured by its health. */
  private drawDamage(d: HudState['damage']): void {
    const key = d ? `${d.engine.toFixed(2)}|${d.corners.map((c) => c.health.toFixed(2)).join(',')}` : '';
    if (key === this.lastDamageKey) return;
    this.lastDamageKey = key;
    this.damageEl.classList.toggle('shown', d !== null);
    if (!d) {
      this.damageEl.innerHTML = '';
      return;
    }
    const colour = (h: number) => (h > 0.97 ? 'currentColor' : h > 0.45 ? '#b8741a' : '#a3311f');
    const wheels = d.corners
      .map(
        (c) =>
          `<rect x="${c.left ? 3 : 17}" y="${c.front ? 3 : 15}" width="4" height="7" rx="1" fill="${colour(c.health)}"/>`,
      )
      .join('');
    this.damageEl.innerHTML = `<svg viewBox="0 0 24 24"><rect x="7.5" y="2" width="9" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="9.5" y="4" width="5" height="5" rx="1" fill="${colour(d.engine)}"/>${wheels}</svg>`;
    const parts = [
      d.engine < 0.97 ? `engine ${Math.round(d.engine * 100)}%` : '',
      ...d.corners.map((c) =>
        c.health < 0.97
          ? `${c.front ? 'front' : 'rear'} ${c.left ? 'left' : 'right'} ${Math.round(c.health * 100)}%`
          : '',
      ),
    ].filter(Boolean);
    this.damageEl.title = `Damage: ${parts.join(', ')}`;
  }

  private drawCompass(s: HudState): void {
    const key = `${s.heading.toFixed(1)}|${s.pois.map((p) => `${p.id}${p.bearing.toFixed(0)}`).join(',')}`;
    if (key === this.lastCompassKey) return;
    this.lastCompassKey = key;
    const c = this.cctx;
    const w = this.compass.width;
    const h = this.compass.height;
    c.clearRect(0, 0, w, h);
    const span = 180;
    const pxPerDeg = w / span;
    const x = (bearing: number) => {
      let d = bearing - s.heading;
      d = ((((d + 180) % 360) + 360) % 360) - 180;
      return w / 2 + d * pxPerDeg;
    };
    c.strokeStyle = '#3B2A1E';
    c.fillStyle = '#3B2A1E';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const labels: Record<number, string> = {
      0: 'N',
      45: 'NE',
      90: 'E',
      135: 'SE',
      180: 'S',
      225: 'SW',
      270: 'W',
      315: 'NW',
    };
    for (let b = 0; b < 360; b += 5) {
      const px = x(b);
      if (px < -10 || px > w + 10) continue;
      const major = b % 45 === 0;
      c.lineWidth = major ? 3 : b % 15 === 0 ? 2 : 1.2;
      c.beginPath();
      c.moveTo(px, h - 6);
      c.lineTo(px, h - (major ? 22 : b % 15 === 0 ? 16 : 11));
      c.stroke();
      if (labels[b] !== undefined) {
        c.font = `${labels[b].length === 1 ? 'bold 30px' : '22px'} "Patrick Hand", "Nunito", sans-serif`;
        c.fillStyle = b === 0 ? '#B5653A' : '#3B2A1E';
        c.fillText(labels[b], px, 24);
        c.fillStyle = '#3B2A1E';
      }
    }
    for (const p of s.pois) {
      const px = x(p.bearing);
      if (px < 12 || px > w - 12) continue;
      const img = this.iconImages.get(p.kind);
      if (img?.complete) c.drawImage(img, px - 13, 32, 26, 26);
    }
    // Centre marker.
    c.fillStyle = '#B5653A';
    c.beginPath();
    c.moveTo(w / 2 - 9, h);
    c.lineTo(w / 2 + 9, h);
    c.lineTo(w / 2, h - 12);
    c.closePath();
    c.fill();
  }

  /** Short message card (range change, winch attached...). On a phone it is one short line. */
  toast(text: string, ms = 2200): void {
    const el = document.createElement('div');
    el.className = 'toast paper';
    const touch = document.body.classList.contains('touch-mode');
    el.textContent = touch ? touchNotice(text) : text;
    if (touch && el.textContent !== text) el.title = text;
    this.toasts.appendChild(el);
    while (this.toasts.children.length > 3) this.toasts.firstElementChild?.remove();
    setTimeout(() => el.classList.add('out'), ms);
    setTimeout(() => el.remove(), ms + 500);
  }

  /** Result card for a scored crawl run. */
  runResult(title: string, name: string, detail: string): void {
    const el = document.createElement('div');
    el.className = 'discovery-card run-card paper';
    el.innerHTML = `<div><div class="discovery-label"></div><div class="discovery-name"></div><div class="run-detail"></div></div>`;
    (el.querySelector('.discovery-label') as HTMLElement).textContent = title;
    (el.querySelector('.discovery-name') as HTMLElement).textContent = name;
    (el.querySelector('.run-detail') as HTMLElement).textContent = detail;
    this.discovery.innerHTML = '';
    this.discovery.appendChild(el);
    setTimeout(() => el.classList.add('out'), 5000);
    setTimeout(() => el.remove(), 5700);
  }

  /** "Discovered: …" paper card that unfolds in the top right corner. */
  discovered(name: string, kind: PoiIcon): void {
    const el = document.createElement('div');
    el.className = 'discovery-card paper';
    el.innerHTML = `<div class="discovery-icon">${icons[kind]}</div><div><div class="discovery-label">Discovered</div><div class="discovery-name"></div></div>`;
    (el.querySelector('.discovery-name') as HTMLElement).textContent = name;
    this.discovery.innerHTML = '';
    this.discovery.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3900);
  }
}

export interface GateState {
  next: number;
  total: number;
  passed: number;
  missed: number;
  flags: number;
}

function alertElement(item: RailItem): HTMLElement {
  const el = document.createElement('div');
  el.className = `alert paper${item.critical ? ' critical' : ''}${item.minimised ? ' minimised' : ''}`;
  el.dataset.id = item.id;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', item.full);
  const mark = document.createElement('span');
  mark.className = 'mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = '!';
  const label = document.createElement('span');
  label.textContent = item.text;
  el.append(mark, label);
  return el;
}

function flagsText(flags: number): string {
  return `${flags} flag${flags === 1 ? '' : 's'}`;
}

/**
 * "Gate 14 / 52", with gates missed and flags touched this lap; "Lap done: 52 / 52 gates"
 * once the lap is done.
 */
export function gateText(g: GateState): string {
  const flags = g.flags ? ` · ${flagsText(g.flags)}` : '';
  if (g.next > g.total) return `Lap done: ${g.passed} / ${g.total} gates${flags}`;
  const missed = g.missed ? ` · ${g.missed} missed` : '';
  return `Gate ${Math.max(1, g.next)} / ${g.total}${missed}${flags}`;
}

/** The second line of the lap result card. */
export function gateLapDetail(missed: number, flags: number): string {
  if (!missed && !flags) return 'Every gate in order, no flags touched';
  return [missed ? `${missed} missed` : 'Every gate in order', flags ? `${flagsText(flags)} touched` : '']
    .filter(Boolean)
    .join(' · ');
}

/** m:ss.s for run times. */
export function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}
