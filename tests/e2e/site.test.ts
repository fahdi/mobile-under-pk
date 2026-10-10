import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Builds the real site against tests/fixtures/site-data and inspects the HTML.
const out = mkdtempSync(join(tmpdir(), 'mupk-site-'));
const BASE = '/mobile-under-pk/';
const page = (p: string) => readFileSync(join(out, p, 'index.html'), 'utf8');
const all = (dir = out): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? all(p) : p.endsWith('.html') ? [p] : [];
});
const jsonLd = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

beforeAll(() => {
  execFileSync('npx', ['astro', 'build', '--outDir', out], {
    env: { ...process.env, DATA_ROOT: 'tests/fixtures/site-data' }, stdio: 'pipe',
  });
}, 120_000);

describe('bracket page', () => {
  const html = () => page('mobile-under-50000-in-pakistan');

  it('has the SEO title, H1 and price check date', () => {
    expect(html()).toContain('<title>Mobile under 50,000 in Pakistan: best phones (Oct 2026)</title>');
    expect(html()).toMatch(/<h1>Best mobile under 50,000 in Pakistan<\/h1>/);
    expect(html()).toContain('<time datetime="2026-10-10">10 Oct 2026</time>');
  });

  it('ranks every phone in the bracket and only those', () => {
    expect(count(html(), /<tr data-slug=/g)).toBe(3);
    expect(html()).not.toContain('data-slug="samsung-galaxy-a26"');
  });

  it('shows a photo on each top pick, lazily loaded below the first', () => {
    const picks = html().split('class="picks"')[1].split('</ul>')[0];
    const imgs = picks.match(/<img [^>]*>/g) ?? [];
    expect(imgs).toHaveLength(2);
    expect(imgs.every((i) => /src="\/mobile-under-pk\/images\/phones\/[a-z0-9-]+\.webp"/.test(i))).toBe(true);
    expect(imgs[0]).toContain('fetchpriority="high"');
    expect(imgs[1]).toContain('loading="lazy"');
  });

  it('keeps discontinued phones out of the top picks but in the table', () => {
    const picks = html().split('class="picks"')[1].split('</ul>')[0];
    expect(count(picks, /class="pick"/g)).toBe(2);
    expect(picks).not.toContain('Galaxy A15');
    expect(html()).toContain('data-slug="samsung-galaxy-a15"');
  });

  it('carries ItemList, FAQPage and BreadcrumbList JSON-LD', () => {
    expect(jsonLd(html()).map((o) => o['@type']).sort()).toEqual(['BreadcrumbList', 'FAQPage', 'ItemList']);
  });

  it('links to the next non-empty bracket', () => {
    expect(html()).toContain(`href="${BASE}mobile-under-60000-in-pakistan/"`);
  });

  it('builds no page for an empty bracket', () => {
    expect(existsSync(join(out, 'mobile-under-20000-in-pakistan'))).toBe(false);
  });
});

describe('phone page', () => {
  const html = () => page('phones/xiaomi-redmi-note-14');

  it('has the price-intent title and Product JSON-LD in PKR', () => {
    expect(html()).toContain('<title>Xiaomi Redmi Note 14 price in Pakistan (Oct 2026)</title>');
    const product = jsonLd(html()).find((o) => o['@type'] === 'Product');
    expect(product.offers).toMatchObject({ priceCurrency: 'PKR', lowPrice: 49000 });
  });

  it('lists variants with PTA, warranty, nofollow sources and check date', () => {
    expect(html()).toContain('Rs 49,000');
    expect(html()).toContain('Shop warranty');
    expect(html()).toMatch(/<a [^>]*href="https:\/\/priceoye\.pk[^"]*"[^>]*rel="nofollow noopener"/);
    expect(html()).toContain('<time datetime="2026-10-10">10 Oct 2026</time>');
  });

  it('shows all eight scores, the specs and links back to its bracket, brand and year', () => {
    expect(count(html(), /class="score-label"/g)).toBe(8);
    expect(html()).toContain('Exynos 1480');
    expect(html()).toContain(`href="${BASE}mobile-under-50000-in-pakistan/"`);
    expect(html()).toContain(`href="${BASE}brands/xiaomi/"`);
    expect(html()).toContain(`href="${BASE}year/2024/"`);
  });

  it('shows the official photo at a fixed size with alt text and a credit link', () => {
    expect(html()).toMatch(/<img [^>]*src="\/mobile-under-pk\/images\/phones\/xiaomi-redmi-note-14\.webp"[^>]*>/);
    const img = html().match(/<img [^>]*images\/phones\/xiaomi-redmi-note-14[^>]*>/)![0];
    expect(img).toContain('alt="Xiaomi Redmi Note 14"');
    expect(img).toContain('width="600"');
    expect(img).toContain('height="800"');
    expect(html()).toMatch(/Photo: <a href="https:\/\/news\.samsung\.com\/global\/" rel="nofollow noopener">Samsung Newsroom<\/a>/);
  });

  it('warns on a discontinued phone', () => {
    expect(page('phones/samsung-galaxy-a15')).toContain('class="notice"');
    expect(html()).not.toContain('class="notice"');
  });
});

describe('compare pages', () => {
  const pair = 'samsung-galaxy-a16-vs-xiaomi-redmi-note-14';

  it('builds the canonical pair with both phones, a verdict and JSON-LD', () => {
    const html = page(`compare/${pair}`);
    expect(html).toContain('<title>Samsung Galaxy A16 vs Xiaomi Redmi Note 14: price in Pakistan and specs</title>');
    expect(html).toContain('class="verdict"');
    expect(html).toContain('Pick Xiaomi Redmi Note 14 for camera');
    expect(count(html, /<img [^>]*images\/phones\//g)).toBe(2);
    expect(html).toMatch(/<td class="win">8\/10<\/td>/);
    expect(jsonLd(html).map((o) => o['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList']);
  });

  it('redirects the reverse order to the canonical page and keeps it out of the index', () => {
    const html = page('compare/xiaomi-redmi-note-14-vs-samsung-galaxy-a16');
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${BASE}compare/${pair}/">`);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain(`<link rel="canonical" href="https://fahdi.github.io${BASE}compare/${pair}/">`);
  });

  it('builds no compare page for phones that are not declared rivals', () => {
    expect(existsSync(join(out, 'compare/samsung-galaxy-a15-vs-samsung-galaxy-a16'))).toBe(false);
  });

  it('is linked from each rival phone page', () => {
    expect(page('phones/xiaomi-redmi-note-14')).toContain(`href="${BASE}compare/${pair}/"`);
  });
});

describe('brand page', () => {
  const html = () => page('brands/samsung');

  it('lists the brand phones cheapest first with the warranty note', () => {
    expect(html()).toContain('<title>Samsung mobile prices in Pakistan (Oct 2026)</title>');
    const slugs = [...html().matchAll(/<tr data-slug="([^"]+)"/g)].map((m) => m[1]);
    expect(slugs).toEqual(['samsung-galaxy-a15', 'samsung-galaxy-a16', 'samsung-galaxy-a26']);
    expect(html()).toContain('Official 1 year warranty.');
    expect(html()).toMatch(/<meta name="description" content="[^"]*Prices checked 10 Oct 2026."/);
    expect(jsonLd(html()).map((o) => o['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList']);
  });

  it('is not built for a brand with no phones', () => {
    expect(existsSync(join(out, 'brands/apple'))).toBe(false);
  });
});

describe('year page', () => {
  it('lists phones released that year', () => {
    const html = page('year/2024');
    expect(html).toContain('<title>Mobile phones released in 2024: Pakistan prices and scores</title>');
    expect((html.match(/<tr data-slug=/g) ?? []).length).toBe(4);
    expect(existsSync(join(out, 'year/2026'))).toBe(false);
  });
});

describe('hub page', () => {
  it('links to every non-empty bracket', () => {
    const html = page('');
    expect(html).toContain(`href="${BASE}mobile-under-50000-in-pakistan/"`);
    expect(html).toContain(`href="${BASE}mobile-under-60000-in-pakistan/"`);
    expect(html).not.toContain('mobile-under-20000-in-pakistan');
  });
});

describe('whole site', () => {
  it('every JSON-LD block parses', () => {
    for (const f of all()) expect(() => jsonLd(readFileSync(f, 'utf8'))).not.toThrow();
  });

  it('every internal link and image resolves to a built file', () => {
    const broken: string[] = [];
    for (const f of all()) {
      for (const [, href] of readFileSync(f, 'utf8').matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
        expect(href.startsWith(BASE), `${href} in ${f} lacks the base path`).toBe(true);
        const rel = href.slice(BASE.length);
        const target = rel === '' || rel.endsWith('/') ? join(out, rel, 'index.html') : join(out, rel);
        if (!existsSync(target)) broken.push(`${href} (in ${f.slice(out.length)})`);
      }
    }
    expect(broken).toEqual([]);
  });
});
