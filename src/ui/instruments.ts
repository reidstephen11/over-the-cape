import { damageTuning } from '../data/damage';
import type { HudStyle } from '../data/hudStyles';
import type { SpeedUnits } from './crawlGauges';
import type { PoiIcon } from './icons';

/** A lamp lights only while something is on or wrong, and always says what in a word. */
export type LampTone = 'amber' | 'green' | 'blue' | 'red';

export interface Lamp {
  id: string;
  text: string;
  tone: LampTone;
  /** Flashes (the engine flooding). */
  blink?: boolean;
  /** The longer sentence for a mouse hover and the screen reader. */
  title?: string;
}

/** Something on the compass card: a discovered place and its bearing (degrees, 0 = north). */
export interface CompassMark {
  id: string;
  kind: PoiIcon;
  bearing: number;
}

/** What the instruments show this frame (see Hud.update). */
export interface InstrumentState {
  speedKmh: number;
  units: SpeedUnits;
  /** 'R', '1', '2' or '3'. */
  gear: string;
  range: 'high' | 'low';
  /** Engine heat (about 0.5 running normally, 1 hot) and fuel; null outside an episode. */
  heat: number | null;
  fuel: number | null;
  tank: number;
  /** The clock (14.5 = 2:30 pm), null while it stands still, and the hours that matter on it. */
  hour: number | null;
  darkHour: number | null;
  finishHour: number | null;
  /** Camera heading (degrees, 0 = north). */
  heading: number;
  pois: readonly CompassMark[];
  lamps: readonly Lamp[];
}

/** Text in a dial never drops below this on screen (CSS px). */
const MIN_TEXT_PX = 9.5;
/** Dial sizes the text is worked out for: the phone sizes are the smallest each layout uses. */
const DIAL_PX = { compact: { speedo: 68, dial: 46 }, full: { speedo: 132, dial: 84 } };

const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function pt(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + Math.sin(rad(deg)) * r, cy - Math.cos(rad(deg)) * r];
}

const f2 = (n: number) => n.toFixed(2);

function arc(cx: number, cy: number, r: number, a: number, b: number): string {
  const p = pt(cx, cy, r, a);
  const q = pt(cx, cy, r, b);
  return `M${f2(p[0])},${f2(p[1])} A${r},${r} 0 ${b - a > 180 ? 1 : 0},1 ${f2(q[0])},${f2(q[1])}`;
}

/** A dial's needle angle: a 240° sweep from -120° (empty, cold) to +120° (full, hot). */
export const sweep = (share: number): number => -120 + clamp01(share) * 240;

/** Font size in dial units (viewBox 100) so the text is at least MIN_TEXT_PX on a dial `px` wide. */
const fz = (units: number, px: number, min = MIN_TEXT_PX) => Math.max(units, (min * 100) / px).toFixed(1);

function line(a: [number, number], b: [number, number], width: number): string {
  return `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke-width="${width}"/>`;
}

function text(x: number, y: number, cls: string, size: string, body: string): string {
  return `<text x="${f2(x)}" y="${f2(y)}" text-anchor="middle" class="${cls}" style="font-size:${size}px">${body}</text>`;
}

/** Clock face angle for an hour of the day (a 12-hour face). */
export const clockAngle = (hour: number): number => ((((hour % 12) + 12) % 12) / 12) * 360;

/** "6:15" for 18.25. */
export function shortClock(hour: number): string {
  let h = Math.floor(hour);
  let m = Math.round((hour - h) * 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  return `${h % 12 === 0 ? 12 : h % 12}:${m < 10 ? '0' : ''}${m}`;
}

/** Temperature dial share: the red band starts where the engine warns. */
export const heatShare = (heat: number): number => clamp01(heat / 1.2);

interface Needle {
  el: SVGGElement;
  cx: number;
  cy: number;
  last: string;
}

function turn(n: Needle | null, deg: number): void {
  if (!n) return;
  const t = `rotate(${deg.toFixed(1)} ${n.cx} ${n.cy})`;
  if (t === n.last) return;
  n.last = t;
  n.el.setAttribute('transform', t);
}

/**
 * The instruments for the chosen HUD style. The dash style is a binnacle of real-looking
 * dials (speedo with the gear in a window, TEMP, FUEL and a clock with the dark hours
 * marked in red), a ball compass like the stick-on ones on 1980s dashboards, and a row of
 * lamps that light only when something is on. Built once per style and size; a frame only
 * turns the needles and swaps the lamps.
 */
export class Instruments {
  /** The dials. */
  readonly cluster: HTMLElement;
  readonly compass: HTMLElement;
  /** Lamps live in the HUD's stack of short lines, next to the place name and warnings. */
  readonly lamps: HTMLElement;
  private style: HudStyle | null = null;
  private compact = false;
  private units: SpeedUnits = 'kmh';
  private speed: Needle | null = null;
  private temp: Needle | null = null;
  private fuel: Needle | null = null;
  private hourHand: Needle | null = null;
  private minuteHand: Needle | null = null;
  private gearEl: SVGTextElement | null = null;
  private fuelValue: SVGTextElement | null = null;
  private clockNote: SVGTextElement | null = null;
  private darkArc: SVGPathElement | null = null;
  private band: SVGGElement | null = null;
  private marks: SVGGElement | null = null;
  private compassWidth = 0;
  private compassScale = 1;
  private lastLamps = '';
  private lastMarks = '';
  private lastDark = '';
  private lastGear = '';
  private lastFuelText = '';
  private lastHot = '';

  constructor(root: HTMLElement, lampRoot: HTMLElement) {
    this.cluster = document.createElement('div');
    this.cluster.className = 'inst-cluster';
    this.cluster.setAttribute('role', 'group');
    this.cluster.setAttribute('aria-label', 'Instruments');
    this.compass = document.createElement('div');
    this.compass.className = 'inst-compass';
    this.lamps = document.createElement('div');
    this.lamps.className = 'inst-lamps';
    this.lamps.setAttribute('aria-live', 'polite');
    root.append(this.cluster, this.compass);
    lampRoot.prepend(this.lamps);
  }

  /** Build the instruments for a style, compact on a phone. Does nothing when unchanged. */
  setStyle(style: HudStyle, compact: boolean, units: SpeedUnits): void {
    if (style === this.style && compact === this.compact && units === this.units) return;
    this.style = style;
    this.compact = compact;
    this.units = units;
    this.lastDark = '';
    this.lastGear = '';
    this.lastFuelText = '';
    this.lastHot = '';
    this.lastMarks = '';
    this.buildDash();
  }

  update(s: InstrumentState): void {
    const kmhMax = this.units === 'mph' ? 60 / 0.621371 : 100;
    turn(this.speed, sweep(s.speedKmh / kmhMax));
    const gear = this.compact ? s.gear : `${s.gear} · ${s.range === 'low' ? 'LOW' : 'HIGH'}`;
    if (this.gearEl && gear !== this.lastGear) {
      this.lastGear = gear;
      this.gearEl.textContent = gear;
    }
    this.cluster.classList.toggle('no-engine', s.heat === null);
    if (s.heat !== null) turn(this.temp, sweep(heatShare(s.heat)));
    if (s.fuel !== null) {
      const share = s.fuel / Math.max(1, s.tank);
      turn(this.fuel, sweep(share));
      const litres = `${Math.round(s.fuel)} L`;
      if (this.fuelValue && litres !== this.lastFuelText) {
        this.lastFuelText = litres;
        this.fuelValue.textContent = litres;
      }
    }
    const hot = `${s.heat !== null && s.heat >= damageTuning.engine.heatWarn}|${s.fuel !== null && s.fuel / Math.max(1, s.tank) < 0.15}`;
    if (hot !== this.lastHot) {
      this.lastHot = hot;
      const [h, f] = hot.split('|');
      this.cluster.querySelector('.inst-temp')?.classList.toggle('hot', h === 'true');
      this.cluster.querySelector('.inst-fuel')?.classList.toggle('hot', f === 'true');
    }
    this.drawClock(s);
    this.drawCompass(s);
    this.drawLamps(s.lamps);
  }

  private drawClock(s: InstrumentState): void {
    this.cluster.classList.toggle('no-clock', s.hour === null);
    if (s.hour === null) return;
    turn(this.hourHand, clockAngle(s.hour));
    turn(this.minuteHand, (((s.hour % 1) + 1) % 1) * 360);
    const late = s.darkHour !== null && s.hour >= s.darkHour;
    const key = `${s.darkHour}|${s.finishHour}|${late}`;
    if (key === this.lastDark) return;
    this.lastDark = key;
    const from = s.darkHour;
    const to = s.finishHour ?? (from !== null ? from + 1.75 : null);
    if (this.darkArc) {
      this.darkArc.setAttribute(
        'd',
        from !== null && to !== null
          ? arc(50, 50, 44, clockAngle(from), clockAngle(from) + ((to - from) / 12) * 360)
          : '',
      );
    }
    if (this.clockNote) {
      this.clockNote.textContent =
        from === null
          ? ''
          : late && s.finishHour !== null
            ? `BY ${shortClock(s.finishHour)}`
            : `DARK ${shortClock(from)}`;
    }
  }

  private drawCompass(s: InstrumentState): void {
    if (!this.band) return;
    const heading = ((s.heading % 360) + 360) % 360;
    const x = this.compassWidth / 2 - heading * this.compassScale;
    this.band.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
    if (!this.marks) return;
    const visible = s.pois
      .map((p) => ({ id: p.id, d: ((((p.bearing - heading + 180) % 360) + 360) % 360) - 180 }))
      .filter((p) => Math.abs(p.d) <= 50);
    const key = visible.map((p) => `${p.id}:${Math.round(p.d)}`).join(',');
    if (key === this.lastMarks) return;
    this.lastMarks = key;
    const top = this.compact ? 3 : 4;
    this.marks.innerHTML = visible
      .map((p) => {
        const mx = this.compassWidth / 2 + p.d * this.compassScale;
        return `<path d="M${f2(mx - 3.5)},${top} L${f2(mx + 3.5)},${top} L${f2(mx)},${top + 5} Z"/>`;
      })
      .join('');
  }

  private drawLamps(lamps: readonly Lamp[]): void {
    const key = lamps.map((l) => `${l.id}|${l.text}|${l.tone}|${l.blink ? 1 : 0}`).join('#');
    if (key === this.lastLamps) return;
    this.lastLamps = key;
    this.lamps.replaceChildren(
      ...lamps.map((l) => {
        const el = document.createElement('span');
        el.className = `lamp ${l.tone}${l.blink ? ' blink' : ''}`;
        el.dataset.lamp = l.id;
        el.textContent = l.text;
        if (l.title) el.title = l.title;
        return el;
      }),
    );
  }

  // --- The dash cluster ----------------------------------------------------------------

  private buildDash(): void {
    const size = this.compact ? DIAL_PX.compact : DIAL_PX.full;
    this.cluster.innerHTML = `
      <div class="inst-speedo">${this.speedoSvg(size.speedo)}</div>
      <div class="inst-dial inst-temp">${dialSvg('TEMP', 'C', 'H', [damageTuning.engine.heatWarn / 1.2, 1], size.dial, false)}</div>
      <div class="inst-dial inst-fuel">${dialSvg('FUEL', 'E', 'F', [0, 0.15], size.dial, !this.compact)}</div>
      <div class="inst-dial inst-clock">${clockSvg(size.dial, !this.compact)}</div>`;
    const needle = (sel: string, cx: number, cy: number): Needle | null => {
      const el = this.cluster.querySelector<SVGGElement>(sel);
      return el ? { el, cx, cy, last: '' } : null;
    };
    this.speed = needle('.inst-speedo .needle', 50, 50);
    this.temp = needle('.inst-temp .needle', 50, 52);
    this.fuel = needle('.inst-fuel .needle', 50, 52);
    this.hourHand = needle('.inst-clock .hand-hour', 50, 50);
    this.minuteHand = needle('.inst-clock .hand-minute', 50, 50);
    this.gearEl = this.cluster.querySelector('.inst-speedo .gear');
    this.fuelValue = this.cluster.querySelector('.inst-fuel .value');
    this.clockNote = this.cluster.querySelector('.inst-clock .value');
    this.darkArc = this.cluster.querySelector('.inst-clock .dark');
    this.compass.innerHTML = this.ballSvg();
    this.band = this.compass.querySelector('.band');
    this.marks = this.compass.querySelector('.marks');
  }

  /** Speedometer: 0–100 km/h (or 0–60 mph), the gear in a window under the hub. */
  private speedoSvg(px: number): string {
    const mph = this.units === 'mph';
    const max = mph ? 60 : 100;
    const minor = mph ? 5 : 10;
    const major = mph ? 10 : 20;
    const every = this.compact ? major * 2 : major;
    const numberSize = fz(8.5, px);
    let ticks = '';
    let numbers = '';
    for (let v = 0; v <= max; v += minor) {
      const d = sweep(v / max);
      const big = v % major === 0;
      ticks += line(pt(50, 50, big ? 36 : 39, d), pt(50, 50, 44, d), big ? 2.4 : 1.2);
      if (v % every === 0) {
        const n = pt(50, 50, this.compact ? 24 : 27, d);
        numbers += text(n[0], n[1] + Number(numberSize) * 0.36, 'num', numberSize, String(v));
      }
    }
    const gearSize = fz(9.5, px, 11);
    const w = this.compact ? 24 : 46;
    const y = this.compact ? 60 : 68;
    const h = this.compact ? 18 : 15;
    return `<svg viewBox="0 0 100 100" role="img" aria-label="Speedometer">
      <circle class="face" cx="50" cy="50" r="48"/>
      <g class="ticks">${ticks}</g>${numbers}
      <rect class="window" x="${50 - w / 2}" y="${y}" width="${w}" height="${h}" rx="2"/>
      <text class="gear" x="50" y="${f2(y + h / 2 + Number(gearSize) * 0.36)}" text-anchor="middle" style="font-size:${gearSize}px"></text>
      ${this.compact ? '' : text(50, 94, 'label', fz(8.5, px, 9), mph ? 'mph' : 'km/h')}
      <g class="needle"><line x1="50" y1="59" x2="50" y2="9" stroke-width="3" stroke-linecap="round"/></g>
      <circle class="hub" cx="50" cy="50" r="6"/>
    </svg>`;
  }

  /** A ball compass: the card seen through a curved window, the lubber line in the middle. */
  private ballSvg(): string {
    const w = this.compact ? 112 : 160;
    const h = this.compact ? 30 : 40;
    const k = w / 110;
    this.compassWidth = w;
    this.compassScale = k;
    let band = '';
    for (let b = -180; b <= 540; b += 5) {
      const nb = ((b % 360) + 360) % 360;
      const x = b * k;
      const big = nb % 30 === 0;
      band += `<line x1="${f2(x)}" y1="${h - 4}" x2="${f2(x)}" y2="${h - (big ? 11 : 7)}" stroke-width="${big ? 1.6 : 1}"/>`;
      const letter = ({ 0: 'N', 90: 'E', 180: 'S', 270: 'W' } as Record<number, string>)[nb];
      if (letter)
        band += `<text x="${f2(x)}" y="${h - 14}" text-anchor="middle" class="cmaj">${letter}</text>`;
      else if (big && !this.compact)
        band += `<text x="${f2(x)}" y="${h - 14}" text-anchor="middle" class="cmin">${nb / 10}</text>`;
    }
    const r = h / 2 - 1;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Compass">
      <defs>
        <radialGradient id="inst-ball" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#2b2a27"/><stop offset="1" stop-color="#090908"/></radialGradient>
        <linearGradient id="inst-fade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".9"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></linearGradient>
        <clipPath id="inst-window"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}"/></clipPath>
      </defs>
      <rect class="ball" x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="url(#inst-ball)"/>
      <g clip-path="url(#inst-window)"><g class="band">${band}</g><g class="marks"></g></g>
      <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="url(#inst-fade)"/>
      <rect class="rim" x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="none"/>
      <line class="lubber" x1="${w / 2}" y1="3" x2="${w / 2}" y2="${h - 3}"/>
    </svg>`;
  }
}

/** TEMP or FUEL: a small round gauge with a red band, its ends lettered. */
function dialSvg(
  label: string,
  from: string,
  to: string,
  danger: [number, number],
  px: number,
  withValue: boolean,
): string {
  let ticks = '';
  for (let i = 0; i <= 8; i++) {
    const d = sweep(i / 8);
    ticks += line(pt(50, 52, i % 2 ? 37 : 34, d), pt(50, 52, 42, d), i % 2 ? 1.6 : 2.6);
  }
  // The label sits under the hub, clear of the needle; small dials leave out the end letters.
  const compact = px < 60;
  const labelSize = fz(9, px);
  const endSize = fz(9, px);
  const e1 = pt(50, 52, 25, -135);
  const e2 = pt(50, 52, 25, 135);
  const valueSize = fz(11, px, 10.5);
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${label}">
    <circle class="face" cx="50" cy="52" r="47"/>
    <path class="danger" d="${arc(50, 52, 40, sweep(danger[0]), sweep(danger[1]))}"/>
    <g class="ticks">${ticks}</g>
    ${text(50, compact ? 82 : 75, 'label', labelSize, label)}
    ${compact ? '' : text(e1[0], e1[1] + Number(endSize) * 0.36, 'end', endSize, from)}
    ${compact ? '' : text(e2[0], e2[1] + Number(endSize) * 0.36, 'end', endSize, to)}
    ${withValue ? `<text class="value" x="50" y="89" text-anchor="middle" style="font-size:${valueSize}px"></text>` : ''}
    <g class="needle"><line x1="50" y1="60" x2="50" y2="14" stroke-width="3" stroke-linecap="round"/></g>
    <circle class="hub" cx="50" cy="52" r="5"/>
  </svg>`;
}

/** A dash clock: the dark hours marked in red on the rim. */
function clockSvg(px: number, withNote: boolean): string {
  let ticks = '';
  for (let i = 0; i < 12; i++)
    ticks += line(pt(50, 50, i % 3 ? 38 : 34, i * 30), pt(50, 50, 43, i * 30), i % 3 ? 1.4 : 2.6);
  return `<svg viewBox="0 0 100 100" role="img" aria-label="Clock">
    <circle class="face" cx="50" cy="50" r="47"/>
    <path class="dark" d=""/>
    <g class="ticks">${ticks}</g>
    ${withNote ? `<text class="value red" x="50" y="76" text-anchor="middle" style="font-size:${fz(8.5, px, 9)}px"></text>` : ''}
    <g class="hand hand-hour"><line x1="50" y1="50" x2="50" y2="28" stroke-width="4" stroke-linecap="round"/></g>
    <g class="hand hand-minute"><line x1="50" y1="50" x2="50" y2="16" stroke-width="2.4" stroke-linecap="round"/></g>
    <circle class="pin" cx="50" cy="50" r="3.5"/>
  </svg>`;
}
