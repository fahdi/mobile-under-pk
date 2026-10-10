import { describe, expect, it } from 'vitest';
import { overallScore, rankPhones, topPicks } from '../src/lib/scoring';
import { makePhone, makeVariant } from './fixtures/phone';
import type { Preset } from '../src/schema/data';

const balanced: Preset = { slug: 'balanced', name: 'B', description: 'd',
  weights: { camera: 1, performance: 1, battery: 1, display: 1, build: 1, software: 1, value: 1.25, availability: 1.25 } };
const s = (v: number) => ({ value: v, reason: 'reason text here' });
const uniform = (v: number) => ({ camera: s(v), performance: s(v), battery: s(v), display: s(v), build: s(v), software: s(v), value: s(v), availability: s(v) });

describe('overallScore', () => {
  it('is the weighted mean rounded to one decimal', () => {
    // fixture scores 7,6,7,8,8,9,6,9 with weights 1 x6, 1.25 x2: (45 + 7.5 + 11.25) / 8.5 = 7.5
    expect(overallScore(makePhone().scores, balanced.weights)).toBe(7.5);
  });
  it('treats missing weights as zero', () => {
    expect(overallScore(makePhone().scores, { camera: 1 })).toBe(7);
  });
  it('throws on all-zero weights', () => {
    expect(() => overallScore(makePhone().scores, { camera: 0 })).toThrow();
  });
});

describe('rankPhones', () => {
  it('sorts by overall descending', () => {
    const a = makePhone({ slug: 'a', scores: uniform(6) });
    const b = makePhone({ slug: 'b', scores: uniform(8) });
    expect(rankPhones([a, b], balanced).map((r) => r.phone.slug)).toEqual(['b', 'a']);
  });
  it('breaks ties by cheaper PTA price, then newer release, then slug', () => {
    const cheap = makePhone({ slug: 'cheap', scores: uniform(7), variants: [makeVariant({ pricePkr: 40000 })] });
    const dear = makePhone({ slug: 'dear', scores: uniform(7), variants: [makeVariant({ pricePkr: 45000 }), makeVariant({ pricePkr: 30000, pta: false })] });
    const newer = makePhone({ slug: 'newer', scores: uniform(7), releaseDate: '2026-01-01', variants: [makeVariant({ pricePkr: 45000 })] });
    const zed = makePhone({ slug: 'zed', scores: uniform(7), releaseDate: '2026-01-01', variants: [makeVariant({ pricePkr: 45000 })] });
    expect(rankPhones([zed, dear, newer, cheap], balanced).map((r) => r.phone.slug)).toEqual(['cheap', 'newer', 'zed', 'dear']);
  });
  it('safe-buy drops phones without an official-warranty PTA variant', () => {
    const safe: Preset = { ...balanced, slug: 'safe-buy', requireOfficialWarranty: true };
    const shop = makePhone({ slug: 'shop', variants: [makeVariant({ warranty: 'local-shop' })] });
    expect(rankPhones([shop, makePhone()], safe).map((r) => r.phone.slug)).toEqual(['samsung-galaxy-a55']);
  });
});

describe('topPicks', () => {
  it('skips discontinued phones', () => {
    const gone = makePhone({ slug: 'gone', status: 'discontinued', scores: uniform(10) });
    const ok = makePhone({ slug: 'ok', scores: uniform(5) });
    expect(topPicks([gone, ok], balanced).map((r) => r.phone.slug)).toEqual(['ok']);
  });
});
