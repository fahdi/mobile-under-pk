import { describe, expect, it } from 'vitest';
import { bracketDescription, bracketTitle, landingPaths, neighbours, phonesInBracket, pickReason } from '../src/lib/landing';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

const at = (slug: string, pricePkr: number, o = {}) => makePhone({ slug, model: slug.toUpperCase(), variants: [makeVariant({ pricePkr })], ...o });
const balanced = { slug: 'balanced', name: 'Balanced', description: 'd', weights: { camera: 1, performance: 1, battery: 1, display: 1, build: 1, software: 1, value: 1.25, availability: 1.25 } };
const data: DataSet = {
  phones: [at('a', 45000), at('b', 50000), at('c', 18000), at('d', 120000)],
  brands: [{ slug: 'samsung', name: 'Samsung', country: 'KR', officialStoreUrl: null, warrantyNote: null }],
  brackets: [20000, 40000, 50000, 60000, 150000].map((ceiling) => ({ ceiling, intro: 'i', faq: [] })),
  presets: [balanced],
};

describe('landingPaths', () => {
  it('emits one page per non-empty bracket, skipping empty ones', () => {
    expect(landingPaths(data).map((p) => p.params.landing)).toEqual([
      'mobile-under-20000-in-pakistan', 'mobile-under-50000-in-pakistan', 'mobile-under-150000-in-pakistan',
    ]);
    expect(landingPaths(data)[1].props).toEqual({ kind: 'bracket', ceiling: 50000 });
  });
});

describe('phonesInBracket', () => {
  it('returns phones whose cheapest PTA price lands in that bracket', () => {
    expect(phonesInBracket(data, 50000).map((p) => p.slug)).toEqual(['a', 'b']);
    expect(phonesInBracket(data, 40000)).toEqual([]);
  });
});

describe('neighbours', () => {
  it('links past empty brackets to the nearest non-empty ones', () => {
    expect(neighbours(data, 50000)).toEqual({ prev: 20000, next: 150000 });
    expect(neighbours(data, 20000)).toEqual({ prev: undefined, next: 50000 });
    expect(neighbours(data, 150000)).toEqual({ prev: 50000, next: undefined });
  });
});

describe('pickReason', () => {
  it('uses the reason of the score that contributes most under the preset', () => {
    // fixture: software 9 and availability 9 tie on value; availability weighs 1.25 so it wins
    expect(pickReason(makePhone(), balanced)).toBe(makePhone().scores.availability.reason);
    expect(pickReason(makePhone(), { ...balanced, weights: { camera: 3 } })).toBe(makePhone().scores.camera.reason);
  });
});

describe('bracketTitle and bracketDescription', () => {
  it('formats the ceiling and the check month', () => {
    expect(bracketTitle(50000, '2026-10-10')).toBe('Mobile under 50,000 in Pakistan: best phones (Oct 2026)');
  });
  it('summarises count, check date and top picks', () => {
    expect(bracketDescription(50000, 7, '2026-10-10', ['Samsung A', 'Samsung B', 'Samsung C'])).toBe(
      'Compare 7 phones under Rs 50,000 in Pakistan with PTA prices checked 10 Oct 2026. Top picks: Samsung A, Samsung B and Samsung C.',
    );
  });
  it('reads naturally with a single pick', () => {
    expect(bracketDescription(50000, 1, '2026-10-10', ['Samsung A'])).toBe(
      'Compare 1 phone under Rs 50,000 in Pakistan with PTA prices checked 10 Oct 2026. Top pick: Samsung A.',
    );
  });
});
