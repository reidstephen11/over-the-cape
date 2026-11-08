import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, shot, waitReady, waitSim } from './helpers';

test('optional trips, journal, rewards and camp restarts', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/?surprises=off&track=reopened');
  await waitReady(page);
  await page.evaluate(() => window.__game!.setParkBrake(true));

  await page.keyboard.press('Escape');
  await page.locator('[data-act="journal"]').click();
  await expect(page.locator('.journal-trip')).toHaveCount(3);
  await expect(page.locator('.pause-journal')).toContainText('The lost logbook · 0/2');
  await shot(page, 'side-trips', 'journal-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-act="back"]')).toBeInViewport();
  await shot(page, 'side-trips', 'journal-phone');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');

  const stop = async (x: number, z: number, key: string) => {
    await page.evaluate(
      ({ x, z }) => {
        window.__game!.teleport(x, z, 0);
        window.__game!.setParkBrake(true);
      },
      { x, z },
    );
    await expect
      .poll(() => page.evaluate(() => window.__game!.sideTrips().done), { timeout: 120_000 })
      .toContain(key);
  };

  // Collect on the ridge and bank it at Roaring Meg before the long delivery.
  await stop(76, 936, 'lost-logbook/collect');
  await page.evaluate(() => window.__game!.teleportPoi('roaring-meg-camp'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.episode().camp), { timeout: 120_000 })
    .toBe('roaring-meg-camp');
  await stop(-100, -79, 'last-pole/sketch');
  await stop(-184, 4, 'last-pole/survey');
  await shot(page, 'side-trips', 'last-pole-clearing');
  const beforeSurvey = await page.evaluate(() => window.__game!.health().plugs);
  await stop(-100, -79, 'last-pole/return');
  expect(await page.evaluate(() => window.__game!.health().plugs)).toBe(beforeSurvey + 2);

  await page.evaluate(() => window.__game!.restartFromCamp());
  await expect
    .poll(() => page.evaluate(() => window.__game!.sideTrips().done), { timeout: 60_000 })
    .toEqual(['lost-logbook/collect']);
  const cans = await page.evaluate(() => window.__game!.health().jerryCans);
  await stop(81, -662, 'lost-logbook/deliver');
  expect(await page.evaluate(() => window.__game!.health().jerryCans)).toBe(cans + 1);
  // The delayed camp handover must be in the checkpoint too, so it cannot pay twice.
  await page.evaluate(() => window.__game!.restartFromCamp());
  await expect
    .poll(() => page.evaluate(() => window.__game!.sideTrips().completed), { timeout: 60_000 })
    .toContain('lost-logbook');
  await waitSim(page, 5);
  expect(await page.evaluate(() => window.__game!.health().jerryCans)).toBe(cans + 1);

  await stop(-98, -655, 'cape-scrapbook/wujal');
  await stop(-7, -283, 'cape-scrapbook/range');
  await stop(81, 488, 'cape-scrapbook/meg');
  expect(await page.evaluate(() => window.__game!.sideTrips().completed)).toContain('cape-scrapbook');
  await page.keyboard.press('Escape');
  await page.locator('[data-act="journal"]').click();
  await expect(page.locator('.journal-trip').last()).toContainText('Falls and high country · Complete');
  await expect(page.locator('.journal-trip').last()).toContainText('canopy');
  await shot(page, 'side-trips', 'scrapbook-complete');
  expect(errors).toEqual([]);
});
