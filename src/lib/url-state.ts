import { SCORE_KEYS, STATUSES, RELEASE_YEARS, type ScoreKey, type Status } from '../schema/phone';
import type { Weights } from '../schema/data';
import { DEFAULT_STATE, type FinderState, type SortKey } from './filters';

const SORTS: readonly string[] = ['overall', 'price', 'release', ...SCORE_KEYS];
const posInt = (v: string | null) => (v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : undefined);
const list = (v: string | null) => (v ?? '').split(',').filter(Boolean);

export function toQuery(s: FinderState): string {
  const q = new URLSearchParams();
  if (s.min !== undefined) q.set('min', String(s.min));
  if (s.max !== undefined) q.set('max', String(s.max));
  if (s.brands.length) q.set('brand', s.brands.join(','));
  if (s.years.length) q.set('year', s.years.join(','));
  if (s.statuses.length) q.set('status', s.statuses.join(','));
  for (const [key, on] of [['pta', s.pta], ['official', s.official], ['5g', s.fiveG], ['nfc', s.nfc], ['jack', s.jack]] as const) {
    if (on) q.set(key, '1');
  }
  if (s.battery !== undefined) q.set('battery', String(s.battery));
  if (s.hz !== undefined) q.set('hz', String(s.hz));
  if (s.sort !== DEFAULT_STATE.sort) q.set('sort', s.sort);
  if (s.preset !== DEFAULT_STATE.preset) q.set('preset', s.preset);
  if (s.weights && Object.keys(s.weights).length) {
    q.set('w', Object.entries(s.weights).map(([k, v]) => `${k}:${v}`).join(','));
  }
  return q.toString().replace(/%2C/g, ',').replace(/%3A/g, ':');
}

// Parse a query string, dropping anything invalid rather than throwing.
export function fromQuery(query: string, known: { brands: string[]; presets: string[] }): FinderState {
  const q = new URLSearchParams(query.replace(/^\?/, ''));
  const weights: Weights = {};
  for (const part of list(q.get('w'))) {
    const [k, v] = part.split(':');
    if ((SCORE_KEYS as readonly string[]).includes(k) && /^\d+(\.\d+)?$/.test(v ?? '') && Number(v) <= 10) {
      weights[k as ScoreKey] = Number(v);
    }
  }
  const sort = q.get('sort');
  const preset = q.get('preset');
  return {
    ...DEFAULT_STATE,
    min: posInt(q.get('min')),
    max: posInt(q.get('max')),
    brands: list(q.get('brand')).filter((b) => known.brands.includes(b)),
    years: list(q.get('year')).map(Number).filter((y) => (RELEASE_YEARS as readonly number[]).includes(y)),
    statuses: list(q.get('status')).filter((x): x is Status => (STATUSES as readonly string[]).includes(x)),
    pta: q.get('pta') === '1', official: q.get('official') === '1', fiveG: q.get('5g') === '1',
    nfc: q.get('nfc') === '1', jack: q.get('jack') === '1',
    battery: posInt(q.get('battery')),
    hz: posInt(q.get('hz')),
    sort: sort && SORTS.includes(sort) ? (sort as SortKey) : DEFAULT_STATE.sort,
    preset: preset && known.presets.includes(preset) ? preset : DEFAULT_STATE.preset,
    weights: Object.keys(weights).length ? weights : undefined,
  };
}
