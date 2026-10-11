import type { Phone } from '../schema/phone';
import type { DataSet } from './load';
import { cheapestPtaVariant } from './brackets';
import { formatDate } from './format';

export interface Band { slug: string; name: string; min: number; heading: string }

export const BANDS: Band[] = [
  { slug: '7000-mah', name: '7000 mAh and above', min: 7000, heading: 'Phones with 7000 mAh battery or more' },
  { slug: '6000-mah', name: '6000 to 6999 mAh', min: 6000, heading: 'Phones with 6000 mAh battery' },
  { slug: '5000-mah', name: '5000 to 5999 mAh', min: 5000, heading: 'Phones with 5000 mAh battery' },
  { slug: 'under-5000-mah', name: 'Under 5000 mAh', min: 0, heading: 'Phones with a battery under 5000 mAh' },
];

export function batteryBand(mah: number): Band {
  return BANDS.find((b) => mah >= b.min)!;
}

const price = (p: Phone) => cheapestPtaVariant(p)!.pricePkr;

// Longest-lasting first: our battery score (endurance and charging), then raw capacity, then cheaper.
export function rankByBattery(phones: Phone[]): Phone[] {
  return [...phones].sort((a, b) => b.scores.battery.value - a.scores.battery.value
    || b.specs.battery.mah - a.specs.battery.mah || price(a) - price(b) || a.slug.localeCompare(b.slug));
}

export function phonesInBand(data: DataSet, band: Band): Phone[] {
  return rankByBattery(data.phones.filter((p) => batteryBand(p.specs.battery.mah).slug === band.slug));
}

// A band page only with 3+ phones, so no thin pages.
export function bandPaths(data: DataSet): Array<{ params: { band: string }; props: { band: Band } }> {
  return BANDS.filter((b) => phonesInBand(data, b).length >= 3).map((band) => ({ params: { band: band.slug }, props: { band } }));
}

const month = (iso: string) => { const [, m, y] = formatDate(iso).split(' '); return `${m} ${y}`; };
export const batteryTitle = (checked: string) => `Longest battery life phones in Pakistan (${month(checked)})`;
export const bandTitle = (band: Band, checked: string) => `${band.heading} in Pakistan (${month(checked)})`;
