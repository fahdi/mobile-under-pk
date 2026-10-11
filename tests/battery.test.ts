import { describe, expect, it } from 'vitest';
import { BANDS, bandPaths, bandTitle, batteryBand, batteryTitle, rankByBattery } from '../src/lib/battery';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

describe('batteryBand', () => {
  it('puts a capacity in the right band, edges included', () => {
    expect(BANDS.map((b) => b.slug)).toEqual(['7000-mah', '6000-mah', '5000-mah', 'under-5000-mah']);
    expect([7000, 6999, 6000, 5999, 5000, 4999].map((m) => batteryBand(m).slug))
      .toEqual(['7000-mah', '6000-mah', '6000-mah', '5000-mah', '5000-mah', 'under-5000-mah']);
  });
});

const p = (slug: string, mah: number, score: number, price: number) => makePhone({
  slug, variants: [makeVariant({ pricePkr: price })],
  specs: { ...makePhone().specs, battery: { mah, wiredW: 33, wirelessW: 0 } },
  scores: { ...makePhone().scores, battery: { value: score, reason: 'reason text here' } },
});
const data: DataSet = {
  phones: [p('a', 7300, 9, 60000), p('b', 7000, 9, 50000), p('c', 7000, 10, 90000), p('d', 6000, 8, 40000), p('e', 5000, 6, 30000), p('f', 6500, 8, 45000), p('g', 6100, 7, 41000)],
  brands: [], brackets: [{ ceiling: 150000, intro: 'i', faq: [] }], presets: [],
};

describe('rankByBattery', () => {
  it('ranks by battery score, then capacity, then cheaper price', () => {
    expect(rankByBattery(data.phones).map((x) => x.slug)).toEqual(['c', 'a', 'b', 'f', 'd', 'g', 'e']);
  });
});

describe('bandPaths', () => {
  it('builds a band page only when 3 or more phones fall in it', () => {
    expect(bandPaths(data).map((x) => x.params.band)).toEqual(['7000-mah', '6000-mah']);
  });
});

describe('titles', () => {
  it('formats the hub and band titles with the check month', () => {
    expect(batteryTitle('2026-10-10')).toBe('Longest battery life phones in Pakistan (Oct 2026)');
    expect(bandTitle(BANDS[0], '2026-10-10')).toBe('Phones with 7000 mAh battery or more in Pakistan (Oct 2026)');
    expect(bandTitle(BANDS[1], '2026-10-10')).toBe('Phones with 6000 mAh battery in Pakistan (Oct 2026)');
    expect(bandTitle(BANDS[3], '2026-10-10')).toBe('Phones with a battery under 5000 mAh in Pakistan (Oct 2026)');
  });
});
