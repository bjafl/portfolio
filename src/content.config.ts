import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { homeSchema, makeProjectSchema, timelineSchema } from './lib/project-model';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => makeProjectSchema(image),
});

// One file per locale (id `nb` / `en`); entries live under the `entries` key.
const timeline = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/timeline' }),
  schema: z.object({ entries: timelineSchema }),
});

// Front-page copy, one file per locale (id `nb` / `en`).
const home = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/home' }),
  schema: homeSchema,
});

// Standalone pages (id `nb/about`, `en/about`).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heading: z.string().optional(),
    lead: z.string().optional(),
    languages: z.array(z.string()).optional(),
    education: z
      .array(z.object({ institution: z.string(), period: z.string(), title: z.string(), detail: z.string() }))
      .optional(),
    now: z.string().optional(),
  }),
});

export const collections = { projects, timeline, home, pages };
