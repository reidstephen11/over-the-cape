import { registerSW } from 'virtual:pwa-register';
import './ui/styles.css';
import './ui/title.css';
import './ui/hudStyles.css';
import { choiceFromSave } from './core/launch';

if (import.meta.env.PROD && location.pathname.startsWith('/over-the-cape')) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      void registration?.update();
    },
  });
}
import { episodes } from './data/episodes';
import { maps } from './data/maps';
import { vehicleLoadout } from './data/vehicles';
import { applyHudStyle, defaultHudStyle } from './data/hudStyles';
import { loadSave } from './sim/save/save';
import { LoadingScreen } from './ui/loading';
import { WelcomeScreen, type WelcomeChoice } from './ui/welcome';

async function play(choice: WelcomeChoice, audio?: AudioContext): Promise<void> {
  const appEl = document.getElementById('app') as HTMLElement;
  const uiEl = document.getElementById('ui') as HTMLElement;
  const loading = new LoadingScreen(
    uiEl,
    choice.inputDevice,
    choice.settings?.controller,
    choice.settings?.touchDrive,
  );
  const def = episodes[choice.episode];
  const map = maps[def.mapId].def;
  const save = loadSave();
  const checkpoint = choice.resume ? save?.episodes[def.id]?.checkpoint : null;
  loading.setSubtitle(map.name);
  loading.briefing(
    def,
    vehicleLoadout(def.loadout, choice.vehicle),
    choice.replay,
    checkpoint ? (map.pois.find((p) => p.id === checkpoint.camp)?.name ?? null) : null,
    choice.damage,
  );
  if (choice.quickStart) loading.el.classList.add('continuing');
  try {
    // The title appears without downloading or initialising the driving engine first.
    const { Game } = await import('./core/game');
    const game = await Game.create(appEl, uiEl, choice, (p, label) => loading.set(p, label), audio);
    loading.set(1, 'Ready');
    if (!choice.quickStart) await loading.waitForDrive();
    loading.hide();
    game.start();
  } catch (err) {
    console.error(err);
    const panel = document.createElement('div');
    panel.className = 'error-panel';
    panel.innerHTML = `<div class="paper"><h2>Something went wrong</h2><p></p></div>`;
    (panel.querySelector('p') as HTMLElement).textContent = String(err);
    uiEl.appendChild(panel);
  }
}

function boot(): void {
  const uiEl = document.getElementById('ui') as HTMLElement;
  const save = loadSave();
  applyHudStyle(save?.settings.hudStyle ?? defaultHudStyle);
  const choice: WelcomeChoice = { ...choiceFromSave(save), damage: save?.settings.damage ?? 'mild' };
  new WelcomeScreen(uiEl, choice, save, (c, audio) => void play(c, audio));
}

boot();
