import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, openJourney, shot } from './helpers';
import { crebEpisode } from '../src/data/episodes/creb';
import { startCheckpoint } from '../src/sim/episode';

test('the camp title opens to three main actions and fits desktop and phones', async ({ page }) => {
  const errors = collectErrors(page);
  const engineRequests: string[] = [];
  page.on('request', (r) => {
    if (/\/src\/core\/game\.ts|\/assets\/game-/.test(r.url())) engineRequests.push(r.url());
  });
  await lowGraphics(page);
  await page.goto('/');
  await expect(page.locator('[data-title-begin]')).toBeVisible();
  await expect(page.locator('[data-welcome-drive]')).toHaveCount(0);
  await expect(page.locator('#game-canvas')).toHaveCount(0);
  await shot(page, 'title', 'press-any-button');
  await page.keyboard.press('Enter');
  await expect(page.locator('.title-menu button')).toHaveCount(3);
  await expect(page.locator('[data-title-continue]')).toBeDisabled();
  await expect(page.locator('[data-title-journey]')).toBeFocused();
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 667 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const action of ['[data-title-continue]', '[data-title-journey]', '[data-value="settings"]'])
      await expect(page.locator(action)).toBeInViewport({ ratio: 1 });
    expect(await page.locator('.welcome').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await shot(page, 'title', `menu-${viewport.width}`);
  }
  expect(engineRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('New Journey opens episode setup and keeps vehicle, difficulty and replay choices', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      'overthecape.save.v1',
      JSON.stringify({
        version: 1,
        episode: 'creb',
        vehicle: 'perentie',
        settings: { quality: 'low', damage: 'realistic' },
        episodes: { creb: { completed: true } },
        replay: { time: 'dusk', weather: 'rain' },
      }),
    ),
  );
  await page.goto('/');
  await openJourney(page);
  await expect(page.locator('#welcome-setup')).toBeHidden();
  await page.locator('[data-group="setup"]').click();
  await expect(page.locator('[data-group="vehicle"]')).toHaveCount(9);
  await expect(page.locator('[data-group="time"].on')).toHaveAttribute('data-value', 'dusk');
  await expect(page.locator('[data-group="weather"].on')).toHaveAttribute('data-value', 'rain');
  await page.locator('[data-group="vehicle"][data-value="perentie"]').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-group="vehicle"].on')).toHaveAttribute('data-value', 'hilux');
  await expect(page.locator('[data-group="episode"]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.title-menu')).toBeVisible();
  expect(errors).toEqual([]);
});

test('title Settings persist sound and graphics without replacing a saved journey', async ({ page }) => {
  const checkpoint = startCheckpoint(crebEpisode, 'roaring-meg-camp', 'perentie');
  await page.addInitScript((checkpoint) => {
    if (!localStorage.getItem('overthecape.save.v1'))
      localStorage.setItem(
        'overthecape.save.v1',
        JSON.stringify({
          version: 1,
          episode: 'creb',
          vehicle: 'perentie',
          settings: { quality: 'low' },
          episodes: { creb: { checkpoint } },
        }),
      );
  }, checkpoint);
  await page.goto('/');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-title-continue]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('.title-settings')).toBeVisible();
  await page.locator('[data-group="quality"][data-value="high"]').click();
  await page.locator('#title-volume').fill('0.3');
  await page.locator('[data-group="units"][data-value="mph"]').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('overthecape.save.v1')!));
  expect(saved.settings).toMatchObject({ quality: 'high', masterVolume: 0.3, units: 'mph' });
  expect(saved.episodes.creb.checkpoint.camp).toBe('roaring-meg-camp');
  expect(saved.vehicle).toBe('perentie');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-title-continue]')).toBeEnabled();
  await page.reload();
  await page.keyboard.press('Enter');
  await page.locator('[data-value="settings"]').click();
  await expect(page.locator('#title-volume')).toHaveValue('0.3');
});

test('New Journey starts fresh without deleting the existing checkpoint while browsing', async ({ page }) => {
  const checkpoint = startCheckpoint(crebEpisode, 'roaring-meg-camp', 'perentie');
  await page.addInitScript(
    (checkpoint) =>
      localStorage.setItem(
        'overthecape.save.v1',
        JSON.stringify({
          version: 1,
          episode: 'creb',
          vehicle: 'perentie',
          settings: { quality: 'low' },
          episodes: { creb: { checkpoint } },
        }),
      ),
    checkpoint,
  );
  await page.goto('/');
  await page.keyboard.press('Enter');
  await page.locator('[data-title-journey]').click();
  await expect(page.locator('[data-group="start"].on')).toHaveAttribute('data-value', 'new');
  await expect(page.locator('[data-welcome-drive]')).toHaveText('Drive');
  await page.keyboard.press('Escape');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('overthecape.save.v1')!).episodes.creb.checkpoint.camp,
    ),
  ).toBe('roaring-meg-camp');
});

test('a held controller button opens only the menu, with directions to select and B to return', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0, touched: false }));
    Object.defineProperty(navigator, 'getGamepads', { value: () => [{ connected: true, buttons }] });
    (window as unknown as { titlePad: typeof buttons }).titlePad = buttons;
  });
  await page.goto('/');
  const setButton = (index: number, pressed: boolean) =>
    page.evaluate(
      ({ index, pressed }) => {
        (window as unknown as { titlePad: { pressed: boolean }[] }).titlePad[index].pressed = pressed;
      },
      { index, pressed },
    );
  await setButton(0, true);
  await expect(page.locator('.title-menu')).toBeVisible();
  await expect(page.locator('.welcome')).toHaveAttribute('data-input', 'gamepad');
  await expect(page.locator('.title-input-hint [aria-label="Cross"]')).toHaveText('✕');
  await expect(page.locator('.title-input-hint [aria-label="Circle"]')).toHaveText('○');
  await expect(page.locator('[data-welcome-drive]')).toHaveCount(0);
  await setButton(0, false);
  await page.waitForTimeout(60);
  await setButton(13, true);
  await expect(page.locator('[data-value="settings"]')).toBeFocused();
  await setButton(13, false);
  await page.waitForTimeout(60);
  await setButton(0, true);
  await expect(page.locator('.title-settings')).toBeVisible();
  await setButton(0, false);
  await page.waitForTimeout(60);
  await setButton(1, true);
  await expect(page.locator('.title-menu')).toBeVisible();
});

test('touch titles use tap prompts and respect reduced motion', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    viewport: { width: 390, height: 667 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-title-begin]')).toHaveText('Tap to begin');
  expect(
    await page.locator('.welcome').evaluate((el) => getComputedStyle(el, '::before').animationName),
  ).toBe('none');
  await page.locator('[data-title-begin]').tap();
  await expect(page.locator('.title-input-hint')).toHaveText('Tap to select');
  await expect(page.locator('[data-title-journey]')).toBeInViewport({ ratio: 1 });
  await context.close();
});

test('test mode keeps title settings and journey browsing out of the real save', async ({ page }) => {
  await lowGraphics(page);
  await page.goto('/?dev');
  const saved = await page.evaluate(() => localStorage.getItem('overthecape.save.v1'));
  await page.keyboard.press('Enter');
  await page.locator('[data-value="settings"]').click();
  await page.locator('[data-group="quality"][data-value="high"]').click();
  await page.locator('#title-volume').fill('0.2');
  await page.keyboard.press('Escape');
  await page.locator('[data-title-journey]').click();
  await expect(page.locator('[data-group="episode"][disabled]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('overthecape.save.v1'))).toBe(saved);
});
