import { describe, expect, it } from 'vitest';
import { crossCheck } from '../src/lib/crosscheck';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

const brackets = [20000, 50000, 150000].map((ceiling) => ({ ceiling, intro: 'x', faq: [] }));
const brands = [{ slug: 'samsung', name: 'Samsung', country: 'South Korea', officialStoreUrl: 'https://www.samsung.com/pk/', warrantyNote: 'Official 1 year.' }];
const presets = [{ slug: 'balanced', name: 'B', description: 'd', weights: { camera: 1 } }];
const ds = (phones = [makePhone()]): DataSet => ({ phones, brands, brackets, presets });
const errors = (d: DataSet) => crossCheck(d, '2026-10-10').filter((i) => i.level === 'error').map((i) => i.message);

describe('crossCheck', () => {
  it('passes a clean data set', () => {
    expect(errors(ds())).toEqual([]);
  });
  it('flags an unknown brand', () => {
    expect(errors(ds([makePhone({ brand: 'nokia' })]))).toEqual([expect.stringContaining('unknown brand "nokia"')]);
  });
  it('flags a rival that does not exist and a self rival', () => {
    expect(errors(ds([makePhone({ rivals: ['ghost-phone'] })]))).toEqual([expect.stringContaining('rival "ghost-phone" does not exist')]);
    expect(errors(ds([makePhone({ rivals: ['samsung-galaxy-a55'] })]))).toEqual([expect.stringContaining('lists itself as a rival')]);
  });
  it('flags a phone with no bracket', () => {
    expect(errors(ds([makePhone({ variants: [makeVariant({ pta: false })] })]))).toEqual([expect.stringContaining('no PTA approved variant')]);
    expect(errors(ds([makePhone({ variants: [makeVariant({ pricePkr: 160000 })] })]))).toEqual([expect.stringContaining('above the top bracket')]);
  });
  it('flags a priceCheckedAt in the future', () => {
    expect(errors(ds([makePhone({ variants: [makeVariant({ priceCheckedAt: '2026-10-11' })] })]))).toEqual([expect.stringContaining('in the future')]);
  });
  it('flags duplicate slugs', () => {
    expect(errors(ds([makePhone(), makePhone()]))).toEqual([expect.stringContaining('duplicate slug')]);
  });
  it('warns, not errors, on unrounded prices, sparse brackets and missing brand info', () => {
    const d: DataSet = { ...ds([makePhone({ variants: [makeVariant({ pricePkr: 119999 })] })]), brands: [{ ...brands[0], warrantyNote: null }] };
    const issues = crossCheck(d, '2026-10-10');
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    const w = issues.map((i) => i.message).join('\n');
    expect(w).toContain('not rounded to 500');
    expect(w).toContain('fewer than 3 phones');
    expect(w).toContain('warrantyNote');
  });

  it('flags a phone whose image file is missing', () => {
    const issues = crossCheck(ds(), '2026-10-10', { imageExists: () => false });
    expect(issues.filter((i) => i.level === 'error').map((i) => i.message)).toEqual([
      expect.stringContaining('image file public/images/phones/samsung-galaxy-a55.webp is missing'),
    ]);
  });
  it('passes when the image file exists', () => {
    expect(crossCheck(ds(), '2026-10-10', { imageExists: () => true }).filter((i) => i.level === 'error')).toEqual([]);
  });
});
