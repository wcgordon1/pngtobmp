import { defineCollection, z } from 'astro:content';

const converters = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  'converters': converters,
};