import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, shot, waitEngine, waitReady, waitSim } from './helpers';

test('night: dusk turns the headlights on, N cycles them, and they light the ground ahead', async ({
  page,
}) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  await waitReady(page);
  expect((await page.evaluate(() => window.__game!.vehicle())).lights).toBe('off');
  // The clock runs on into the evening: at dusk the lamps come on by themselves.
  await page.evaluate(() => window.__game!.setHour(17.7));
  await expect.poll(async () => (await page.evaluate(() => window.__game!.vehicle())).lights).toBe('low');
  await expect(page.locator('.status-lights')).toHaveClass(/shown/);
  // Past the deadline the episode ends; carry on driving in the dark from the result card.
  await page.evaluate(() => window.__game!.setHour(19.6));
  await expect.poll(() => page.evaluate(() => window.__game!.result().open)).toBe(true);
  await page.evaluate(() => window.__game!.pickResult('restart'));
  await waitEngine(page);
  await page.evaluate(() => window.__game!.setHour(19.6));
  await waitSim(page, 0.5);

  // The ground in front of the car, above it on the screen in the chase view.
  const ahead = () => page.evaluate(() => window.__game!.brightness(0.3, 0.3, 0.7, 0.45));
  await page.evaluate(() => window.__game!.setLights('low'));
  await waitSim(page, 0.3);
  const lowBeam = await ahead();
  await shot(page, 'night', 'low-beam');
  await page.keyboard.press('KeyN');
  await expect.poll(async () => (await page.evaluate(() => window.__game!.vehicle())).lights).toBe('high');
  await expect(page.locator('.status-lights')).toHaveClass(/high/);
  await expect.poll(() => page.evaluate(() => window.__game!.beams().head)).toBeGreaterThan(0);
  await shot(page, 'night', 'high-beam');
  await page.keyboard.press('KeyN');
  await expect.poll(async () => (await page.evaluate(() => window.__game!.vehicle())).lights).toBe('off');
  const dark = await ahead();
  await shot(page, 'night', 'lights-off');
  expect(lowBeam).toBeGreaterThan(dark * 1.3);
  expect(errors).toEqual([]);
});
