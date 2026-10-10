import type { APIRoute } from 'astro';
import { getData } from '../lib/data';
import { latestCheck } from '../lib/format';
import { sitemapPaths, sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => {
  const data = getData();
  const lastmod = latestCheck(data.phones) ?? new Date().toISOString().slice(0, 10);
  const xml = sitemapXml(sitemapPaths(data), site!, import.meta.env.BASE_URL, lastmod);
  return new Response(xml, { headers: { 'content-type': 'application/xml' } });
};
