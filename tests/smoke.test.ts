import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

describe('astro config', () => {
  it('defaults to the GitHub Pages base path with trailing slashes', () => {
    expect(config.base).toBe('/mobile-under-pk');
    expect(config.site).toBe('https://fahdi.github.io');
    expect(config.trailingSlash).toBe('always');
  });
});
