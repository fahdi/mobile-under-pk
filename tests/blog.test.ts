import { describe, expect, it } from 'vitest';
import { BlogFrontmatterSchema, parsePost, readingMinutes } from '../src/lib/blog';

const valid = {
  title: 'What are JV phones?',
  description: 'What JV phones are in Pakistan and why we do not list them.',
  publishedAt: '2026-10-11',
  sources: [{ name: 'PTA', url: 'https://www.pta.gov.pk/' }],
};

describe('BlogFrontmatterSchema', () => {
  it('accepts a complete post', () => {
    expect(BlogFrontmatterSchema.safeParse(valid).success).toBe(true);
  });
  it('requires at least one source', () => {
    expect(BlogFrontmatterSchema.safeParse({ ...valid, sources: [] }).success).toBe(false);
  });
  it('keeps descriptions to search-snippet length', () => {
    expect(BlogFrontmatterSchema.safeParse({ ...valid, description: 'x'.repeat(161) }).success).toBe(false);
  });
  it('rejects a bad date and an updatedAt before publishedAt', () => {
    expect(BlogFrontmatterSchema.safeParse({ ...valid, publishedAt: '11/10/2026' }).success).toBe(false);
    expect(BlogFrontmatterSchema.safeParse({ ...valid, updatedAt: '2026-10-01' }).success).toBe(false);
  });
});

describe('parsePost', () => {
  it('splits frontmatter and body and derives the slug from the file name', () => {
    const post = parsePost('what-are-jv-phones.md', `---\ntitle: "${valid.title}"\ndescription: "${valid.description}"\npublishedAt: "2026-10-11"\nsources:\n  - name: PTA\n    url: https://www.pta.gov.pk/\n---\n\n## Heading\n\nBody text.\n`);
    expect(post.slug).toBe('what-are-jv-phones');
    expect(post.frontmatter.title).toBe(valid.title);
    expect(post.body.trim()).toBe('## Heading\n\nBody text.');
  });
  it('names the file and the problem when frontmatter is invalid', () => {
    expect(() => parsePost('bad.md', '---\ntitle: x\n---\nbody')).toThrow(/bad\.md/);
  });
});

describe('readingMinutes', () => {
  it('rounds up at about 200 words a minute', () => {
    expect(readingMinutes('word '.repeat(450))).toBe(3);
    expect(readingMinutes('short')).toBe(1);
  });
});

import { loadPosts } from '../src/lib/blog';

describe('loadPosts', () => {
  it('loads the posts under a data root, newest first', () => {
    const { posts, issues } = loadPosts('tests/fixtures/site-data');
    expect(issues).toEqual([]);
    expect(posts.map((p) => p.slug)).toEqual(['fixture-post']);
  });
  it('returns no posts and no issues when there is no blog folder', () => {
    expect(loadPosts('tests/fixtures/data-ok')).toEqual({ posts: [], issues: [] });
  });
});

describe('published posts', () => {
  const { posts, issues } = loadPosts('.');

  it('all parse', () => {
    expect(issues).toEqual([]);
  });

  it('include the JV phones post, substantial and well sourced', () => {
    const jv = posts.find((p) => p.slug === 'what-are-jv-phones-in-pakistan');
    expect(jv).toBeDefined();
    expect(jv!.frontmatter.sources.length).toBeGreaterThanOrEqual(6);
    expect(jv!.body.split(/\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(600);
  });

  it.each(posts.map((p) => [p.slug, p]))('%s has no em or en dashes', (_, p) => {
    expect(JSON.stringify(p)).not.toMatch(/[–—]/);
  });
});
