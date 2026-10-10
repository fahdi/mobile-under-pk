import { assignBracket, cheapestPtaVariant } from './brackets';
import type { DataSet, Issue } from './load';

export interface CrossCheckOptions {
  // Given a public path like /images/phones/x.webp, says whether the file exists.
  imageExists?: (publicPath: string) => boolean;
}

export function crossCheck(data: DataSet, today: string, opts: CrossCheckOptions = {}): Issue[] {
  const issues: Issue[] = [];
  const err = (file: string, message: string) => issues.push({ level: 'error', file, message });
  const warn = (file: string, message: string) => issues.push({ level: 'warning', file, message });

  const slugs = new Set<string>();
  const brandSlugs = new Set(data.brands.map((b) => b.slug));
  const top = data.brackets.at(-1)?.ceiling ?? 0;
  const perBracket = new Map<number, number>(data.brackets.map((b) => [b.ceiling, 0]));

  for (const p of data.phones) {
    if (slugs.has(p.slug)) err(p.slug, `duplicate slug "${p.slug}"`);
    slugs.add(p.slug);
  }

  for (const p of data.phones) {
    const f = `data/phones/${p.slug}.json`;
    if (!brandSlugs.has(p.brand)) err(f, `unknown brand "${p.brand}" (add it to data/brands.json)`);
    if (opts.imageExists && !opts.imageExists(p.image)) err(f, `image file public${p.image} is missing`);
    for (const r of p.rivals) {
      if (r === p.slug) err(f, 'lists itself as a rival');
      else if (!slugs.has(r)) err(f, `rival "${r}" does not exist`);
    }
    p.variants.forEach((v, i) => {
      if (v.priceCheckedAt > today) err(f, `variants.${i}.priceCheckedAt ${v.priceCheckedAt} is in the future`);
      if (v.pricePkr % 500 !== 0) warn(f, `variants.${i}.pricePkr ${v.pricePkr} is not rounded to 500`);
    });
    const pta = cheapestPtaVariant(p);
    if (!pta) { err(f, 'no PTA approved variant, so no bracket'); continue; }
    const b = assignBracket(p, data.brackets);
    if (!b) { err(f, `cheapest PTA price ${pta.pricePkr} is above the top bracket ${top}`); continue; }
    perBracket.set(b.ceiling, (perBracket.get(b.ceiling) ?? 0) + 1);
  }

  for (const [ceiling, n] of perBracket) {
    if (n < 3) warn('data/brackets.json', `bracket ${ceiling} has ${n} phones, fewer than 3 phones`);
  }
  for (const b of data.brands) {
    if (!b.officialStoreUrl) warn('data/brands.json', `${b.slug}: officialStoreUrl is null`);
    if (!b.warrantyNote) warn('data/brands.json', `${b.slug}: warrantyNote is null`);
  }
  return issues;
}
