export interface SiteConfig {
  name: string;
  github: string;
  email: string;
  linkedin: string | null;
}

export const site: SiteConfig = {
  name: 'Bjarte Flø Lode',
  github: 'https://github.com/bjafl',
  email: '__SET_EMAIL__',
  linkedin: '__SET_LINKEDIN__',
};

const isPlaceholder = (v: string | null): boolean => v !== null && v.startsWith('__SET_');

/** True once no contact value is still a `__SET_*` placeholder. */
export function isLaunchReady(cfg: SiteConfig = site): boolean {
  return ![cfg.github, cfg.email, cfg.linkedin].some(isPlaceholder);
}

/** A contact value that may be rendered: set, and not a placeholder. */
export function contactValue(v: string | null): string | null {
  return v && !isPlaceholder(v) ? v : null;
}
