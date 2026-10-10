import { SCORE_KEYS, type ScoreKey, type Scores, type Status } from '../schema/phone';
import type { Preset, Weights } from '../schema/data';
import type { IndexEntry } from './index-entry';
import { overallScore } from './scoring';

export type SortKey = 'overall' | 'price' | 'release' | ScoreKey;

export interface FinderState {
  min?: number; max?: number;
  brands: string[]; years: number[]; statuses: Status[];
  pta: boolean; official: boolean; fiveG: boolean; nfc: boolean; jack: boolean;
  battery?: number; hz?: number;
  sort: SortKey; preset: string; weights?: Weights;
}

export const DEFAULT_STATE: FinderState = {
  brands: [], years: [], statuses: [],
  pta: false, official: false, fiveG: false, nfc: false, jack: false,
  sort: 'overall', preset: 'balanced',
};

export function matchesFilters(e: IndexEntry, s: FinderState): boolean {
  const price = s.pta ? e.ptaPrice : e.price;
  return (s.min === undefined || price >= s.min)
    && (s.max === undefined || price <= s.max)
    && (!s.brands.length || s.brands.includes(e.brand))
    && (!s.years.length || s.years.includes(e.year))
    && (!s.statuses.length || s.statuses.includes(e.status))
    && (!s.official || e.officialWarranty)
    && (!s.fiveG || e.fiveG) && (!s.nfc || e.nfc) && (!s.jack || e.jack)
    && (s.battery === undefined || e.mah >= s.battery)
    && (s.hz === undefined || e.hz >= s.hz);
}

const asScores = (values: number[]) =>
  Object.fromEntries(SCORE_KEYS.map((k, i) => [k, { value: values[i], reason: '' }])) as Scores;
const hasWeight = (w?: Weights) => !!w && Object.values(w).some((v) => (v ?? 0) > 0);

export function sortEntries(es: IndexEntry[], s: FinderState, presets: Preset[]): Array<IndexEntry & { overall: number }> {
  const preset = presets.find((p) => p.slug === s.preset) ?? presets.find((p) => p.slug === 'balanced') ?? presets[0];
  const weights = hasWeight(s.weights) ? s.weights! : preset.weights;
  const tie = (a: IndexEntry, b: IndexEntry) => a.ptaPrice - b.ptaPrice
    || b.releaseDate.localeCompare(a.releaseDate) || a.slug.localeCompare(b.slug);
  const by: Record<string, (a: IndexEntry & { overall: number }, b: IndexEntry & { overall: number }) => number> = {
    overall: (a, b) => b.overall - a.overall,
    price: (a, b) => a.ptaPrice - b.ptaPrice,
    release: (a, b) => b.releaseDate.localeCompare(a.releaseDate),
  };
  const cmp = by[s.sort] ?? ((a, b) => b.scores[SCORE_KEYS.indexOf(s.sort as ScoreKey)] - a.scores[SCORE_KEYS.indexOf(s.sort as ScoreKey)]);
  return es
    .filter((e) => !preset.requireOfficialWarranty || e.officialWarranty)
    .map((e) => ({ ...e, overall: overallScore(asScores(e.scores), weights) }))
    .sort((a, b) => cmp(a, b) || tie(a, b));
}
