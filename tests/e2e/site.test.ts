import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkSite } from '../../scripts/lib/check-site';
import sharp from 'sharp';

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
    expect(count(html(), /<tr data-slug=/g)).toBe(4);
    expect(html()).not.toContain('data-slug="samsung-galaxy-a26"');
  });

  it('shows a photo on each top pick, lazily loaded below the first', () => {
    const picks = html().split('class="picks"')[1].split('</ul>')[0];
    const imgs = picks.match(/<img [^>]*>/g) ?? [];
    expect(imgs).toHaveLength(3);
    expect(imgs.every((i) => /src="\/mobile-under-pk\/images\/phones\/[a-z0-9-]+\.webp"/.test(i))).toBe(true);
    expect(imgs[0]).toContain('fetchpriority="high"');
    expect(imgs[1]).toContain('loading="lazy"');
  });

  it('keeps discontinued phones out of the top picks but in the table', () => {
    const picks = html().split('class="picks"')[1].split('</ul>')[0];
    expect(count(picks, /class="pick"/g)).toBe(3);
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

describe('intent landing pages', () => {
  const html = () => page('best-camera-phone-under-50000');

  it('exist only where the preset changes the top 3', () => {
    expect(existsSync(join(out, 'best-camera-phone-under-50000/index.html'))).toBe(true);
    expect(existsSync(join(out, 'best-battery-phone-under-50000/index.html'))).toBe(true);
    expect(existsSync(join(out, 'best-camera-phone-under-60000'))).toBe(false);
  });

  it('rank by the preset with its own title, H1 and JSON-LD', () => {
    expect(html()).toContain('<title>Best camera phone under 50,000 in Pakistan (Oct 2026)</title>');
    expect(html()).toMatch(/<h1>Best camera phone under 50,000 in Pakistan<\/h1>/);
    const picks = html().split('class="picks"')[1].split('</ul>')[0];
    expect([...picks.matchAll(/phones\/([a-z0-9-]+)\/"/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i))
      .toEqual(['xiaomi-redmi-note-14', 'samsung-galaxy-a16', 'xiaomi-poco-c75']);
    const table = [...html().split('class="phone-table"')[1].matchAll(/<tr data-slug="([^"]+)"/g)].map((m) => m[1]);
    expect(table[0]).toBe('samsung-galaxy-a15'); // discontinued stays in the table, flagged, but never a pick
    expect(jsonLd(html()).map((o) => o['@type']).sort()).toEqual(['BreadcrumbList', 'ItemList']);
  });

  it('link to and from the bracket page', () => {
    expect(html()).toContain(`href="${BASE}mobile-under-50000-in-pakistan/"`);
    expect(page('mobile-under-50000-in-pakistan')).toContain(`href="${BASE}best-camera-phone-under-50000/"`);
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
    expect((html.match(/<tr data-slug=/g) ?? []).length).toBe(5);
    expect(existsSync(join(out, 'year/2026'))).toBe(false);
  });
});

describe('hub page', () => {
  it('shows the top phones overall, excluding discontinued ones', () => {
    const html = page('');
    const top = html.split('id="top-phones"')[1].split('</table>')[0];
    expect((top.match(/<tr data-slug=/g) ?? []).length).toBe(4);
    expect(top).not.toContain('samsung-galaxy-a15');
  });

  it('has the #budgets and #brands sections the header and footer link to, and a finder call to action', () => {
    const html = page('');
    expect(html).toMatch(/id="budgets"/);
    expect(html).toMatch(/id="brands"/);
    expect(html).toMatch(/<a [^>]*class="btn btn-primary"[^>]*href="\/mobile-under-pk\/finder\/"|<a [^>]*href="\/mobile-under-pk\/finder\/"[^>]*class="btn btn-primary"/);
  });

  it('links every brand with phones and carries WebSite JSON-LD', () => {
    const html = page('');
    expect(html).toContain(`href="${BASE}brands/samsung/"`);
    expect(html).toContain(`href="${BASE}brands/xiaomi/"`);
    expect(jsonLd(html).map((o) => o['@type']).sort()).toEqual(['WebSite']);
  });

  it('links to every non-empty bracket', () => {
    const html = page('');
    expect(html).toContain(`href="${BASE}mobile-under-50000-in-pakistan/"`);
    expect(html).toContain(`href="${BASE}mobile-under-60000-in-pakistan/"`);
    expect(html).not.toContain('mobile-under-20000-in-pakistan');
  });
});

describe('finder page', () => {
  const html = () => page('finder');

  it('server-renders every phone under the default preset, so it works without JavaScript', () => {
    expect(html()).toContain('<title>Phone finder: filter and rank phones in Pakistan by budget</title>');
    expect(count(html(), /<tr data-slug=/g)).toBe(5);
    expect(html()).toContain('id="finder-count"');
  });

  it('offers every filter, the presets and custom weights', () => {
    for (const name of ['min', 'max', 'brand', 'year', 'status', 'pta', 'official', '5g', 'nfc', 'jack', 'battery', 'hz', 'sort', 'preset', 'w-camera', 'w-availability']) {
      expect(html(), name).toContain(`name="${name}"`);
    }
    expect(html()).toContain('value="xiaomi"');
    expect(html()).toContain('<option value="safe-buy">');
  });

  it('embeds the presets as JSON and loads the island script', () => {
    const presets = JSON.parse(html().match(/<script type="application\/json" id="finder-presets">(.*?)<\/script>/s)![1]);
    expect(presets.map((p: { slug: string }) => p.slug)).toContain('balanced');
    expect(html()).toMatch(/<script type="module" src="[^"]+"><\/script>|<script type="module">/);
  });

  it('is linked from the hub', () => {
    expect(page('')).toContain(`href="${BASE}finder/"`);
  });
});

describe('finder index', () => {
  it('is built from the data with one compact entry per phone', () => {
    const raw = readFileSync(join(out, 'phones.index.json'), 'utf8');
    const entries = JSON.parse(raw);
    expect(entries.map((e: { slug: string }) => e.slug).sort()).toEqual([
      'samsung-galaxy-a15', 'samsung-galaxy-a16', 'samsung-galaxy-a26', 'xiaomi-poco-c75', 'xiaomi-redmi-note-14',
    ]);
    expect(entries.find((e: { slug: string }) => e.slug === 'xiaomi-redmi-note-14')).toMatchObject({
      name: 'Xiaomi Redmi Note 14', ptaPrice: 49000, officialWarranty: false,
    });
    expect(raw).not.toContain('\n');
  });
});

describe('sitemap and robots', () => {
  it('sitemap lists every built page except redirects', () => {
    const xml = readFileSync(join(out, 'sitemap.xml'), 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const built = all().map((f) => `https://fahdi.github.io${BASE}${f.slice(out.length + 1).replace(/index\.html$/, '')}`)
      .filter((u) => !readFileSync(join(out, u.slice(`https://fahdi.github.io${BASE}`.length), 'index.html'), 'utf8').includes('noindex'));
    expect(locs.sort()).toEqual(built.sort());
    expect(xml).not.toContain('xiaomi-redmi-note-14-vs-samsung-galaxy-a16');
  });

  it('robots.txt allows crawling and points at the sitemap', () => {
    const robots = readFileSync(join(out, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: https://fahdi.github.io${BASE}sitemap.xml`);
  });
});

describe('Open Graph images', () => {
  it('every indexable page points at a 1200x630 PNG that exists', async () => {
    const pages = all().map((f) => readFileSync(f, 'utf8')).filter((h) => !h.includes('noindex'));
    expect(pages.length).toBeGreaterThan(10);
    for (const html of pages) {
      const url = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      expect(url, html.match(/<title>(.*?)<\/title>/)?.[1]).toMatch(new RegExp(`^https://fahdi\\.github\\.io${BASE}og/.+\\.png$`));
      const file = join(out, url!.slice(`https://fahdi.github.io${BASE}`.length));
      const meta = await sharp(readFileSync(file)).metadata();
      expect([meta.format, meta.width, meta.height]).toEqual(['png', 1200, 630]);
    }
  });

  it('uses the large image card', () => {
    expect(page('phones/xiaomi-redmi-note-14')).toContain('<meta name="twitter:card" content="summary_large_image">');
  });
});

describe('theme', () => {
  it('every page applies a saved theme from <head> before the stylesheet', () => {
    for (const f of all()) {
      const html = readFileSync(f, 'utf8');
      if (html.includes('http-equiv="refresh"')) continue;
      const head = html.split('</head>')[0];
      const boot = head.indexOf("localStorage.getItem('theme')");
      const css = head.search(/<link rel="stylesheet"|<style/);
      expect(boot, f).toBeGreaterThan(-1);
      if (css > -1) expect(boot, f).toBeLessThan(css);
    }
  });
});

describe('whole site', () => {
  it('has no broken links or images, no links without the base path, and valid JSON-LD', () => {
    expect(checkSite(out, BASE).problems).toEqual([]);
  });
});
