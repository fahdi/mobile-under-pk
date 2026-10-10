import { defineConfig } from 'astro/config';

// Custom domain later: set SITE_URL=https://mobileunder.pk BASE_PATH=/
const site = process.env.SITE_URL ?? 'https://fahdi.github.io';
const base = process.env.BASE_PATH ?? '/mobile-under-pk';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
});
