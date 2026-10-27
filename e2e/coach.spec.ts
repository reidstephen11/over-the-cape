import { expect, test, type Page } from '@playwright/test';
import { collectErrors, driveFromBriefing, lowGraphics, shot, waitReady, waitSim } from './helpers';

const episode = (page: Page) => page.evaluate(() => window.__game!.episode());

test('Episode 2 unlocks, crosses the range, saves on the ridge and opens Lakefield', async ({ page }) => {
  test.setTimeout(1_500_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  const coach = page.locator('[data-group="episode"][data-value="coach"]');
  await expect(coach).toBeDisabled();
  await waitReady(page);
  await page.evaluate(() => window.__game!.teleportPoi('lions-den'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.result()), { timeout: 120_000 })
    .toEqual({ open: true, title: 'The CREB Track' });
  await Promise.all([page.waitForEvent('load'), page.evaluate(() => window.__game!.pickResult('menu'))]);

  await expect(page.locator('.welcome-option.on[data-group="episode"]')).toHaveAttribute(
    'data-value',
    'coach',
  );
  await expect(coach).toBeEnabled();
  await shot(page, 'coach', 'welcome');
  await page.locator('[data-welcome-drive]').click();
  const briefing = page.locator('.briefing');
  await expect(briefing).toContainText('Episode 2 · The Old Coach Road');
  await expect(briefing).toContainText('grandparent');
  await expect(briefing).toContainText('Cobb & Co');
  await expect(briefing).toContainText('There is no deadline');
  await driveFromBriefing(page);
  expect(await page.evaluate(() => window.__game!.episodeId())).toBe('coach');
  expect(await episode(page)).toMatchObject({ status: 'driving', camp: 'range-camp' });
  await expect(page.locator('.mission-clock')).toContainText('9:00 am');
  await expect(page.locator('.fuel-litres')).toHaveText('50 L');
  await expect
    .poll(() => page.evaluate(() => window.__game!.historyShown()))
    .toContain('The diary: below the range');
  await shot(page, 'coach', 'range-camp');

  await page.evaluate(() => window.__game!.setInput({ throttle: 0.6 }));
  await waitSim(page, 6);
  await page.evaluate(() => window.__game!.setInput(null));
  await page.evaluate(() => window.__game!.teleport(0, 500, 0));
  await waitSim(page, 2);
  await shot(page, 'coach', 'range-face');

  await page.evaluate(() => window.__game!.teleportPoi('hotel-site'));
  await expect.poll(async () => (await episode(page)).camp, { timeout: 120_000 }).toBe('hotel-site');
  await expect.poll(() => page.evaluate(() => window.__game!.historyShown())).toContain('Hotel site');
  await shot(page, 'coach', 'ridge-camp');
  await page.reload();
  await waitReady(page);
  expect(await episode(page)).toMatchObject({ status: 'driving', camp: 'hotel-site' });

  await page.evaluate(() => window.__game!.teleport(-20, 25, 0));
  await waitSim(page, 2);
  await shot(page, 'coach', 'big-step');
  await page.evaluate(() => window.__game!.teleport(-6, -302, 0));
  await waitSim(page, 2);
  await shot(page, 'coach', 'range-descent');

  await page.evaluate(() => window.__game!.teleportPoi('range-exit'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.result()), { timeout: 120_000 })
    .toEqual({ open: true, title: 'The Old Coach Road' });
  await expect(page.locator('.result-card')).toContainText('Laura');
  await expect(page.locator('.result-card')).toContainText('Lakefield');
  await shot(page, 'coach', 'range-exit');
  await Promise.all([page.waitForEvent('load'), page.evaluate(() => window.__game!.pickResult('menu'))]);
  await expect(page.locator('.welcome-option.on[data-group="episode"]')).toHaveAttribute(
    'data-value',
    'lakefield',
  );
  expect(errors).toEqual([]);
});

test('a save at a removed river camp starts safely at the new range camp', async ({ page }) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem(
      'overthecape.save.v1',
      JSON.stringify({
        version: 1,
        settings: { quality: 'low' },
        episode: 'coach',
        episodes: {
          creb: { completed: true },
          coach: { checkpoint: { camp: 'maytown', hour: 17, fuel: 4 } },
        },
      }),
    );
  });
  await page.goto('/');
  await waitReady(page);
  expect(await episode(page)).toMatchObject({ status: 'driving', camp: 'range-camp' });
  await expect(page.locator('.mission-clock')).toContainText('9:00 am');
  await expect(page.locator('.fuel-litres')).toHaveText('50 L');
  expect(errors).toEqual([]);
});
