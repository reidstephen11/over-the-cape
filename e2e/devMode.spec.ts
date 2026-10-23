import { expect, test } from '@playwright/test';
import { collectErrors, driveFromBriefing, lowGraphics, shot } from './helpers';

test('test mode opens every episode and sets the weather, the clock, the place and the vehicle', async ({
  page,
}) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/?dev&surprises=off');
  // Every episode is open, with conditions to pick, before any is finished.
  await expect(page.locator('[data-group="episode"][disabled]')).toHaveCount(0);
  await expect(page.locator('[data-group="time"]').first()).toBeVisible();
  await expect(page.locator('.welcome-card')).toContainText('Test mode');
  await page.locator('[data-welcome-drive]').click();
  await driveFromBriefing(page);

  const panel = page.locator('.dev-panel');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Heavy storm' }).click();
  const storm = await page.evaluate(() => window.__game!.conditions());
  expect(storm.rain).toBe(1);
  expect(storm.wetness).toBe(1);
  expect(storm.creekRise).toBeGreaterThan(0.3);
  await panel.getByRole('button', { name: 'Clear' }).click();
  const clear = await page.evaluate(() => window.__game!.conditions());
  expect(clear.rain).toBe(0);
  expect(clear.creekRise).toBe(0);

  // The clock slider sets the time; stopped, it stays put.
  await panel.locator('[data-in="hour"]').fill('18');
  await panel.getByRole('button', { name: 'Stop the clock' }).click();
  const stopped = (await page.evaluate(() => window.__game!.episode())).hour;
  expect(stopped).toBeCloseTo(18, 1);
  await page.waitForTimeout(1500);
  expect((await page.evaluate(() => window.__game!.episode())).hour).toBe(stopped);

  // Jump to another place and change vehicle on the spot.
  const before = await page.evaluate(() => window.__game!.vehicle());
  await panel.locator('.debug-teleports button').nth(3).click();
  const after = await page.evaluate(() => window.__game!.vehicle());
  expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(20);
  await panel.getByRole('button', { name: /Perentie/ }).click();
  await expect.poll(() => page.evaluate(() => window.__game!.vehicleId())).toBe('perentie');
  await shot(page, 'dev', 'test-panel');

  // Nothing is saved in test mode.
  const saved = await page.evaluate(() => localStorage.getItem('overthecape.save.v1'));
  expect(saved).not.toContain('"episode"');
  expect(errors).toEqual([]);
});
