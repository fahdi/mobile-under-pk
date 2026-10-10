import type { Phone, Status } from '../schema/phone';
import { withBase } from './paths';

type Ld = Record<string, unknown>;
const CONTEXT = 'https://schema.org';

export function absUrl(path: string, site: string | URL, base?: string): string {
  return new URL(withBase(path, base), site).href;
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>, site: string | URL, base?: string): Ld {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: absUrl(it.path, site, base),
    })),
  };
}

const AVAILABILITY: Record<Status, string> = {
  available: `${CONTEXT}/InStock`,
  limited: `${CONTEXT}/LimitedAvailability`,
  discontinued: `${CONTEXT}/Discontinued`,
};

export function productLd(p: Phone, { name, brandName, url }: { name: string; brandName: string; url: string }): Ld {
  const prices = p.variants.filter((v) => v.pta).map((v) => v.pricePkr);
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    name,
    brand: { '@type': 'Brand', name: brandName },
    url,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PKR',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
      availability: AVAILABILITY[p.status],
    },
  };
}

export function itemListLd(items: Array<{ name: string; url: string }>): Ld {
  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
  };
}

export function faqLd(faq: Array<{ q: string; a: string }>): Ld {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
