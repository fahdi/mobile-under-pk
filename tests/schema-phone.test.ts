import { describe, expect, it } from 'vitest';
import { PhoneSchema } from '../src/schema/phone';
import { makePhone, makeVariant } from './fixtures/phone';

const parse = (v: unknown) => PhoneSchema.safeParse(v);

describe('PhoneSchema', () => {
  it('accepts the spec example shape', () => {
    expect(parse(makePhone()).success).toBe(true);
  });

  it('rejects release years outside 2024 to 2026', () => {
    expect(parse(makePhone({ releaseDate: '2023-12-31' })).success).toBe(false);
    expect(parse(makePhone({ releaseDate: '2027-01-01' })).success).toBe(false);
    expect(parse(makePhone({ releaseDate: '2026-12-31' })).success).toBe(true);
  });

  it('rejects an unknown status or warranty', () => {
    expect(parse(makePhone({ status: 'sold-out' as never })).success).toBe(false);
    expect(parse(makePhone({ variants: [makeVariant({ warranty: 'shop' as never })] })).success).toBe(false);
  });

  it('requires at least one variant and one source per variant', () => {
    expect(parse(makePhone({ variants: [] })).success).toBe(false);
    expect(parse(makePhone({ variants: [makeVariant({ sources: [] })] })).success).toBe(false);
  });

  it('requires a valid priceCheckedAt date', () => {
    expect(parse(makePhone({ variants: [makeVariant({ priceCheckedAt: '10/10/2026' })] })).success).toBe(false);
  });

  it('requires all eight scores, integers 1 to 10, with a reason', () => {
    const p = makePhone();
    const { camera: _drop, ...seven } = p.scores;
    expect(parse({ ...p, scores: seven }).success).toBe(false);
    expect(parse({ ...p, scores: { ...p.scores, camera: { value: 11, reason: 'Too high a score here.' } } }).success).toBe(false);
    expect(parse({ ...p, scores: { ...p.scores, camera: { value: 7.5, reason: 'Fractions are not allowed.' } } }).success).toBe(false);
    expect(parse({ ...p, scores: { ...p.scores, camera: { value: 7, reason: '' } } }).success).toBe(false);
  });

  it('rejects a stored overall score and unknown keys (typo guard)', () => {
    const p = makePhone();
    expect(parse({ ...p, scores: { ...p.scores, overall: { value: 7, reason: 'Never stored here.' } } }).success).toBe(false);
    expect(parse({ ...p, colour: 'blue' }).success).toBe(false);
  });

  it('rejects slugs that are not lowercase kebab case', () => {
    expect(parse(makePhone({ slug: 'Samsung_A55' })).success).toBe(false);
  });

  it('rejects non-integer or non-positive prices', () => {
    expect(parse(makePhone({ variants: [makeVariant({ pricePkr: 0 })] })).success).toBe(false);
    expect(parse(makePhone({ variants: [makeVariant({ pricePkr: 1000.5 })] })).success).toBe(false);
  });
});
