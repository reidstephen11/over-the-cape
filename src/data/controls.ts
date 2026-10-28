import { controllers, defaultController, type ControllerType } from './controllers';

/** Controls (SPEC §10). Key codes are KeyboardEvent.code; pad indices follow the W3C standard mapping. */
export type Action =
  | 'accelerate'
  | 'brake'
  | 'steerLeft'
  | 'steerRight'
  | 'handbrake'
  | 'range'
  | 'frontDiff'
  | 'rearDiff'
  | 'precision'
  | 'winch'
  | 'winchIn'
  | 'winchOut'
  | 'toolMenu'
  | 'interact'
  | 'jack'
  | 'horn'
  | 'lights'
  | 'map'
  | 'pause'
  | 'cameraReset'
  | 'cameraPreset'
  | 'gauges'
  | 'confirm'
  | 'back'
  | 'menuUp'
  | 'menuDown'
  | 'menuLeft'
  | 'menuRight';

export const keyBindings: Record<Action, readonly string[]> = {
  accelerate: ['KeyW', 'ArrowUp'],
  brake: ['KeyS', 'ArrowDown'],
  steerLeft: ['KeyA', 'ArrowLeft'],
  steerRight: ['KeyD', 'ArrowRight'],
  handbrake: ['Space'],
  range: ['KeyL'],
  frontDiff: ['KeyZ'],
  rearDiff: ['KeyX'],
  precision: ['KeyP'],
  winch: ['KeyE'],
  winchIn: ['KeyR'],
  winchOut: ['KeyF'],
  toolMenu: ['KeyQ'],
  interact: ['KeyE'],
  jack: ['KeyJ'],
  horn: ['KeyH'],
  lights: ['KeyN'],
  map: ['KeyM'],
  pause: ['Escape'],
  cameraReset: ['KeyV', 'Numpad5'],
  cameraPreset: ['KeyC'],
  gauges: ['KeyI'],
  confirm: ['Enter', 'KeyE'],
  back: ['Escape', 'Backspace'],
  menuUp: ['ArrowUp', 'KeyW'],
  menuDown: ['ArrowDown', 'KeyS'],
  menuLeft: ['ArrowLeft', 'KeyA'],
  menuRight: ['ArrowRight', 'KeyD'],
};

/** Standard gamepad buttons. */
export const Pad = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  View: 8,
  Start: 9,
  LS: 10,
  RS: 11,
  Up: 12,
  Down: 13,
  Left: 14,
  Right: 15,
} as const;

export const padBindings: Partial<Record<Action, readonly number[]>> = {
  handbrake: [Pad.X],
  range: [Pad.Y],
  winch: [Pad.RB],
  winchIn: [Pad.Up],
  winchOut: [Pad.Down],
  toolMenu: [Pad.LB],
  interact: [Pad.A],
  jack: [Pad.B],
  horn: [Pad.LS],
  map: [Pad.View],
  pause: [Pad.Start],
  cameraReset: [Pad.RS],
  confirm: [Pad.A],
  back: [Pad.B],
  menuUp: [Pad.Up],
  menuDown: [Pad.Down],
  menuLeft: [Pad.Left],
  menuRight: [Pad.Right],
};

export const padTuning = {
  stickDeadzone: 0.12,
  triggerDeadzone: 0.05,
  /** Camera zoom steps per second while holding D-pad left/right. */
  cameraZoomRate: 6,
  /** Camera orbit radians per second at full stick/key deflection. */
  cameraOrbitRate: 1.8,
};

function padGlyphs(controller: ControllerType): Partial<Record<Action, string>> {
  const p = controllers[controller];
  return {
    accelerate: p.accelerate,
    brake: p.brake,
    handbrake: p.handbrake,
    range: p.range,
    frontDiff: `${p.toolMenu} menu`,
    rearDiff: `${p.toolMenu} menu`,
    precision: `${p.toolMenu} menu`,
    winch: p.winch,
    winchIn: 'D-pad ↑',
    winchOut: 'D-pad ↓',
    toolMenu: p.toolMenu,
    interact: p.confirm,
    jack: p.back,
    horn: p.horn,
    lights: `${p.toolMenu} menu`,
    map: p.map,
    pause: p.pause,
    confirm: p.confirm,
    back: p.back,
    cameraReset: p.cameraReset,
  };
}

export const controllerGlyphs: Record<ControllerType, Partial<Record<Action, string>>> = {
  playstation: padGlyphs('playstation'),
  xbox: padGlyphs('xbox'),
  generic: padGlyphs('generic'),
};

/** Short glyphs shown in prompts for the active device. */
export const glyphs: Record<'keyboard' | 'gamepad' | 'touch', Partial<Record<Action, string>>> = {
  keyboard: {
    accelerate: 'W',
    brake: 'S',
    handbrake: 'Space',
    range: 'L',
    frontDiff: 'Z',
    rearDiff: 'X',
    precision: 'P',
    winch: 'E',
    winchIn: 'R',
    winchOut: 'F',
    toolMenu: 'Q',
    interact: 'E',
    jack: 'J',
    horn: 'H',
    lights: 'N',
    map: 'M',
    pause: 'Esc',
    confirm: 'E',
    back: 'Esc',
  },
  gamepad: controllerGlyphs[defaultController],
  /** Labels on the on-screen touch buttons. */
  touch: {
    accelerate: 'GAS',
    brake: 'BRAKE',
    handbrake: 'HAND',
    range: 'LOW',
    frontDiff: 'F LOCK',
    rearDiff: 'R LOCK',
    precision: 'CRAWL',
    winch: 'USE',
    winchIn: 'IN',
    winchOut: 'OUT',
    toolMenu: 'TOOLS',
    interact: 'USE',
    jack: 'UPRIGHT',
    lights: 'LIGHTS',
    map: 'MAP',
    pause: 'II',
    confirm: 'USE',
    back: 'BACK',
  },
};

/** The active input device and the saved controller label preference are independent. */
export function glyphsFor(
  device: 'keyboard' | 'gamepad' | 'touch',
  controller = defaultController,
): Partial<Record<Action, string>> {
  return device === 'gamepad' ? controllerGlyphs[controller] : glyphs[device];
}

/** Rows for the controls table (pause menu and README). */
export function controlsTable(
  controller: ControllerType = defaultController,
): ReadonlyArray<readonly [string, string, string]> {
  const p = controllers[controller];
  return [
    ['Accelerate', 'W / ↑', p.accelerate],
    ['Brake / reverse', 'S / ↓', p.brake],
    ['Steer', 'A D / ← →', 'Left stick'],
    ['Handbrake on / off', 'Space', p.handbrake],
    ['Toggle high/low range', 'L', p.range],
    [
      'Toggle front / rear diff lock',
      'Z / X (below 5 km/h to engage)',
      `Hold ${p.toolMenu} → front / rear diff`,
    ],
    ['Toggle precision crawl', 'P (6 km/h forward, 5 km/h reverse)', `Hold ${p.toolMenu} → precision crawl`],
    ['Winch quick attach / detach', 'E', p.winch],
    ['Winch in / out', 'R / F', 'D-pad up / down'],
    ['Tool menu', 'Hold Q', `Hold ${p.toolMenu}`],
    ['Interact (pick up planks)', 'E (when prompted)', p.confirm],
    ['Right vehicle', 'Hold J', `Hold ${p.back}`],
    ['Orbit camera', 'Mouse drag / Num 4 6 8 2', 'Right stick'],
    ['Camera distance', 'Scroll', 'D-pad left/right (driving)'],
    ['Recenter camera', 'V / Num 5', p.cameraReset],
    ['Cycle crawler and driver views', 'C / View button', `Hold ${p.toolMenu} + ${p.cameraReset}`],
    ['Crawl gauges: auto (low range) / on / off', 'I', 'Shown in low range'],
    ['Horn', 'H', p.horn],
    ['Headlights: off / low beam / high beam', 'N', `Hold ${p.toolMenu} → headlights`],
    ['Map', 'M', p.map],
    ['Pause', 'Esc', p.pause],
  ];
}

/** Action → touch control, for the Controls page on phones and tablets (README "Phones and tablets"). */
export const touchControlsTable: ReadonlyArray<readonly [string, string]> = [
  ['Steer', 'Joystick, bottom left (push part way for part lock)'],
  ['Accelerate / brake and reverse', 'GAS / BRAKE, bottom right (hold BRAKE when stopped to reverse)'],
  ['Handbrake on / off', 'HAND'],
  ['High / low range', '4WD, then LOW'],
  ['Precision crawl, diff locks', '4WD, then CRAWL, F LOCK, R LOCK (tap 4WD again to tuck them away)'],
  ['Winch attach / detach, pick up planks', 'USE'],
  ['Winch in / out', 'Hold IN / OUT (shown while the winch is attached)'],
  ['Right vehicle', 'Hold UPRIGHT (shown when needed)'],
  ['Tool menu', 'TOOLS, then tap an option (tap the space around it to close)'],
  ['Placing planks / choosing anchor', 'Joystick, then USE to confirm or BACK to cancel'],
  ['Orbit camera', 'Drag a finger on the view'],
  ['Camera distance', 'Pinch with two fingers on the view'],
  ['Cycle views / recenter camera', 'View and ⟲ (Reset view), top right'],
  ['Map / pause', 'MAP and II, top left (tap outside the map to close it)'],
  ['Full screen', '⛶, top left, where the browser allows it'],
  ['Headlights', 'LIGHTS, top left: off, low beam, high beam'],
];
