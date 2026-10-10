import type { Phone, Variant } from '../../src/schema/phone';

export function makeVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    ram: 8,
    storage: 128,
    pricePkr: 120000,
    priceCheckedAt: '2026-10-10',
    pta: true,
    warranty: 'official',
    sources: [{ name: 'PriceOye', url: 'https://priceoye.pk/mobiles/samsung/samsung-galaxy-a55' }],
    ...overrides,
  };
}

const reason = (s: string) => ({ reason: `${s} drives this score in the bracket.` });

export function makePhone(overrides: Partial<Phone> = {}): Phone {
  return {
    slug: 'samsung-galaxy-a55',
    brand: 'samsung',
    model: 'Galaxy A55',
    releaseDate: '2024-03-11',
    status: 'available',
    variants: [makeVariant()],
    specs: {
      chipset: 'Exynos 1480',
      display: { size: 6.6, type: 'Super AMOLED', refreshHz: 120, resolution: '1080x2340', peakNits: 1000 },
      battery: { mah: 5000, wiredW: 25, wirelessW: 0 },
      cameras: {
        rear: [{ mp: 50, type: 'wide', ois: true }],
        front: { mp: 32 },
        video: '4K@30fps',
      },
      build: { frame: 'aluminium', back: 'glass', front: 'Gorilla Glass Victus+', ip: 'IP67' },
      software: { os: 'Android 14, One UI 6.1', osUpdates: 4, securityYears: 5 },
      connectivity: { fiveG: true, nfc: true, jack35: false, esim: false },
      weightG: 213,
    },
    scores: {
      camera: { value: 7, ...reason('OIS main camera') },
      performance: { value: 6, ...reason('Exynos 1480') },
      battery: { value: 7, ...reason('5000 mAh with 25W') },
      display: { value: 8, ...reason('120Hz AMOLED') },
      build: { value: 8, ...reason('IP67 glass build') },
      software: { value: 9, ...reason('4 OS updates') },
      value: { value: 6, ...reason('Brand premium') },
      availability: { value: 9, ...reason('Official warranty') },
    },
    tags: ['safe-buy'],
    rivals: [],
    ...overrides,
  };
}
