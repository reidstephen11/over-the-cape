import { expect, test } from '@playwright/test';
import { collectErrors, shot, waitReady, waitSim } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('the delivery trailer and its Tools actions fit on a phone upright and sideways', async ({ page }) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      'overthecape.save.v1',
      JSON.stringify({
        version: 1,
        settings: { quality: 'low', masterVolume: 0 },
        vehicle: 'shortie',
        episode: 'frenchmans',
        episodes: { creb: { completed: true }, coach: { completed: true }, lakefield: { completed: true } },
      }),
    ),
  );
  await page.goto('/');
  await waitReady(page);
  await waitSim(page, 6);
  await expect(page.locator('.supplies')).toContainText('2 drums');
  for (const [width, height] of [
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator('[data-tap="toolMenu"]').tap();
    await expect(page.locator('.tool-menu')).toBeVisible();
    await expect(page.locator('.tool-menu')).toContainText('Tighten load straps');
    const layoutErrors = await page.locator('.tool-option').evaluateAll((buttons) => {
      const boxes = buttons.map((b) => b.getBoundingClientRect());
      const issues: string[] = [];
      boxes.forEach((a, i) => {
        if (a.left < 0 || a.right > innerWidth || a.top < 0 || a.bottom > innerHeight)
          issues.push(`off-screen ${i}`);
        boxes.slice(i + 1).forEach((b, j) => {
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom)
            issues.push(`overlap ${i}/${i + j + 1}`);
        });
      });
      return issues;
    });
    expect(layoutErrors).toEqual([]);
    await shot(page, 'frenchmans-touch', `${width}-tools`);
    await page.getByRole('button', { name: 'Tighten load straps' }).tap();
    await expect(page.locator('.tool-menu')).toBeHidden();
  }
  expect(errors).toEqual([]);
});
