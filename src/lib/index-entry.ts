import { SCORE_KEYS, type Phone, type Status } from '../schema/phone';
import { cheapestPtaVariant, cheapestVariant } from './brackets';

// One compact row per phone for the finder; written to public/phones.index.json at build.
export interface IndexEntry {
  slug: string; name: string; brand: string; image: string;
  price: number; ptaPrice: number; officialWarranty: boolean;
  status: Status; year: number; releaseDate: string;
  fiveG: boolean; nfc: boolean; jack: boolean; mah: number; hz: number;
  scores: number[];
}

export function toIndexEntry(p: Phone, brandName: string): IndexEntry {
  const c = p.specs.connectivity;
  return {
    slug: p.slug,
    name: p.model.toLowerCase().startsWith(brandName.toLowerCase()) ? p.model : `${brandName} ${p.model}`,
    brand: p.brand,
    image: p.image,
    price: cheapestVariant(p).pricePkr,
    ptaPrice: cheapestPtaVariant(p)!.pricePkr,
    officialWarranty: p.variants.some((v) => v.pta && v.warranty === 'official'),
    status: p.status,
    year: Number(p.releaseDate.slice(0, 4)),
    releaseDate: p.releaseDate,
    fiveG: c.fiveG, nfc: c.nfc, jack: c.jack35,
    mah: p.specs.battery.mah, hz: p.specs.display.refreshHz,
    scores: SCORE_KEYS.map((k) => p.scores[k].value),
  };
}
