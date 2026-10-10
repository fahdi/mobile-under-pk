import { defineConfig } from 'astro/config';
import { validateData } from './src/integrations/validate-data.ts';

// Custom domain later: set SITE_URL=https://mobileunder.pk BASE_PATH=/
const site = process.env.SITE_URL ?? 'https://fahdi.github.io';
const base = process.env.BASE_PATH ?? '/mobile-under-pk';
// Phone photos live with the data, so a DATA_ROOT tree brings its own public/.
const publicDir = process.env.DATA_ROOT ? `${process.env.DATA_ROOT}/public` : './public';

export default defineConfig({
  site,
  base,
  publicDir,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [validateData()],
});
