/**
 * Episode cards: the history note shown on reaching a place (top right, while you keep
 * driving), and the result card when the mission is done or the episode ends early
 * (centred, with buttons, the game paused behind it).
 */
export class HistoryCard {
  readonly el: HTMLElement;
  /** Titles shown so far, oldest first. */
  readonly shown: string[] = [];
  private readonly queue: { title: string; text: string }[] = [];
  private timer = 0;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'history-card paper hidden';
    this.el.innerHTML = `<small>History</small><strong></strong><p></p><span class="history-close" aria-hidden="true">×</span>`;
    this.el.addEventListener('click', () => this.next());
    root.appendChild(this.el);
  }

  get isShown(): boolean {
    return !this.el.classList.contains('hidden');
  }

  show(title: string, text: string): void {
    this.queue.push({ title, text });
    if (!this.isShown) this.next();
  }

  /** Close the card, showing the next one waiting. */
  next(): void {
    clearTimeout(this.timer);
    const n = this.queue.shift();
    this.el.classList.toggle('hidden', !n);
    if (!n) return;
    this.el.querySelector('strong')!.textContent = n.title;
    this.shown.push(n.title);
    this.el.querySelector('p')!.textContent = n.text;
    // About 200 words a minute, and at least 12 s.
    const words = n.text.split(/\s+/).length;
    this.timer = window.setTimeout(() => this.next(), Math.max(12_000, (words / 200) * 60_000 + 4_000));
  }

  clear(): void {
    this.queue.length = 0;
    this.next();
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
