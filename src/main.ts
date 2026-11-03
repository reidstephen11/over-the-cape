import { registerSW } from 'virtual:pwa-register';
import './ui/styles.css';
import './ui/title.css';
import './ui/hudStyles.css';
import { briefingLoad, choiceFromSave } from './core/launch';
import { pendingUpdate } from './core/update';

/** Set once a drive is loading: from then on a new build waits for the pause menu. */
let playing = false;

if (import.meta.env.PROD && location.pathname.startsWith('/over-the-cape')) {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      void registration?.update();
    },
    // A new build has been downloaded and waits. On the title screen it takes over at once;
    // during a drive it waits for "Restart for the new version" in the pause menu (v1.23).
    onNeedRefresh() {
      if (playing) pendingUpdate.arrive(() => void updateSW(true));
      else void updateSW(true);
    },
  });
}
import { episodes } from './data/episodes';
import { maps } from './data/maps';
import { applyHudStyle, defaultHudStyle } from './data/hudStyles';
import { loadSave } from './sim/save/save';
import { LoadingScreen } from './ui/loading';
import { WelcomeScreen, type WelcomeChoice } from './ui/welcome';

async function play(choice: WelcomeChoice, audio?: AudioContext): Promise<void> {
  playing = true;
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
    briefingLoad(checkpoint, choice.load, def.id, choice.vehicle),
    choice.replay,
    checkpoint ? (map.pois.find((p) => p.id === checkpoint.camp)?.name ?? null) : null,
    choice.damage,
  );
  if (choice.quickStart) loading.el.classList.add('continuing');
  try {
    // The title appears without downloading or initialising the driving engine first.
    const { Game } = await import('./core/game');
    const game = await Game.create(appEl, uiEl, choice, (p, label) => loading.set(p, label), audio);
    // The track's state for today is rolled from the run's seed, which the world build settles.
    if (!choice.replay) loading.trackCondition(game.condition);
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
