import type { Phone } from '../schema/phone';
import type { DataSet } from './load';
import { cheapestPtaVariant } from './brackets';
import { formatDate } from './format';

export interface Chip { slug: string; name: string }
export interface Tier { slug: string; name: string; min: number; blurb: string }

export const TIERS: Tier[] = [
  { slug: 'gaming-ready', name: 'Gaming-ready', min: 7, blurb: 'Fast enough for demanding games at good settings and years of smooth daily use.' },
  { slug: 'smooth-everyday', name: 'Smooth everyday', min: 5, blurb: 'Smooth for social media, video and light gaming; heavy games run at lower settings.' },
  { slug: 'basic', name: 'Basic', min: 0, blurb: 'Fine for calls, WhatsApp and browsing; expect slowdowns with heavy apps and games.' },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Canonical processor: merges spellings and groups Helio Ultra/Ultimate/Max variants under their family.
export function chipFamily(raw: string): Chip | undefined {
  let s = raw.trim();
  if (/\(|octa-core/i.test(s)) return undefined;
  s = s.replace(/^(MediaTek|Qualcomm|Samsung)\s+/i, '');
  let vendor = '';
  if (/^(Helio|Dimensity)\b/i.test(s)) vendor = 'MediaTek';
  else if (/^Snapdragon\b/i.test(s)) vendor = 'Qualcomm';
  else if (/^Exynos\b/i.test(s)) vendor = 'Samsung';
  else if (!/^Unisoc\b/i.test(s)) return undefined;
  if (/^Helio\b/i.test(s)) s = s.replace(/\s+(Ultra|Ultimate|Max)$/i, '');
  const name = vendor ? `${vendor} ${s}` : s;
  return { slug: slugify(name), name };
}

export function powerTier(performance: number): Tier {
  return TIERS.find((t) => performance >= t.min)!;
}

const perf = (p: Phone) => p.scores.performance.value;
const price = (p: Phone) => cheapestPtaVariant(p)!.pricePkr;
const byPower = (a: Phone, b: Phone) => perf(b) - perf(a) || price(a) - price(b) || a.slug.localeCompare(b.slug);
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export interface ChipGroup extends Chip { phones: Phone[]; count: number; tier: Tier }

export function chipGroups(data: DataSet): ChipGroup[] {
  const groups = new Map<string, { chip: Chip; phones: Phone[] }>();
  for (const p of data.phones) {
    const chip = chipFamily(p.specs.chipset);
    if (!chip) continue;
    const g = groups.get(chip.slug) ?? { chip, phones: [] };
    g.phones.push(p);
    groups.set(chip.slug, g);
  }
  return [...groups.values()].map(({ chip, phones }) => ({
    ...chip, phones: phones.sort(byPower), count: phones.length, tier: powerTier(Math.round(median(phones.map(perf)))),
  }));
}

export function processorTiers(data: DataSet): Array<{ tier: Tier; phones: Phone[]; chips: ChipGroup[] }> {
  const chips = chipGroups(data);
  return TIERS.map((tier) => ({
    tier,
    phones: data.phones.filter((p) => powerTier(perf(p)).slug === tier.slug).sort(byPower),
    chips: chips.filter((c) => c.tier.slug === tier.slug).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  }));
}

// A chip page only when 2+ phones use it, so no thin pages.
export function chipPaths(data: DataSet): Array<{ params: { slug: string }; props: { chip: ChipGroup } }> {
  return chipGroups(data).filter((c) => c.count >= 2).sort((a, b) => a.slug.localeCompare(b.slug))
    .map((chip) => ({ params: { slug: chip.slug }, props: { chip } }));
}

export function tierPaths(data: DataSet): Array<{ params: { slug: string }; props: { tier: Tier } }> {
  return processorTiers(data).filter((t) => t.phones.length > 0).map(({ tier }) => ({ params: { slug: tier.slug }, props: { tier } }));
}

const month = (iso: string) => { const [, m, y] = formatDate(iso).split(' '); return `${m} ${y}`; };
export const processorsTitle = (checked: string) => `Phones by processor in Pakistan: performance tiers (${month(checked)})`;
export const tierTitle = (tier: Tier, checked: string) => `${tier.name} processor phones in Pakistan (${month(checked)})`;
export const chipTitle = (chip: Chip, checked: string) => `Phones with ${chip.name} in Pakistan (${month(checked)})`;
