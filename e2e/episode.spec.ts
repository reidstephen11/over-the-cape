import { expect, test, type Page } from '@playwright/test';
import {
  collectErrors,
  driveFromBriefing,
  lowGraphics,
  shot,
  waitEngine,
  waitReady,
  waitSim,
} from './helpers';

const episode = (page: Page) => page.evaluate(() => window.__game!.episode());

test('camps save the run; the clock, an empty tank, a flat with no spare and the current end it; restart from camp', async ({
  page,
}) => {
  test.setTimeout(1_200_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  // Realistic damage, so a flat tyre with nothing to fix it ends the episode.
  await page.locator('[data-group="damage"][data-value="realistic"]').click();
  await waitReady(page);
  expect(await episode(page)).toMatchObject({ status: 'driving', camp: 'daintree-village' });
  // The first history note shows at the start.
  await expect.poll(() => page.evaluate(() => window.__game!.historyShown())).toContain('Daintree Village');

  // Reaching Roaring Meg camp saves the run there.
  await page.evaluate(() => window.__game!.teleportPoi('roaring-meg-camp'));
  await expect.poll(async () => (await episode(page)).camp, { timeout: 120_000 }).toBe('roaring-meg-camp');
  const campHour = (await episode(page)).hour;

  // Dark falls: the episode is over, and restarting puts the clock back to the camp's.
  await page.evaluate(() => window.__game!.setHour(18.3));
  await expect
    .poll(() => page.evaluate(() => window.__game!.result()), { timeout: 60_000 })
    .toEqual({
      open: true,
      title: 'Episode over',
    });
  await expect(page.locator('.result-card')).toContainText('Dark caught you');
  await shot(page, 'episode', 'episode-over');
  await page.evaluate(() => window.__game!.pickResult('restart'));
  await expect.poll(async () => (await episode(page)).status, { timeout: 60_000 }).toBe('driving');
  expect((await episode(page)).hour).toBeCloseTo(campHour, 2);
  await waitEngine(page);

  // Out of fuel with a jerry can left: pour it in from the tool menu and drive on.
  await page.evaluate(() => window.__game!.setSupplies({ fuel: 0.01, jerryCans: 1 }));
  await page.evaluate(() => window.__game!.setInput({ throttle: 0.5 }));
  await expect
    .poll(async () => (await page.evaluate(() => window.__game!.vehicle())).engineRunning, {
      timeout: 120_000,
    })
    .toBe(false);
  await page.evaluate(() => window.__game!.setInput({ brake: 1 }));
  await expect(page.locator('.prompts')).toContainText('Out of fuel');
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => window.__game!.vehicle())).speed))
    .toBeLessThan(0.3);
  expect(await page.evaluate(() => window.__game!.tool('refuel'))).toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__game!.health()), { timeout: 600_000 })
    .toMatchObject({ jerryCans: 0, repairing: false });
  expect((await page.evaluate(() => window.__game!.health())).fuel).toBeGreaterThan(19);
  await waitEngine(page);
  expect((await episode(page)).status).toBe('driving');

  // Empty again with no cans left: over.
  await page.evaluate(() => window.__game!.setSupplies({ fuel: 0.01 }));
  await page.evaluate(() => window.__game!.setInput({ throttle: 0.5 }));
  await expect.poll(async () => (await episode(page)).reason, { timeout: 300_000 }).toBe('fuel');
  await page.evaluate(() => window.__game!.setInput(null));
  await expect(page.locator('.result-card')).toContainText('Out of fuel');
  await page.evaluate(() => window.__game!.pickResult('restart'));
  await expect.poll(async () => (await episode(page)).status, { timeout: 60_000 }).toBe('driving');
  // The camp's load comes back with the restart.
  expect((await page.evaluate(() => window.__game!.health())).fuel).toBeGreaterThan(30);
  await waitEngine(page);

  // A torn sidewall with no spare left is the end too.
  await page.evaluate(() => window.__game!.setSupplies({ spares: 0 }));
  await page.evaluate(() => window.__game!.setHealth({ tyres: [1, 0, 1, 1] }));
  await expect.poll(async () => (await episode(page)).reason, { timeout: 60_000 }).toBe('tyre');
  await page.evaluate(() => window.__game!.pickResult('restart'));
  await expect.poll(async () => (await episode(page)).status, { timeout: 60_000 }).toBe('driving');
  await waitEngine(page);

  // Out in the deep, running Daintree the current lifts the car and carries it off.
  await page.evaluate(() => window.__game!.teleport(-250, 2244, 90));
  await expect(page.locator('.prompts')).toContainText('The current is taking the car', { timeout: 120_000 });
  await expect.poll(async () => (await episode(page)).reason, { timeout: 120_000 }).toBe('swept');
  await expect(page.locator('.result-card')).toContainText('The current took the vehicle');
  await shot(page, 'episode', 'swept-away');
  await page.evaluate(() => window.__game!.pickResult('restart'));
  await expect.poll(async () => (await episode(page)).status, { timeout: 60_000 }).toBe('driving');
  expect(errors).toEqual([]);
});

test('reaching the Lions Den finishes the episode and opens replays in other conditions', async ({
  page,
}) => {
  test.setTimeout(1_200_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/');
  await waitReady(page);
  await page.evaluate(() => window.__game!.teleportPoi('lions-den'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.result()), { timeout: 120_000 })
    .toEqual({
      open: true,
      title: 'The CREB Track',
    });
  await expect(page.locator('.result-card')).toContainText('1875');
  await shot(page, 'episode', 'mission-complete');
  // Keep driving: the card closes and the game carries on.
  await page.evaluate(() => window.__game!.pickResult('drive'));
  await expect.poll(() => page.evaluate(() => window.__game!.ui().paused)).toBe(false);
  expect((await episode(page)).status).toBe('complete');

  // Back at the welcome screen the episode is finished and can be replayed at dusk in the rain.
  await page.keyboard.press('Escape');
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: /^Main menu/ }).click()]);
  await expect(page.locator('.welcome-option[data-group="episode"]').first()).toContainText('finished');
  await page.locator('[data-group="time"][data-value="dusk"]').click();
  await page.locator('[data-group="weather"][data-value="rain"]').click();
  await page.locator('[data-welcome-drive]').click();
  await expect(page.locator('.briefing')).toContainText('no time limit');
  await driveFromBriefing(page);
  expect(await episode(page)).toMatchObject({ replay: { time: 'dusk', weather: 'rain' } });
  // The clock stands still on a replay, and the headlights are on for dusk.
  const hour = (await episode(page)).hour;
  await waitSim(page, 2);
  expect((await episode(page)).hour).toBe(hour);
  expect((await page.evaluate(() => window.__game!.vehicle())).lights).toBe('low');
  await expect(page.locator('.mission-clock')).toHaveText('');
  expect(errors).toEqual([]);
});
