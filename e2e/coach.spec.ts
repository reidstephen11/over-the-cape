import { expect, test, type Page } from '@playwright/test';
import { collectErrors, driveFromBriefing, lowGraphics, shot, waitReady, waitSim } from './helpers';

const episode = (page: Page) => page.evaluate(() => window.__game!.episode());

test('finishing Episode 1 opens Episode 2: the Old Coach Road from the Palmer River to Laura', async ({
  page,
}) => {
  test.setTimeout(1_500_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  // Episode 2 is listed, but shut until Episode 1 is finished.
  const coach = page.locator('[data-group="episode"][data-value="coach"]');
  await expect(coach).toBeDisabled();
  await expect(coach).toContainText('finish episode 1 first');
  await waitReady(page);
  await page.evaluate(() => window.__game!.teleportPoi('lions-den'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.result()), { timeout: 120_000 })
    .toEqual({ open: true, title: 'The CREB Track' });
  await expect(page.locator('.result-card')).toContainText('Next episode');
  await Promise.all([page.waitForEvent('load'), page.evaluate(() => window.__game!.pickResult('menu'))]);

  // Back at the welcome screen, on Episode 2.
  await expect(page.locator('.welcome-option.on[data-group="episode"]')).toHaveAttribute(
    'data-value',
    'coach',
  );
  await expect(coach).toBeEnabled();
  await shot(page, 'coach', 'welcome');
  await page.locator('[data-welcome-drive]').click();
  const briefing = page.locator('.briefing');
  await expect(briefing).toContainText('Episode 2 · The Old Coach Road');
  await expect(briefing).toContainText('Cobb & Co');
  await expect(briefing).toContainText('Through Maytown to Laura before dark');
  await driveFromBriefing(page);
  expect(await page.evaluate(() => window.__game!.episodeId())).toBe('coach');
  expect(await episode(page)).toMatchObject({ status: 'driving', camp: 'palmer-camp' });
  await expect(page.locator('.mission-clock')).toContainText('10:00 am');
  await expect(page.locator('.fuel-litres')).toHaveText('50 L');
  await expect.poll(() => page.evaluate(() => window.__game!.historyShown())).toContain('The Palmer River');
  await shot(page, 'coach', 'palmer-camp');

  // Into the river's sand, then the ruins of Maytown, which is a camp.
  await page.evaluate(() => window.__game!.setInput({ throttle: 0.6 }));
  await waitSim(page, 6);
  await page.evaluate(() => window.__game!.setInput(null));
  await page.evaluate(() => window.__game!.teleportPoi('maytown'));
  await expect.poll(async () => (await episode(page)).camp, { timeout: 120_000 }).toBe('maytown');
  await expect.poll(() => page.evaluate(() => window.__game!.historyShown())).toContain('Maytown');
  await page.evaluate(() => window.__game!.setCamera(-75, 66, 2918, -100, 59, 2896));
  await waitSim(page, 1);
  await shot(page, 'coach', 'maytown-ruins');
  await page.evaluate(() => window.__game!.useChaseCamera());

  // The foot of the range, looking up the three ways onto it.
  await page.evaluate(() => window.__game!.teleport(0, 1250, 0));
  await waitSim(page, 2);
  await shot(page, 'coach', 'range-face');
  // The descent off the range's north face.
  await page.evaluate(() => window.__game!.teleport(-6, -742, 175));
  await waitSim(page, 2);
  await shot(page, 'coach', 'range-descent');

  // Laura finishes the episode.
  await page.evaluate(() => window.__game!.teleportPoi('laura'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.result()), { timeout: 120_000 })
    .toEqual({ open: true, title: 'The Old Coach Road' });
  await expect(page.locator('.result-card')).toContainText('Quinkan');
  await shot(page, 'coach', 'laura');
  expect(errors).toEqual([]);
});
