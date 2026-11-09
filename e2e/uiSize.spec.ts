import { expect, test, type Page } from '@playwright/test';
import { collectErrors, drawnText, lowGraphics, shot, waitReady, waitSim } from './helpers';

/**
 * Text big enough to read where the owner plays (v1.75): a 1080p television from the couch
 * (no touch, keyboard or controller) and a phone held upright. The interface scales with the
 * screen (src/ui/uiScale.ts); these check the driving screen as drawn.
 */

/** Drive onto the CREB's first pinch in low range with an action prompt and a history note up. */
async function drivingScreen(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = window.__game!;
    g.teleport(-33, 2428, 5);
    g.setInput({ throttle: 0.5 });
  });
  await waitSim(page, 1);
  await page.evaluate(() => window.__game!.showNote('creb-lookout'));
  await expect(page.locator('.history-card')).toBeVisible();
  await expect(page.locator('.prompt').first()).toBeVisible();
}

const under = (texts: { px: number; text: string; cls: string }[], min: number) =>
  texts.filter((t) => t.px < min - 0.05).map((t) => `${t.px.toFixed(1)} px ${t.cls}: ${t.text.slice(0, 30)}`);

test.describe('television', () => {
  test.use({ viewport: { width: 1920, height: 1080 }, hasTouch: false });

  test('1920×1080: every piece of driving text is 18 px or more; prompts, notes and the road name 24 px', async ({
    page,
  }) => {
    test.setTimeout(900_000);
    const errors = collectErrors(page);
    await lowGraphics(page);
    await page.goto('/?surprises=off&track=reopened');
    await waitReady(page);
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui')),
    ).toBe('1.875');
    await drivingScreen(page);
    await shot(page, 'uiSize', 'tv-driving');
    const texts = await drawnText(page);
    expect(texts.length).toBeGreaterThan(20);
    expect(under(texts, 18)).toEqual([]);
    const big = texts.filter(
      (t) => /prompt|history-text|history-do|hud-stack|course-hint|mission/.test(t.cls) || t.cls === 'STRONG',
    );
    expect(big.length).toBeGreaterThan(2);
    expect(under(big, 24)).toEqual([]);
    // The middle of the picture (the road ahead and the car) stays clear of panels.
    const middle = await page.evaluate(() => {
      const [w, h] = [innerWidth, innerHeight];
      const mid = { left: w / 3, right: (w * 2) / 3, top: h / 3, bottom: (h * 2) / 3 };
      return [
        ...document.querySelectorAll<HTMLElement>('.inst-cluster, .hud-stack > *, .notices > *, .prompt'),
      ]
        .filter((e) => e.offsetParent)
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.left < mid.right && r.right > mid.left && r.top < mid.bottom && r.bottom > mid.top)
        .length;
    });
    expect(middle).toBe(0);
    await page.evaluate(() => window.__game!.setInput(null));
    expect(errors).toEqual([]);
  });
});

test.describe('phone held upright', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('390×844: driving text is 12 px or more, buttons 44 px, and the prompt and note keep off the road', async ({
    page,
  }) => {
    test.setTimeout(900_000);
    const errors = collectErrors(page);
    await lowGraphics(page);
    await page.goto('/?surprises=off&track=reopened');
    await waitReady(page);
    await drivingScreen(page);
    await shot(page, 'uiSize', 'portrait-driving');
    expect(under(await drawnText(page), 12)).toEqual([]);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('#ui button')]
        .filter((b) => b.offsetParent && getComputedStyle(b).visibility !== 'hidden')
        .map((b) => ({ r: b.getBoundingClientRect(), label: b.getAttribute('aria-label') ?? b.textContent }))
        .filter(({ r }) => r.width > 0 && Math.min(r.width, r.height) < 44)
        .map(({ r, label }) => `${label} ${Math.round(r.width)}×${Math.round(r.height)}`),
    );
    expect(small).toEqual([]);
    // The prompt and the note stay in the band under the dials, above the road and the car.
    for (const sel of ['.prompt', '.history-card']) {
      const box = (await page.locator(sel).first().boundingBox())!;
      expect(box.y + box.height, sel).toBeLessThan(844 * 0.3);
    }
    await page.evaluate(() => window.__game!.setInput(null));
    expect(errors).toEqual([]);
  });
});

test.describe('phone held sideways', () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

  test('844×390: dial numbers and the pitch and roll panel read at 12 px or more; buttons 44 px', async ({
    page,
  }) => {
    test.setTimeout(900_000);
    const errors = collectErrors(page);
    await lowGraphics(page);
    await page.goto('/?surprises=off&track=reopened');
    await waitReady(page);
    await drivingScreen(page);
    await page.evaluate(() => window.__game!.setCrawlGauges('on'));
    await expect(page.locator('.crawl-gauges')).toBeVisible();
    await waitSim(page, 0.3);
    await shot(page, 'uiSize', 'landscape-driving');
    expect(under(await drawnText(page), 12)).toEqual([]);
    // The panel is a canvas: its lettering is drawn 19.5 units high on a phone (crawlGauges.ts),
    // so the panel must be shown at 12 / 19.5 of its drawn size or more.
    const shown = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.crawl-gauges canvas')!;
      return c.getBoundingClientRect().width / 318;
    });
    expect(shown * 19.5).toBeGreaterThanOrEqual(12);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('#ui button')]
        .filter((b) => b.offsetParent && getComputedStyle(b).visibility !== 'hidden')
        .map((b) => ({ r: b.getBoundingClientRect(), label: b.getAttribute('aria-label') ?? b.textContent }))
        .filter(({ r }) => r.width > 0 && Math.min(r.width, r.height) < 44)
        .map(({ r, label }) => `${label} ${Math.round(r.width)}×${Math.round(r.height)}`),
    );
    expect(small).toEqual([]);
    await page.evaluate(() => window.__game!.setInput(null));
    expect(errors).toEqual([]);
  });
});
