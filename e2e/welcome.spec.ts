import { expect, test } from '@playwright/test';
import { openJourney, collectErrors, driveFromBriefing, lowGraphics, shot, waitEngine } from './helpers';

test('the welcome screen offers the episodes in order, then the briefing, and remembers the choices', async ({
  page,
}) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/?surprises=off');
  await openJourney(page);
  const drive = page.locator('[data-welcome-drive]');
  await expect(drive).toBeVisible();
  const on = (group: string) => page.locator(`.welcome-option.on[data-group="${group}"]`);
  // First time: Episode 1 from its start, in the short-wheelbase 4WD on mild damage.
  await expect(on('episode')).toHaveAttribute('data-value', 'creb');
  await expect(on('start')).toHaveAttribute('data-value', 'new');
  await expect(on('vehicle')).toHaveAttribute('data-value', 'shortie');
  await expect(on('damage')).toHaveAttribute('data-value', 'mild');
  // The CREB is the whole game: one episode and no "coming soon" list.
  await expect(page.locator('[data-group="episode"]')).toHaveCount(1);
  await expect(page.locator('.welcome-upcoming')).toHaveCount(0);
  // Conditions are the story's until the episode is finished.
  await expect(page.locator('[data-group="time"]')).toHaveCount(0);

  await page.locator('[data-group="setup"]').click();
  await page.getByRole('button', { name: /Land Rover 110 Perentie/ }).click();
  await page.locator('[data-group="damage"][data-value="realistic"]').click();
  await expect(page.locator('.damage-note')).toContainText('spare');
  await shot(page, 'welcome', 'welcome-screen');
  await drive.click();

  // The briefing tells the story and the mission while the map builds.
  const briefing = page.locator('.briefing');
  await expect(briefing).toContainText('Episode 1 · The CREB Track');
  await expect(briefing).toContainText('Cairns Regional Electricity Board');
  await expect(briefing).toContainText('Reach the Lions Den Hotel before dark');
  await expect(briefing).toContainText('50 L of fuel');
  await expect(briefing).toContainText('a wrecked engine');
  await page.locator('[data-briefing-drive]:not(.hidden)').waitFor({ timeout: 300_000 });
  await expect(page.locator('.briefing-text')).not.toBeVisible();
  const story = page.getByText('Story & trip details', { exact: true });
  await story.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.briefing-text')).toBeVisible();
  expect(await page.evaluate(() => window.__game?.ready)).not.toBe(true);
  await story.click();
  await shot(page, 'welcome', 'briefing');
  await driveFromBriefing(page);
  expect(await page.evaluate(() => window.__game!.episodeId())).toBe('creb');
  expect(await page.evaluate(() => window.__game!.vehicleId())).toBe('perentie');
  expect(await page.evaluate(() => window.__game!.conditions())).toMatchObject({ weather: 'wet' });
  // The mission and clock, and what's on board.
  await expect(page.locator('.mission')).toContainText('Reach the Lions Den Hotel before dark');
  await expect(page.locator('.mission-clock')).toContainText('12:30 pm');
  await expect(page.locator('.fuel-litres')).toHaveText('50 L');
  await expect(page.locator('.status-supplies')).toContainText('×3');
  // The Drive click started the sound.
  await expect.poll(async () => (await page.evaluate(() => window.__game!.audio())).state).toBe('running');
  await shot(page, 'welcome', 'episode-start');

  // Pause menu → Main menu: the run can be carried on from where it started.
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-episode')).toHaveText('Episode 1 · The CREB Track');
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: /^Main menu/ }).click()]);
  await page.locator('[data-title-begin]').click();
  await expect(page.locator('[data-title-continue]')).toBeEnabled();
  await page.locator('[data-title-continue]').click();
  // Continue starts the saved camp without a second Drive press or setup screen.
  await page.waitForFunction(() => window.__game?.ready, null, { timeout: 300_000 });
  await waitEngine(page);
  await expect(page.locator('[data-briefing-drive]')).toHaveCount(0);
  expect(await page.evaluate(() => window.__game!.vehicleId())).toBe('perentie');
  await page.keyboard.press('Escape');
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: /^Main menu/ }).click()]);
  await openJourney(page);
  await expect(drive).toBeVisible();
  await expect(on('start')).toHaveAttribute('data-value', 'resume');
  await expect(on('start')).toContainText('From Daintree Village');
  await expect(on('vehicle')).toHaveAttribute('data-value', 'perentie');
  await expect(on('damage')).toHaveAttribute('data-value', 'realistic');
  expect(errors).toEqual([]);
});
