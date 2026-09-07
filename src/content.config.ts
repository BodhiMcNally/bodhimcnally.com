import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
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
    browserR: z.boolean().default(true),
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

const updates = defineCollection({
  loader: glob({
    base: './src/content/updates',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z
    .object({
      title: z.string(),
      summary: z.string(),
      published: z.coerce.date().optional(),
      sortOrder: z.number().int().default(0),
      source: z.enum(['site', 'linkedin']).default('site'),
      linkedinUrl: z.url().optional(),
      linkedinEmbedUrl: z.url().optional(),
      collapsed: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .refine(
      (entry) => entry.source !== 'linkedin' || Boolean(entry.linkedinUrl),
      'LinkedIn updates require a linkedinUrl.',
    ),
});

export const collections = {
  resources,
  updates,
};
