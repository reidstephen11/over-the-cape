import { expect, test, type Page } from '@playwright/test';
import { openJourney, collectErrors, driveFromBriefing, shot, waitSim } from './helpers';

const episode = (page: Page) => page.evaluate(() => window.__game!.episode());

/** From the road's far side, looking across it at the stockman's bog. */
const lookAtStockman = (page: Page) =>
  page.evaluate(() => {
    const g = window.__game!;
    g.setCamera(-8, g.heightAt(-8, -1114) + 5, -1114, 20, g.heightAt(20, -1132) + 0.6, -1132);
  });

test('Episode 3, Lakefield: winch the stockman out, beat the river over Hann Crossing, on to Musgrave', async ({
  page,
}) => {
  test.setTimeout(1_500_000);
  const errors = collectErrors(page);
  // Episodes 1 and 2 finished, and Episode 3 picked on the welcome screen.
  await page.addInitScript(() => {
    if (!localStorage.getItem('overthecape.save.v1'))
      localStorage.setItem(
        'overthecape.save.v1',
        JSON.stringify({
          version: 1,
          settings: { quality: 'low', masterVolume: 0 },
          vehicle: 'shortie',
          episode: 'lakefield',
          episodes: { creb: { completed: true }, coach: { completed: true } },
        }),
      );
  });
  await page.goto('/');
  await openJourney(page);
  await expect(page.locator('.welcome-option.on[data-group="episode"]')).toHaveAttribute(
    'data-value',
    'lakefield',
  );
  await page.locator('[data-welcome-drive]').click({ timeout: 120_000 });
  const briefing = page.locator('.briefing');
  await expect(briefing).toContainText('Episode 3 · Lakefield');
  await expect(briefing).toContainText('From the diary, Friday 28 November 1986');
  await driveFromBriefing(page);
  expect(await episode(page)).toMatchObject({ status: 'driving', camp: 'laura', rescued: false });
  await expect(page.locator('.mission-clock')).toContainText('11:00 am');
  await expect(page.locator('.mission')).toContainText('winch him out of the bog');
  await expect(page.locator('.mission')).toContainText('Hann Crossing goes under about 3 pm');
  await shot(page, 'lakefield', 'laura');

  // Musgrave doesn't count with the stockman still bogged.
  await page.evaluate(() => window.__game!.teleportPoi('musgrave'));
  await waitSim(page, 2);
  expect(await episode(page)).toMatchObject({ status: 'driving' });
  await expect(page.locator('.toasts')).toContainText('Not without the stockman');

  // On the road beside him, facing him: hook on and winch him out.
  await page.evaluate(() => window.__game!.teleport(6.5, -1129, 75));
  await waitSim(page, 2);
  await lookAtStockman(page);
  await waitSim(page, 0.5);
  await shot(page, 'lakefield', 'stockman-bogged');
  await page.evaluate(() => window.__game!.useChaseCamera());
  await page.evaluate(() => window.__game!.tool('quick'));
  await page.evaluate(() => window.__game!.setInput({ winchIn: true }));
  await expect.poll(async () => (await episode(page)).rescued, { timeout: 300_000 }).toBe(true);
  await page.evaluate(() => window.__game!.setInput(null));
  await expect.poll(() => page.evaluate(() => window.__game!.historyShown())).toContain('The stockman');
  await expect(page.locator('.mission')).toContainText('Over Hann Crossing before the river covers the bar');
  await lookAtStockman(page);
  await waitSim(page, 0.5);
  await shot(page, 'lakefield', 'stockman-out');
  await page.evaluate(() => window.__game!.useChaseCamera());

  // Hann Crossing, then the camp on the north bank: the deadline no longer holds.
  await page.evaluate(() => window.__game!.teleport(6, -1880, 0));
  await waitSim(page, 2);
  await shot(page, 'lakefield', 'hann-crossing');
  await page.evaluate(() => window.__game!.teleportPoi('hann-camp'));
  await expect.poll(async () => (await episode(page)).camp, { timeout: 120_000 }).toBe('hann-camp');
  await expect(page.locator('.mission')).toContainText('On to Musgrave');
  await expect(page.locator('.mission')).not.toContainText('3 pm');

  // Musgrave finishes the episode.
  await page.evaluate(() => window.__game!.teleportPoi('musgrave'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.result()), { timeout: 120_000 })
    .toEqual({ open: true, title: 'Lakefield' });
  await expect(page.locator('.result-card')).toContainText('telegraph');
  await shot(page, 'lakefield', 'musgrave');
  expect(errors).toEqual([]);
});
