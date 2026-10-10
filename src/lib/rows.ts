import type { Phone } from '../schema/phone';
import type { Preset } from '../schema/data';
import { cheapestPtaVariant } from './brackets';
import { overallScore, type Ranked } from './scoring';

// Table rows in the caller's order (for brand and year listings that are not ranked by score).
export function toRows(phones: Phone[], preset: Preset): Ranked[] {
  return phones.map((phone) => ({ phone, overall: overallScore(phone.scores, preset.weights), price: cheapestPtaVariant(phone)!.pricePkr }));
}
