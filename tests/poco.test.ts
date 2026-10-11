import { describe, expect, it } from 'vitest';
import { loadData } from '../src/lib/load';

const { data } = loadData('.');

describe('POCO', () => {
  it('is its own brand, with the Xiaomi Pakistan warranty and store', () => {
    const poco = data.brands.find((b) => b.slug === 'poco');
    expect(poco?.name).toBe('POCO');
    expect(poco?.warrantyNote).toMatch(/Xiaomi/);
    expect(poco?.officialStoreUrl).toMatch(/^https:\/\//);
  });

  it('has enough phones for a real brand page', () => {
    expect(data.phones.filter((p) => p.brand === 'poco').length).toBeGreaterThanOrEqual(2);
  });
});
