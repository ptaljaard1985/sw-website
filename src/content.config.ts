import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    date: z.string(),
    author: z.string().default('Pierre Taljaard'),
    authorTitle: z.string().default('Certified Financial Planner'),
    authorPhoto: z.string().default('/images/headshot-pierre.webp'),
    authorBio: z.string().default(
      'Pierre is the founder of Simple Wealth and a Certified Financial Planner based on the KZN north coast. He is passionate about simplifying finance and helping families make confident decisions about their future.'
    ),
  }),
});

export const collections = { articles };
