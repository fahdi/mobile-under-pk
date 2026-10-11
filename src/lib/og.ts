import type { DataSet } from './load';
import { bracketSlug, cheapestPtaVariant } from './brackets';
import { comparePaths } from './compare';
import { formatDate, formatPkr, latestCheck, phoneName } from './format';
import { landingPaths, phonesInBracket } from './landing';
import { brandSummaries, phonesByBrand, phonesByYear } from './listing';
import { chipPaths, processorTiers, tierPaths } from './processors';
import { bandPaths, phonesInBand, rankByBattery } from './battery';
import { topPicks } from './scoring';

export interface OgContent { title: string; subtitle: string; price?: string; images: string[] }

export function ogPath(pagePath: string): string {
  return pagePath === '/' ? '/og/index.png' : `/og${pagePath.replace(/\/$/, '')}.png`;
}

// What the share image for each page says and shows.
export function ogContent(data: DataSet, path: string): OgContent {
  const balanced = data.presets.find((p) => p.slug === 'balanced') ?? data.presets[0];
  const name = (slug: string) => phoneName(data.phones.find((p) => p.slug === slug)!, data.brands);
  const photos = (phones: DataSet['phones']) => phones.slice(0, 3).map((p) => p.image);
  const parts = path.split('/').filter(Boolean);

  if (path === '/') {
    return { title: 'Best mobile phones in Pakistan by budget', subtitle: `${data.phones.length} phones up to 150,000 PKR with PTA prices`, images: topPicks(data.phones, balanced, 3).map((r) => r.phone.image) };
  }
  if (path === '/brands/') {
    const summaries = brandSummaries(data);
    return { title: 'Phone brands in Pakistan', subtitle: `${summaries.length} brands, prices by brand with PTA status`, images: summaries.slice(0, 3).map((s) => s.top.image) };
  }
  if (path === '/processors/') {
    return { title: 'Phones by processor power', subtitle: 'Gaming-ready, smooth everyday and basic chips', images: processorTiers(data).flatMap((t) => t.phones.slice(0, 1)).map((p) => p.image) };
  }
  if (parts[0] === 'processors' && parts.length === 2) {
    const tier = tierPaths(data).find((t) => t.params.slug === parts[1]);
    if (tier) {
      const phones = processorTiers(data).find((t) => t.tier.slug === parts[1])!.phones;
      return { title: `${tier.props.tier.name} processor phones`, subtitle: `${phones.length} phones in Pakistan, fastest first`, images: photos(phones) };
    }
    const chip = chipPaths(data).find((c) => c.params.slug === parts[1]);
    if (chip) return { title: `Phones with ${chip.props.chip.name}`, subtitle: `${chip.props.chip.count} phones in Pakistan, ${chip.props.chip.tier.name.toLowerCase()} processor`, images: photos(chip.props.chip.phones) };
  }
  if (path === '/battery/') {
    return { title: 'Longest battery life phones', subtitle: `${data.phones.length} phones ranked by battery life`, images: photos(rankByBattery(data.phones)) };
  }
  if (parts[0] === 'battery' && parts.length === 2) {
    const band = bandPaths(data).find((b) => b.params.band === parts[1]);
    if (band) return { title: band.props.band.heading, subtitle: 'Longest-lasting first, PTA prices', images: photos(phonesInBand(data, band.props.band)) };
  }
  if (path === '/finder/') {
    return { title: 'Find your phone', subtitle: 'Filter and rank every phone by what matters to you', images: [] };
  }
  const intentPage = landingPaths(data).find((p) => p.props.kind === 'intent' && path === `/${p.params.landing}/`);
  if (intentPage && intentPage.props.kind === 'intent') {
    const { ceiling, preset: presetSlug } = intentPage.props;
    const preset = data.presets.find((p) => p.slug === presetSlug)!;
    return {
      title: `Best ${preset.intent} phone under ${ceiling.toLocaleString('en-US')} in Pakistan`,
      subtitle: `Ranked by ${preset.name.toLowerCase()}, PTA prices checked by hand`,
      images: topPicks(phonesInBracket(data, ceiling), preset, 3).map((r) => r.phone.image),
    };
  }
  const bracket = data.brackets.find((b) => path === `/${bracketSlug(b.ceiling)}/`);
  if (bracket) {
    const phones = phonesInBracket(data, bracket.ceiling);
    if (phones.length) {
      return {
        title: `Best mobile under ${bracket.ceiling.toLocaleString('en-US')} in Pakistan`,
        subtitle: `${phones.length} phones ranked, prices checked ${formatDate(latestCheck(phones)!)}`,
        images: topPicks(phones, balanced, 3).map((r) => r.phone.image),
      };
    }
  }
  if (parts[0] === 'phones' && parts.length === 2) {
    const p = data.phones.find((x) => x.slug === parts[1]);
    if (p) return { title: phoneName(p, data.brands), subtitle: 'Price in Pakistan', price: `${formatPkr(cheapestPtaVariant(p)!.pricePkr)} PTA`, images: [p.image] };
  }
  if (parts[0] === 'brands' && parts.length === 2) {
    const brand = data.brands.find((b) => b.slug === parts[1]);
    const phones = phonesByBrand(data, parts[1]);
    if (brand && phones.length) return { title: `${brand.name} mobile prices in Pakistan`, subtitle: `${phones.length} phones, cheapest PTA price first`, images: photos(phones) };
  }
  if (parts[0] === 'year' && parts.length === 2) {
    const phones = phonesByYear(data, Number(parts[1]));
    if (phones.length) return { title: `Phones released in ${parts[1]}`, subtitle: `${phones.length} phones with Pakistan prices and scores`, images: photos(phones) };
  }
  if (parts[0] === 'compare' && parts.length === 2) {
    const page = comparePaths(data.phones).find((c) => c.params.pair === parts[1] && c.props.kind === 'page');
    if (page && page.props.kind === 'page') {
      const { a, b } = page.props;
      return { title: `${name(a)} vs ${name(b)}`, subtitle: 'Price in Pakistan, specs and scores compared', images: [a, b].map((s) => data.phones.find((p) => p.slug === s)!.image) };
    }
  }
  throw new Error(`no OG content for ${path}`);
}
