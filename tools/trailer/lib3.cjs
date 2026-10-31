const { chromium } = require('playwright');
// Frame stepping: the game's requestAnimationFrame only runs when we call __step, so every
// frame advances the simulation by exactly the same amount however long it takes to draw.
const INIT = () => {
  const q = [];
  let manual = false;
  const real = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => { if (!manual) return real(cb); q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__manual = (on) => { manual = on; };
  window.__now = performance.now();
  window.__step = (dtMs, grab) => {
    window.__now += dtMs;
    for (const cb of q.splice(0)) cb(window.__now);
    if (!grab) return null;
    const c = [...document.querySelectorAll('canvas')].find((c) => c.clientWidth >= innerWidth * 0.9 && c.clientHeight >= innerHeight * 0.9);
    return c.toDataURL('image/jpeg', 0.92);
  };
};
async function launch({ quality = 'high', w = 1920, h = 1080, headless = true, args = [] } = {}) {
  const b = await chromium.launch({ headless, args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', ...args] });
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.addInitScript(INIT);
  await p.addInitScript((qq) => localStorage.setItem('overthecape.save.v1', JSON.stringify({ version: 1, settings: { quality: qq }, unlocked: ['perentie', 'hilux', 'unimog', 'troopy', 'patrol', 'lc79', 'sooty80', 'hj60'] })), quality);
  return { b, p };
}
async function start(p, url = 'http://localhost:4173/?dev&surprises=off') {
  await p.goto(url);
  await p.locator('.welcome').waitFor({ timeout: 120000 });
  const begin = p.locator('[data-title-begin]'); if (await begin.isVisible()) await begin.click();
  const j = p.locator('[data-title-journey]'); if (await j.isVisible()) await j.click();
  await p.locator('[data-welcome-drive]').click({ timeout: 120000 });
  await p.locator('[data-briefing-drive]:not(.hidden)').click({ timeout: 300000 });
  await p.waitForFunction(() => window.__game?.ready === true, null, { timeout: 300000 });
  await p.evaluate(() => { const g = window.__game; if (g.vehicle().engineOff) g.startEngine(); });
  await p.waitForFunction(() => { document.querySelector('.history-card.reading')?.click(); return window.__game.vehicle().engineRunning; }, null, { timeout: 300000, polling: 200 });
  await p.evaluate(() => window.__manual(true));
  const gpu = await p.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  console.log('GPU:', gpu);
}
module.exports = { launch, start };
