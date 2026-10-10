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

import { intentSlug } from '../src/lib/landing';

describe('intent pages', () => {
  const s = (v: number) => ({ value: v, reason: 'reason text here' });
  const scored = (slug: string, price: number, camera: number, battery: number) =>
    makePhone({ slug, variants: [makeVariant({ pricePkr: price })], scores: { ...makePhone().scores, camera: s(camera), battery: s(battery) } });
  const presets = [
    balanced,
    { slug: 'camera-first', name: 'Camera', description: 'd', intent: 'camera', weights: { camera: 3 } },
    { slug: 'battery-first', name: 'Battery', description: 'd', intent: 'battery', weights: { battery: 3 } },
    { slug: 'gaming', name: 'Gaming', description: 'd', weights: { performance: 3 } },
  ];
  // Four phones in the 50,000 bracket; camera-first reorders the top 3, battery-first does not.
  const intentData: DataSet = {
    ...data,
    phones: [scored('p1', 41000, 5, 9), scored('p2', 42000, 6, 8), scored('p3', 43000, 7, 7), scored('p4', 44000, 10, 1), at('c', 18000)],
    presets,
  };

  it('builds the slug from the preset intent and the ceiling', () => {
    expect(intentSlug('camera', 60000)).toBe('best-camera-phone-under-60000');
  });

  it('emits an intent page only where the preset changes the top 3, and only for presets with an intent', () => {
    const intents = landingPaths(intentData).filter((p) => p.props.kind === 'intent');
    expect(intents).toEqual([
      { params: { landing: 'best-camera-phone-under-50000' }, props: { kind: 'intent', ceiling: 50000, preset: 'camera-first' } },
    ]);
  });

  it('never emits intent pages for brackets with fewer than 3 phones', () => {
    expect(landingPaths(intentData).some((p) => p.params.landing.endsWith('-under-20000'))).toBe(false);
  });
});
