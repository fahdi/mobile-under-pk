import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { processPhoto } from './photo';

export interface Credit { name: string; url: string }

// Process an official photo for one phone and record it, keeping image fields right after `status`.
export async function addPhoto({ root, slug, input, credit }: { root: string; slug: string; input: Buffer; credit: Credit }): Promise<void> {
  const file = join(root, 'data/phones', `${slug}.json`);
  if (!existsSync(file)) throw new Error(`no phone "${slug}" in data/phones`);
  if (!credit.name || !/^https:\/\//.test(credit.url)) throw new Error('credit needs a name and an https URL');

  const webp = await processPhoto(input);
  const image = `/images/phones/${slug}.webp`;
  mkdirSync(join(root, 'public/images/phones'), { recursive: true });
  writeFileSync(join(root, 'public', image), webp);

  const phone = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(phone)) {
    if (k === 'image' || k === 'imageCredit') continue;
    out[k] = v;
    if (k === 'status') Object.assign(out, { image, imageCredit: credit });
  }
  writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
}
