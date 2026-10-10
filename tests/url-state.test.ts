import { describe, expect, it } from 'vitest';
import { fromQuery, toQuery } from '../src/lib/url-state';
import { DEFAULT_STATE } from '../src/lib/filters';

const known = { brands: ['samsung', 'xiaomi'], presets: ['balanced', 'gaming'] };

describe('url state', () => {
  it('round-trips a full state', () => {
    const s = { ...DEFAULT_STATE, min: 20000, max: 60000, brands: ['samsung', 'xiaomi'], years: [2025, 2026],
      statuses: ['available' as const], pta: true, official: true, fiveG: true, nfc: true, jack: true,
      battery: 5000, hz: 120, sort: 'camera' as const, preset: 'gaming', weights: { camera: 2, value: 3 } };
    expect(fromQuery(toQuery(s), known)).toEqual(s);
  });
  it('default state serialises to an empty string', () => {
    expect(toQuery(DEFAULT_STATE)).toBe('');
    expect(fromQuery('', known)).toEqual(DEFAULT_STATE);
  });
  it('drops garbage and keeps the valid parts', () => {
    const s = fromQuery('?max=abc&min=-5&brand=nokia,,samsung&year=1999,2025&sort=foo&preset=evil&w=camera:-5,value:2,speed:3&battery=5e3x', known);
    expect(s).toEqual({ ...DEFAULT_STATE, brands: ['samsung'], years: [2025], weights: { value: 2 } });
  });
  it('accepts a leading question mark or none', () => {
    expect(fromQuery('max=50000', known).max).toBe(50000);
  });
});
