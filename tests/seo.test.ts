import { describe, expect, it } from 'vitest';
import { absUrl, breadcrumbLd, faqLd, itemListLd, productLd } from '../src/lib/seo';
import { makePhone, makeVariant } from './fixtures/phone';

const site = 'https://fahdi.github.io';
const base = '/mobile-under-pk/';

describe('absUrl', () => {
  it('builds an absolute URL with the base path once and a trailing slash', () => {
    expect(absUrl('/phones/x', site, base)).toBe('https://fahdi.github.io/mobile-under-pk/phones/x/');
    expect(absUrl('/', site, base)).toBe('https://fahdi.github.io/mobile-under-pk/');
  });
});

describe('breadcrumbLd', () => {
  it('numbers positions from 1 with absolute URLs', () => {
    const ld = breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Phones', path: '/phones/x/' }], site, base) as any;
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement.map((i: any) => [i.position, i.item])).toEqual([
      [1, 'https://fahdi.github.io/mobile-under-pk/'],
      [2, 'https://fahdi.github.io/mobile-under-pk/phones/x/'],
    ]);
  });
});

describe('productLd', () => {
  it('offers PKR prices from PTA variants only', () => {
    const p = makePhone({ variants: [
      makeVariant({ pricePkr: 30000, pta: false, warranty: 'none' }),
      makeVariant({ pricePkr: 45000 }),
      makeVariant({ pricePkr: 52000, storage: 256 }),
    ] });
    const ld = productLd(p, { name: 'Samsung Galaxy A55', brandName: 'Samsung', url: 'https://x/' }) as any;
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('Samsung Galaxy A55');
    expect(ld.brand).toEqual({ '@type': 'Brand', name: 'Samsung' });
    expect(ld.offers).toMatchObject({ '@type': 'AggregateOffer', priceCurrency: 'PKR', lowPrice: 45000, highPrice: 52000, offerCount: 2 });
  });
  it('marks discontinued phones as discontinued and limited as limited availability', () => {
    expect((productLd(makePhone({ status: 'discontinued' }), { name: 'n', brandName: 'b', url: 'u' }) as any).offers.availability).toBe('https://schema.org/Discontinued');
    expect((productLd(makePhone({ status: 'limited' }), { name: 'n', brandName: 'b', url: 'u' }) as any).offers.availability).toBe('https://schema.org/LimitedAvailability');
    expect((productLd(makePhone(), { name: 'n', brandName: 'b', url: 'u' }) as any).offers.availability).toBe('https://schema.org/InStock');
  });
});

describe('itemListLd and faqLd', () => {
  it('builds an ordered ItemList', () => {
    const ld = itemListLd([{ name: 'A', url: 'https://x/a/' }, { name: 'B', url: 'https://x/b/' }]) as any;
    expect(ld.itemListElement.map((i: any) => [i.position, i.name, i.url])).toEqual([[1, 'A', 'https://x/a/'], [2, 'B', 'https://x/b/']]);
  });
  it('maps q and a to Question and acceptedAnswer', () => {
    const ld = faqLd([{ q: 'Is it PTA?', a: 'Yes.' }]) as any;
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Is it PTA?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } });
  });
});
