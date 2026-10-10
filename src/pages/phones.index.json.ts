import type { APIRoute } from 'astro';
import { getData } from '../lib/data';
import { toIndexEntry } from '../lib/index-entry';

// The finder's data, generated from the same validated records as the pages.
export const GET: APIRoute = () => {
  const data = getData();
  const name = (slug: string) => data.brands.find((b) => b.slug === slug)?.name ?? slug;
  const entries = data.phones.map((p) => toIndexEntry(p, name(p.brand)));
  return new Response(JSON.stringify(entries), { headers: { 'content-type': 'application/json' } });
};
