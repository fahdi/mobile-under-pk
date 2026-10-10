import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, matchesFilters, sortEntries } from '../src/lib/filters';
import type { IndexEntry } from '../src/lib/index-entry';

const e = (o: Partial<IndexEntry> = {}): IndexEntry => ({
  slug: 'a', name: 'A', brand: 'samsung', price: 40000, ptaPrice: 45000, officialWarranty: true,
  status: 'available', year: 2025, releaseDate: '2025-02-01', fiveG: true, nfc: false, jack: true,
  mah: 5000, hz: 120, image: '/images/phones/a.webp', scores: [7, 6, 7, 8, 8, 9, 6, 9], ...o,
});

describe('matchesFilters', () => {
  it('default state matches everything', () => {
    expect(matchesFilters(e(), DEFAULT_STATE)).toBe(true);
  });
  it('price range uses PTA price when pta is on, any price otherwise', () => {
    expect(matchesFilters(e(), { ...DEFAULT_STATE, max: 42000 })).toBe(true);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, max: 42000, pta: true })).toBe(false);
  });
  it('min is inclusive and max is inclusive', () => {
    expect(matchesFilters(e(), { ...DEFAULT_STATE, min: 40000, max: 40000 })).toBe(true);
  });
  it('brand, year, status and flags narrow', () => {
    expect(matchesFilters(e(), { ...DEFAULT_STATE, brands: ['xiaomi'] })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, years: [2024] })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, statuses: ['discontinued'] })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, nfc: true })).toBe(false);
    expect(matchesFilters(e({ officialWarranty: false }), { ...DEFAULT_STATE, official: true })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, battery: 5000, hz: 120 })).toBe(true);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, battery: 5001 })).toBe(false);
  });
});

describe('sortEntries', () => {
  const presets = [{ slug: 'balanced', name: 'B', description: 'd', weights: { camera: 1 } }];
  it('sorts by overall with price tie-break, and by price ascending', () => {
    const list = [e({ slug: 'x', scores: [8, 1, 1, 1, 1, 1, 1, 1], ptaPrice: 50000 }), e({ slug: 'y', scores: [8, 1, 1, 1, 1, 1, 1, 1], ptaPrice: 30000 }), e({ slug: 'z', scores: [9, 1, 1, 1, 1, 1, 1, 1] })];
    expect(sortEntries(list, DEFAULT_STATE, presets).map((x) => x.slug)).toEqual(['z', 'y', 'x']);
    expect(sortEntries(list, { ...DEFAULT_STATE, sort: 'price' }, presets).map((x) => x.slug)).toEqual(['y', 'z', 'x']);
  });
  it('custom weights override the preset', () => {
    const list = [e({ slug: 'cam', scores: [9, 1, 1, 1, 1, 1, 1, 1] }), e({ slug: 'bat', scores: [1, 1, 9, 1, 1, 1, 1, 1] })];
    expect(sortEntries(list, { ...DEFAULT_STATE, weights: { battery: 1 } }, presets)[0].slug).toBe('bat');
  });
  it('safe-buy drops phones without an official PTA warranty', () => {
    const safe = [...presets, { slug: 'safe-buy', name: 'S', description: 'd', weights: { availability: 1 }, requireOfficialWarranty: true }];
    const list = [e({ slug: 'shop', officialWarranty: false }), e({ slug: 'official' })];
    expect(sortEntries(list, { ...DEFAULT_STATE, preset: 'safe-buy' }, safe).map((x) => x.slug)).toEqual(['official']);
  });
  it('ignores custom weights that are all zero instead of throwing', () => {
    expect(() => sortEntries([e()], { ...DEFAULT_STATE, weights: { camera: 0 } }, presets)).not.toThrow();
  });
  it('falls back to balanced for an unknown preset', () => {
    expect(() => sortEntries([e()], { ...DEFAULT_STATE, preset: 'nope' }, presets)).not.toThrow();
  });
});
