import { describe, expect, it } from 'vitest';
import { withBase } from '../src/lib/paths';

describe('withBase', () => {
  const base = '/mobile-under-pk/';
  it('prefixes once and adds a trailing slash to pages', () => {
    expect(withBase('/phones/samsung-galaxy-a55', base)).toBe('/mobile-under-pk/phones/samsung-galaxy-a55/');
    expect(withBase('phones/x/', base)).toBe('/mobile-under-pk/phones/x/');
    expect(withBase('/', base)).toBe('/mobile-under-pk/');
  });
  it('never adds a trailing slash to files', () => {
    expect(withBase('/phones.index.json', base)).toBe('/mobile-under-pk/phones.index.json');
    expect(withBase('/og/phones/x.png', base)).toBe('/mobile-under-pk/og/phones/x.png');
  });
  it('works without the trailing slash on base and with a root base', () => {
    expect(withBase('/x', '/mobile-under-pk')).toBe('/mobile-under-pk/x/');
    expect(withBase('/x', '/')).toBe('/x/');
  });
  it('keeps query strings and hashes after the slash', () => {
    expect(withBase('/finder?max=50000', base)).toBe('/mobile-under-pk/finder/?max=50000');
  });
});
