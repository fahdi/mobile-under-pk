# MobileUnder.pk

A decision tool for phone buyers in Pakistan. Pick a budget, see phones that are actually available locally (PTA status, warranty, stock), sort by what matters to you, and compare finalists side by side.

Covers phones released in 2024, 2025 and 2026, up to 150,000 PKR.

- Live site: https://fahdi.github.io/mobile-under-pk/
- PRD: [docs/superpowers/specs/2026-10-10-mobile-under-pk-design.md](docs/superpowers/specs/2026-10-10-mobile-under-pk-design.md)
- Implementation plan: [docs/superpowers/plans/2026-10-10-mobile-under-pk.md](docs/superpowers/plans/2026-10-10-mobile-under-pk.md)
- How to add or update a phone: [docs/RESEARCH.md](docs/RESEARCH.md)

## What the site has

- A page per budget bracket (`/mobile-under-50000-in-pakistan/`) with top 3 picks, a full ranked table and FAQs.
- A page per phone with every variant's PTA price, warranty, sources and check date, eight scores with reasons, specs and an official photo.
- Brand, release year and compare pages, plus intent pages such as `/best-camera-phone-under-80000/` where a priority changes the top 3.
- A finder (`/finder/`) that filters and ranks every phone and keeps its state in the URL, so a filtered view can be shared. It works without JavaScript.
- `sitemap.xml`, `robots.txt`, JSON-LD on every page and an Open Graph image per page.

## Running it locally

Needs Node 22.12 or newer.

```bash
npm ci
npm run dev        # http://localhost:4321/mobile-under-pk/
npm test           # unit, component and end-to-end tests
npm run validate   # schema and cross-checks for every file in data/
npm run build      # static site in dist/, fails on invalid data
```

## How the data works

- One JSON file per phone in `data/phones/`, validated by the Zod schema in `src/schema/phone.ts`. Unknown keys fail, so a typo cannot ship.
- `data/brands.json`, `data/brackets.json` (ceilings, intro and FAQ copy) and `data/presets.json` (ranking weights) hold the rest.
- A phone sits in the lowest bracket that fits its cheapest PTA approved variant. Grey market prices are recorded but never used for brackets or headline prices.
- The overall score is a weighted mean of the eight scores under a preset (spec section 8), never stored. Ties go to the cheaper PTA price, then the newer phone.
- Every phone needs an official photo, added with `npm run add-photo` (see the research guide).

## Checks that guard every change

Every pull request and every push to `main` runs:

1. `npm run validate`: schema, slugs, brands, rivals, brackets and photo files.
2. `npm test`: about 190 tests, including an end-to-end build against fixture data.
3. `npm run check`: Astro and TypeScript type checks.
4. `npm run build` and `npm run check:site`: every link and image resolves under the base path and all JSON-LD parses.
5. Lighthouse on mobile (median of 3 runs): SEO 100, performance and accessibility 95 or more.

`main` deploys to GitHub Pages only after all of these pass.

## Custom domain

The site builds for `https://fahdi.github.io/mobile-under-pk/` by default. To build for a custom domain, set both variables (also in the CI workflow):

```bash
SITE_URL=https://mobileunder.pk BASE_PATH=/ npm run build
```

## Prices

Prices are approximate PKR from official and PTA approved listings, rounded to the nearest 500, each with the date it was checked. They are refreshed by hand once a month; the routine is in [docs/RESEARCH.md](docs/RESEARCH.md).
