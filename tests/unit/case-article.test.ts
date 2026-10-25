import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/CaseArticle.astro';
import cover from '../fixtures/cover.svg';

// Synthetic entry: the content store is not populated under Vitest, so the
// entry carries its own pre-rendered body. CaseArticle itself is the real component.
function entry(extra: Record<string, unknown>) {
  return {
    id: 'nb/synthetic',
    collection: 'projects',
    body: 'Body',
    rendered: { html: '<p>Body text</p>', metadata: { headings: [], imagePaths: [], frontmatter: {} } },
    data: {
      title: 'Synthetic',
      summary: 'Summary',
      period: { start: '2026-01' },
      status: 'prototype',
      context: 'personal',
      areas: ['frontend'],
      stack: [],
      featured: false,
      order: 1,
      draft: false,
      ...extra,
    },
  } as never;
}

async function render(extra: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, { props: { project: entry(extra), locale: 'nb' } });
}

const article = (html: string) => html.slice(html.indexOf('<article'), html.indexOf('</article>'));

describe('CaseArticle cover rendering', () => {
  it('renders the cover image with its alt text before the body', async () => {
    const html = article(await render({ cover, coverAlt: 'Dekkbilde for test' }));
    const img = html.indexOf('<img');
    expect(img).toBeGreaterThan(-1);
    expect(html.slice(img, html.indexOf('>', img))).toContain('alt="Dekkbilde for test"');
    expect(img).toBeLessThan(html.indexOf('class="prose-case"'));
  });

  it('renders no image without a cover', async () => {
    const html = article(await render({}));
    expect(html).not.toContain('<img');
    expect(html).toContain('class="prose-case"');
  });
});
