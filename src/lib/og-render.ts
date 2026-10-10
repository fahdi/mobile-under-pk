import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import type { OgContent } from './og';

const require = createRequire(import.meta.url);
const font = (weight: 400 | 700) => readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`));
let fonts: Array<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }> | undefined;

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node =>
  ({ type, props: { style, children, ...extra } });

async function photo(publicDir: string, path: string): Promise<string> {
  const png = await sharp(readFileSync(join(publicDir, path))).resize(330, 440).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

// 1200x630 share image: text on the left, up to three phone photos on the right.
export async function renderOg(content: OgContent, publicDir: string): Promise<Buffer> {
  fonts ??= [
    { name: 'Inter', data: font(400), weight: 400, style: 'normal' },
    { name: 'Inter', data: font(700), weight: 700, style: 'normal' },
  ];
  const images = await Promise.all(content.images.slice(0, 3).map((p) => photo(publicDir, p)));
  const tree = el('div', { width: 1200, height: 630, display: 'flex', background: '#ffffff', fontFamily: 'Inter', padding: 56 }, [
    el('div', { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: images.length ? 560 : 1088 }, [
      el('div', { display: 'flex', fontSize: 30, fontWeight: 700, color: '#01411c' }, 'MobileUnder.pk'),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { display: 'flex', fontSize: 58, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1 }, content.title),
        el('div', { display: 'flex', fontSize: 30, color: '#555555', marginTop: 20 }, content.subtitle),
        ...(content.price ? [el('div', { display: 'flex', fontSize: 44, fontWeight: 700, color: '#01411c', marginTop: 20 }, content.price)] : []),
      ]),
      el('div', { display: 'flex', fontSize: 22, color: '#777777' }, 'PTA prices, official warranty, checked by hand'),
    ]),
    ...(images.length ? [el('div', { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' },
      images.map((src, i) => {
        // One photo large; two or three smaller and overlapping so they fit the 520px column.
        const [w, h] = images.length === 1 ? [330, 440] : [200, 267];
        return el('img', { width: w, height: h, marginLeft: i ? -40 : 0 }, undefined, { src, width: w, height: h });
      }))] : []),
  ]);
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  return new Resvg(svg).render().asPng();
}
