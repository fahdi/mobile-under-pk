import { SCORE_KEYS, type Phone, type ScoreKey, type Scores } from '../schema/phone';

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

export const SCORE_NAMES: Record<ScoreKey, string> = {
  camera: 'camera', performance: 'performance', battery: 'battery life', display: 'display',
  build: 'build', software: 'software updates', value: 'value for money', availability: 'availability',
};

const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

// A clear win is 2 or more points on one score.
export function verdict(nameA: string, a: Scores, nameB: string, b: Scores): string {
  const winsA = SCORE_KEYS.filter((k) => a[k].value - b[k].value >= 2).map((k) => SCORE_NAMES[k]);
  const winsB = SCORE_KEYS.filter((k) => b[k].value - a[k].value >= 2).map((k) => SCORE_NAMES[k]);
  if (!winsA.length && !winsB.length) return `Too close to call: ${nameA} and ${nameB} are within a point of each other on every score.`;
  if (!winsB.length) return `Pick ${nameA} for ${list(winsA)}; ${nameB} has no clear win.`;
  if (!winsA.length) return `Pick ${nameB} for ${list(winsB)}; ${nameA} has no clear win.`;
  return `Pick ${nameA} for ${list(winsA)}; pick ${nameB} for ${list(winsB)}.`;
}

export type CompareProps = { kind: 'page'; a: string; b: string } | { kind: 'redirect'; to: string };

export function comparePaths(phones: Phone[]): Array<{ params: { pair: string }; props: CompareProps }> {
  return comparePairs(phones).flatMap(([a, b]) => [
    { params: { pair: pairSlug(a, b) }, props: { kind: 'page' as const, a, b } },
    { params: { pair: pairSlug(b, a) }, props: { kind: 'redirect' as const, to: pairSlug(a, b) } },
  ]);
}
