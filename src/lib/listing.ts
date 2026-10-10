import { RELEASE_YEARS, type Phone } from '../schema/phone';
import type { DataSet } from './load';
import { cheapestPtaVariant } from './brackets';
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
