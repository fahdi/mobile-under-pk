import { describe, expect, it } from 'vitest';
import { assignBracket, bracketSlug, cheapestPtaVariant } from '../src/lib/brackets';
import { makePhone, makeVariant } from './fixtures/phone';

const brackets = [20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000, 150000]
  .map((ceiling) => ({ ceiling, intro: 'x', faq: [] }));

describe('assignBracket', () => {
  it('puts a price exactly on a ceiling into that bracket', () => {
    const p = makePhone({ variants: [makeVariant({ pricePkr: 50000 })] });
    expect(assignBracket(p, brackets)?.ceiling).toBe(50000);
  });
  it('puts one rupee over into the next bracket', () => {
    const p = makePhone({ variants: [makeVariant({ pricePkr: 50001 })] });
    expect(assignBracket(p, brackets)?.ceiling).toBe(60000);
  });
  it('uses the cheapest PTA variant, ignoring a cheaper non-PTA one', () => {
    const p = makePhone({ variants: [
      makeVariant({ pricePkr: 35000, pta: false, warranty: 'none' }),
      makeVariant({ pricePkr: 58000, storage: 256 }),
      makeVariant({ pricePkr: 52000 }),
    ] });
    expect(cheapestPtaVariant(p)?.pricePkr).toBe(52000);
    expect(assignBracket(p, brackets)?.ceiling).toBe(60000);
  });
  it('returns undefined when no PTA variant exists or price exceeds the top bracket', () => {
    expect(assignBracket(makePhone({ variants: [makeVariant({ pta: false })] }), brackets)).toBeUndefined();
    expect(assignBracket(makePhone({ variants: [makeVariant({ pricePkr: 150500 })] }), brackets)).toBeUndefined();
  });
  it('builds the SEO slug', () => {
    expect(bracketSlug(50000)).toBe('mobile-under-50000-in-pakistan');
  });
});
