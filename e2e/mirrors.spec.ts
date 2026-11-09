import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, waitReady } from './helpers';

test('cockpit mirrors capture only while enabled and keep the choice across reload', async ({ page }) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/?surprises=off');
  await waitReady(page);
  expect(await page.evaluate(() => window.__game!.mirrors())).toMatchObject({
    targets: 0,
    captures: 0,
    enabled: true,
  });
  await page.evaluate(() => window.__game!.cameraPreset('cockpit'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.mirrors().captures), { timeout: 120_000 })
    .toBeGreaterThan(1);
  expect(await page.evaluate(() => window.__game!.mirrors().targets)).toBe(2);
  await page.screenshot({ path: '/workspace/scratch/mirrors-game-cockpit.png' });
  await page.evaluate(() => window.__game!.setMirrors(false));
  const stopped = await page.evaluate(() => window.__game!.mirrors().captures);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__game!.mirrors().captures)).toBe(stopped);
  await page.evaluate(() => window.__game!.setMirrors(true));
  await expect
    .poll(() => page.evaluate(() => window.__game!.mirrors().captures), { timeout: 120_000 })
    .toBeGreaterThan(stopped);
  await page.evaluate(() => window.__game!.cameraPreset('follow'));
  await page.waitForTimeout(500);
  const chase = await page.evaluate(() => window.__game!.mirrors().captures);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__game!.mirrors().captures)).toBe(chase);
  await page.locator('[data-tap="pause"]').click();
  await page.locator('[data-act="settings"]').click();
  await page.locator('[data-mirrors="false"]').click();
  await expect(page.locator('[data-mirrors="false"]')).toHaveClass('on');
  await page.reload();
  await page.locator('[data-title-begin]').click();
  await page.locator('[data-group="menu"][data-value="settings"]').click();
  await expect(page.locator('[data-group="mirrors"][data-value="off"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(errors).toEqual([]);
});
