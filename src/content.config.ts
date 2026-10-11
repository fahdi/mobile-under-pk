import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { BlogFrontmatterSchema } from './lib/blog';

// Posts live with the data, so tests can point DATA_ROOT at a fixture tree.
export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '*.md', base: `${process.env.DATA_ROOT ?? '.'}/data/blog` }),
    schema: BlogFrontmatterSchema,
  }),
};
