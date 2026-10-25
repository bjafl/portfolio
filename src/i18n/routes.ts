export type Locale = 'nb' | 'en';
export const LOCALES: readonly Locale[] = ['nb', 'en'];
export const DEFAULT_LOCALE: Locale = 'nb';

export type RouteKey = 'home' | 'projects' | 'project' | 'about';

const SEGMENTS = {
  projects: { nb: 'prosjekter', en: 'projects' },
  about: { nb: 'om', en: 'about' },
} as const;

type Parsed = { route: RouteKey; slug?: string };

function segmentsOf(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

function localeOf(segs: string[]): Locale {
  return segs[0] === 'en' ? 'en' : 'nb';
}

function parse(pathname: string): Parsed | null {
  const segs = segmentsOf(pathname);
  const locale = localeOf(segs);
  const rest = locale === 'en' ? segs.slice(1) : segs;
  if (rest.length === 0) return { route: 'home' };

  const [head, slug] = rest;
  if (head === SEGMENTS.projects[locale]) {
    return slug ? { route: 'project', slug } : { route: 'projects' };
  }
  if (head === SEGMENTS.about[locale]) return { route: 'about' };
  return null;
}

export function localizePath(key: RouteKey, locale: Locale, slug?: string): string {
  const base = locale === 'en' ? '/en' : '';
  switch (key) {
    case 'home':
      return `${base}/`;
    case 'projects':
      return `${base}/${SEGMENTS.projects[locale]}/`;
    case 'project':
      return slug
        ? `${base}/${SEGMENTS.projects[locale]}/${slug}/`
        : `${base}/${SEGMENTS.projects[locale]}/`;
    case 'about':
      return `${base}/${SEGMENTS.about[locale]}/`;
  }
}

export function getLocaleFromPath(pathname: string): Locale {
  return localeOf(segmentsOf(pathname));
}

export function alternatePath(
  pathname: string,
  target: Locale,
  available: (slug: string, locale: Locale) => boolean = () => true,
): string {
  const parsed = parse(pathname);
  if (!parsed) return localizePath('home', target);
  if (parsed.route === 'project' && parsed.slug) {
    return available(parsed.slug, target)
      ? localizePath('project', target, parsed.slug)
      : localizePath('projects', target);
  }
  return localizePath(parsed.route, target);
}
