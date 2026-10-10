import type { APIRoute, GetStaticPaths } from 'astro';
import { getData } from '../../lib/data';
import { ogContent, ogPath } from '../../lib/og';
import { renderOg } from '../../lib/og-render';
import { sitemapPaths } from '../../lib/sitemap';

// One share image per indexable page, rendered at build.
export const getStaticPaths: GetStaticPaths = () =>
  sitemapPaths(getData()).map((page) => ({
    params: { path: ogPath(page).replace(/^\/og\//, '').replace(/\.png$/, '') },
    props: { page },
  }));

export const GET: APIRoute = async ({ props }) => {
  const publicDir = `${process.env.DATA_ROOT ?? '.'}/public`;
  const png = await renderOg(ogContent(getData(), props.page as string), publicDir);
  return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
