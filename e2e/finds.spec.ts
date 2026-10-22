import { expect, test, type Page } from '@playwright/test';
import { collectErrors, lowGraphics, shot, waitEngine, waitReady } from './helpers';

const health = (page: Page) => page.evaluate(() => window.__game!.health());
const finds = (page: Page) => page.evaluate(() => window.__game!.finds());

test('finds off the main line load once, show in the supplies, and camps keep them', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  await waitReady(page);
  const start = await health(page);

  // Pull up at the old line camp: the plugs go on board and show in the supplies.
  await page.evaluate(() => window.__game!.teleport(70, 940, 70));
  await expect.poll(() => finds(page), { timeout: 120_000 }).toEqual(['line-camp-plugs']);
  expect((await health(page)).plugs).toBe(start.plugs + 2);
  await expect(page.locator('.status-supplies')).toContainText(`×${start.plugs + 2}`);
  await shot(page, 'finds', 'line-camp');

  // Roaring Meg camp saves the run with the plugs on board.
  await page.evaluate(() => window.__game!.teleportPoi('roaring-meg-camp'));
  await expect
    .poll(async () => (await page.evaluate(() => window.__game!.episode())).camp, { timeout: 120_000 })
    .toBe('roaring-meg-camp');

  // The jerry can at the linesman's hut, after the camp.
  await page.evaluate(() => window.__game!.teleport(-95, -85, 330));
  await expect.poll(() => finds(page), { timeout: 120_000 }).toContain('linesmans-jerry-can');
  expect((await health(page)).jerryCans).toBe(start.jerryCans + 1);

  // Restarting from the camp puts the can back at the hut and keeps the plugs.
  await page.evaluate(() => window.__game!.restartFromCamp());
  await expect.poll(() => finds(page), { timeout: 60_000 }).toEqual(['line-camp-plugs']);
  const h = await health(page);
  expect(h.jerryCans).toBe(start.jerryCans);
  expect(h.plugs).toBe(start.plugs + 2);
  await waitEngine(page);
  expect(errors).toEqual([]);
});
