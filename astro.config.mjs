import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://portfolio.flode.net',
  output: 'static',
  i18n: {
    defaultLocale: 'nb',
    locales: ['nb', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'nb', locales: { nb: 'nb', en: 'en' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
