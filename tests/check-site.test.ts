import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkSite } from '../scripts/lib/check-site';

function site(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'mupk-check-'));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), body);
  }
  return root;
}
const BASE = '/mobile-under-pk/';

describe('checkSite', () => {
  it('passes a site whose links, images and JSON-LD are all good', () => {
    const dir = site({
      'index.html': `<a href="${BASE}phones/x/">x</a><img src="${BASE}img/x.webp"><script type="application/ld+json">{"a":1}</script>`,
      'phones/x/index.html': `<a href="${BASE}">home</a><a href="https://example.com/out">ext</a><a href="#top">top</a>`,
      'img/x.webp': 'x',
    });
    expect(checkSite(dir, BASE)).toEqual({ pages: 2, jsonLd: 1, problems: [] });
  });

  it('reports broken links, missing images, links without the base path and bad JSON-LD', () => {
    const dir = site({
      'index.html': `<a href="${BASE}nope/">a</a><img src="${BASE}img/missing.webp"><a href="/phones/x/">b</a><script type="application/ld+json">{bad</script>`,
    });
    expect(checkSite(dir, BASE).problems.sort()).toEqual([
      '/index.html: broken link /mobile-under-pk/img/missing.webp',
      '/index.html: broken link /mobile-under-pk/nope/',
      '/index.html: invalid JSON-LD',
      '/index.html: link without base path /phones/x/',
    ]);
  });

  it('ignores query strings and fragments on internal links', () => {
    const dir = site({ 'index.html': `<a href="${BASE}finder/?max=5">f</a><a href="${BASE}#x">h</a>`, 'finder/index.html': '' });
    expect(checkSite(dir, BASE).problems).toEqual([]);
  });

  it('checks every URL in srcset too', () => {
    const dir = site({ 'index.html': `<img src="${BASE}a.webp" srcset="${BASE}a.webp 160w, ${BASE}missing-320.webp 320w">`, 'a.webp': 'x' });
    expect(checkSite(dir, BASE).problems).toEqual(['/index.html: broken link /mobile-under-pk/missing-320.webp']);
  });
});
