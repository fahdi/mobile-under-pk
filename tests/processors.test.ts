import { describe, expect, it } from 'vitest';
import { chipFamily, chipPaths, powerTier, processorTiers, TIERS } from '../src/lib/processors';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

describe('chipFamily', () => {
  it('merges spellings and groups Helio Ultra, Ultimate and Max variants under the family', () => {
    expect(chipFamily('MediaTek Helio G99')).toEqual({ slug: 'mediatek-helio-g99', name: 'MediaTek Helio G99' });
    expect(chipFamily('Helio G99')).toEqual({ slug: 'mediatek-helio-g99', name: 'MediaTek Helio G99' });
    expect(chipFamily('Helio G81 Ultra')?.slug).toBe('mediatek-helio-g81');
    expect(chipFamily('MediaTek Helio G81 Ultimate')?.slug).toBe('mediatek-helio-g81');
    expect(chipFamily('Helio G100 Max')?.slug).toBe('mediatek-helio-g100');
  });
  it('names each vendor and keeps distinct chips distinct', () => {
    expect(chipFamily('Dimensity 7360 Turbo')).toEqual({ slug: 'mediatek-dimensity-7360-turbo', name: 'MediaTek Dimensity 7360 Turbo' });
    expect(chipFamily('Snapdragon 685')).toEqual({ slug: 'qualcomm-snapdragon-685', name: 'Qualcomm Snapdragon 685' });
    expect(chipFamily('Exynos 1480')).toEqual({ slug: 'samsung-exynos-1480', name: 'Samsung Exynos 1480' });
    expect(chipFamily('Unisoc T7250')).toEqual({ slug: 'unisoc-t7250', name: 'Unisoc T7250' });
  });
  it('returns undefined for an unnamed chip', () => {
    expect(chipFamily('Unisoc octa-core (2x Cortex-A75 1.6GHz, Mali-G57 MC1)')).toBeUndefined();
  });
});

describe('powerTier', () => {
  it('maps the performance score to a tier', () => {
    expect(TIERS.map((t) => t.slug)).toEqual(['gaming-ready', 'smooth-everyday', 'basic']);
    expect([10, 7, 6, 5, 4, 1].map((v) => powerTier(v).slug)).toEqual(['gaming-ready', 'gaming-ready', 'smooth-everyday', 'smooth-everyday', 'basic', 'basic']);
  });
});

const perf = (v: number) => ({ ...makePhone().scores, performance: { value: v, reason: 'reason text here' } });
const p = (slug: string, chipset: string, v: number, price: number) =>
  makePhone({ slug, specs: { ...makePhone().specs, chipset }, scores: perf(v), variants: [makeVariant({ pricePkr: price })] });
const data: DataSet = {
  phones: [p('a', 'Helio G99', 6, 40000), p('b', 'MediaTek Helio G99', 5, 35000), p('c', 'Snapdragon 685', 5, 45000), p('d', 'Snapdragon 7 Gen 4', 8, 130000), p('e', 'Unisoc octa-core (x)', 2, 20000)],
  brands: [], brackets: [{ ceiling: 150000, intro: 'i', faq: [] }], presets: [],
};

describe('processorTiers', () => {
  it('groups phones by tier, best performance first then cheaper, with each tier listing its chips', () => {
    const tiers = processorTiers(data);
    expect(tiers.map((t) => [t.tier.slug, t.phones.map((x) => x.slug)])).toEqual([
      ['gaming-ready', ['d']], ['smooth-everyday', ['a', 'b', 'c']], ['basic', ['e']],
    ]);
    expect(tiers[1].chips.map((c) => [c.slug, c.count])).toEqual([['mediatek-helio-g99', 2], ['qualcomm-snapdragon-685', 1]]);
  });
});

describe('chipPaths', () => {
  it('builds a page only for chips with 2 or more phones, never colliding with tier slugs', () => {
    const paths = chipPaths(data);
    expect(paths.map((x) => x.params.slug)).toEqual(['mediatek-helio-g99']);
    expect(paths.some((x) => TIERS.some((t) => t.slug === x.params.slug))).toBe(false);
  });
});

import { chipTitle, processorsTitle, tierPaths, tierTitle } from '../src/lib/processors';

describe('tierPaths and titles', () => {
  it('only builds tiers that have phones', () => {
    const only = { ...data, phones: data.phones.filter((x) => x.slug !== 'd') };
    expect(tierPaths(only).map((x) => x.params.slug)).toEqual(['smooth-everyday', 'basic']);
  });
  it('formats titles with the check month', () => {
    expect(processorsTitle('2026-10-10')).toBe('Phones by processor in Pakistan: performance tiers (Oct 2026)');
    expect(tierTitle(TIERS[0], '2026-10-10')).toBe('Gaming-ready processor phones in Pakistan (Oct 2026)');
    expect(chipTitle({ slug: 'x', name: 'MediaTek Helio G99' }, '2026-10-10')).toBe('Phones with MediaTek Helio G99 in Pakistan (Oct 2026)');
  });
});
