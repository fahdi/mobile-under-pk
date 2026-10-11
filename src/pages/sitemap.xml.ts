import type { APIRoute } from 'astro';
import { getData } from '../lib/data';
import { latestCheck } from '../lib/format';
import { sitemapPaths, sitemapXml } from '../lib/sitemap';
import { loadPosts } from '../lib/blog';

export const GET: APIRoute = ({ site }) => {
  const data = getData();
  const lastmod = latestCheck(data.phones) ?? new Date().toISOString().slice(0, 10);
  const xml = sitemapXml(sitemapPaths(data, loadPosts(process.env.DATA_ROOT ?? process.cwd()).posts.map((p) => p.slug)), site!, import.meta.env.BASE_URL, lastmod);
  return new Response(xml, { headers: { 'content-type': 'application/xml' } });
};
