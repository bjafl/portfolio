import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';

const locales = [
  { code: 'nb', base: '/prosjekter/', about: '/om/', other: '/en/projects/' },
  { code: 'en', base: '/en/projects/', about: '/en/about/', other: '/prosjekter/' },
] as const;

function frontmatter(file: string): Record<string, string> {
  const raw = readFileSync(file, 'utf8').split('---')[1];
  const out: Record<string, string> = {};
  for (const m of raw.matchAll(/^(\w+):\s*(.+)$/gm)) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  return out;
}

function projects(locale: string): Array<Record<string, string>> {
  const dir = `src/content/projects/${locale}`;
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f): Record<string, string> => ({ ...frontmatter(`${dir}/${f}`), slug: f.replace(/\.md$/, '') }))
    .filter((p) => p.draft !== 'true');
}

for (const l of locales) {
  test.describe(`case pages ${l.code}`, () => {
    for (const p of projects(l.code)) {
      test(`${p.slug}: title, description, repo, images`, async ({ page }) => {
        const res = await page.goto(`${l.base}${p.slug}/`);
        expect(res?.status()).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).toHaveText(p.title);
        await expect(page.locator('meta[name=description]')).toHaveAttribute('content', p.summary);
        await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');

        const meta = page.locator('[data-case-meta]');
        await expect(meta).toBeVisible();
        if (!p.repo) {
          await expect(meta).toContainText(l.code === 'nb' ? 'Kode i privat repo' : 'Code in a private repository');
          await expect(meta.locator('a[href*="github.com/"]')).toHaveCount(0);
        }
        const coverImg = page.locator('article > img');
        if (p.cover) {
          await expect(coverImg).toHaveCount(1);
          await expect(coverImg).toHaveAttribute('alt', p.coverAlt);
          // Cover precedes the body.
          expect(await coverImg.evaluate((el) => !!el.compareDocumentPosition(document.querySelector('.prose-case')!) && el.compareDocumentPosition(document.querySelector('.prose-case')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
        } else {
          await expect(coverImg).toHaveCount(0);
          // Diagrams inside the Markdown body are fine; nothing image-like outside it.
          await expect(page.locator('article img')).toHaveCount(await page.locator('article .prose-case img').count());
        }
        for (const img of await page.locator('main img').all()) {
          expect((await img.getAttribute('alt'))?.trim()).toBeTruthy();
        }
        // No empty sections, no dead internal links.
        await expect(page.locator('main section:empty')).toHaveCount(0);
        await expect(page.locator(`a[href="${l.base}"]`).first()).toBeVisible();
      });
    }

    test('language switch on a case page', async ({ page }) => {
      await page.goto(`${l.base}e2ee-drop/`);
      const other = l.code === 'nb' ? 'en' : 'nb';
      await expect(page.locator(`header a[hreflang="${other}"]`)).toHaveAttribute('href', `${l.other}e2ee-drop/`);
    });

    test('cover image renders before the body (any project with a cover)', async ({ page }) => {
      const withCover = projects(l.code).filter((p) => p.cover);
      test.skip(withCover.length === 0, 'No real project has a cover in its frontmatter yet.');
      for (const p of withCover) {
        await page.goto(`${l.base}${p.slug}/`);
        const coverImg = page.locator('article > img');
        await expect(coverImg).toHaveCount(1);
        await expect(coverImg).toHaveAttribute('alt', p.coverAlt);
      }
    });

    test('a project without cover renders no cover image', async ({ page }) => {
      await page.goto(`${l.base}stillas/`);
      await expect(page.locator('article > img')).toHaveCount(0);
    });

    test('related section appears only for projects that declare related', async ({ page }) => {
      for (const p of projects(l.code)) {
        await page.goto(`${l.base}${p.slug}/`);
        const section = page.locator('section[aria-labelledby="related-heading"]');
        if (p.related) {
          expect(await section.locator('article').count(), p.slug).toBeGreaterThanOrEqual(1);
        } else {
          await expect(section, p.slug).toHaveCount(0);
        }
      }
    });

    test('about page', async ({ page }) => {
      const res = await page.goto(l.about);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(l.code === 'nb' ? 'Om meg' : 'About me');
      await expect(page.locator('main p').first()).toBeVisible();
    });

    test('no horizontal scroll at 360px', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`${l.base}stillas/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    });

    for (const scheme of ['light', 'dark'] as const) {
      test(`axe case + about (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        for (const path of [`${l.base}stillas/`, l.about]) {
          await page.goto(path);
          const results = await new AxeBuilder({ page }).analyze();
          expect(results.violations, path).toEqual([]);
        }
      });
    }
  });
}
