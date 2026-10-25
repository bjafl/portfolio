import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import {
  assertLocaleParity,
  assertReferences,
  formatYearMonth,
  formatYearRange,
  formatPeriod,
  homeProjectSlugs,
  homeSchema,
  localeOf,
  makeProjectSchema,
  slugOf,
  sortProjects,
  visibleTimelineProjects,
} from '../../src/lib/project-model';
import { areaLabel } from '../../src/lib/areas';
import { t } from '../../src/i18n/ui';

const projectSchema = makeProjectSchema(() => z.string());

const valid = {
  title: 'T',
  summary: 'S',
  period: { start: '2024-01' },
  status: 'active',
  context: 'personal',
  areas: ['frontend'],
  stack: ['Astro'],
};

describe('assertLocaleParity', () => {
  it('passes when both locales have the same slugs', () => {
    expect(() => assertLocaleParity(['nb/a', 'en/a'])).not.toThrow();
  });
  it('throws naming slug and missing locale', () => {
    expect(() => assertLocaleParity(['nb/a', 'nb/b', 'en/a'])).toThrow(/b.*en|en.*b/);
  });
});

describe('sortProjects', () => {
  it('orders featured first, then order asc', () => {
    const items = [
      { featured: false, order: 1, period: { start: '2020-01' } },
      { featured: true, order: 5, period: { start: '2020-01' } },
      { featured: true, order: 2, period: { start: '2020-01' } },
    ];
    const sorted = [...items].sort(sortProjects);
    expect(sorted.map((i) => [i.featured, i.order])).toEqual([
      [true, 2],
      [true, 5],
      [false, 1],
    ]);
  });
  it('breaks ties by period.start desc', () => {
    const items = [
      { featured: false, order: 1, period: { start: '2020-01' } },
      { featured: false, order: 1, period: { start: '2024-01' } },
    ];
    expect([...items].sort(sortProjects)[0]!.period.start).toBe('2024-01');
  });
});

describe('id helpers', () => {
  it('splits locale and slug', () => {
    expect(slugOf('nb/example')).toBe('example');
    expect(localeOf('en/example')).toBe('en');
  });
});

describe('projectSchema', () => {
  it('accepts a valid project and applies defaults', () => {
    const r = projectSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.featured).toBe(false);
      expect(r.data.order).toBe(100);
      expect(r.data.draft).toBe(false);
    }
  });
  it('rejects empty areas', () => {
    expect(projectSchema.safeParse({ ...valid, areas: [] }).success).toBe(false);
  });
  it('rejects unknown area', () => {
    expect(projectSchema.safeParse({ ...valid, areas: ['web'] }).success).toBe(false);
  });
  it('rejects cover without coverAlt', () => {
    expect(projectSchema.safeParse({ ...valid, cover: 'x.png' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...valid, cover: 'x.png', coverAlt: 'a' }).success).toBe(true);
  });
  it('accepts a bare year when the month is unknown', () => {
    expect(projectSchema.safeParse({ ...valid, period: { start: '2025', end: '2025' } }).success).toBe(true);
    expect(projectSchema.safeParse({ ...valid, period: { start: '25' } }).success).toBe(false);
  });
  it('rejects summary over 200 chars', () => {
    expect(projectSchema.safeParse({ ...valid, summary: 'x'.repeat(201) }).success).toBe(false);
  });
});

describe('status/context ids and area labels', () => {
  const statuses = ['active', 'in-use', 'prototype', 'archived'] as const;
  const contexts = ['work', 'personal', 'study', 'teaching'] as const;

  it('accepts exactly the mandated status and context ids, each with a ui label', () => {
    for (const status of statuses) {
      expect(projectSchema.safeParse({ ...valid, status }).success).toBe(true);
      expect(t('nb', `status.${status}`)).toBeTruthy();
    }
    for (const context of contexts) {
      expect(projectSchema.safeParse({ ...valid, context }).success).toBe(true);
      expect(t('nb', `context.${context}`)).toBeTruthy();
    }
  });
  it('rejects retired ids', () => {
    expect(projectSchema.safeParse({ ...valid, status: 'completed' }).success).toBe(false);
    expect(projectSchema.safeParse({ ...valid, context: 'education' }).success).toBe(false);
  });
  it('has the mandated area labels', () => {
    expect(areaLabel('devops', 'nb')).toBe('Linux og DevOps');
    expect(areaLabel('data', 'en')).toBe('Data & migration');
  });
});

describe('visibleTimelineProjects', () => {
  const published = new Set(['a']); // 'draft-one' exists as a draft, so it is not published
  const exists = (s: string) => published.has(s);
  it('drops unknown and draft slugs, keeps published ones in order', () => {
    expect(visibleTimelineProjects(['not-a-project', 'a', 'draft-one'], exists)).toEqual(['a']);
  });
  it('handles missing projects', () => {
    expect(visibleTimelineProjects(undefined, exists)).toEqual([]);
  });
});

describe('formatYearMonth / formatPeriod', () => {
  it('formats per locale', () => {
    expect(formatYearMonth('2026-02', 'nb')).toBe('feb. 2026');
    expect(formatYearMonth('2026-02', 'en')).toBe('Feb 2026');
    expect(formatYearMonth('2025-12', 'en')).toBe('Dec 2025');
  });
  it('joins start and end, or shows the ongoing label', () => {
    expect(formatPeriod({ start: '2026-02', end: '2026-05' }, 'en', 'ongoing')).toBe('Feb 2026 – May 2026');
    expect(formatPeriod({ start: '2026-02' }, 'nb', 'pågår')).toBe('feb. 2026 – pågår');
  });
});

describe('formatYearRange', () => {
  it('shows an open range, a closed range or a single year', () => {
    expect(formatYearRange({ start: '2025-05' })).toBe('2025–');
    expect(formatYearRange({ start: '2024-09', end: '2026-01' })).toBe('2024–2026');
    expect(formatYearRange({ start: '2025', end: '2025' })).toBe('2025');
  });
  it('formatPeriod collapses an identical start and end', () => {
    expect(formatPeriod({ start: '2025', end: '2025' }, 'nb', 'pågår')).toBe('2025');
  });
});

describe('home', () => {
  const home = homeSchema.parse({
    hero: { eyebrow: 'E', title: 'T', lead: 'L', description: 'D' },
    facts: [{ label: 'a', value: '1' }],
    principles: [{ title: 'P', text: 'x', project: 'a' }, { title: 'Q', text: 'y' }],
    offer: { technical: [{ title: 'O', text: 'z', projects: ['b'] }], human: [{ title: 'H', text: 'w', about: true }] },
  });
  it('applies defaults', () => {
    expect(home.facts[0]!.mono).toBe(true);
    expect(home.offer.technical[0]!.about).toBe(false);
  });
  it('collects every project slug the front page links to', () => {
    expect(homeProjectSlugs(home)).toEqual(['a', 'b']);
  });
});

describe('assertReferences', () => {
  const ids = ['nb/a', 'en/a', 'nb/b', 'en/b'];
  it('passes for known slugs, drafts included', () => {
    expect(() =>
      assertReferences(
        ids,
        [{ id: 'nb/a', related: ['b'] }],
        [{ id: 'nb', entries: [{ projects: ['a', 'b'] }, {}] }],
      ),
    ).not.toThrow();
  });
  it('names the unknown related slug and its source', () => {
    expect(() => assertReferences(ids, [{ id: 'nb/a', related: ['nope'] }], [])).toThrow(
      /nb\/a.*related.*"nope"/,
    );
  });
  it('names an unknown slug from other sources', () => {
    expect(() => assertReferences(ids, [], [], [{ id: 'home nb', slugs: ['a', 'gone'] }])).toThrow(
      /home nb.*"gone"/,
    );
  });
  it('names the unknown timeline slug', () => {
    expect(() =>
      assertReferences(ids, [], [{ id: 'en', entries: [{ projects: ['gone'] }] }]),
    ).toThrow(/timeline en.*"gone"/);
  });
});
