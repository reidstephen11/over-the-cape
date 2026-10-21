import { BUILD_LABEL, GAME_VERSION } from '../core/buildInfo';
import type { LaunchChoice } from '../core/game';
import { damageLabels, damageModes, type DamageMode } from '../data/damage';
import { timeLabels, timesOfDay, weatherLabels, weathers, type TimeOfDay } from '../data/environment';
import { clockTime, episodeOrder, episodes, upcomingEpisodes, type EpisodeId } from '../data/episodes';
import { maps } from '../data/maps';
import { vehicleOrder, vehicles } from '../data/vehicles';
import { unlocked, type SaveData } from '../sim/save/save';
import { damageNotes } from './menus';

type Group = 'episode' | 'start' | 'vehicle' | 'damage' | 'time' | 'weather' | 'drive';

/** The full choice: the launch, plus the damage setting (it decides how an episode can end). */
export interface WelcomeChoice extends LaunchChoice {
  damage: DamageMode;
}

/**
 * Welcome screen (shown on launch): choose the episode, whether to carry on from its last
 * camp, the vehicle and the difficulty; a finished episode can be replayed in conditions
 * of your choosing. It starts on the last choices, so Enter (or A on a gamepad) goes
 * straight back to where you were. Arrow keys or the d-pad move between options.
 */
export class WelcomeScreen {
  readonly el: HTMLElement;
  private choice: WelcomeChoice;
  /** Replaying: the time and weather picked (story when `replay` is null). */
  private time: TimeOfDay | 'story';
  private weather: (typeof weathers)[number] = 'clear';
  private rows: HTMLButtonElement[][] = [];
  private row = 0;
  private col = 0;
  private padPrev: boolean[] = [];
  private raf = 0;
  private done = false;

  constructor(
    root: HTMLElement,
    initial: WelcomeChoice,
    private readonly save: SaveData | null,
    private readonly onDrive: (choice: WelcomeChoice, audio?: AudioContext) => void,
  ) {
    this.choice = { ...initial };
    this.time = initial.replay?.time ?? 'story';
    this.weather = initial.replay?.weather ?? 'clear';
    this.el = document.createElement('div');
    this.el.className = 'welcome';
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (b && !b.disabled) this.activate(b);
    });
    window.addEventListener('keydown', this.onKey);
    this.render('drive');
    // Without preventScroll a phone opens scrolled down to Drive, hiding the title.
    this.rows[this.row][this.col]?.focus({ preventScroll: true });
    this.raf = requestAnimationFrame(this.pollPad);
  }

  private get progress() {
    return this.save?.episodes[this.choice.episode];
  }

  /** Build the card for the current choices, keeping the focus on `focusGroup`. */
  private render(focusGroup?: Group): void {
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
        const status = p?.completed ? ' · finished' : p?.checkpoint ? ' · under way' : '';
        const open = unlocked(this.save, id);
        return option(
          'episode',
          id,
          `${e.number}. ${e.title}`,
          open ? `${e.route}${status}` : `${e.route} · finish episode ${e.number - 1} first`,
          !open,
        );
      }),
    ].join('');
    const upcoming = upcomingEpisodes
      .map((u) => `<li><b>${u.number}. ${u.title}</b> — ${u.route}</li>`)
      .join('');
    const story = `${weatherLabels[def.weather]}, from ${clockTime(def.startHour)}${def.deadline ? ` · ${def.deadline.label.toLowerCase()}` : ''}`;
    this.el.innerHTML = `
      <div class="welcome-card paper">
        <h1>Over the Cape</h1>
        <p class="subtitle">A 4WD adventure up Cape York, in episodes</p>
        <div class="welcome-grid">
          <section class="welcome-section welcome-episodes">
            <h2>Episode</h2>
            <div class="welcome-options">${episodeButtons}</div>
            <p class="welcome-note">Coming in later updates, north up the Cape:</p>
            <ul class="welcome-upcoming">${upcoming}</ul>
          </section>
          <section class="welcome-section">
            <h2>Start</h2>
            <div class="welcome-options seg">${
              camp ? option('start', 'resume', 'Continue', `From ${camp.name}`) : ''
            }${option('start', 'new', camp ? 'Start again' : 'Start', `From ${maps[def.mapId].def.pois.find((p) => p.id === maps[def.mapId].def.spawnCampsite)?.name ?? 'the start'}`)}</div>
            <h2>Vehicle</h2>
            <div class="welcome-options seg">${vehicleOrder.map((id) => option('vehicle', id, vehicles[id].tuning.name)).join('')}</div>
            <p class="welcome-note">${vehicles[this.choice.vehicle].blurb}</p>
            <h2>Difficulty</h2>
            <div class="welcome-options seg">${damageModes.map((m) => option('damage', m, damageLabels[m])).join('')}</div>
            <p class="welcome-note damage-note"></p>
            ${
              progress?.completed
                ? `<h2>Conditions</h2>
            <div class="welcome-options seg">${option('time', 'story', 'Story', story)}${timesOfDay.map((t) => option('time', t, timeLabels[t])).join('')}</div>
            ${this.time === 'story' ? '' : `<div class="welcome-options seg">${weathers.map((w) => option('weather', w, weatherLabels[w])).join('')}</div>`}
            <p class="welcome-note">${this.time === 'story' ? 'The story’s own time and weather, with its time limit.' : 'Your choice of light and weather: the clock stands still and there’s no time limit.'}</p>`
                : `<h2>Conditions</h2><p class="welcome-note">${story}. Finish the episode to replay it in other conditions.</p>`
            }
          </section>
        </div>
        <button type="button" class="welcome-drive" data-group="drive" data-welcome-drive>Drive</button>
        <p class="build-label" title="Build ${BUILD_LABEL}">Version ${GAME_VERSION}</p>
      </div>`;
    const groups: Group[] = ['episode', 'start', 'vehicle', 'damage', 'time', 'weather', 'drive'];
    this.rows = groups
      .map((g) => [...this.el.querySelectorAll<HTMLButtonElement>(`[data-group="${g}"]:not([disabled])`)])
      .filter((r) => r.length > 0);
    this.row = Math.max(
      0,
      this.rows.findIndex((r) => r[0].dataset.group === keep),
    );
    const on = this.rows[this.row].findIndex((b) => this.chosen(b));
    this.col = Math.max(0, on);
    this.refresh();
  }

  /** Is this option the one chosen in its group? */
  private chosen(b: HTMLButtonElement): boolean {
    const v = b.dataset.value;
    switch (b.dataset.group as Group) {
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

  private activate(b: HTMLButtonElement): void {
    if (this.done) return;
    const group = b.dataset.group as Group;
    const value = b.dataset.value ?? '';
    if (group === 'drive') return this.drive();
    if (group === 'episode') {
      this.choice.episode = value as EpisodeId;
      this.choice.resume = !!this.progress?.checkpoint;
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
    if (dRow) {
      this.row = Math.max(0, Math.min(this.rows.length - 1, this.row + dRow));
      // Land on the chosen option of the new row.
      const on = this.rows[this.row].findIndex((b) => this.chosen(b));
      this.col = Math.max(0, on);
    } else this.col = Math.max(0, Math.min(this.rows[this.row].length - 1, this.col + dCol));
    this.rows[this.row][this.col]?.focus();
    this.refresh();
  }

  private readonly onKey = (e: KeyboardEvent): void => {
    if (this.done) return;
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
      // Standard mapping: 12-15 d-pad up, down, left, right; 0 = A; 9 = Start.
      if (edge(12)) this.move(-1, 0);
      if (edge(13)) this.move(1, 0);
      if (edge(14)) this.move(0, -1);
      if (edge(15)) this.move(0, 1);
      if (edge(0)) this.activate(this.rows[this.row][this.col]);
      if (edge(9)) this.drive();
      this.padPrev = pressed;
    }
    this.raf = requestAnimationFrame(this.pollPad);
  };

  private drive(): void {
    if (this.done) return;
    this.done = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    // This click (or key or button press) lets the browser start sound now.
    let audio: AudioContext | undefined;
    try {
      const Ctor = window.AudioContext as typeof AudioContext | undefined;
      if (Ctor) {
        audio = new Ctor({ latencyHint: 'interactive' });
        void audio.resume().catch(() => undefined);
      }
    } catch {
      audio = undefined;
    }
    this.el.classList.add('hidden');
    setTimeout(() => this.el.remove(), 400);
    const replay =
      this.progress?.completed && this.time !== 'story' ? { time: this.time, weather: this.weather } : null;
    this.onDrive({ ...this.choice, replay }, audio);
  }
}
