// Pure project model: no `astro:content` import, so it is testable without the Astro runtime.
import { z } from 'astro/zod';
import { AREAS } from './areas';
import { LOCALES } from '../i18n/routes';
import type { Locale } from '../i18n/routes';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');

/** `image` is the helper from the content-config schema callback; tests pass a stub. */
export function makeProjectSchema(image: () => z.ZodType) {
  return z
    .object({
      title: z.string(),
      summary: z.string().max(200),
      period: z.object({ start: yearMonth, end: yearMonth.optional() }),
      status: z.enum(['active', 'in-use', 'prototype', 'archived']),
      context: z.enum(['work', 'personal', 'study', 'teaching']),
      areas: z.array(z.enum(AREAS)).min(1),
      stack: z.array(z.string()),
      featured: z.boolean().default(false),
      order: z.number().default(100),
      repo: z.url().optional(),
      links: z.array(z.object({ label: z.string(), href: z.url() })).optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      related: z.array(z.string()).optional(),
      draft: z.boolean().default(false),
    })
    .refine((p) => !p.cover || !!p.coverAlt, {
      message: 'coverAlt is required when cover is set',
      path: ['coverAlt'],
    });
}

export const timelineSchema = z.array(
  z.object({
    year: z.string(),
    title: z.string(),
    text: z.string(),
    projects: z.array(z.string()).optional(),
  }),
);

export interface Sortable {
  featured: boolean;
  order: number;
  period: { start: string };
}

/** featured desc, then order asc, then period.start desc. */
export function sortProjects(a: Sortable, b: Sortable): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.order !== b.order) return a.order - b.order;
  return b.period.start.localeCompare(a.period.start);
}

/** Entry ids are `<locale>/<slug>` (glob loader over src/content/projects). */
export function slugOf(id: string): string {
  return id.slice(id.indexOf('/') + 1);
}

export function localeOf(id: string): Locale {
  return id.slice(0, id.indexOf('/')) as Locale;
}

/** Throws if any slug is missing from a locale. */
export function assertLocaleParity(ids: string[]): void {
  const bySlug = new Map<string, Set<string>>();
  for (const id of ids) {
    const slug = slugOf(id);
    if (!bySlug.has(slug)) bySlug.set(slug, new Set());
    bySlug.get(slug)!.add(localeOf(id));
  }
  const problems: string[] = [];
  for (const [slug, have] of bySlug) {
    const missing = LOCALES.filter((l) => !have.has(l));
    if (missing.length) problems.push(`"${slug}" is missing in: ${missing.join(', ')}`);
  }
  if (problems.length) {
    throw new Error(`Project locale parity check failed. ${problems.join('; ')}`);
  }
}

/** Keeps only timeline project slugs that pass `exists` (unknown or draft slugs are dropped). */
export function visibleTimelineProjects(
  slugs: readonly string[] | undefined,
  exists: (slug: string) => boolean,
): string[] {
  return (slugs ?? []).filter(exists);
}

const DATE_LOCALE: Record<Locale, string> = { nb: 'nb-NO', en: 'en-GB' };

/** "2026-02" -> "feb. 2026" (nb) / "Feb 2026" (en). */
export function formatYearMonth(ym: string, locale: Locale): string {
  const [y, m] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function formatPeriod(
  period: { start: string; end?: string },
  locale: Locale,
  ongoingLabel: string,
): string {
  const end = period.end ? formatYearMonth(period.end, locale) : ongoingLabel;
  return `${formatYearMonth(period.start, locale)} – ${end}`;
}

/** Throws if a `related` or timeline `projects` slug matches no project (drafts count as existing). */
export function assertReferences(
  projectIds: string[],
  projects: { id: string; related?: string[] }[],
  timelines: { id: string; entries: { projects?: string[] }[] }[],
): void {
  const known = new Set(projectIds.map(slugOf));
  const problems: string[] = [];
  for (const p of projects) {
    for (const slug of p.related ?? []) {
      if (!known.has(slug)) problems.push(`${p.id}: related slug "${slug}" does not exist`);
    }
  }
  for (const tl of timelines) {
    for (const e of tl.entries) {
      for (const slug of e.projects ?? []) {
        if (!known.has(slug)) problems.push(`timeline ${tl.id}: project slug "${slug}" does not exist`);
      }
    }
  }
  if (problems.length) throw new Error(`Unknown project reference. ${problems.join('; ')}`);
}
