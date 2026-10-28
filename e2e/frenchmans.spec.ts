import { expect, test } from '@playwright/test';
import { openJourney, collectErrors, driveFromBriefing, shot, waitSim } from './helpers';

test('Episode 4: the trailer carries the delivery, camps retain a trailer left behind, and Continue restores it', async ({
  page,
}) => {
  test.setTimeout(1_200_000);
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem('overthecape.save.v1'))
      localStorage.setItem(
        'overthecape.save.v1',
        JSON.stringify({
          version: 1,
          settings: { quality: 'low', masterVolume: 0 },
          vehicle: 'perentie',
          episode: 'frenchmans',
          episodes: { creb: { completed: true }, coach: { completed: true }, lakefield: { completed: true } },
        }),
      );
  });
  await page.goto('/');
  await openJourney(page);
  await expect(page.locator('.welcome-option.on[data-group="episode"]')).toHaveAttribute(
    'data-value',
    'frenchmans',
  );
  await page.locator('[data-welcome-drive]').click();
  await expect(page.locator('.briefing')).toContainText('Episode 4 · The Frenchmans Track');
  await expect(page.locator('.briefing')).toContainText('both 200 L drums');
  await driveFromBriefing(page);
  await waitSim(page, 2);
  expect(await page.evaluate(() => window.__game!.trailer())).toMatchObject({
    kind: 'no5',
    drums: 2,
    hitched: true,
  });
  await expect(page.locator('.mission')).toContainText('Deliver both drums');
  await shot(page, 'frenchmans', 'loaded-at-start');

  // Driving the car to the goal, leaving the trailer at the start, does not deliver fuel.
  expect(await page.evaluate(() => window.__game!.tool('unhitch'))).toBe(true);
  await page.evaluate(() => window.__game!.teleportPoi('fuel-camp'));
  await waitSim(page, 2);
  expect(await page.evaluate(() => window.__game!.episode().status)).toBe('driving');
  await expect(page.locator('.mission')).toContainText('Deliver both drums');

  await page.evaluate(() => window.__game!.teleportPoi('telegraph-camp'));
  await waitSim(page, 2);
  expect(await page.evaluate(() => window.__game!.tool('hitch'))).toBe(true);
  await page.evaluate(() => window.__game!.teleportPoi('wenlock-camp'));
  await expect.poll(() => page.evaluate(() => window.__game!.episode().camp)).toBe('wenlock-camp');
  await waitSim(page, 2);
  expect(await page.evaluate(() => window.__game!.tool('unhitch'))).toBe(true);
  await page.evaluate(() => window.__game!.teleportPoi('pascoe-camp'));
  await expect.poll(() => page.evaluate(() => window.__game!.episode().camp)).toBe('pascoe-camp');
  await page.reload();
  await openJourney(page);
  await expect(page.locator('.welcome-option.on[data-group="start"]')).toHaveAttribute(
    'data-value',
    'resume',
  );
  await page.locator('[data-welcome-drive]').click();
  await driveFromBriefing(page);
  const trailer = await page.evaluate(() => window.__game!.trailer());
  expect(trailer).toMatchObject({ hitched: false, drums: 2, kind: 'no5' });
  expect(trailer!.x).toBeLessThan(-2100);
  expect(await page.evaluate(() => window.__game!.episode().camp)).toBe('pascoe-camp');

  // Go back for the same cargo; the goal only completes once the trailer is parked there.
  await page.evaluate(() => window.__game!.teleportPoi('wenlock-camp'));
  await waitSim(page, 2);
  expect(await page.evaluate(() => window.__game!.tool('hitch'))).toBe(true);
  await page.keyboard.down('KeyQ');
  await expect(page.locator('.tool-menu')).toContainText('Tighten load straps');
  await shot(page, 'frenchmans', 'trailer-tools');
  await page.keyboard.up('KeyQ');
  await page.evaluate(() => window.__game!.teleportPoi('fuel-camp'));
  await expect
    .poll(() => page.evaluate(() => window.__game!.episode().status), { timeout: 120_000 })
    .toBe('complete');
  await expect(page.locator('.result-card')).toContainText('Both drums are at the camp');
  await shot(page, 'frenchmans', 'delivered');
  expect(errors).toEqual([]);
});

test('Episode 4 shows the fork, rutted climb, sideling and curved Pascoe line', async ({ page }) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      'overthecape.save.v1',
      JSON.stringify({
        version: 1,
        settings: { quality: 'low', masterVolume: 0 },
        vehicle: 'perentie',
        episode: 'frenchmans',
        episodes: { creb: { completed: true }, coach: { completed: true }, lakefield: { completed: true } },
      }),
    ),
  );
  await page.goto('/?dev');
  await openJourney(page);
  await page.locator('[data-welcome-drive]').click();
  await driveFromBriefing(page);
  await page.evaluate(() => {
    window.__game!.setStepsPerFrame(1);
    window.__game!.setInput({ handbrake: true });
  });
  for (const [name, parkX, parkZ, heading, x, z, tx, tz] of [
    ['fork', -1800, -35, 145, -1800, -90, -1700, 55],
    ['jump-up', -1590, -35, 35, -1620, -10, -1490, -95],
    ['sideling', -1280, 50, 140, -1300, 240, -1195, 135],
    ['pascoe', -85, 115, 120, -70, 190, 100, 8],
  ] as const) {
    await page.evaluate(
      ({ parkX, parkZ, heading, x, z, tx, tz }) => {
        const g = window.__game!;
        g.setTrailer(null);
        g.teleport(parkX, parkZ, heading);
        g.setTrailer(2, 'no5');
        g.setCamera(
          x,
          Math.max(g.heightAt(x, z), g.heightAt(tx, tz)) + 35,
          z,
          tx,
          g.heightAt(tx, tz) + 1,
          tz,
        );
      },
      { parkX, parkZ, heading, x, z, tx, tz },
    );
    await page.waitForTimeout(500);
    await shot(page, 'frenchmans-v51', name);
  }
  expect(errors).toEqual([]);
});
