import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, waitReady, waitSim } from './helpers';

test('Sooty 80 Series can be selected, driven and restored after reload', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/?surprises=off');
  const button = page.getByRole('button', { name: /80 Series — Sooty MkII/ });
  await button.click();
  await expect(page.locator('.welcome-option.on[data-group="vehicle"]')).toHaveAttribute(
    'data-value',
    'sooty80',
  );
  await expect(page.locator('.welcome-card')).toContainText('turbo diesel');
  await page.setViewportSize({ width: 390, height: 844 });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport({ ratio: 0.9 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1280, height: 720 });
  await waitReady(page);
  expect(await page.evaluate(() => window.__game!.vehicleId())).toBe('sooty80');
  await page.evaluate(() => window.__game!.setInput({ throttle: 0.6 }));
  await waitSim(page, 3);
  expect((await page.evaluate(() => window.__game!.vehicle())).speed).toBeGreaterThan(2);
  await page.evaluate(() => window.__game!.setInput(null));
  await page.reload();
  await expect(page.locator('.welcome-option.on[data-group="vehicle"]')).toHaveAttribute(
    'data-value',
    'sooty80',
  );
  expect(errors).toEqual([]);
});
