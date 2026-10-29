import { controlInstruction, type ControlInstruction, type InputDevice } from '../data/controlInstructions';
import { controllers, defaultController, type ControllerType } from '../data/controllers';
import { glyphsFor } from '../data/controls';

/** The CREB's four lessons, in the order the signs come on the road out of the village. */
const LESSONS: readonly ControlInstruction[] = ['range', 'precision', 'locks', 'winch'];

/** On-screen button names that a touch lesson tells you to tap. */
const TOUCH_KEYS = ['F LOCK', 'R LOCK', 'CRAWL', '4WD', 'LOW', 'USE', 'OUT', 'IN'];

const escapeHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A lesson's instruction with each key or button drawn as a key cap. */
export function instructionHtml(instruction: string, keys: readonly string[]): string {
  const tokens = [...new Set(keys.filter((k) => k.trim().length > 0))].sort((a, b) => b.length - a.length);
  if (tokens.length === 0) return escapeHtml(instruction);
  const alternatives = tokens.map((t) => t.replace(/[.*+?^$|()[\]{}\\]/g, '\\$&')).join('|');
  const pattern = new RegExp(`(?<![\\w])(${alternatives})(?![\\w])`, 'g');
  let out = '';
  let at = 0;
  for (const m of instruction.matchAll(pattern)) {
    out += `${escapeHtml(instruction.slice(at, m.index))}<kbd>${escapeHtml(m[0])}</kbd>`;
    at = (m.index ?? 0) + m[0].length;
  }
  return out + escapeHtml(instruction.slice(at));
}

interface HistoryNote {
  title: string;
  text: string;
  reading: boolean;
  instruction?: ControlInstruction;
}

/**
 * Episode cards: the history note shown on reaching a place, and the result card when the
 * mission is done or the episode ends early (centred, with buttons, the game paused behind
 * it). The note is a small card in the top right corner, under any discovery card, and you
 * keep driving while it's up; a click or tap closes it. A note can instead be read with the
 * game stopped (`reading`). A lesson card leads with what to press, drawn as keys, then says why.
 */
export class HistoryCard {
  readonly el: HTMLElement;
  /** Titles shown so far, oldest first. */
  readonly shown: string[] = [];
  private readonly backdrop: HTMLElement;
  private readonly queue: HistoryNote[] = [];
  private current: HistoryNote | null = null;
  private device: InputDevice = 'keyboard';
  private controller: ControllerType = defaultController;
  private timer = 0;

  /**
   * `root` takes the backdrop for a note read with the game stopped; `host` (the HUD's corner
   * stack) takes the card. `onRead` runs when the last note read with the game stopped is closed.
   */
  constructor(
    root: HTMLElement,
    host: HTMLElement,
    private readonly onRead: () => void,
  ) {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'history-backdrop hidden';
    this.backdrop.addEventListener('click', () => this.next());
    root.appendChild(this.backdrop);
    this.el = document.createElement('div');
    this.el.className = 'history-card paper hidden';
    this.el.innerHTML = `<small class="history-kind">History</small><strong></strong><p><span class="history-do"></span><span class="history-text"></span></p><span class="history-close" aria-hidden="true">×</span><span class="history-hint">Tap to carry on</span>`;
    this.el.addEventListener('click', () => this.next());
    host.appendChild(this.el);
  }

  get isShown(): boolean {
    return !this.el.classList.contains('hidden');
  }

  /** Is a note up that stops the game until it's closed? */
  get reading(): boolean {
    return this.isShown && this.el.classList.contains('reading');
  }

  /** Show a note (after any already waiting). `reading`: stop and read it, tap to close. */
  show(title: string, text: string, reading = false, instruction?: ControlInstruction): void {
    this.queue.push({ title, text, reading, instruction });
    if (!this.isShown) this.next();
  }

  /** Close the card, showing the next one waiting. */
  next(): void {
    clearTimeout(this.timer);
    const wasReading = this.reading;
    const n = this.queue.shift();
    this.current = n ?? null;
    this.el.classList.toggle('hidden', !n);
    this.el.classList.toggle('reading', !!n?.reading);
    this.backdrop.classList.toggle('hidden', !n?.reading);
    if (!n) {
      if (wasReading) this.onRead();
      return;
    }
    this.el.querySelector('strong')!.textContent = n.title;
    this.shown.push(n.title);
    const text = this.noteText(n);
    this.fill(n);
    this.updateHint();
    if (n.reading) return;
    // About 200 words a minute, and at least 12 s.
    const words = text.split(/\s+/).length;
    this.timer = window.setTimeout(() => this.next(), Math.max(12_000, (words / 200) * 60_000 + 4_000));
  }

  clear(): void {
    this.queue.length = 0;
    this.next();
  }

  /** Reformat an open tutorial without rediscovering it, resetting its timer or advancing the queue. */
  setInput(device: InputDevice, controller: ControllerType): void {
    if (this.device === device && this.controller === controller) return;
    this.device = device;
    this.controller = controller;
    if (this.current) this.fill(this.current);
    this.updateHint();
  }

  /** The note's words: a lesson's instruction first, with its keys drawn as keys. */
  private fill(note: HistoryNote): void {
    const lesson = note.instruction ? LESSONS.indexOf(note.instruction) : -1;
    this.el.classList.toggle('lesson', !!note.instruction);
    this.el.querySelector('.history-kind')!.textContent = note.instruction
      ? lesson >= 0
        ? `Lesson ${lesson + 1} of ${LESSONS.length}`
        : 'Lesson'
      : 'History';
    const doEl = this.el.querySelector('.history-do') as HTMLElement;
    if (note.instruction) {
      const instruction = controlInstruction(note.instruction, this.device, this.controller);
      const keys =
        this.device === 'touch'
          ? TOUCH_KEYS
          : Object.values(glyphsFor(this.device, this.controller)).filter((k): k is string => !!k);
      doEl.innerHTML = `${instructionHtml(instruction, keys)} `;
    } else doEl.textContent = '';
    this.el.querySelector('.history-text')!.textContent = note.text;
  }

  private noteText(note: HistoryNote): string {
    return note.instruction
      ? `${controlInstruction(note.instruction, this.device, this.controller)} ${note.text}`
      : note.text;
  }

  private updateHint(): void {
    this.el.querySelector('.history-hint')!.textContent =
      this.device === 'touch'
        ? 'Tap to carry on'
        : `${this.device === 'gamepad' ? controllers[this.controller].confirm : 'Enter'} to carry on`;
  }
}

export interface ResultButton {
  id: string;
  label: string;
  note?: string;
}

/** The end of an episode: mission complete, or why it ended and where you can restart. */
export class ResultCard {
  readonly el: HTMLElement;
  isOpen = false;
  private focusIndex = 0;
  private onPick: ((id: string) => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'result hidden';
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-result]');
      if (b) this.pick(b.dataset.result ?? '');
    });
  }

  open(
    kind: 'complete' | 'failed',
    heading: string,
    title: string,
    paragraphs: readonly string[],
    stats: readonly string[],
    buttons: readonly ResultButton[],
    onPick: (id: string) => void,
  ): void {
    this.onPick = onPick;
    this.isOpen = true;
    this.focusIndex = 0;
    const card = document.createElement('div');
    card.className = `result-card paper ${kind}`;
    card.innerHTML = `<small></small><h2></h2><div class="result-text"></div><ul class="result-stats"></ul><div class="result-buttons"></div>`;
    card.querySelector('small')!.textContent = heading;
    card.querySelector('h2')!.textContent = title;
    const text = card.querySelector('.result-text') as HTMLElement;
    for (const p of paragraphs) {
      const el = document.createElement('p');
      el.textContent = p;
      text.appendChild(el);
    }
    const list = card.querySelector('.result-stats') as HTMLElement;
    for (const s of stats) {
      const li = document.createElement('li');
      li.textContent = s;
      list.appendChild(li);
    }
    const row = card.querySelector('.result-buttons') as HTMLElement;
    for (const b of buttons) {
      const el = document.createElement('button');
      el.type = 'button';
      el.dataset.result = b.id;
      el.textContent = b.label;
      if (b.note) {
        const small = document.createElement('small');
        small.textContent = b.note;
        el.appendChild(small);
      }
      row.appendChild(el);
    }
    this.el.innerHTML = '';
    this.el.appendChild(card);
    this.el.classList.remove('hidden');
    this.focus();
  }

  close(): void {
    this.isOpen = false;
    this.el.classList.add('hidden');
  }

  private buttons(): HTMLButtonElement[] {
    return [...this.el.querySelectorAll<HTMLButtonElement>('button[data-result]')];
  }

  private focus(): void {
    const b = this.buttons();
    b.forEach((x, i) => x.classList.toggle('focused', i === this.focusIndex));
    b[this.focusIndex]?.focus({ preventScroll: true });
  }

  private pick(id: string): void {
    const cb = this.onPick;
    this.close();
    cb?.(id);
  }

  /** Keyboard and gamepad: move between the buttons and press one. */
  navigate(cmd: 'prev' | 'next' | 'confirm'): void {
    const b = this.buttons();
    if (b.length === 0) return;
    if (cmd === 'confirm') return this.pick(b[this.focusIndex].dataset.result ?? '');
    this.focusIndex = (this.focusIndex + (cmd === 'next' ? 1 : b.length - 1)) % b.length;
    this.focus();
  }
}
