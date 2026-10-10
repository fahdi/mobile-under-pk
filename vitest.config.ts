/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';
import astroConfig from './astro.config.mjs';

// Astro's Vite config lets tests render .astro components with the Container API.
// Vitest pins BASE_URL to "/", so mirror the Astro base to match the real build.
export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: { BASE_URL: `${astroConfig.base!.replace(/\/$/, '')}/` },
  },
});
