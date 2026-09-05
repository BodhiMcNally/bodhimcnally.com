import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const resources = defineCollection({
  loader: glob({
    base: './src/content/resources',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum([
      'Statistics',
      'R',
      'Data Science',
      'Visualisation',
      'Reproducible Research',
      'Statistical Thinking',
    ]),
    tags: z.array(z.string()).default([]),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    level: z.enum(['Introductory', 'Intermediate', 'Advanced']),
    software: z.array(z.string()).default([]),
    estimatedMinutes: z.number().int().positive(),
    featured: z.boolean().default(false),
    template: z.boolean().default(false),
    draft: z.boolean().default(false),
    downloadableAssets: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          description: z.string().optional(),
        }),
      )
      .default([]),
    externalRepository: z
      .object({
        label: z.string().default('View repository'),
        href: z.url(),
      })
      .optional(),
  }),
});

const leadership = defineCollection({
  loader: file('./src/data/leadership.json'),
  schema: z.object({
    organisation: z.string(),
    role: z.string(),
    period: z.string(),
    description: z.string(),
    themes: z.array(z.string()).default([]),
  }),
});

export const collections = {
  resources,
  leadership,
};
