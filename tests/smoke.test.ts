import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

describe('astro config', () => {
  it('defaults to the GitHub Pages base path with trailing slashes', () => {
    expect(config.base).toBe('/mobile-under-pk');
    expect(config.site).toBe('https://fahdi.github.io');
    expect(config.trailingSlash).toBe('always');
  });

  it('registers the build-time data validation', () => {
    expect(config.integrations?.map((i) => (i as { name: string }).name)).toContain('validate-data');
  });
});
