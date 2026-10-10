import sharp from 'sharp';
import { withBase } from './paths';

export const THUMB_WIDTHS = [160, 320] as const;

const name = (image: string) => image.replace(/^\/images\/phones\//, '').replace(/\.webp$/, '');

export function thumbSrc(image: string, width: number): string {
  return `/thumbs/${name(image)}-${width}.webp`;
}

export function thumbSrcset(image: string, base?: string): string {
  return THUMB_WIDTHS.map((w) => `${withBase(thumbSrc(image, w), base)} ${w}w`).join(', ');
}

// 3:4 transparent WebP thumbnail, small enough for galleries of dozens of phones.
export async function makeThumb(input: Buffer, width: number): Promise<Buffer> {
  return sharp(input)
    .resize(width, Math.round((width * 4) / 3), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 72, alphaQuality: 80, effort: 6 })
    .toBuffer();
}
