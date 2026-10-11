import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { parse as parseYaml } from 'yaml';
import { SourceSchema } from '../schema/phone';
import type { Issue } from './load';

export const BlogFrontmatterSchema = z.strictObject({
  title: z.string().min(10).max(110),
  description: z.string().min(50).max(160),
  publishedAt: z.iso.date(),
  updatedAt: z.iso.date().optional(),
  sources: z.array(SourceSchema).min(1),
}).refine((f) => !f.updatedAt || f.updatedAt >= f.publishedAt, { message: 'updatedAt is before publishedAt', path: ['updatedAt'] });

export type BlogFrontmatter = z.infer<typeof BlogFrontmatterSchema>;
export interface BlogPost { slug: string; frontmatter: BlogFrontmatter; body: string }

export function parsePost(file: string, text: string): BlogPost {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const r = BlogFrontmatterSchema.safeParse(parseYaml(m[1]));
  if (!r.success) throw new Error(`${file}: ${r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}`);
  return { slug: file.replace(/\.md$/, ''), frontmatter: r.data, body: m[2] };
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}


// Posts live with the data so a DATA_ROOT tree (tests) brings its own.
export function loadPosts(root: string): { posts: BlogPost[]; issues: Issue[] } {
  const dir = join(root, 'data/blog');
  if (!existsSync(dir)) return { posts: [], issues: [] };
  const posts: BlogPost[] = [];
  const issues: Issue[] = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
    try { posts.push(parsePost(f, readFileSync(join(dir, f), 'utf8'))); }
    catch (err) { issues.push({ level: 'error', file: `data/blog/${f}`, message: (err as Error).message }); }
  }
  posts.sort((a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt) || a.slug.localeCompare(b.slug));
  return { posts, issues };
}
