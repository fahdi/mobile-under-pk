import { RELEASE_YEARS, type Phone } from '../schema/phone';
import type { DataSet } from './load';
import { assignBracket, cheapestPtaVariant } from './brackets';
import { rankPhones } from './scoring';
import type { Brand } from '../schema/data';
import { formatDate } from './format';

const ptaPrice = (p: Phone) => cheapestPtaVariant(p)?.pricePkr ?? Number.POSITIVE_INFINITY;
const releaseYear = (p: Phone) => Number(p.releaseDate.slice(0, 4));

export function phonesByBrand(data: DataSet, brand: string): Phone[] {
  return data.phones.filter((p) => p.brand === brand)
    .sort((a, b) => ptaPrice(a) - ptaPrice(b) || a.slug.localeCompare(b.slug));
}

export function brandPaths(data: DataSet): Array<{ params: { brand: string } }> {
  return data.brands.filter((b) => phonesByBrand(data, b.slug).length > 0).map((b) => ({ params: { brand: b.slug } }));
}

export function brandTitle(name: string, checkedIso: string): string {
  const [, month, year] = formatDate(checkedIso).split(' ');
  return `${name} mobile prices in Pakistan (${month} ${year})`;
}

export function phonesByYear(data: DataSet, year: number): Phone[] {
  return data.phones.filter((p) => releaseYear(p) === year)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.slug.localeCompare(b.slug));
}

export function yearPaths(data: DataSet): Array<{ params: { year: string } }> {
  return [...RELEASE_YEARS].reverse().filter((y) => phonesByYear(data, y).length > 0).map((y) => ({ params: { year: String(y) } }));
}

export function yearTitle(year: number): string {
  return `Mobile phones released in ${year}: Pakistan prices and scores`;
}

export interface BrandSummary { brand: Brand; count: number; minPrice: number; maxPrice: number; top: Phone }

// Brands with phones, biggest range first, each with its PTA price span and best phone.
export function brandSummaries(data: DataSet): BrandSummary[] {
  const balanced = data.presets.find((p) => p.slug === 'balanced') ?? data.presets[0];
  return data.brands
    .map((brand) => ({ brand, phones: phonesByBrand(data, brand.slug) }))
    .filter((b) => b.phones.length > 0)
    .map(({ brand, phones }) => {
      const prices = phones.map(ptaPrice);
      const buyable = phones.filter((p) => p.status !== 'discontinued');
      return { brand, count: phones.length, minPrice: Math.min(...prices), maxPrice: Math.max(...prices), top: rankPhones(buyable.length ? buyable : phones, balanced)[0].phone };
    })
    .sort((a, b) => b.count - a.count || a.brand.name.localeCompare(b.brand.name));
}

export function brandBrackets(data: DataSet, brand: string): number[] {
  const ceilings = new Set(phonesByBrand(data, brand).map((p) => assignBracket(p, data.brackets)?.ceiling).filter((c): c is number => c !== undefined));
  return data.brackets.map((b) => b.ceiling).filter((c) => ceilings.has(c));
}

export function brandIndexTitle(checkedIso: string): string {
  const [, month, year] = formatDate(checkedIso).split(' ');
  return `Mobile phone brands in Pakistan: prices by brand (${month} ${year})`;
}
