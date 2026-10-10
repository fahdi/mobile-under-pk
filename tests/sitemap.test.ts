import { describe, expect, it } from 'vitest';
import { sitemapPaths, sitemapXml } from '../src/lib/sitemap';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

const data: DataSet = {
  phones: [
    makePhone({ slug: 'a', rivals: ['b'], variants: [makeVariant({ pricePkr: 45000 })] }),
    makePhone({ slug: 'b', rivals: ['a'], releaseDate: '2025-02-01', variants: [makeVariant({ pricePkr: 48000 })] }),
  ],
  brands: [{ slug: 'samsung', name: 'Samsung', country: 'KR', officialStoreUrl: null, warrantyNote: null },
    { slug: 'apple', name: 'Apple', country: 'US', officialStoreUrl: null, warrantyNote: null }],
  brackets: [20000, 50000].map((ceiling) => ({ ceiling, intro: 'i', faq: [] })),
  presets: [],
};

describe('sitemapPaths', () => {
  it('lists every canonical page once and nothing else', () => {
    expect(sitemapPaths(data).sort()).toEqual([
      '/', '/brands/samsung/', '/compare/a-vs-b/', '/finder/', '/mobile-under-50000-in-pakistan/',
      '/phones/a/', '/phones/b/', '/year/2024/', '/year/2025/',
    ]);
  });
});

describe('sitemapXml', () => {
  it('writes absolute URLs with the base path and escapes XML', () => {
    const xml = sitemapXml(['/', '/phones/a&b/'], 'https://fahdi.github.io', '/mobile-under-pk/', '2026-10-10');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://fahdi.github.io/mobile-under-pk/</loc>');
    expect(xml).toContain('<loc>https://fahdi.github.io/mobile-under-pk/phones/a&amp;b/</loc>');
    expect(xml).toContain('<lastmod>2026-10-10</lastmod>');
  });
});
