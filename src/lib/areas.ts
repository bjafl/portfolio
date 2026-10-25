import type { Locale } from '../i18n/routes';

export const AREAS = ['frontend', 'backend', 'data', 'devops', 'ai', 'security'] as const;
export type Area = (typeof AREAS)[number];

const LABELS: Record<Area, Record<Locale, string>> = {
  frontend: { nb: 'Frontend', en: 'Frontend' },
  backend: { nb: 'Backend og API', en: 'Backend & APIs' },
  data: { nb: 'Data og migrering', en: 'Data & migration' },
  devops: { nb: 'Linux og DevOps', en: 'Linux & DevOps' },
  ai: { nb: 'AI og ML', en: 'AI & ML' },
  security: { nb: 'Sikkerhet', en: 'Security' },
};

export function areaLabel(area: Area, locale: Locale): string {
  return LABELS[area][locale];
}
