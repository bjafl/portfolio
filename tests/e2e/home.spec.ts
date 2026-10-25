import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const SITE = 'https://portfolio.flode.net';

const locales = [
  { name: 'nb', path: '/', lang: 'nb', projectsBase: '/prosjekter/', switchTo: '/en/', switchText: 'English', switchLabel: 'Bytt språk' },
  { name: 'en', path: '/en/', lang: 'en', projectsBase: '/en/projects/', switchTo: '/', switchText: 'Norsk', switchLabel: 'Change language' },
] as const;

for (const l of locales) {
  test.describe(`home ${l.name}`, () => {
    test('structure', async ({ page }) => {
      await page.goto(l.path);
      await expect(page.locator('html')).toHaveAttribute('lang', l.lang);
      await expect(page.locator('h1')).toHaveCount(1);

      const timeline = page.locator('section[aria-labelledby="timeline-heading"]');
      await expect(timeline.locator('#timeline-heading')).toBeVisible();
      await expect(timeline.getByRole('list').first()).toBeVisible();

      const featured = page.locator('section[aria-labelledby="featured-heading"] article');
      expect(await featured.count()).toBeGreaterThanOrEqual(1);
      expect(await featured.count()).toBeLessThanOrEqual(6);

      const skills = page.locator('section[aria-labelledby="skills-heading"] a');
      await expect(skills).toHaveCount(6);
      const hrefs = await skills.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
      const re = new RegExp(`^${l.projectsBase}\\?area=(frontend|backend|data|devops|ai|security)$`);
      for (const h of hrefs) expect(h).toMatch(re);
    });

    test('timeline links only to existing case pages', async ({ page, request }) => {
      await page.goto(l.path);
      const hrefs = await page
        .locator('section[aria-labelledby="timeline-heading"] a')
        .evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
      expect(hrefs.length).toBeGreaterThanOrEqual(1);
      for (const h of hrefs) {
        expect(h.startsWith(l.projectsBase), h).toBe(true);
        expect((await request.get(h)).status(), h).toBe(200);
      }
    });

    test('no internal link 404s', async ({ page, request }) => {
      await page.goto(l.path);
      const hrefs = await page.locator('a[href^="/"]').evaluateAll((els) =>
        els.map((e) => (e.getAttribute('href') ?? '').split('#')[0].split('?')[0]),
      );
      for (const h of new Set(hrefs)) {
        if (!h) continue;
        const status = (await request.get(h)).status();
        expect(status, h).toBeLessThan(400);
      }
    });

    test('no horizontal scroll at 360px', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(l.path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    });

    for (const scheme of ['light', 'dark'] as const) {
      test(`axe (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(l.path);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    }

    test('canonical, hreflang and language switch', async ({ page }) => {
      await page.goto(l.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE + l.path);
      await expect(page.locator('link[rel="alternate"][hreflang="nb"]')).toHaveAttribute('href', `${SITE}/`);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `${SITE}/en/`);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `${SITE}/`);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', SITE + l.path);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', l.lang === 'nb' ? 'nb_NO' : 'en_GB');
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
      const other = l.lang === 'nb' ? 'en' : 'nb';
      const sw = page.locator(`header a[hreflang="${other}"]`);
      await expect(sw).toHaveAttribute('href', l.switchTo);
      await expect(sw).toHaveText(l.switchText);
      await expect(sw).toHaveAttribute('aria-label', `${l.switchLabel}: ${l.switchText}`);
    });
  });
}

test('sitemap uses the same hreflang tags as the page head', async ({ request }) => {
  const xml = await (await request.get('/sitemap-0.xml')).text();
  const langs = new Set([...xml.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]));
  expect([...langs].sort()).toEqual(['en', 'nb']);
});
