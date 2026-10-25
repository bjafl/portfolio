import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('nav links and language switch on /', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: /hoved/i });
  await expect(nav.locator('a[href="/prosjekter/"]')).toBeVisible();
  await expect(nav.locator('a[href="/om/"]')).toBeVisible();
  await expect(page.locator('header a[hreflang="en"]')).toHaveAttribute('href', '/en/');
});

test('theme toggle flips and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Bytt tema' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('dark OS preference resolves to dark with nothing stored', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await ctx.close();
});

test('without JS the body background equals the OS-preferred --background', async ({ browser }) => {
  const expected = { light: 'rgb(248, 249, 247)', dark: 'rgb(15, 17, 15)' } as const;
  for (const scheme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    const color = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
    await ctx.close();
    expect(color).toBe(expected[scheme]);
  }
});

test('footer hides placeholder contacts but always shows GitHub', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.locator('a[href^="https://github.com/"]')).toHaveCount(1);
  await expect(footer.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(footer.locator('a[href*="linkedin"]')).toHaveCount(0);
  expect(await page.content()).not.toContain('__SET_');
});

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`axe: no violations on / (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('404 page links home', async ({ page }) => {
  await page.goto('/finnes-ikke/');
  await expect(page.getByRole('main').getByRole('link', { name: /hjem|forsiden/i })).toHaveAttribute('href', '/');
});
