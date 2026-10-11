import type { Phone } from '../schema/phone';
import type { Brand } from '../schema/data';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatPkr(n: number): string {
  return `Rs ${n.toLocaleString('en-US')}`;
}

// Parse the ISO parts directly so no timezone can shift the day.
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function latestCheck(phones: Phone[]): string | undefined {
  const dates = phones.flatMap((p) => p.variants.map((v) => v.priceCheckedAt)).sort();
  return dates.at(-1);
}

export function phoneName(p: Phone, brands: Brand[]): string {
  const brand = brands.find((b) => b.slug === p.brand)?.name ?? p.brand;
  return p.model.toLowerCase().startsWith(brand.toLowerCase()) ? p.model : `${brand} ${p.model}`;
}

export function formatPkrRange(min: number, max: number): string {
  return min === max ? formatPkr(min) : `${formatPkr(min)} to ${formatPkr(max)}`;
}
