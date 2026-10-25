import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/routes';
import { assertLocaleParity, assertReferences, homeProjectSlugs, localeOf, slugOf, sortProjects } from './project-model';

export type ProjectEntry = CollectionEntry<'projects'>;
export { slugOf, localeOf };

const all = await getCollection('projects');
const timelines = await getCollection('timeline');
const homes = await getCollection('home');
const published = new Set(all.filter((e) => !e.data.draft).map((e) => e.id));

let checked = false;

export async function getProjects(
  locale: Locale,
  opts: { includeDrafts?: boolean } = {},
): Promise<ProjectEntry[]> {
  if (!checked) {
    assertLocaleParity(all.map((e) => e.id)); // drafts included
    assertReferences(
      all.map((e) => e.id),
      all.map((e) => ({ id: e.id, related: e.data.related })),
      timelines.map((e) => ({ id: e.id, entries: e.data.entries })),
      homes.map((e) => ({ id: `home ${e.id}`, slugs: homeProjectSlugs(e.data) })),
    );
    checked = true;
  }
  return all
    .filter((e) => localeOf(e.id) === locale && (opts.includeDrafts || !e.data.draft))
    .sort((a, b) => sortProjects(a.data, b.data));
}

export async function getFeatured(locale: Locale): Promise<ProjectEntry[]> {
  return (await getProjects(locale)).filter((e) => e.data.featured);
}

export function hasProject(slug: string, locale: Locale): boolean {
  return published.has(`${locale}/${slug}`);
}
