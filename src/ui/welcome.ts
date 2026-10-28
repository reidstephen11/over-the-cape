import { controllers, controllerTypes, type ControllerType } from '../data/controllers';
import { TitleAmbience } from '../audio/titleAmbience';
import { BUILD_LABEL, GAME_VERSION } from '../core/buildInfo';
import type { LaunchChoice } from '../core/game';
import { damageLabels, damageModes, type DamageMode } from '../data/damage';
import { isDevMode } from '../data/devWeather';
import { timeLabels, timesOfDay, weatherLabels, weathers, type TimeOfDay } from '../data/environment';
import { clockTime, episodeOrder, episodes, type EpisodeId } from '../data/episodes';
import { maps } from '../data/maps';
import { touchDriveLabels, touchDriveSchemes, type TouchDriveScheme } from '../data/touch';
import { vehicleOrder, vehicles } from '../data/vehicles';
import {
  defaultSettings,
  loadSave,
  unlocked,
  writeSave,
  type SaveData,
  type Settings,
} from '../sim/save/save';
import { isTouchDevice } from './touchControls';
import { damageNotes } from './menus';

type Group =
  | 'menu'
  | 'back'
  | 'controller'
  | 'touchDrive'
  | 'quality'
  | 'volume'
  | 'units'
  | 'episode'
  | 'start'
  | 'setup'
  | 'vehicle'
  | 'damage'
  | 'time'
  | 'weather'
  | 'drive';

/** The full choice: the launch, plus the damage setting (it decides how an episode can end). */
export interface WelcomeChoice extends LaunchChoice {
  damage: DamageMode;
  /** Continue returns to the saved camp without another briefing confirmation. */
  quickStart?: boolean;
  inputDevice?: 'keyboard' | 'gamepad' | 'touch';
}

/**
 * Camp title, main menu and journey setup. The first gesture starts quiet ambience;
 * Continue loads the saved camp, while New Journey opens episode and vehicle choices.
 * Keyboard, touch and gamepad share the same selection and focus state.
 */
export class WelcomeScreen {
  readonly el: HTMLElement;
  private choice: WelcomeChoice;
  /** Replaying: the time and weather picked (story when `replay` is null). */
  private time: TimeOfDay | 'story';
  private weather: (typeof weathers)[number] = 'clear';
  private rows: (HTMLButtonElement | HTMLInputElement)[][] = [];
  private page: 'title' | 'menu' | 'journey' | 'settings' = 'title';
  private settings: Settings;
  private ambience: TitleAmbience | null = null;
  private inputMode: 'keyboard' | 'touch' | 'gamepad' = isTouchDevice() ? 'touch' : 'keyboard';
  private row = 0;
  private col = 0;
  private padPrev: boolean[] = [];
  private raf = 0;
  private done = false;
  private setupOpen = false;
  /** Test mode (`?dev`): every episode open, and conditions to pick for any of them. */
  private readonly dev = isDevMode();

  constructor(
    root: HTMLElement,
    private readonly initial: WelcomeChoice,
    private readonly save: SaveData | null,
    private readonly onDrive: (choice: WelcomeChoice, audio?: AudioContext) => void,
  ) {
    this.choice = { ...initial };
    this.settings = {
      ...defaultSettings,
      quality: isTouchDevice() ? 'low' : defaultSettings.quality,
      ...save?.settings,
    };
    this.time = initial.replay?.time ?? 'story';
    this.weather = initial.replay?.weather ?? 'clear';
    this.el = document.createElement('div');
    this.el.className = 'welcome';
    this.el.tabIndex = -1;
    root.appendChild(this.el);
    this.el.addEventListener('pointerdown', (e) =>
      this.setInputMode(e.pointerType === 'touch' ? 'touch' : 'keyboard'),
    );
    this.el.addEventListener('click', (e) => {
      if (this.page === 'title') return this.openMenu();
      const b = (e.target as HTMLElement).closest('button');
      if (b && !b.disabled) this.activate(b);
    });
    this.el.addEventListener('input', (e) => {
      const slider = e.target as HTMLInputElement;
      if (slider.dataset.group !== 'volume') return;
      this.settings.masterVolume = Number(slider.value);
      this.persistSettings();
      this.el.querySelector('output')!.textContent = `${Math.round(this.settings.masterVolume * 100)}%`;
    });
    this.el.addEventListener('focusin', (e) => {
      const button = e.target as HTMLButtonElement | HTMLInputElement;
      const row = this.rows.findIndex((r) => r.includes(button));
      if (row < 0) return;
      this.row = row;
      this.col = this.rows[row].indexOf(button);
      this.refresh();
    });
    window.addEventListener('keydown', this.onKey);
    this.render();
    this.raf = requestAnimationFrame(this.pollPad);
  }

  private get progress() {
    return this.save?.episodes[this.choice.episode];
  }

  private readonly logo = `<div class="title-logo" role="img" aria-label="Over the Cape"><svg class="title-compass" viewBox="0 0 80 80" aria-hidden="true"><path d="M40 0 46 33 80 40 47 46 40 80 33 47 0 40 33 33Z" fill="currentColor"/><path d="M40 0V40H80L47 46 40 80V40H0L33 33Z" fill="#f7dec0"/></svg><h1><span>Over</span><span>The Cape</span></h1><div class="title-rule" aria-hidden="true">◆</div></div>`;

  private get gamepadMenuHint(): string {
    const p = controllers[this.settings.controller];
    const confirm = this.settings.controller === 'generic' ? '1' : p.confirm;
    const back = this.settings.controller === 'generic' ? '2' : p.back;
    return `<b role="img" aria-label="${p.confirmName}" title="${p.confirmName}">${confirm}</b> Select <b role="img" aria-label="${p.backName}" title="${p.backName}">${back}</b> Back`;
  }

  private get inputHint(): string {
    return this.inputMode === 'gamepad'
      ? this.gamepadMenuHint
      : this.inputMode === 'touch'
        ? 'Tap to select'
        : '<b>Enter</b> Select <b>Esc</b> Back';
  }

  private setInputMode(device: 'keyboard' | 'gamepad' | 'touch'): void {
    if (this.inputMode === device) return;
    this.inputMode = device;
    this.el.dataset.input = device;
    const hint = this.el.querySelector('.title-input-hint');
    if (hint) hint.innerHTML = this.inputHint;
  }

  private openMenu(): void {
    if (!this.ambience) {
      try {
        this.ambience = new TitleAmbience(this.settings);
      } catch {
        /* Silent play is supported. */
      }
    }
    this.page = 'menu';
    this.render();
  }

  private persistSettings(): void {
    const saved = loadSave() ?? {
      version: 1 as const,
      settings: this.settings,
      episode: this.initial.episode,
      vehicle: this.initial.vehicle,
      episodes: {},
      replay: null,
    };
    if (!this.dev) writeSave({ ...saved, settings: this.settings });
    this.ambience?.setSettings(this.settings);
  }

  private render(focusGroup?: Group): void {
    this.el.dataset.screen = this.page;
    this.el.dataset.input = this.inputMode;
    if (this.page === 'journey') return this.renderJourney(focusGroup ?? 'drive');
    const hasCamp = !!this.save?.episodes[this.initial.episode]?.checkpoint;
    const hint = this.inputHint;
    if (this.page === 'settings') {
      const setting = (group: Group, value: string, label: string, on: boolean) =>
        `<button type="button" class="welcome-option ${on ? 'on' : ''}" aria-pressed="${on}" data-group="${group}" data-value="${value}">${label}</button>`;
      this.el.innerHTML = `<div class="title-settings title-panel"><button class="title-back" data-group="back">‹ Back</button><p class="title-eyebrow">Over the Cape</p><h2>Settings</h2>
        <section class="title-setting"><h3>Graphics</h3><div class="welcome-options seg">${(['low', 'medium', 'high'] as const).map((q) => setting('quality', q, q[0].toUpperCase() + q.slice(1), this.settings.quality === q)).join('')}</div></section>
        <section class="title-setting phone-driving-setting"><h3>Phone driving</h3><div class="welcome-options seg">${touchDriveSchemes.map((c) => setting('touchDrive', c, touchDriveLabels[c], this.settings.touchDrive === c)).join('')}</div></section>
        <section class="title-setting"><label for="title-volume">Master volume <output for="title-volume">${Math.round(this.settings.masterVolume * 100)}%</output></label><input id="title-volume" type="range" min="0" max="1" step="0.1" value="${this.settings.masterVolume}" data-group="volume" /></section>
        <section class="title-setting"><h3>Controller type</h3><div class="welcome-options seg">${controllerTypes.map((c) => setting('controller', c, controllers[c].label, this.settings.controller === c)).join('')}</div></section>
        <section class="title-setting"><h3>Speed units</h3><div class="welcome-options seg">${setting('units', 'kmh', 'km/h', this.settings.units === 'kmh')}${setting('units', 'mph', 'mph', this.settings.units === 'mph')}</div></section>
        <p class="title-settings-version" title="Build ${BUILD_LABEL}">${GAME_VERSION}</p>
      </div><p class="title-input-hint">${hint}</p>`;
      this.setRows(['back', 'quality', 'touchDrive', 'volume', 'controller', 'units'], focusGroup ?? 'back');
      return;
    }
    this.el.innerHTML = `<div class="title-home">${this.logo}${
      this.page === 'title'
        ? `<button type="button" class="title-begin" data-title-begin>${this.inputMode === 'touch' ? 'Tap to begin' : 'Press any button'}</button>`
        : `<nav class="title-menu" aria-label="Main menu"><button type="button" data-group="menu" data-value="continue" data-title-continue ${hasCamp ? '' : 'disabled'}>Continue</button><button type="button" data-group="menu" data-value="journey" data-title-journey>New Journey</button><button type="button" data-group="menu" data-value="settings">Settings</button></nav>`
    }
      </div><p class="title-version" title="Build ${BUILD_LABEL}">${GAME_VERSION}</p>${this.page === 'menu' ? `<p class="title-input-hint">${hint}</p>` : ''}`;
    if (this.page === 'menu') this.setRows(['menu'], 'menu');
    else {
      this.rows = [];
      this.el.focus({ preventScroll: true });
    }
  }

  private setRows(groups: Group[], focusGroup: Group): void {
    this.rows = groups
      .map((g) =>
        [
          ...this.el.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
            `[data-group="${g}"]:not([disabled])`,
          ),
        ].filter((b) => !b.closest('[hidden]')),
      )
      .filter((r) => r.length > 0);
    this.row = Math.max(
      0,
      this.rows.findIndex((r) => r[0].dataset.group === focusGroup),
    );
    this.col = Math.max(0, this.rows[this.row]?.findIndex((b) => this.chosen(b)) ?? 0);
    this.refresh();
    this.rows[this.row]?.[this.col]?.focus({ preventScroll: true });
  }

  /** Episode and vehicle setup follows New Journey, away from the title menu. */
  private renderJourney(focusGroup?: Group): void {
    const keep = focusGroup ?? (this.rows[this.row]?.[0]?.dataset.group as Group | undefined);
    const option = (group: Group, value: string, label: string, note = '', disabled = false) =>
      `<button type="button" class="welcome-option" data-group="${group}" data-value="${value}"${disabled ? ' disabled' : ''}>${label}${note ? `<small>${note}</small>` : ''}</button>`;
    const def = episodes[this.choice.episode];
    const progress = this.progress;
    const camp = progress?.checkpoint
      ? maps[def.mapId].def.pois.find((p) => p.id === progress.checkpoint?.camp)
      : null;
    const episodeButtons = [
      ...episodeOrder.map((id) => {
        const e = episodes[id];
        const p = this.save?.episodes[id];
        const status = p?.completed ? 'Finished' : p?.checkpoint ? 'Under way' : '';
        const open = this.dev || unlocked(this.save, id);
        return option(
          'episode',
          id,
          `${e.number}. ${e.title}`,
          open ? status : `Finish episode ${e.number - 1} to unlock`,
          !open,
        );
      }),
    ].join('');
    const story = `${weatherLabels[def.weather]}${def.storm ? `, ${def.storm.forecast}` : ''}, from ${clockTime(def.startHour)}${def.deadline ? ` · ${def.deadline.label.toLowerCase()}` : ''}`;
    this.el.innerHTML = `
      <div class="welcome-card title-panel">
        <button type="button" class="title-back" data-group="back">‹ Back</button>
        <p class="title-eyebrow">Over the Cape</p>
        <h1>Your journey</h1>
        <div class="welcome-grid">
          <section class="welcome-section welcome-episodes">
            <h2>Choose an episode</h2>
            <div class="welcome-options">${episodeButtons}</div>
          </section>
          <section class="welcome-section welcome-trip">
            <p class="welcome-kicker">Episode ${def.number}</p>
            <h2>${def.title}</h2>
            <p class="welcome-route">${def.route}</p>
            <p class="welcome-mission">${def.mission}</p>
            <div class="welcome-options seg welcome-start" ${camp ? '' : 'hidden'}>${
              camp ? option('start', 'resume', 'Continue', `From ${camp.name}`) : ''
            }${option('start', 'new', camp ? 'Start again' : 'Start')}</div>
            <button type="button" class="welcome-drive" data-group="drive" data-welcome-drive>${camp && this.choice.resume ? 'Continue' : 'Drive'}</button>
          </section>
        </div>
        <button type="button" class="welcome-setup-toggle" data-group="setup" aria-expanded="${this.setupOpen}" aria-controls="welcome-setup"><span>Vehicle & difficulty</span><span>${vehicles[this.choice.vehicle].tuning.name} · ${damageLabels[this.choice.damage]} <b aria-hidden="true">${this.setupOpen ? '−' : '+'}</b></span></button>
        <section id="welcome-setup" class="welcome-section welcome-setup" ${this.setupOpen ? '' : 'hidden'}>
            <h2>Vehicle</h2>
            <div class="welcome-options seg">${vehicleOrder.map((id) => option('vehicle', id, vehicles[id].tuning.name)).join('')}</div>
            <p class="welcome-note">${vehicles[this.choice.vehicle].blurb}</p>
            <h2>Difficulty</h2>
            <div class="welcome-options seg">${damageModes.map((m) => option('damage', m, damageLabels[m])).join('')}</div>
            <details class="welcome-rules"><summary>About difficulty</summary><p class="welcome-note damage-note"></p></details>
            ${
              progress?.completed || this.dev
                ? `<h2>Conditions</h2>
            <div class="welcome-options seg">${option('time', 'story', 'Story', story)}${timesOfDay.map((t) => option('time', t, timeLabels[t])).join('')}</div>
            ${this.time === 'story' ? '' : `<div class="welcome-options seg">${weathers.map((w) => option('weather', w, weatherLabels[w])).join('')}</div>`}
            <p class="welcome-note">${this.time === 'story' ? '' : 'No time limit.'}</p>`
                : ''
            }
        </section>
        ${this.dev ? '<p class="welcome-note dev-note">Test mode: every episode is open, and nothing you do is saved.</p>' : ''}
        <p class="build-label" title="Build ${BUILD_LABEL}">Version ${GAME_VERSION}</p>
      </div>`;
    const groups: Group[] = [
      'back',
      'episode',
      'start',
      'setup',
      ...(this.setupOpen ? (['vehicle', 'damage', 'time', 'weather'] as const) : []),
      'drive',
    ];
    this.setRows(groups, keep ?? 'drive');
  }

  /** Is this option the one chosen in its group? */
  private chosen(b: HTMLButtonElement | HTMLInputElement): boolean {
    const v = b.dataset.value;
    switch (b.dataset.group as Group) {
      case 'controller':
        return v === this.settings.controller;
      case 'touchDrive':
        return v === this.settings.touchDrive;
      case 'quality':
        return v === this.settings.quality;
      case 'units':
        return v === this.settings.units;
      case 'episode':
        return v === this.choice.episode;
      case 'start':
        return v === (this.choice.resume ? 'resume' : 'new');
      case 'vehicle':
        return v === this.choice.vehicle;
      case 'damage':
        return v === this.choice.damage;
      case 'time':
        return v === this.time;
      case 'weather':
        return v === this.weather;
      default:
        return false;
    }
  }

  private activate(b: HTMLButtonElement | HTMLInputElement): void {
    if (this.done) return;
    const group = b.dataset.group as Group;
    const value = b.dataset.value ?? '';
    if (group === 'back') {
      this.page = 'menu';
      this.render();
      return;
    }
    if (group === 'menu') {
      if (value === 'continue') {
        this.choice = { ...this.initial, damage: this.settings.damage, resume: true };
        this.time = this.initial.replay?.time ?? 'story';
        this.weather = this.initial.replay?.weather ?? 'clear';
        return this.drive(true);
      }
      this.page = value === 'settings' ? 'settings' : 'journey';
      if (this.page === 'journey') this.choice.resume = false;
      this.render();
      return;
    }
    if (group === 'quality' || group === 'units' || group === 'controller' || group === 'touchDrive') {
      if (group === 'quality') this.settings.quality = value as Settings['quality'];
      else if (group === 'controller') this.settings.controller = value as ControllerType;
      else if (group === 'touchDrive') this.settings.touchDrive = value as TouchDriveScheme;
      else this.settings.units = value as Settings['units'];
      this.persistSettings();
      this.render(group);
      return;
    }
    if (group === 'drive') return this.drive();
    if (group === 'setup') {
      this.setupOpen = !this.setupOpen;
      this.render('setup');
      return;
    }
    if (group === 'episode') {
      this.choice.episode = value as EpisodeId;
      this.choice.resume = false;
    } else if (group === 'start') this.choice.resume = value === 'resume';
    else if (group === 'vehicle') this.choice.vehicle = value as WelcomeChoice['vehicle'];
    else if (group === 'damage') this.choice.damage = value as DamageMode;
    else if (group === 'time') this.time = value as TimeOfDay | 'story';
    else if (group === 'weather') this.weather = value as (typeof weathers)[number];
    this.render(group);
  }

  /** Mark the chosen option in each group, and the focused one. */
  private refresh(): void {
    for (const b of this.el.querySelectorAll<HTMLButtonElement>('.welcome-option')) {
      const on = this.chosen(b);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    this.rows.flat().forEach((b) => b.classList.remove('focused'));
    this.rows[this.row]?.[this.col]?.classList.add('focused');
    const note = this.el.querySelector('.damage-note') as HTMLElement | null;
    if (note) note.textContent = damageNotes[this.choice.damage];
  }

  private move(dRow: number, dCol: number): void {
    if (this.page === 'menu') {
      dCol = dRow || dCol;
      dRow = 0;
    }
    if (dRow) {
      this.row = Math.max(0, Math.min(this.rows.length - 1, this.row + dRow));
      // Land on the chosen option of the new row.
      const on = this.rows[this.row].findIndex((b) => this.chosen(b));
      this.col = Math.max(0, on);
    } else if (this.rows[this.row][this.col] instanceof HTMLInputElement) {
      const input = this.rows[this.row][this.col] as HTMLInputElement;
      input.value = String(Math.max(0, Math.min(1, Number(input.value) + dCol * 0.1)));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else this.col = Math.max(0, Math.min(this.rows[this.row].length - 1, this.col + dCol));
    this.rows[this.row][this.col]?.focus();
    this.refresh();
  }

  private readonly onKey = (e: KeyboardEvent): void => {
    if (this.done) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    this.setInputMode('keyboard');
    if (this.page === 'title') {
      if (e.repeat || ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      this.openMenu();
      return;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      this.page = this.page === 'menu' ? 'title' : 'menu';
      this.render();
      return;
    }
    if (e.target instanceof HTMLInputElement && ['ArrowLeft', 'ArrowRight'].includes(e.code)) return;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const m = moves[e.code];
    if (m) {
      e.preventDefault();
      this.move(m[0], m[1]);
    }
  };

  private readonly pollPad = (): void => {
    if (this.done) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = [...pads].find((p) => p && p.connected);
    if (pad) {
      const pressed = pad.buttons.map((b) => b.pressed);
      const edge = (i: number) => pressed[i] && !this.padPrev[i];
      if (pressed.some(Boolean)) this.setInputMode('gamepad');
      if (this.page === 'title') {
        if (pressed.some((p, i) => p && !this.padPrev[i])) this.openMenu();
        this.padPrev = pressed;
        this.raf = requestAnimationFrame(this.pollPad);
        return;
      }
      // Standard mapping: 12-15 d-pad up, down, left, right; 0 = Cross; 9 = Options.
      if (edge(12)) this.move(-1, 0);
      if (edge(13)) this.move(1, 0);
      if (edge(14)) this.move(0, -1);
      if (edge(15)) this.move(0, 1);
      if (edge(1)) {
        this.page = this.page === 'menu' ? 'title' : 'menu';
        this.render();
      } else if (edge(0) || edge(9)) {
        if (edge(9) && this.page === 'journey') this.drive();
        else this.activate(this.rows[this.row][this.col]);
      }
      this.padPrev = pressed;
    }
    this.raf = requestAnimationFrame(this.pollPad);
  };

  private drive(quickStart = false): void {
    if (this.done) return;
    this.done = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    this.settings.damage = this.choice.damage;
    this.persistSettings();
    const audio = this.ambience?.leave();
    this.el.classList.add('hidden');
    setTimeout(() => this.el.remove(), 400);
    const replay =
      (this.progress?.completed || this.dev) && this.time !== 'story'
        ? { time: this.time, weather: this.weather }
        : null;
    this.onDrive(
      { ...this.choice, replay, quickStart, settings: { ...this.settings }, inputDevice: this.inputMode },
      audio,
    );
  }
}
