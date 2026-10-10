import { describe, expect, it } from 'vitest';
import { formatDate, formatPkr, latestCheck, phoneName } from '../src/lib/format';
import { makePhone, makeVariant } from './fixtures/phone';

describe('formatPkr', () => {
  it('groups thousands with an Rs prefix', () => {
    expect(formatPkr(119999)).toBe('Rs 119,999');
    expect(formatPkr(45000)).toBe('Rs 45,000');
    expect(formatPkr(500)).toBe('Rs 500');
  });
});

describe('formatDate', () => {
  it('renders an ISO date as day, short month, year without timezone drift', () => {
    expect(formatDate('2026-10-10')).toBe('10 Oct 2026');
    expect(formatDate('2026-01-01')).toBe('1 Jan 2026');
  });
});

describe('latestCheck', () => {
  it('returns the newest priceCheckedAt across all variants of all phones', () => {
    const a = makePhone({ variants: [makeVariant({ priceCheckedAt: '2026-09-01' }), makeVariant({ priceCheckedAt: '2026-10-02' })] });
    const b = makePhone({ variants: [makeVariant({ priceCheckedAt: '2026-09-30' })] });
    expect(latestCheck([a, b])).toBe('2026-10-02');
  });
  it('is undefined with no phones', () => {
    expect(latestCheck([])).toBeUndefined();
  });
});

describe('phoneName', () => {
  const brands = [{ slug: 'samsung', name: 'Samsung', country: 'South Korea', officialStoreUrl: null, warrantyNote: null }];
  it('prefixes the brand display name', () => {
    expect(phoneName(makePhone(), brands)).toBe('Samsung Galaxy A55');
  });
  it('does not double the brand when the model already starts with it', () => {
    expect(phoneName(makePhone({ model: 'Samsung Galaxy A55' }), brands)).toBe('Samsung Galaxy A55');
  });
});
