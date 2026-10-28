import { expect, test } from '@playwright/test';
import { collectErrors, lowGraphics, shot, waitReady } from './helpers';

test('vehicle instruments show fuel, temperature, pressure setting and the damaged tyre', async ({
  page,
}) => {
  test.setTimeout(600_000);
  const errors = collectErrors(page);
  await lowGraphics(page);
  await page.goto('/?surprises=off');
  await waitReady(page);

  const instruments = page.getByRole('group', { name: 'Vehicle instruments' });
  const temperature = instruments.getByRole('meter', { name: 'TEMP' });
  const fuel = instruments.getByRole('meter', { name: 'FUEL' });
  await expect(temperature).toBeVisible();
  await expect(temperature).toHaveAttribute('aria-valuetext', /Engine temperature: normal/);
  const health = await page.evaluate(() => window.__game!.health());
  await expect(fuel).toHaveAttribute('aria-valuetext', /^Fuel: /);
  await expect(fuel.locator('.dial-value')).toHaveText(`${Math.round(health.fuel)} L`);
  await expect(instruments.locator('.tyre-mode')).toHaveText('ROAD');
  await expect(instruments.locator('.tyre-gauge')).toHaveCount(4);
  await expect(instruments.getByRole('meter', { name: 'Front left tyre' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );

  // The pressure setting changes immediately when let down.
  await page.evaluate(() => window.__game!.setParkBrake(true));
  await page.keyboard.down('KeyQ');
  await page.locator('.tool-option', { hasText: 'Let the tyres down' }).click();
  await page.keyboard.up('KeyQ');
  await expect(instruments.locator('.tyre-mode')).toHaveText('TRAIL');
  // Healthy tyres keep all their air at the chosen trail setting.
  await expect(instruments.getByRole('meter', { name: 'Front left tyre' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );

  // Away from camp, a torn front-left tyre must only mark that corner.
  await page.evaluate(() => {
    window.__game!.teleport(-2, 2130, 40);
    window.__game!.setHealth({ tyres: [0.6, 1, 1, 1] });
  });
  const frontLeft = instruments.getByRole('meter', { name: 'Front left tyre' });
  await expect(frontLeft).toHaveAttribute('aria-valuetext', /60% air remaining, torn sidewall/);
  await expect(frontLeft.locator('.tyre-value')).toHaveText('LEAK');
  await expect(instruments.getByRole('meter', { name: 'Rear right tyre' })).toHaveAttribute(
    'aria-valuenow',
    '100',
  );
  await shot(page, 'gauges', 'vehicle-instruments');
  expect(errors).toEqual([]);
});
