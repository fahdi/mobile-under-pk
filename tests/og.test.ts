import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { ogContent, ogPath } from '../src/lib/og';
import { renderOg } from '../src/lib/og-render';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

const phone = (slug: string, pricePkr: number, o = {}) => makePhone({ slug, model: slug.toUpperCase(), image: `/images/phones/${slug}.webp`, variants: [makeVariant({ pricePkr })], ...o });
const data: DataSet = {
  phones: [phone('a', 45000, { rivals: ['b'] }), phone('b', 48000), phone('c', 49000, { status: 'discontinued' })],
  brands: [{ slug: 'samsung', name: 'Samsung', country: 'KR', officialStoreUrl: null, warrantyNote: null }],
  brackets: [{ ceiling: 50000, intro: 'i', faq: [] }],
  presets: [{ slug: 'balanced', name: 'B', description: 'd', weights: { camera: 1 } }],
};

describe('ogPath', () => {
  it('maps each page to a PNG under /og/', () => {
    expect(ogPath('/')).toBe('/og/index.png');
    expect(ogPath('/phones/a/')).toBe('/og/phones/a.png');
    expect(ogPath('/mobile-under-50000-in-pakistan/')).toBe('/og/mobile-under-50000-in-pakistan.png');
  });
});

describe('ogContent', () => {
  it('phone: name, PTA price and its photo', () => {
    expect(ogContent(data, '/phones/a/')).toEqual({ title: 'Samsung A', subtitle: 'Price in Pakistan', price: 'Rs 45,000 PTA', images: ['/images/phones/a.webp'] });
  });
  it('bracket: headline, count and check date, top pick photos without discontinued', () => {
    expect(ogContent(data, '/mobile-under-50000-in-pakistan/')).toEqual({
      title: 'Best mobile under 50,000 in Pakistan', subtitle: '3 phones ranked, prices checked 10 Oct 2026',
      images: ['/images/phones/a.webp', '/images/phones/b.webp'],
    });
  });
  it('compare: both names and both photos', () => {
    expect(ogContent(data, '/compare/a-vs-b/')).toMatchObject({ title: 'Samsung A vs Samsung B', images: ['/images/phones/a.webp', '/images/phones/b.webp'] });
  });
  it('brand, year, hub and finder have their own headlines', () => {
    expect(ogContent(data, '/brands/samsung/').title).toBe('Samsung mobile prices in Pakistan');
    expect(ogContent(data, '/year/2024/').title).toBe('Phones released in 2024');
    expect(ogContent(data, '/').title).toBe('Best mobile phones in Pakistan by budget');
    expect(ogContent(data, '/finder/').title).toBe('Find your phone');
  });
  it('throws for a path with no page', () => {
    expect(() => ogContent(data, '/phones/nope/')).toThrow(/no OG content/);
  });
});

describe('renderOg', () => {
  it('renders a 1200x630 PNG with text and a phone photo', async () => {
    const png = await renderOg({ title: 'Samsung Galaxy A55', subtitle: 'Price in Pakistan', price: 'Rs 120,000 PTA', images: ['/images/phones/samsung-galaxy-a55.webp'] }, 'tests/fixtures/data-ok/public');
    const meta = await sharp(png).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['png', 1200, 630]);
  });
  it('renders without photos', async () => {
    const png = await renderOg({ title: 'Find your phone', subtitle: 'Filter and rank', images: [] }, 'tests/fixtures/data-ok/public');
    expect((await sharp(png).metadata()).width).toBe(1200);
  });
});
