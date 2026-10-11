import { describe, expect, it } from 'vitest';
import { brandPaths, brandTitle, phonesByBrand, phonesByYear, yearPaths, yearTitle } from '../src/lib/listing';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

const p = (slug: string, brand: string, pricePkr: number, releaseDate: string) =>
  makePhone({ slug, brand, releaseDate, variants: [makeVariant({ pricePkr })] });
const brand = (slug: string, name: string) => ({ slug, name, country: 'X', officialStoreUrl: null, warrantyNote: null });
const data: DataSet = {
  phones: [p('s-b', 'samsung', 60000, '2025-01-01'), p('s-a', 'samsung', 40000, '2024-05-01'), p('x-a', 'xiaomi', 40000, '2025-06-01'), p('x-b', 'xiaomi', 30000, '2025-06-01')],
  brands: [brand('samsung', 'Samsung'), brand('xiaomi', 'Xiaomi'), brand('nokia', 'Nokia')],
  brackets: [{ ceiling: 150000, intro: 'i', faq: [] }],
  presets: [],
};

describe('brand pages', () => {
  it('exist only for brands with phones', () => {
    expect(brandPaths(data).map((x) => x.params.brand)).toEqual(['samsung', 'xiaomi']);
  });
  it('list phones cheapest PTA first, ties by slug', () => {
    expect(phonesByBrand(data, 'samsung').map((x) => x.slug)).toEqual(['s-a', 's-b']);
  });
  it('have a price-intent title', () => {
    expect(brandTitle('Samsung', '2026-10-10')).toBe('Samsung mobile prices in Pakistan (Oct 2026)');
  });
});

describe('year pages', () => {
  it('exist only for release years with phones, newest first', () => {
    expect(yearPaths(data).map((x) => x.params.year)).toEqual(['2025', '2024']);
  });
  it('list phones newest release first, ties by slug', () => {
    expect(phonesByYear(data, 2025).map((x) => x.slug)).toEqual(['x-a', 'x-b', 's-b']);
  });
  it('have a title', () => {
    expect(yearTitle(2025)).toBe('Mobile phones released in 2025: Pakistan prices and scores');
  });
});

import { brandBrackets, brandIndexTitle, brandSummaries } from '../src/lib/listing';

describe('brand index', () => {
  const brackets = [50000, 60000, 150000].map((ceiling) => ({ ceiling, intro: 'i', faq: [] }));
  const withBrackets: DataSet = { ...data, brackets, presets: [{ slug: 'balanced', name: 'B', description: 'd', weights: { camera: 1 } }] };

  it('summarises each brand with phones: count, PTA price range and its best phone, biggest brand first', () => {
    expect(brandSummaries(withBrackets).map((s) => [s.brand.slug, s.count, s.minPrice, s.maxPrice, s.top.slug])).toEqual([
      ['samsung', 2, 40000, 60000, 's-a'],
      ['xiaomi', 2, 30000, 40000, 'x-b'],
    ]);
  });

  it('lists the budget brackets a brand has phones in', () => {
    expect(brandBrackets(withBrackets, 'samsung')).toEqual([50000, 60000]);
    expect(brandBrackets(withBrackets, 'xiaomi')).toEqual([50000]);
  });

  it('has a title with the check month', () => {
    expect(brandIndexTitle('2026-10-10')).toBe('Mobile phone brands in Pakistan: prices by brand (Oct 2026)');
  });
});
