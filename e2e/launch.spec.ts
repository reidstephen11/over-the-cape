import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, shot } from './helpers';
import { crebEpisode } from '../src/data/episodes/creb';
import { startCheckpoint } from '../src/sim/episode';

test('launch keeps the mission and Drive visible with optional setup on desktop and phones', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  const setup = page.locator('[data-group="setup"]');
  await expect(setup).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#welcome-setup')).toBeHidden();
  await expect(page.locator('.welcome-upcoming')).toBeHidden();
  await expect(page.locator('.welcome-mission')).toHaveText('Reach the Lions Den Hotel before dark');

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 667 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('[data-welcome-drive]')).toBeInViewport({ ratio: 1 });
    expect(await page.locator('.welcome').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await shot(page, 'launch', `welcome-${viewport.width}`);
  }

  await setup.click();
  await expect(page.locator('[data-group="vehicle"]')).toHaveCount(9);
  await page.locator('[data-group="vehicle"][data-value="perentie"]').click();
  // Re-rendering keeps focus, so keyboard users can make another choice immediately.
  await expect(page.locator('[data-group="vehicle"][data-value="perentie"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-group="vehicle"].on')).toHaveAttribute('data-value', 'hilux');
  await page.locator('[data-group="damage"][data-value="realistic"]').click();
  await setup.click();
  await expect(setup).toContainText('Hilux');
  await expect(setup).toContainText('Realistic');
  await expect(page.locator('#welcome-setup')).toBeHidden();
  expect(errors).toEqual([]);
});

test('finished episodes retain replay conditions inside setup and update the mission when selected', async ({
  page,
}) => {
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
  await expect(page.locator('[data-group="setup"]')).toContainText('Perentie');
  await page.locator('[data-group="setup"]').click();
  await expect(page.locator('[data-group="time"].on')).toHaveAttribute('data-value', 'dusk');
  await expect(page.locator('[data-group="weather"].on')).toHaveAttribute('data-value', 'rain');
  await page.locator('[data-group="episode"][data-value="coach"]').click();
  await expect(page.locator('.welcome-trip h2')).toHaveText('The Old Coach Road');
  await expect(page.locator('.welcome-route')).toContainText('Conglomerate');
  await expect(page.locator('[data-group="time"]')).toHaveCount(0);
  await page.locator('[data-group="episode"][data-value="creb"]').click();
  await expect(page.locator('[data-group="time"].on')).toHaveAttribute('data-value', 'dusk');
});

test('a saved camp offers Continue and an explicit Start again choice', async ({ page }) => {
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
  const drive = page.locator('[data-welcome-drive]');
  await expect(drive).toHaveText('Continue');
  await expect(page.locator('[data-group="start"].on')).toContainText('Roaring Meg');
  await expect(page.locator('#welcome-setup')).toBeHidden();
  await page.locator('[data-group="start"][data-value="new"]').click();
  await expect(drive).toHaveText('Drive');
  await page.locator('[data-group="start"][data-value="resume"]').click();
  await expect(drive).toHaveText('Continue');
});
