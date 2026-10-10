import { SCORE_KEYS, type Phone, type Scores } from '../schema/phone';
import type { Preset, Weights } from '../schema/data';
import { cheapestPtaVariant } from './brackets';

export interface Ranked { phone: Phone; overall: number; price: number }

export function overallScore(scores: Scores, weights: Weights): number {
  let sum = 0;
  let total = 0;
  for (const k of SCORE_KEYS) {
    const w = weights[k] ?? 0;
    sum += w * scores[k].value;
    total += w;
  }
  if (total <= 0) throw new Error('weights must sum to more than 0');
  return Math.round((sum / total) * 10) / 10;
}

export function rankPhones(phones: Phone[], preset: Preset): Ranked[] {
  return phones
    .filter((p) => !preset.requireOfficialWarranty
      || p.variants.some((v) => v.pta && v.warranty === 'official'))
    .flatMap((phone) => {
      const v = cheapestPtaVariant(phone);
      return v ? [{ phone, overall: overallScore(phone.scores, preset.weights), price: v.pricePkr }] : [];
    })
    .sort((a, b) => b.overall - a.overall
      || a.price - b.price
      || b.phone.releaseDate.localeCompare(a.phone.releaseDate)
      || a.phone.slug.localeCompare(b.phone.slug));
}

export function topPicks(phones: Phone[], preset: Preset, n = 3): Ranked[] {
  return rankPhones(phones.filter((p) => p.status !== 'discontinued'), preset).slice(0, n);
}
