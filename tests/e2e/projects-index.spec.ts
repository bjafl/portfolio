import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const items = (page: import('@playwright/test').Page) => page.locator('[data-project-list] > li');
const visible = (page: import('@playwright/test').Page) => page.locator('[data-project-list] > li:not([hidden])');

test('?area=devops preselects the filter and shows only matching items', async ({ page }) => {
  await page.goto('/prosjekter/?area=devops');
  await expect(page.getByRole('button', { name: 'Linux og DevOps' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'false');
  const n = await visible(page).count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(await items(page).count());
  for (let i = 0; i < n; i++) {
    expect(await visible(page).nth(i).getAttribute('data-areas')).toContain('devops');
  }
  // Every item without devops is hidden (items may carry several areas, e.g. frontend + devops).
  await expect(page.locator('[data-project-list] > li:not([data-areas~="devops"]):not([hidden])')).toHaveCount(0);
  await expect(page.locator('[data-filter-status]')).toContainText(String(n));
});

test('unknown area shows everything with All pressed', async ({ page }) => {
  await page.goto('/prosjekter/?area=nonsense');
  await expect(page.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'true');
  expect(await visible(page).count()).toBe(await items(page).count());
});

test('without JS every project is visible and the filter is hidden', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/prosjekter/?area=devops');
  expect(await items(page).count()).toBeGreaterThanOrEqual(1);
  expect(await visible(page).count()).toBe(await items(page).count());
  await expect(page.locator('[data-filter]')).toBeHidden();
  await ctx.close();
});

test('clicking a filter then All restores the list and clears the URL param', async ({ page }) => {
  await page.goto('/prosjekter/');
  const total = await items(page).count();
  await page.getByRole('button', { name: 'AI og ML' }).click();
  await expect(page).toHaveURL(/\?area=ai$/);
  await expect(page.getByRole('button', { name: 'AI og ML' })).toHaveAttribute('aria-pressed', 'true');
  const ai = await visible(page).count();
  expect(ai).toBeLessThan(total);
  await expect(page.locator('[data-filter-status]')).toHaveText(new RegExp(`${ai}$`));
  await page.getByRole('button', { name: 'Alle' }).click();
  expect(await visible(page).count()).toBe(total);
  expect(new URL(page.url()).searchParams.has('area')).toBe(false);
  await expect(page.locator('[data-filter-status]')).toContainText(String(total));
});

test('language switch on the english index leads to the norwegian index', async ({ page }) => {
  await page.goto('/en/projects/');
  await expect(page.locator('header a[hreflang="nb"]')).toHaveAttribute('href', '/prosjekter/');
  await page.goto('/prosjekter/');
  await expect(page.locator('header a[hreflang="en"]')).toHaveAttribute('href', '/en/projects/');
});

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const p of ['/prosjekter/?area=ai', '/en/projects/']) {
    await page.goto(p);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  }
});

for (const scheme of ['light', 'dark'] as const) {
  test(`axe on /prosjekter/ with a filter selected (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/prosjekter/?area=frontend');
    await expect(page.getByRole('button', { name: 'Frontend' })).toHaveAttribute('aria-pressed', 'true');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
