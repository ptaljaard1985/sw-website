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
      'Pierre has over 15 years of experience helping individuals and families build, protect, and grow their wealth. As a Certified Financial Planner and founder of Simple Wealth, he believes in straightforward advice and long-term thinking.'
    ),
  }),
});

export const collections = { articles };
