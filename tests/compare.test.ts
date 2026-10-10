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

import { comparePaths, verdict } from '../src/lib/compare';
import type { Scores } from '../src/schema/phone';

const sc = (o: Partial<Record<keyof Scores, number>>): Scores => {
  const base = makePhone().scores;
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { ...v, value: o[k as keyof Scores] ?? 5 }])) as Scores;
};

describe('verdict', () => {
  it('names the clear wins (2 or more points) on each side', () => {
    expect(verdict('A', sc({ camera: 8, software: 9 }), 'B', sc({ battery: 8, value: 7 })))
      .toBe('Pick A for camera and software updates; pick B for battery life and value for money.');
  });
  it('handles a one-sided result', () => {
    expect(verdict('A', sc({ camera: 8, display: 9, build: 7 }), 'B', sc({})))
      .toBe('Pick A for camera, display and build; B has no clear win.');
  });
  it('calls it close when nothing differs by 2 or more', () => {
    expect(verdict('A', sc({ camera: 6 }), 'B', sc({ battery: 6 })))
      .toBe('Too close to call: A and B are within a point of each other on every score.');
  });
});

describe('comparePaths', () => {
  it('emits the canonical page and a redirect from the reverse order', () => {
    const phones = [makePhone({ slug: 'b', rivals: ['a'] }), makePhone({ slug: 'a', rivals: [] })];
    expect(comparePaths(phones)).toEqual([
      { params: { pair: 'a-vs-b' }, props: { kind: 'page', a: 'a', b: 'b' } },
      { params: { pair: 'b-vs-a' }, props: { kind: 'redirect', to: 'a-vs-b' } },
    ]);
  });
});
