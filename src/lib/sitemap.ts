import type { DataSet } from './load';
import { comparePaths } from './compare';
import { landingPaths } from './landing';
import { brandPaths, yearPaths } from './listing';
import { withBase } from './paths';

// Canonical pages only: built from the same path functions as the pages, so redirects never appear.
export function sitemapPaths(data: DataSet): string[] {
  return [
    '/',
    '/finder/',
    ...landingPaths(data).map((p) => `/${p.params.landing}/`),
    ...data.phones.map((p) => `/phones/${p.slug}/`),
    ...(brandPaths(data).length ? ['/brands/'] : []),
    ...brandPaths(data).map((p) => `/brands/${p.params.brand}/`),
    ...yearPaths(data).map((p) => `/year/${p.params.year}/`),
    ...comparePaths(data.phones).filter((p) => p.props.kind === 'page').map((p) => `/compare/${p.params.pair}/`),
  ];
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sitemapXml(paths: string[], site: string | URL, base: string, lastmod: string): string {
  const urls = paths.map((p) => `  <url><loc>${esc(new URL(withBase(p, base), site).href)}</loc><lastmod>${lastmod}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
