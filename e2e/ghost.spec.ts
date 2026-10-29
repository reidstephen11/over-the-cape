import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, shot, waitReady } from './helpers';

/** A ghost saved from an earlier run shows as a pale car and the pause menu says how far ahead it is. */
test('the best run drives along as a ghost', async ({ page }) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  await waitReady(page);
  // A ghost that sets off straight ahead of where the car starts, at 5 m/s.
  const v = await page.evaluate(() => window.__game!.vehicle());
  const rad = (v.heading * Math.PI) / 180;
  const poses: number[] = [];
  for (let i = 0; i < 400; i++) {
    const d = 6 + i * 1.25;
    const x = v.x + Math.sin(rad) * d;
    const z = v.z - Math.cos(rad) * d;
    const y = await page.evaluate(([px, pz]) => window.__game!.heightAt(px, pz), [x, z]);
    const h = -rad / 2;
    poses.push(x, y + 0.6, z, 0, Math.sin(h), 0, Math.cos(h), 0.05);
  }
  await page.evaluate((p) => {
    localStorage.setItem(
      'overthecape.save.v1.ghost.creb',
      JSON.stringify({ version: 1, vehicle: 'troopy', seconds: 100, poses: p }),
    );
  }, poses);
  await page.reload();
  await waitReady(page);
  await page.waitForTimeout(1500);
  await shot(page, 'ghost', 'ghost-ahead');
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause')).toContainText('Ghost');
  await shot(page, 'ghost', 'pause');
  expect(errors).toEqual([]);
});
