import { describe, expect, it } from 'vitest';
import { toIndexEntry } from '../src/lib/index-entry';
import { SCORE_KEYS } from '../src/schema/phone';
import { makePhone, makeVariant } from './fixtures/phone';

describe('toIndexEntry', () => {
  it('separates the cheapest price from the cheapest PTA price', () => {
    const p = makePhone({ variants: [
      makeVariant({ pricePkr: 35000, pta: false, warranty: 'none' }),
      makeVariant({ pricePkr: 45000, warranty: 'local-shop' }),
      makeVariant({ pricePkr: 52000, storage: 256 }),
    ] });
    const e = toIndexEntry(p, 'Samsung');
    expect([e.price, e.ptaPrice]).toEqual([35000, 45000]);
    expect(e.officialWarranty).toBe(true);
  });

  it('says no official warranty when only the non-PTA variant has one', () => {
    const p = makePhone({ variants: [makeVariant({ pta: false, warranty: 'official', pricePkr: 30000 }), makeVariant({ warranty: 'local-shop' })] });
    expect(toIndexEntry(p, 'Samsung').officialWarranty).toBe(false);
  });

  it('carries name, image, flags and scores in SCORE_KEYS order', () => {
    const e = toIndexEntry(makePhone(), 'Samsung');
    expect(e).toMatchObject({ slug: 'samsung-galaxy-a55', name: 'Samsung Galaxy A55', brand: 'samsung', year: 2024,
      releaseDate: '2024-03-11', status: 'available', fiveG: true, nfc: true, jack: false, mah: 5000, hz: 120,
      image: '/images/phones/samsung-galaxy-a55.webp' });
    expect(e.scores).toEqual(SCORE_KEYS.map((k) => makePhone().scores[k].value));
  });

  it('keeps 70 phones under the 60 KB budget', () => {
    const entries = Array.from({ length: 70 }, (_, i) =>
      toIndexEntry(makePhone({ slug: `brand-model-name-number-${i}`, model: `Model Name Number ${i} Pro Max` }), 'Samsung'));
    expect(JSON.stringify(entries).length).toBeLessThan(60_000);
  });
});
