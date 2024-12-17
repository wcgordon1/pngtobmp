import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    pubDate: z.date(),
    modDate: z.string(),
    author: z.string(),
    title: z.string(),
    description: z.string(),
    avatar: z.object({
      url: z.string(),
      alt: z.string()
    }),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }),
    tags: z.array(z.string()),
    words: z.number()
  })
});

export const collections = {
  blog
};