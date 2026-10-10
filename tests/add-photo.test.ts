import { describe, expect, it } from 'vitest';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { addPhoto } from '../scripts/lib/add-photo';

const tmpTree = () => {
  const root = mkdtempSync(join(tmpdir(), 'mupk-photo-'));
  cpSync('tests/fixtures/data-ok/data', join(root, 'data'), { recursive: true });
  return root;
};
const jpeg = () => sharp({ create: { width: 900, height: 1200, channels: 3, background: '#223344' } }).jpeg().toBuffer();
const credit = { name: 'Samsung Pakistan', url: 'https://www.samsung.com/pk/smartphones/galaxy-a/galaxy-a55-5g/' };

describe('addPhoto', () => {
  it('writes the processed WebP and records image and credit on the phone', async () => {
    const root = tmpTree();
    try {
      await addPhoto({ root, slug: 'samsung-galaxy-a55', input: await jpeg(), credit });
      const out = join(root, 'public/images/phones/samsung-galaxy-a55.webp');
      expect(existsSync(out)).toBe(true);
      expect((await sharp(out).metadata()).format).toBe('webp');
      const phone = JSON.parse(readFileSync(join(root, 'data/phones/samsung-galaxy-a55.json'), 'utf8'));
      expect(phone.image).toBe('/images/phones/samsung-galaxy-a55.webp');
      expect(phone.imageCredit).toEqual(credit);
      expect(Object.keys(phone).slice(0, 7)).toEqual(['slug', 'brand', 'model', 'releaseDate', 'status', 'image', 'imageCredit']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses an unknown slug without writing anything', async () => {
    const root = tmpTree();
    try {
      await expect(addPhoto({ root, slug: 'nope-phone', input: await jpeg(), credit })).rejects.toThrow(/no phone "nope-phone"/);
      expect(existsSync(join(root, 'public/images/phones/nope-phone.webp'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses a credit URL that is not https', async () => {
    const root = tmpTree();
    try {
      await expect(addPhoto({ root, slug: 'samsung-galaxy-a55', input: await jpeg(), credit: { name: 'x', url: 'ftp://x' } })).rejects.toThrow(/https/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
