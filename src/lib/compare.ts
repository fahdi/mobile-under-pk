import type { Phone } from '../schema/phone';

export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function pairSlug(a: string, b: string): string {
  return `${a}-vs-${b}`;
}

export function comparePairs(phones: Phone[]): Array<[string, string]> {
  const seen = new Map<string, [string, string]>();
  for (const p of phones) {
    for (const r of p.rivals) {
      const pair = canonicalPair(p.slug, r);
      seen.set(pair.join('|'), pair);
    }
  }
  return [...seen.values()].sort((x, y) => x.join('|').localeCompare(y.join('|')));
}
