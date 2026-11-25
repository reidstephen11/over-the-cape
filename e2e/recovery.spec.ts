import { expect, test } from '@playwright/test';
import { collectErrors, waitReady, waitSim } from './helpers';

/**
 * Recovery reads clearly (v2.24): the history note makes way when the winch chooser opens,
 * the long drive's two winch rocks have names, and after the winch comes off away from the
 * track the HUD points back to the line.
 */
test('the note makes way for the winch, the bog’s boulders are named, and the HUD points back to the line', async ({
  page,
}) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem('overthecape.save.v1'))
      localStorage.setItem(
        'overthecape.save.v1',
        JSON.stringify({ version: 1, settings: { quality: 'low' }, episode: 'telegraphNorth' }),
      );
  });
  await page.goto('/?surprises=off&track=reopened');
  await waitReady(page);
  expect(await page.evaluate(() => window.__game!.episodeId())).toBe('telegraphNorth');

  // In the bog on the long drive, parked. Its note opens in full.
  await page.evaluate(() => {
    window.__game!.teleport(-9.4, -700, 5);
    window.__game!.setParkBrake(true);
    window.__game!.showNote('long-drive');
  });
  const card = page.locator('.history-card');
  await expect(card).toBeVisible();
  await expect(card).not.toHaveClass(/brief/);

  // The winch chooser opens: the note shrinks to make way, and the anchors are named.
  expect(await page.evaluate(() => window.__game!.tool('winch'))).toBe(true);
  await expect(card).toHaveClass(/brief/);
  // Step through the anchors in reach (a tree may be among them): both boulders are there by name.
  const selected = page.locator('.prompt').first();
  const names = new Set<string>();
  for (let k = 0; k < 8; k++) {
    await expect(selected).toContainText(/, \d+ m/);
    names.add(
      ((await selected.textContent()) ?? '')
        .replace(/^[\d/]+/, '')
        .replace(/, \d+ m.*$/, '')
        .trim(),
    );
    await page.keyboard.press('d');
    await page.waitForTimeout(150);
  }
  expect([...names]).toEqual(expect.arrayContaining(['Approach boulder', 'Exit boulder']));

  // Attach, then let go and end up 8 m west of the track facing north: the line is to the right.
  await page.evaluate(() => window.__game!.tool('confirm'));
  await waitSim(page, 0.5);
  await page.evaluate(() => {
    window.__game!.tool('detach');
    window.__game!.teleport(-18.5, -700, 0);
    window.__game!.setParkBrake(true);
  });
  const hint = page.locator('.course-hint');
  await expect(hint.locator('strong')).toHaveText(/Back to The long drive/i);
  await expect(hint.locator('span')).toContainText(/The line is \d+ m to your right\. Soft sand/);

  // Back on the track, clear of the bog: the track's own hint, and no cue after driving off it again.
  await page.evaluate(() => {
    window.__game!.teleport(-12.4, -680, 5);
    window.__game!.setParkBrake(true);
  });
  await expect(hint.locator('strong')).toHaveText(/^The long drive$/i);
  await page.evaluate(() => {
    window.__game!.teleport(-22, -680, 0);
    window.__game!.setParkBrake(true);
  });
  await expect(hint).toBeHidden();
  expect(errors).toEqual([]);
});
