import { BUILD_LABEL, GAME_VERSION } from '../core/buildInfo';
import type { DamageMode } from '../data/damage';
import { timeLabels, weatherLabels, type Conditions } from '../data/environment';
import { clockTime, type EpisodeDef, type EpisodeLoadout } from '../data/episodes';
import { isTouchDevice } from './touchControls';

/** The ways an episode can end with each damage setting. */
const endings: Record<DamageMode, string> = {
  off: 'Running out of fuel or time ends the episode.',
  mild: 'Running out of fuel or time ends the episode.',
  realistic:
    'Running out of fuel or time, a flat tyre with no spare or plug that fits, or a wrecked engine ends the episode.',
};

/**
 * Loading screen (SPEC §9): the episode's briefing while the map builds, then a Drive
 * button; a progress bar and a short controls reminder.
 */
export class LoadingScreen {
  readonly el: HTMLElement;
  private readonly bar: HTMLElement;
  private readonly label: HTMLElement;
  private readonly subtitle: HTMLElement;
  private onDrive: (() => void) | null = null;
  private padPrev = false;
  private padMovePrev = false;
  private raf = 0;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'loading';
    this.el.innerHTML = `
      <div class="loading-card paper">
        <p class="loading-brand">Over the Cape</p>
        <p class="subtitle"></p>
        <div class="briefing hidden">
          <h2></h2><p class="briefing-route"></p>
          <p class="briefing-mission"></p><p class="briefing-conditions"></p><p class="briefing-resume" hidden></p>
        <div class="progress"><div class="progress-fill"></div></div>
        <p class="progress-label">Starting…</p>
        <button type="button" class="welcome-drive briefing-drive hidden" data-briefing-drive>Drive</button>
        <p class="launch-controls">${isTouchDevice() ? 'Stick to steer · GAS to drive · HAND to release brake' : 'WASD to drive · Space to release handbrake'}</p>
        <details class="launch-details"><summary>Story & trip details</summary><div class="briefing-text"></div><ul class="briefing-facts"></ul></details>
        <details class="launch-details"><summary>Controls</summary><ul class="controls-reminder">${
          isTouchDevice()
            ? `
          <li><b>Stick</b> steer · <b>GAS / BRAKE</b> drive, brake and reverse · <b>HAND</b> handbrake</li>
          <li><b>LOW</b> range · <b>USE</b> winch · <b>TOOLS</b> tools · drag the view to look around</li>`
            : `
          <li><b>W / S</b> drive and brake · <b>A / D</b> steer · <b>Space</b> handbrake</li>
          <li><b>L</b> high / low range · <b>E</b> winch · <b>Q</b> tools</li>
          <li><b>M</b> map · <b>Esc</b> pause</li>`
        }
        </ul></details></div>
        <p class="build-label" title="Build ${BUILD_LABEL}">Version ${GAME_VERSION}</p>
      </div>`;
    root.appendChild(this.el);
    this.bar = this.el.querySelector('.progress-fill') as HTMLElement;
    this.label = this.el.querySelector('.progress-label') as HTMLElement;
    this.subtitle = this.el.querySelector('.subtitle') as HTMLElement;
  }

  /** The name of the map being loaded. */
  setSubtitle(text: string): void {
    this.subtitle.textContent = text;
  }

  /** The episode's story, mission, conditions and load. */
  briefing(
    def: EpisodeDef,
    load: EpisodeLoadout,
    replay: Conditions | null,
    resumeFrom: string | null,
    damage: DamageMode,
  ): void {
    const el = this.el.querySelector('.briefing') as HTMLElement;
    el.classList.remove('hidden');
    this.el.classList.add('with-briefing');
    el.querySelector('h2')!.textContent = `Episode ${def.number} · ${def.title}`;
    el.querySelector('.briefing-route')!.textContent = def.route;
    el.querySelector('.briefing-mission')!.textContent = def.mission;
    el.querySelector('.briefing-conditions')!.textContent = replay
      ? `${timeLabels[replay.time]} · ${weatherLabels[replay.weather]} · No time limit`
      : `${weatherLabels[def.weather]}${def.storm ? ` · ${def.storm.forecast}` : ''} · ${def.deadline?.label ?? 'No deadline'}`;
    const resume = el.querySelector('.briefing-resume') as HTMLElement;
    resume.hidden = !resumeFrom;
    resume.textContent = resumeFrom ? `Continuing from ${resumeFrom}` : '';
    const text = this.el.querySelector('.briefing-text') as HTMLElement;
    text.replaceChildren();
    for (const p of def.briefing) {
      const para = document.createElement('p');
      para.textContent = p;
      text.appendChild(para);
    }
    const l = load;
    const facts = [
      `Mission: ${def.mission}.`,
      replay
        ? `Conditions: ${timeLabels[replay.time].toLowerCase()}, ${weatherLabels[replay.weather].toLowerCase()} — no time limit.`
        : `Conditions: ${weatherLabels[def.weather].toLowerCase()}${def.storm ? `, ${def.storm.forecast}` : ''}, leaving at ${clockTime(def.startHour)}${def.deadline ? `; ${def.deadline.label.toLowerCase()}` : ''}.`,
      `On board: ${l.fuel} L of fuel, ${l.jerryCans} jerry can${l.jerryCans === 1 ? '' : 's'} (20 L), ${l.spares} spare wheel${l.spares === 1 ? '' : 's'}, ${l.plugs} tyre plugs.`,
      `${endings[damage]} Camps save your progress; you restart from the last one you reached.`,
      ...(resumeFrom ? [`Carrying on from ${resumeFrom}.`] : []),
    ];
    const list = this.el.querySelector('.briefing-facts') as HTMLElement;
    list.replaceChildren();
    for (const f of facts) {
      const li = document.createElement('li');
      li.textContent = f;
      list.appendChild(li);
    }
  }

  /** Loading done: show Drive, and resolve when it's pressed (click, Enter, Space, A or Start). */
  waitForDrive(): Promise<void> {
    const button = this.el.querySelector('[data-briefing-drive]') as HTMLButtonElement;
    button.classList.remove('hidden');
    (this.el.querySelector('.progress') as HTMLElement).classList.add('hidden');
    this.label.classList.add('hidden');
    // Loading may finish while someone is reading: preserve their disclosure focus.
    if (!this.el.contains(document.activeElement)) button.focus({ preventScroll: true });
    return new Promise((resolve) => {
      const go = () => {
        if (!this.onDrive) return;
        this.onDrive = null;
        cancelAnimationFrame(this.raf);
        window.removeEventListener('keydown', onKey);
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        // Enter/Space on an optional disclosure must open it, without starting the game.
        if ((e.target as HTMLElement).closest('summary')) return;
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
          e.preventDefault();
          go();
        }
      };
      this.onDrive = go;
      button.addEventListener('click', go);
      window.addEventListener('keydown', onKey);
      const poll = () => {
        const pad = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find((p) => p && p.connected);
        const pressed = !!pad && (pad.buttons[0]?.pressed || pad.buttons[9]?.pressed);
        const direction = !pad
          ? 0
          : pad.buttons[12]?.pressed || pad.buttons[14]?.pressed
            ? -1
            : pad.buttons[13]?.pressed || pad.buttons[15]?.pressed
              ? 1
              : 0;
        if (direction && !this.padMovePrev) {
          const targets = [...this.el.querySelectorAll<HTMLElement>('[data-briefing-drive], summary')];
          const current = targets.indexOf(document.activeElement as HTMLElement);
          targets[(current + direction + targets.length) % targets.length]?.focus();
        }
        this.padMovePrev = !!direction;
        if (pressed && !this.padPrev) {
          const focused = document.activeElement as HTMLElement;
          if (focused.matches('summary') && !pad?.buttons[9]?.pressed) focused.click();
          else go();
        }
        this.padPrev = pressed;
        if (this.onDrive) this.raf = requestAnimationFrame(poll);
      };
      // The press that started the load mustn't count: wait for it to be let go.
      this.padPrev = true;
      this.raf = requestAnimationFrame(poll);
    });
  }

  set(progress: number, label: string): void {
    this.bar.style.width = `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;
    this.label.textContent = label;
  }

  hide(): void {
    this.el.classList.add('hidden');
    setTimeout(() => this.el.remove(), 600);
  }
}
