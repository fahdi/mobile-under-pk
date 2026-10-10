// Usage: npm run add-photo -- <slug> <image file or https URL> "<credit name>" <credit https URL>
import { readFileSync } from 'node:fs';
import { addPhoto } from './lib/add-photo';

const [slug, src, name, url] = process.argv.slice(2);
if (!slug || !src || !name || !url) {
  console.error('usage: npm run add-photo -- <slug> <file|url> "<credit name>" <credit url>');
  process.exit(2);
}
async function download(u: string): Promise<Buffer> {
  const res = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 MobileUnder.pk' } });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${u}`);
  return Buffer.from(await res.arrayBuffer());
}
const input = /^https:\/\//.test(src) ? await download(src) : readFileSync(src);
await addPhoto({ root: process.cwd(), slug, input, credit: { name, url } });
console.log(`added public/images/phones/${slug}.webp`);
