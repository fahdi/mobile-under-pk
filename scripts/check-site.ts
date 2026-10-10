// Usage: npm run check:site [-- <dist dir>]
import { checkSite } from './lib/check-site';

const base = `${(process.env.BASE_PATH ?? '/mobile-under-pk').replace(/\/$/, '')}/`;
const { pages, jsonLd, problems } = checkSite(process.argv[2] ?? 'dist', base);
for (const p of problems) console.log(`ERROR ${p}`);
console.log(`${pages} pages, ${jsonLd} JSON-LD blocks, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
