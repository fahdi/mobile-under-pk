import { describe, expect, it } from 'vitest';
import { canonicalPair, comparePairs, pairSlug } from '../src/lib/compare';
import { makePhone } from './fixtures/phone';

describe('compare pairs', () => {
  it('orders alphabetically by slug', () => {
    expect(canonicalPair('xiaomi-x', 'oppo-y')).toEqual(['oppo-y', 'xiaomi-x']);
    expect(pairSlug('a', 'b')).toBe('a-vs-b');
  });
  it('dedupes symmetric rivals and keeps asymmetric ones once', () => {
    const phones = [
      makePhone({ slug: 'a', rivals: ['b', 'c'] }),
      makePhone({ slug: 'b', rivals: ['a'] }),
      makePhone({ slug: 'c', rivals: [] }),
    ];
    expect(comparePairs(phones)).toEqual([['a', 'b'], ['a', 'c']]);
  });
});
