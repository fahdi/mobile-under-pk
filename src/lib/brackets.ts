import type { Phone, Variant } from '../schema/phone';
import type { Bracket } from '../schema/data';

const byPrice = (a: Variant, b: Variant) => a.pricePkr - b.pricePkr;

export function cheapestPtaVariant(phone: Phone): Variant | undefined {
  return phone.variants.filter((v) => v.pta).sort(byPrice)[0];
}

export function cheapestVariant(phone: Phone): Variant {
  return [...phone.variants].sort(byPrice)[0];
}

export function assignBracket(phone: Phone, brackets: Bracket[]): Bracket | undefined {
  const v = cheapestPtaVariant(phone);
  if (!v) return undefined;
  return brackets.find((b) => v.pricePkr <= b.ceiling);
}

export function bracketSlug(ceiling: number): string {
  return `mobile-under-${ceiling}-in-pakistan`;
}
