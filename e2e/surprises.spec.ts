import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, shot, waitReady, waitSim } from './helpers';

test('Surprises: a dead tree comes down across the track ahead, and the message says so', async ({
  page,
}) => {
  test.setTimeout(900_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/?seed=1');
  await waitReady(page);
  const plans = await page.evaluate(() => window.__game!.surprises(72));
  expect(plans.map((p) => p.kind).sort()).toEqual(['rockfall', 'treefall', 'treefall']);
  const tree = plans.find((p) => p.kind === 'treefall')!;
  expect(tree.phase).toBe('waiting');

  // Driven along its track towards it, it starts once the car is close enough. The car starts
  // just beyond the furthest a tree can start (70 m), since the rough stretch before it is slow.
  await page.evaluate((a) => window.__game!.teleport(a.x, a.z, a.headingDeg), tree.approach);
  await page.evaluate(() => window.__game!.setParkBrake(false));
  await page.evaluate(() => window.__game!.setInput({ throttle: 1 }));
  await page.waitForFunction(
    (id) => window.__game!.surprises().find((p) => p.id === id)!.phase !== 'waiting',
    tree.id,
    { timeout: 300_000, polling: 100 },
  );
  await page.evaluate(() => window.__game!.setInput({ throttle: 0, brake: 1 }));
  await expect(page.locator('.toast', { hasText: 'A tree is coming down ahead' })).toBeVisible();
  await waitSim(page, 5);
  await page.evaluate(() => window.__game!.setInput({ throttle: 0, brake: 0, handbrake: true }));
  await expect
    .poll(() => page.evaluate((id) => window.__game!.surprises().find((p) => p.id === id)!.phase, tree.id), {
      timeout: 300_000,
    })
    .toBe('down');
  // It came down ahead of the car, not on it.
  const v = await page.evaluate(() => window.__game!.vehicle());
  expect(Math.hypot(v.x - tree.x, v.z - tree.z)).toBeGreaterThan(8);
  // From above, between the car and the tree.
  await page.evaluate(
    ([t, c]) =>
      window.__game!.setCamera((t.x + c.x) / 2 + 4, c.y + 9, (t.z + c.z) / 2 + 4, t.x, c.y - 1, t.z),
    [tree, v] as const,
  );
  await page.waitForTimeout(1000);
  await shot(page, 'v0.11', 'tree-down-across-the-track');
  await page.evaluate(() => window.__game!.useChaseCamera());
  expect(errors).toEqual([]);
});
