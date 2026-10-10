import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getData } from '../../lib/data';
import { makeThumb, thumbSrc, THUMB_WIDTHS } from '../../lib/thumbs';

// Thumbnails generated at build from the official photos, so they never go stale.
export const getStaticPaths: GetStaticPaths = () =>
  getData().phones.flatMap((p) => THUMB_WIDTHS.map((width) => ({
    params: { file: thumbSrc(p.image, width).replace(/^\/thumbs\//, '').replace(/\.webp$/, '') },
    props: { image: p.image, width },
  })));

export const GET: APIRoute = async ({ props }) => {
  const publicDir = `${process.env.DATA_ROOT ?? '.'}/public`;
  const thumb = await makeThumb(readFileSync(join(publicDir, props.image as string)), props.width as number);
  return new Response(new Uint8Array(thumb), { headers: { 'content-type': 'image/webp' } });
};
