import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { makeProjectSchema, timelineSchema } from './lib/project-model';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => makeProjectSchema(image),
});

// One file per locale (id `nb` / `en`); entries live under the `entries` key.
const timeline = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/timeline' }),
  schema: z.object({ entries: timelineSchema }),
});

// Standalone pages (id `nb/about`, `en/about`).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { projects, timeline, pages };
