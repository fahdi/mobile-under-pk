# MobileUnder.pk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static, SEO-first phone decision site for Pakistani buyers (2024 to 2026 phones, up to 150,000 PKR) on GitHub Pages, driven by one validated JSON file per phone.

**Architecture:** Astro + TypeScript generates every page at build from `data/*.json`. All data passes a Zod schema plus cross-checks before the build, so a malformed record cannot ship. Pure logic (bracket assignment, scoring, filtering, URL state) lives in `src/lib/` with Vitest tests and is shared by the pages and the one client-side island (the finder).

**Tech Stack:** Node 22 LTS in CI (Astro 7 needs >= 22.12), Astro 7.3, TypeScript 6.0 (`@astrojs/check` 0.9 peers on `^5 || ^6`, so not TS 7), Zod 4.6, Vitest 5, tsx 4, satori + @resvg/resvg-js for OG images, linkinator for link checks, @lhci/cli for Lighthouse. GitHub Actions: checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5.

**Spec:** `docs/superpowers/specs/2026-10-10-mobile-under-pk-design.md` (approved 2026-10-10; decisions in section 5 are not reopened here).

## Global Constraints

- Phones released in 2024, 2025 or 2026 only (`releaseDate` year in that set).
- Launch price up to 150,000 PKR. v1 brackets: 20k, 25k, 30k, 40k, 50k, 60k, 80k, 100k, 120k, 150k.
- A phone appears in the lowest bracket that fits its cheapest PTA approved variant.
- `status` is one of `available`, `limited`, `discontinued`. Discontinued phones are included and flagged.
- `warranty` is one of `official`, `local-shop`, `none`.
- Every variant has `priceCheckedAt` and at least one source. Prices are PKR, approximate, rounded to the nearest 500.
- All eight scores required (camera, performance, battery, display, build, software, value, availability), integer 1 to 10, each with a one-sentence reason that names the driving fact. `overall` is computed, never stored.
- Only pairs declared in `rivals` get a `/compare/` page; canonical order is alphabetical by slug.
- Trailing slashes everywhere. Base path `/mobile-under-pk/`, switchable for a custom domain via env.
- `lang="en-PK"`. Unique title and meta description per page. Canonical URL on every page. Visible "prices last checked" date on every page that shows a price.
- `public/phones.index.json` (derived, never committed) under 60 KB for 70 phones.
- Lighthouse targets: SEO 100, Performance 95+, Accessibility 95+.
- Writing rules for all copy, docs and commits: no em-dashes, avoid en-dashes, blank line before every markdown list.
- Commits end with the session attribution block; never "Generated with Claude Code" in a commit.

## Decisions made in this plan (implementation choices the spec left open)

| Choice | Decision | Reason |
| --- | --- | --- |
| Finder island | Vanilla TypeScript. It enhances server-rendered rows (hide and reorder by `data-slug`) instead of re-rendering, and reuses `src/lib` for logic. Switch to Preact only if `src/scripts/finder.ts` passes 300 lines. | Keeps the island small and the no-JS path identical to the JS path. |
| OG images | satori + @resvg/resvg-js at build through an Astro static endpoint, Inter TTF committed under `src/assets/fonts/` (OFL). | Per-page text (name, price) needs a renderer; a prebuilt static image cannot carry it. |
| Bracket and intent routes | One root route `src/pages/[landing].astro` serves both `mobile-under-N-in-pakistan` and `best-<preset>-phone-under-N`. | Two root-level dynamic routes would collide in Astro's router. |
| Compare non-canonical order | Static page with `<meta http-equiv="refresh">`, `rel=canonical` and `noindex`. | GitHub Pages has no server redirects. |
| Phone with no PTA approved variant, or cheapest PTA variant above 150,000 | Validation error. | Spec: cross-check "brackets cover all phones"; such a phone has no bracket. |
| Top 3 picks on bracket pages | Exclude `discontinued` phones; they still appear in the ranked table with a flag. | A pick the buyer cannot buy fails the site's job (spec section 2). |
| Tie on overall | Compare the rounded (1 decimal) overall, then cheaper PTA price, then newer `releaseDate`, then slug alphabetically. | Spec 8.3 plus a deterministic final key. |
| `value` preset "value score and price" | Weights favour `value`; price is applied through the existing cheaper-wins tie-break. | Avoids inventing a price score. Revisit if the preset's top 3 look wrong in M5. |
| `safe-buy` preset | `requireOfficialWarranty: true` filters to phones with a PTA variant whose warranty is `official`. | Spec 8.2. |
| Default `balanced` weights | 1.0 for all, 1.25 for `value` and `availability`. | Spec 8.1 "slightly higher". |
| `image` field | Optional in the schema. Phone images need a licence-clean source; pages render a neutral placeholder without one. | GSMArena images are not ours to rehost. |
| Price rounding to 500 | Warning, not error. | The spec's own example (119,999) is not rounded; the researcher fixes on sight. |
| Brands list | Seeded in M1 with names and countries; `officialStoreUrl` and `warrantyNote` nullable until the M2 reconcile task fills them (warning while null). | Lets research agents run in parallel without editing a shared file. |

## Review Focus

1. **Price on a bracket boundary**: a phone at exactly 50,000 belongs in the 50k bracket, 50,001 in 60k. Pinned in Task 4 (`brackets.test.ts`).
2. **Base path links**: every internal link and asset must carry `/mobile-under-pk/` exactly once with a trailing slash on pages and none on files. Pinned in Task 18 (`paths.test.ts`) and the M5 link check (Task 30).
3. **Garbage or hand-edited finder URLs** (`?max=abc&brand=nokia,,&sort=foo&w=camera:-5`): bad keys are dropped, valid ones kept, the page never throws. Pinned in Task 25 (`url-state.test.ts`).
4. **Phone with only non-PTA variants, or with a cheap non-PTA variant**: brackets and displayed prices use the PTA variant, never the grey-market price. Pinned in Task 4 and Task 25 (`index-entry.test.ts`).
5. **Rivals that are asymmetric, self-referencing or point at a missing slug**: missing or self is an error; asymmetric gets one compare page, not two. Pinned in Task 4 (`crosscheck.test.ts`) and Task 18 (`compare.test.ts`).

---

## File Structure

```
astro.config.mjs              site, base, trailingSlash from env
package.json                  scripts: dev, build, check, test, validate, build:index, ci:links, ci:lhci
tsconfig.json                 extends astro/tsconfigs/strict
vitest.config.ts
lighthouserc.json             (M5)
data/
  phones/*.json               one per phone (M2)
  brands.json                 seeded M1, completed M2
  brackets.json               ceilings + SEO copy
  presets.json                finder weight sets
docs/RESEARCH.md              research guide (M2, finalised M6)
public/images/phones/         optional licence-clean images
scripts/
  validate.ts                 CLI: schema + cross-checks, exit 1 on error
  build-index.ts              writes public/phones.index.json (M4)
  stage-site.sh               copies dist/ under dist-ci/mobile-under-pk/ for link check and Lighthouse (M5)
src/
  schema/phone.ts             PhoneSchema, VariantSchema, SCORE_KEYS, types
  schema/data.ts              BrandSchema, BracketSchema, PresetSchema
  lib/load.ts                 read and parse data/ from disk
  lib/brackets.ts             cheapestPtaVariant, assignBracket, bracketSlug
  lib/crosscheck.ts           crossCheck(dataSet, filenames) -> issues
  lib/data.ts                 getData(): validated DataSet for Astro, throws on error
  lib/paths.ts                withBase(path, base)
  lib/scoring.ts              overallScore, rankPhones, topPicks
  lib/seo.ts                  titles, descriptions, JSON-LD builders
  lib/compare.ts              comparePairs, canonicalPair
  lib/index-entry.ts          toIndexEntry
  lib/filters.ts              FinderState, matchesFilters, sortEntries
  lib/url-state.ts            toQuery, fromQuery
  layouts/Base.astro          head, canonical, OG, JSON-LD slot, header/footer
  components/*.astro          PhoneTable, PickCard, ScoreList, SpecTable, Breadcrumbs, PriceChecked
  scripts/finder.ts           the island (M4)
  pages/index.astro
  pages/[landing].astro       bracket + intent pages
  pages/phones/[slug].astro
  pages/brands/[brand].astro
  pages/year/[year].astro
  pages/compare/[pair].astro
  pages/finder.astro
  pages/og/[...path].png.ts   (M5)
  pages/robots.txt.ts         (M5)
tests/
  fixtures/                   small valid and invalid phone records
  *.test.ts
.github/workflows/ci.yml
.github/workflows/deploy.yml
```

---

## Milestone 1: Foundation

### Task 1: Astro + TypeScript scaffold with placeholder page

**Files:**

- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.nvmrc`, `src/pages/index.astro`, `tests/smoke.test.ts`

**Interfaces:**

- Produces: npm scripts `dev`, `build`, `check`, `test`, `validate`. Env `SITE_URL` (default `https://fahdi.github.io`) and `BASE_PATH` (default `/mobile-under-pk`).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "mobile-under-pk",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "validate": "tsx scripts/validate.ts"
  }
}
```

- [ ] **Step 2: Install pinned dependencies**

Run: `npm install astro@7.3.8 zod@4.6.5 && npm install -D typescript@6.0.3 @astrojs/check@0.9.10 vitest@5.0.3 tsx@4.23.15 @types/node@22`
Expected: lockfile written, no peer dependency errors.

- [ ] **Step 3: Write `astro.config.mjs`**

```js
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
```

- [ ] **Step 4: Write `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.nvmrc`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "dist-ci"]
}
```

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
```

```
node_modules/
dist/
dist-ci/
.astro/
public/phones.index.json
.lighthouseci/
.DS_Store
```

`.nvmrc`: `22`

- [ ] **Step 5: Write the placeholder page `src/pages/index.astro`**

```astro
---
const title = 'MobileUnder.pk: best mobile phones by budget in Pakistan';
---
<!doctype html>
<html lang="en-PK">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content="Pick a budget and compare phones actually available in Pakistan, with PTA status, warranty and checked PKR prices. Coming soon." />
    <link rel="canonical" href={new URL(import.meta.env.BASE_URL, Astro.site)} />
  </head>
  <body>
    <main>
      <h1>MobileUnder.pk</h1>
      <p>Phones released in 2024, 2025 and 2026, up to 150,000 PKR, with PTA status and checked prices. Coming soon.</p>
    </main>
  </body>
</html>
```

- [ ] **Step 6: Write a smoke test `tests/smoke.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import config from '../astro.config.mjs';

describe('astro config', () => {
  it('defaults to the GitHub Pages base path with trailing slashes', () => {
    expect(config.base).toBe('/mobile-under-pk');
    expect(config.site).toBe('https://fahdi.github.io');
    expect(config.trailingSlash).toBe('always');
  });
});
```

- [ ] **Step 7: Run test, check, build**

Run: `npm test && npm run check && npm run build && ls dist/index.html`
Expected: 1 test passes, `astro check` 0 errors, `dist/index.html` exists.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "Scaffold Astro site with placeholder page"
```

### Task 2: Phone schema

**Files:**

- Create: `src/schema/phone.ts`, `tests/schema-phone.test.ts`, `tests/fixtures/phone.ts`

**Interfaces:**

- Produces: `SCORE_KEYS`, `ScoreKey`, `STATUSES`, `WARRANTIES`, `PhoneSchema`, `VariantSchema`, `type Phone`, `type Variant`, `type Status`, `type Warranty`. Fixture helper `makePhone(overrides?: DeepPartial<Phone>): Phone` and `makeVariant(overrides?: Partial<Variant>): Variant`.

- [ ] **Step 1: Write the fixture `tests/fixtures/phone.ts`**

```ts
import type { Phone, Variant } from '../../src/schema/phone';

export function makeVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    ram: 8,
    storage: 128,
    pricePkr: 120000,
    priceCheckedAt: '2026-10-10',
    pta: true,
    warranty: 'official',
    sources: [{ name: 'PriceOye', url: 'https://priceoye.pk/mobiles/samsung/samsung-galaxy-a55' }],
    ...overrides,
  };
}

const reason = (s: string) => ({ reason: `${s} drives this score in the bracket.` });

export function makePhone(overrides: Partial<Phone> = {}): Phone {
  return {
    slug: 'samsung-galaxy-a55',
    brand: 'samsung',
    model: 'Galaxy A55',
    releaseDate: '2024-03-11',
    status: 'available',
    variants: [makeVariant()],
    specs: {
      chipset: 'Exynos 1480',
      display: { size: 6.6, type: 'Super AMOLED', refreshHz: 120, resolution: '1080x2340', peakNits: 1000 },
      battery: { mah: 5000, wiredW: 25, wirelessW: 0 },
      cameras: {
        rear: [{ mp: 50, type: 'wide', ois: true }],
        front: { mp: 32 },
        video: '4K@30fps',
      },
      build: { frame: 'aluminium', back: 'glass', front: 'Gorilla Glass Victus+', ip: 'IP67' },
      software: { os: 'Android 14, One UI 6.1', osUpdates: 4, securityYears: 5 },
      connectivity: { fiveG: true, nfc: true, jack35: false, esim: false },
      weightG: 213,
    },
    scores: {
      camera: { value: 7, ...reason('OIS main camera') },
      performance: { value: 6, ...reason('Exynos 1480') },
      battery: { value: 7, ...reason('5000 mAh with 25W') },
      display: { value: 8, ...reason('120Hz AMOLED') },
      build: { value: 8, ...reason('IP67 glass build') },
      software: { value: 9, ...reason('4 OS updates') },
      value: { value: 6, ...reason('Brand premium') },
      availability: { value: 9, ...reason('Official warranty') },
    },
    tags: ['safe-buy'],
    rivals: [],
    ...overrides,
  };
}
```

- [ ] **Step 2: Write failing tests `tests/schema-phone.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { PhoneSchema } from '../src/schema/phone';
import { makePhone, makeVariant } from './fixtures/phone';

const parse = (v: unknown) => PhoneSchema.safeParse(v);

describe('PhoneSchema', () => {
  it('accepts the spec example shape', () => {
    expect(parse(makePhone()).success).toBe(true);
  });

  it('rejects release years outside 2024 to 2026', () => {
    expect(parse(makePhone({ releaseDate: '2023-12-31' })).success).toBe(false);
    expect(parse(makePhone({ releaseDate: '2027-01-01' })).success).toBe(false);
    expect(parse(makePhone({ releaseDate: '2026-12-31' })).success).toBe(true);
  });

  it('rejects an unknown status or warranty', () => {
    expect(parse(makePhone({ status: 'sold-out' as never })).success).toBe(false);
    expect(parse(makePhone({ variants: [makeVariant({ warranty: 'shop' as never })] })).success).toBe(false);
  });

  it('requires at least one variant and one source per variant', () => {
    expect(parse(makePhone({ variants: [] })).success).toBe(false);
    expect(parse(makePhone({ variants: [makeVariant({ sources: [] })] })).success).toBe(false);
  });

  it('requires a valid priceCheckedAt date', () => {
    expect(parse(makePhone({ variants: [makeVariant({ priceCheckedAt: '10/10/2026' })] })).success).toBe(false);
  });

  it('requires all eight scores, integers 1 to 10, with a reason', () => {
    const p = makePhone();
    const { camera: _drop, ...seven } = p.scores;
    expect(parse({ ...p, scores: seven }).success).toBe(false);
    expect(parse({ ...p, scores: { ...p.scores, camera: { value: 11, reason: 'Too high a score here.' } } }).success).toBe(false);
    expect(parse({ ...p, scores: { ...p.scores, camera: { value: 7.5, reason: 'Fractions are not allowed.' } } }).success).toBe(false);
    expect(parse({ ...p, scores: { ...p.scores, camera: { value: 7, reason: '' } } }).success).toBe(false);
  });

  it('rejects a stored overall score and unknown keys (typo guard)', () => {
    const p = makePhone();
    expect(parse({ ...p, scores: { ...p.scores, overall: { value: 7, reason: 'Never stored here.' } } }).success).toBe(false);
    expect(parse({ ...p, colour: 'blue' }).success).toBe(false);
  });

  it('rejects slugs that are not lowercase kebab case', () => {
    expect(parse(makePhone({ slug: 'Samsung_A55' })).success).toBe(false);
  });

  it('rejects non-integer or non-positive prices', () => {
    expect(parse(makePhone({ variants: [makeVariant({ pricePkr: 0 })] })).success).toBe(false);
    expect(parse(makePhone({ variants: [makeVariant({ pricePkr: 1000.5 })] })).success).toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/schema-phone.test.ts`
Expected: FAIL, cannot resolve `../src/schema/phone`.

- [ ] **Step 4: Implement `src/schema/phone.ts`**

```ts
import { z } from 'zod';

export const SCORE_KEYS = [
  'camera', 'performance', 'battery', 'display', 'build', 'software', 'value', 'availability',
] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];

export const STATUSES = ['available', 'limited', 'discontinued'] as const;
export const WARRANTIES = ['official', 'local-shop', 'none'] as const;
export const RELEASE_YEARS = [2024, 2025, 2026] as const;

export const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase kebab-case');
const IsoDate = z.iso.date();
const PositiveInt = z.number().int().positive();

export const SourceSchema = z.strictObject({ name: z.string().min(1), url: z.url() });

export const VariantSchema = z.strictObject({
  ram: PositiveInt,
  storage: PositiveInt,
  pricePkr: PositiveInt,
  priceCheckedAt: IsoDate,
  pta: z.boolean(),
  warranty: z.enum(WARRANTIES),
  sources: z.array(SourceSchema).min(1),
});

const ScoreSchema = z.strictObject({
  value: z.number().int().min(1).max(10),
  reason: z.string().min(10),
});

const CameraSchema = z.strictObject({
  mp: z.number().positive(),
  type: z.enum(['wide', 'ultrawide', 'telephoto', 'periscope', 'macro', 'depth', 'mono']),
  ois: z.boolean(),
});

const SpecsSchema = z.strictObject({
  chipset: z.string().min(1),
  display: z.strictObject({
    size: z.number().positive(),
    type: z.string().min(1),
    refreshHz: PositiveInt,
    resolution: z.string().regex(/^\d+x\d+$/),
    peakNits: PositiveInt.optional(),
  }),
  battery: z.strictObject({
    mah: PositiveInt,
    wiredW: z.number().nonnegative(),
    wirelessW: z.number().nonnegative(),
  }),
  cameras: z.strictObject({
    rear: z.array(CameraSchema).min(1),
    front: z.strictObject({ mp: z.number().positive() }),
    video: z.string().min(1),
  }),
  build: z.strictObject({
    frame: z.string().min(1),
    back: z.string().min(1),
    front: z.string().min(1).nullable(),
    ip: z.string().regex(/^IP\d[\dX]$/).nullable(),
  }),
  software: z.strictObject({
    os: z.string().min(1),
    osUpdates: z.number().int().nonnegative(),
    securityYears: z.number().int().nonnegative(),
  }),
  connectivity: z.strictObject({
    fiveG: z.boolean(), nfc: z.boolean(), jack35: z.boolean(), esim: z.boolean(),
  }),
  weightG: z.number().positive(),
});

export const PhoneSchema = z.strictObject({
  slug: SlugSchema,
  brand: SlugSchema,
  model: z.string().min(1),
  releaseDate: IsoDate.refine(
    (d) => (RELEASE_YEARS as readonly number[]).includes(Number(d.slice(0, 4))),
    'release year must be 2024, 2025 or 2026',
  ),
  status: z.enum(STATUSES),
  image: z.string().regex(/^\/images\/phones\/[a-z0-9-]+\.webp$/).optional(),
  variants: z.array(VariantSchema).min(1),
  specs: SpecsSchema,
  scores: z.strictObject(
    Object.fromEntries(SCORE_KEYS.map((k) => [k, ScoreSchema])) as Record<ScoreKey, typeof ScoreSchema>,
  ),
  tags: z.array(SlugSchema),
  rivals: z.array(SlugSchema),
  notes: z.string().min(1).optional(),
});

export type Phone = z.infer<typeof PhoneSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type Status = (typeof STATUSES)[number];
export type Warranty = (typeof WARRANTIES)[number];
export type Scores = Phone['scores'];
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/schema-phone.test.ts`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/schema/phone.ts tests/ && git commit -m "Add Zod phone schema with tests"
```

### Task 3: Supporting data schemas and seed data

**Files:**

- Create: `src/schema/data.ts`, `data/brands.json`, `data/brackets.json`, `data/presets.json`, `data/phones/.gitkeep`, `tests/schema-data.test.ts`

**Interfaces:**

- Consumes: `SlugSchema`, `SCORE_KEYS`, `ScoreKey` from Task 2.
- Produces: `BrandSchema`, `BracketSchema`, `PresetSchema`, `BracketsFileSchema`, `type Brand`, `type Bracket`, `type Preset`, `type Weights = Partial<Record<ScoreKey, number>>`.

- [ ] **Step 1: Write failing tests `tests/schema-data.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BracketsFileSchema, BrandSchema, PresetSchema } from '../src/schema/data';
import { z } from 'zod';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

describe('seed data files', () => {
  it('brands.json parses', () => {
    expect(z.array(BrandSchema).safeParse(read('data/brands.json')).success).toBe(true);
  });
  it('brackets.json has the ten v1 ceilings in ascending order', () => {
    const b = BracketsFileSchema.parse(read('data/brackets.json'));
    expect(b.map((x) => x.ceiling)).toEqual([20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000, 150000]);
  });
  it('presets.json has the six spec presets with balanced first', () => {
    const p = z.array(PresetSchema).parse(read('data/presets.json'));
    expect(p.map((x) => x.slug)).toEqual(['balanced', 'camera-first', 'battery-first', 'gaming', 'safe-buy', 'value']);
    expect(p.find((x) => x.slug === 'safe-buy')?.requireOfficialWarranty).toBe(true);
  });
});

describe('schema rules', () => {
  it('rejects unsorted or duplicate bracket ceilings', () => {
    const mk = (c: number) => ({ ceiling: c, intro: 'Intro text for the bracket.', faq: [] });
    expect(BracketsFileSchema.safeParse([mk(30000), mk(20000)]).success).toBe(false);
    expect(BracketsFileSchema.safeParse([mk(20000), mk(20000)]).success).toBe(false);
  });
  it('rejects presets with unknown score keys or all-zero weights', () => {
    expect(PresetSchema.safeParse({ slug: 'x', name: 'X', description: 'Desc.', weights: { speed: 1 } }).success).toBe(false);
    expect(PresetSchema.safeParse({ slug: 'x', name: 'X', description: 'Desc.', weights: { camera: 0 } }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/schema-data.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/schema/data.ts`**

```ts
import { z } from 'zod';
import { SCORE_KEYS, SlugSchema, type ScoreKey } from './phone';

export const BrandSchema = z.strictObject({
  slug: SlugSchema,
  name: z.string().min(1),
  country: z.string().min(1),
  officialStoreUrl: z.url().nullable(),
  warrantyNote: z.string().min(1).nullable(),
});

const FaqSchema = z.strictObject({ q: z.string().min(1), a: z.string().min(1) });

export const BracketSchema = z.strictObject({
  ceiling: z.number().int().positive(),
  intro: z.string().min(1),
  faq: z.array(FaqSchema),
});

export const BracketsFileSchema = z.array(BracketSchema).min(1).refine(
  (bs) => bs.every((b, i) => i === 0 || b.ceiling > bs[i - 1].ceiling),
  'ceilings must be strictly ascending',
);

const WeightsSchema = z
  .partialRecord(z.enum(SCORE_KEYS), z.number().nonnegative())
  .refine((w) => Object.values(w).some((v) => (v ?? 0) > 0), 'at least one weight must be positive');

export const PresetSchema = z.strictObject({
  slug: SlugSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  weights: WeightsSchema,
  requireOfficialWarranty: z.boolean().optional(),
  intent: z.string().min(1).optional(),
});

export type Brand = z.infer<typeof BrandSchema>;
export type Bracket = z.infer<typeof BracketSchema>;
export type Preset = z.infer<typeof PresetSchema>;
export type Weights = Partial<Record<ScoreKey, number>>;
```

`intent` is the word used in intent landing URLs (`best-camera-phone-under-60000`), set on presets that get landing pages in M5.

- [ ] **Step 4: Write seed data**

`data/brands.json`: entries for samsung (South Korea), xiaomi (China), oppo (China), vivo (China), realme (China), infinix (Hong Kong), tecno (China), itel (China), honor (China), oneplus (China), motorola (United States), nothing (United Kingdom), google (United States), apple (United States), sparx (Pakistan), zte (China), hmd (Finland), huawei (China). Each with `officialStoreUrl: null, warrantyNote: null` (filled in Task 17).

`data/brackets.json`: ten entries, ceilings as in the test, each with a one-paragraph `intro` written for that budget (e.g. 20000: "Under 20,000 PKR you are buying a basic Android phone for calls, WhatsApp and light use. Expect 4 to 6 GB of RAM, a 5000 mAh battery and a 90Hz screen at best.") and `faq: []` (filled in Task 20).

`data/presets.json`:

```json
[
  { "slug": "balanced", "name": "Balanced", "description": "Good at everything, weighted toward value and local availability.",
    "weights": { "camera": 1, "performance": 1, "battery": 1, "display": 1, "build": 1, "software": 1, "value": 1.25, "availability": 1.25 } },
  { "slug": "camera-first", "name": "Camera first", "description": "Ranks photo and video quality above everything else.", "intent": "camera",
    "weights": { "camera": 3, "display": 1, "performance": 0.5, "battery": 0.5, "value": 1, "availability": 1 } },
  { "slug": "battery-first", "name": "Battery first", "description": "Longest battery life and fastest charging.", "intent": "battery",
    "weights": { "battery": 3, "performance": 0.5, "display": 0.5, "value": 1, "availability": 1 } },
  { "slug": "gaming", "name": "Gaming", "description": "Sustained performance and a fast, bright display.", "intent": "gaming",
    "weights": { "performance": 3, "display": 2, "battery": 1, "value": 1, "availability": 1 } },
  { "slug": "safe-buy", "name": "Safe buy", "description": "Official warranty only, long software support, solid build.", "requireOfficialWarranty": true,
    "weights": { "availability": 3, "software": 2, "build": 2, "value": 1 } },
  { "slug": "value", "name": "Best value", "description": "Most phone for the money; ties go to the cheaper phone.",
    "weights": { "value": 3, "availability": 1, "performance": 0.5, "camera": 0.5, "battery": 0.5 } }
]
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run tests/schema-data.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/schema/data.ts data/ tests/schema-data.test.ts && git commit -m "Add brand, bracket and preset schemas with seed data"
```

### Task 4: Bracket assignment, data loader, cross-checks and `npm run validate`

**Files:**

- Create: `src/lib/brackets.ts`, `src/lib/load.ts`, `src/lib/crosscheck.ts`, `src/lib/data.ts`, `scripts/validate.ts`, `tests/brackets.test.ts`, `tests/crosscheck.test.ts`, `tests/load.test.ts`, `tests/fixtures/data-ok/...`, `tests/fixtures/data-bad/...`

**Interfaces:**

- Consumes: schemas from Tasks 2 and 3, `makePhone`, `makeVariant`.
- Produces:
  - `cheapestPtaVariant(phone: Phone): Variant | undefined`
  - `cheapestVariant(phone: Phone): Variant`
  - `assignBracket(phone: Phone, brackets: Bracket[]): Bracket | undefined`
  - `bracketSlug(ceiling: number): string` returns `mobile-under-${ceiling}-in-pakistan`
  - `interface DataSet { phones: Phone[]; brands: Brand[]; brackets: Bracket[]; presets: Preset[] }`
  - `interface Issue { level: 'error' | 'warning'; file: string; message: string }`
  - `loadData(root: string): { data: DataSet; issues: Issue[] }` (schema issues only; invalid phones excluded from `data.phones`)
  - `crossCheck(data: DataSet, today: string): Issue[]`
  - `getData(): DataSet` (Astro side; throws listing every error; memoised)

- [ ] **Step 1: Write failing `tests/brackets.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { assignBracket, bracketSlug, cheapestPtaVariant } from '../src/lib/brackets';
import { makePhone, makeVariant } from './fixtures/phone';

const brackets = [20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000, 150000]
  .map((ceiling) => ({ ceiling, intro: 'x', faq: [] }));

describe('assignBracket', () => {
  it('puts a price exactly on a ceiling into that bracket', () => {
    const p = makePhone({ variants: [makeVariant({ pricePkr: 50000 })] });
    expect(assignBracket(p, brackets)?.ceiling).toBe(50000);
  });
  it('puts one rupee over into the next bracket', () => {
    const p = makePhone({ variants: [makeVariant({ pricePkr: 50001 })] });
    expect(assignBracket(p, brackets)?.ceiling).toBe(60000);
  });
  it('uses the cheapest PTA variant, ignoring a cheaper non-PTA one', () => {
    const p = makePhone({ variants: [
      makeVariant({ pricePkr: 35000, pta: false, warranty: 'none' }),
      makeVariant({ pricePkr: 58000, storage: 256 }),
      makeVariant({ pricePkr: 52000 }),
    ] });
    expect(cheapestPtaVariant(p)?.pricePkr).toBe(52000);
    expect(assignBracket(p, brackets)?.ceiling).toBe(60000);
  });
  it('returns undefined when no PTA variant exists or price exceeds the top bracket', () => {
    expect(assignBracket(makePhone({ variants: [makeVariant({ pta: false })] }), brackets)).toBeUndefined();
    expect(assignBracket(makePhone({ variants: [makeVariant({ pricePkr: 150500 })] }), brackets)).toBeUndefined();
  });
  it('builds the SEO slug', () => {
    expect(bracketSlug(50000)).toBe('mobile-under-50000-in-pakistan');
  });
});
```

- [ ] **Step 2: Run, expect FAIL (module missing). Implement `src/lib/brackets.ts`**

```ts
import type { Phone, Variant } from '../schema/phone';
import type { Bracket } from '../schema/data';

const byPrice = (a: Variant, b: Variant) => a.pricePkr - b.pricePkr;

export function cheapestPtaVariant(phone: Phone): Variant | undefined {
  return phone.variants.filter((v) => v.pta).sort(byPrice)[0];
}

export function cheapestVariant(phone: Phone): Variant {
  return [...phone.variants].sort(byPrice)[0];
}

export function assignBracket(phone: Phone, brackets: Bracket[]): Bracket | undefined {
  const v = cheapestPtaVariant(phone);
  if (!v) return undefined;
  return brackets.find((b) => v.pricePkr <= b.ceiling);
}

export function bracketSlug(ceiling: number): string {
  return `mobile-under-${ceiling}-in-pakistan`;
}
```

Run: `npx vitest run tests/brackets.test.ts` Expected: PASS.

- [ ] **Step 3: Write failing `tests/crosscheck.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { crossCheck } from '../src/lib/crosscheck';
import type { DataSet } from '../src/lib/load';
import { makePhone, makeVariant } from './fixtures/phone';

const brackets = [20000, 50000, 150000].map((ceiling) => ({ ceiling, intro: 'x', faq: [] }));
const brands = [{ slug: 'samsung', name: 'Samsung', country: 'South Korea', officialStoreUrl: 'https://www.samsung.com/pk/', warrantyNote: 'Official 1 year.' }];
const presets = [{ slug: 'balanced', name: 'B', description: 'd', weights: { camera: 1 } }];
const ds = (phones = [makePhone()]): DataSet => ({ phones, brands, brackets, presets });
const errors = (d: DataSet) => crossCheck(d, '2026-10-10').filter((i) => i.level === 'error').map((i) => i.message);

describe('crossCheck', () => {
  it('passes a clean data set', () => {
    expect(errors(ds())).toEqual([]);
  });
  it('flags an unknown brand', () => {
    expect(errors(ds([makePhone({ brand: 'nokia' })]))).toEqual([expect.stringContaining('unknown brand "nokia"')]);
  });
  it('flags a rival that does not exist and a self rival', () => {
    expect(errors(ds([makePhone({ rivals: ['ghost-phone'] })]))).toEqual([expect.stringContaining('rival "ghost-phone" does not exist')]);
    expect(errors(ds([makePhone({ rivals: ['samsung-galaxy-a55'] })]))).toEqual([expect.stringContaining('lists itself as a rival')]);
  });
  it('flags a phone with no bracket', () => {
    expect(errors(ds([makePhone({ variants: [makeVariant({ pta: false })] })]))).toEqual([expect.stringContaining('no PTA approved variant')]);
    expect(errors(ds([makePhone({ variants: [makeVariant({ pricePkr: 160000 })] })]))).toEqual([expect.stringContaining('above the top bracket')]);
  });
  it('flags a priceCheckedAt in the future', () => {
    expect(errors(ds([makePhone({ variants: [makeVariant({ priceCheckedAt: '2026-10-11' })] })]))).toEqual([expect.stringContaining('in the future')]);
  });
  it('flags duplicate slugs', () => {
    expect(errors(ds([makePhone(), makePhone()]))).toEqual([expect.stringContaining('duplicate slug')]);
  });
  it('warns, not errors, on unrounded prices, sparse brackets and missing brand info', () => {
    const d: DataSet = { ...ds([makePhone({ variants: [makeVariant({ pricePkr: 119999 })] })]), brands: [{ ...brands[0], warrantyNote: null }] };
    const issues = crossCheck(d, '2026-10-10');
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    const w = issues.map((i) => i.message).join('\n');
    expect(w).toContain('not rounded to 500');
    expect(w).toContain('fewer than 3 phones');
    expect(w).toContain('warrantyNote');
  });
});
```

- [ ] **Step 4: Implement `src/lib/load.ts` and `src/lib/crosscheck.ts`**

`src/lib/load.ts`:

```ts
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { z } from 'zod';
import { PhoneSchema, type Phone } from '../schema/phone';
import { BracketsFileSchema, BrandSchema, PresetSchema, type Bracket, type Brand, type Preset } from '../schema/data';

export interface DataSet { phones: Phone[]; brands: Brand[]; brackets: Bracket[]; presets: Preset[] }
export interface Issue { level: 'error' | 'warning'; file: string; message: string }

const fmt = (e: z.ZodError) => e.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');

function readJson(path: string, file: string, issues: Issue[]): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    issues.push({ level: 'error', file, message: `cannot read JSON: ${(err as Error).message}` });
    return undefined;
  }
}

function parseFile<T>(root: string, rel: string, schema: z.ZodType<T>, fallback: T, issues: Issue[]): T {
  const raw = readJson(join(root, rel), rel, issues);
  if (raw === undefined) return fallback;
  const r = schema.safeParse(raw);
  if (!r.success) { issues.push({ level: 'error', file: rel, message: fmt(r.error) }); return fallback; }
  return r.data;
}

export function loadData(root: string): { data: DataSet; issues: Issue[] } {
  const issues: Issue[] = [];
  const brands = parseFile(root, 'data/brands.json', z.array(BrandSchema), [], issues);
  const brackets = parseFile(root, 'data/brackets.json', BracketsFileSchema, [], issues);
  const presets = parseFile(root, 'data/presets.json', z.array(PresetSchema), [], issues);

  const dir = join(root, 'data/phones');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const phones: Phone[] = [];
  for (const f of files) {
    const rel = `data/phones/${f}`;
    const raw = readJson(join(dir, f), rel, issues);
    if (raw === undefined) continue;
    const r = PhoneSchema.safeParse(raw);
    if (!r.success) { issues.push({ level: 'error', file: rel, message: fmt(r.error) }); continue; }
    if (r.data.slug !== basename(f, '.json')) {
      issues.push({ level: 'error', file: rel, message: `slug "${r.data.slug}" does not match filename` });
    }
    phones.push(r.data);
  }
  return { data: { phones, brands, brackets, presets }, issues };
}
```

`src/lib/crosscheck.ts`:

```ts
import { assignBracket, cheapestPtaVariant } from './brackets';
import type { DataSet, Issue } from './load';

export function crossCheck(data: DataSet, today: string): Issue[] {
  const issues: Issue[] = [];
  const err = (file: string, message: string) => issues.push({ level: 'error', file, message });
  const warn = (file: string, message: string) => issues.push({ level: 'warning', file, message });

  const slugs = new Set<string>();
  const brandSlugs = new Set(data.brands.map((b) => b.slug));
  const top = data.brackets.at(-1)?.ceiling ?? 0;
  const perBracket = new Map<number, number>(data.brackets.map((b) => [b.ceiling, 0]));

  for (const p of data.phones) {
    if (slugs.has(p.slug)) err(p.slug, `duplicate slug "${p.slug}"`);
    slugs.add(p.slug);
  }

  for (const p of data.phones) {
    const f = `data/phones/${p.slug}.json`;
    if (!brandSlugs.has(p.brand)) err(f, `unknown brand "${p.brand}" (add it to data/brands.json)`);
    for (const r of p.rivals) {
      if (r === p.slug) err(f, 'lists itself as a rival');
      else if (!slugs.has(r)) err(f, `rival "${r}" does not exist`);
    }
    p.variants.forEach((v, i) => {
      if (v.priceCheckedAt > today) err(f, `variants.${i}.priceCheckedAt ${v.priceCheckedAt} is in the future`);
      if (v.pricePkr % 500 !== 0) warn(f, `variants.${i}.pricePkr ${v.pricePkr} is not rounded to 500`);
    });
    const pta = cheapestPtaVariant(p);
    if (!pta) { err(f, 'no PTA approved variant, so no bracket'); continue; }
    const b = assignBracket(p, data.brackets);
    if (!b) { err(f, `cheapest PTA price ${pta.pricePkr} is above the top bracket ${top}`); continue; }
    perBracket.set(b.ceiling, (perBracket.get(b.ceiling) ?? 0) + 1);
  }

  for (const [ceiling, n] of perBracket) {
    if (n < 3) warn('data/brackets.json', `bracket ${ceiling} has ${n} phones, fewer than 3 phones`);
  }
  for (const b of data.brands) {
    if (!b.officialStoreUrl) warn('data/brands.json', `${b.slug}: officialStoreUrl is null`);
    if (!b.warrantyNote) warn('data/brands.json', `${b.slug}: warrantyNote is null`);
  }
  return issues;
}
```

Run: `npx vitest run tests/crosscheck.test.ts` Expected: PASS.

- [ ] **Step 5: Write `tests/load.test.ts` with on-disk fixtures**

Fixtures: `tests/fixtures/data-ok/data/{brands,brackets,presets}.json` (copies of minimal valid content) plus `data/phones/samsung-galaxy-a55.json` (the spec example with price 120000). `tests/fixtures/data-bad/data/` is the same plus `data/phones/wrong-name.json` (valid record whose slug is `samsung-galaxy-a55`) and `data/phones/broken.json` containing `{ "slug": `.

```ts
import { describe, expect, it } from 'vitest';
import { loadData } from '../src/lib/load';

describe('loadData', () => {
  it('loads a valid tree with no issues', () => {
    const { data, issues } = loadData('tests/fixtures/data-ok');
    expect(issues).toEqual([]);
    expect(data.phones.map((p) => p.slug)).toEqual(['samsung-galaxy-a55']);
  });
  it('reports broken JSON and slug/filename mismatch without throwing', () => {
    const { issues } = loadData('tests/fixtures/data-bad');
    const msgs = issues.map((i) => `${i.file}: ${i.message}`).join('\n');
    expect(msgs).toContain('broken.json: cannot read JSON');
    expect(msgs).toContain('wrong-name.json: slug "samsung-galaxy-a55" does not match filename');
  });
});
```

Run: `npx vitest run tests/load.test.ts` Expected: PASS.

- [ ] **Step 6: Implement `scripts/validate.ts` and `src/lib/data.ts`**

`scripts/validate.ts`:

```ts
import { loadData } from '../src/lib/load';
import { crossCheck } from '../src/lib/crosscheck';

const root = process.argv[2] ?? process.cwd();
const today = new Date().toISOString().slice(0, 10);
const { data, issues } = loadData(root);
const all = [...issues, ...crossCheck(data, today)];

for (const i of all) console.log(`${i.level.toUpperCase()} ${i.file}: ${i.message}`);
const errors = all.filter((i) => i.level === 'error').length;
console.log(`\n${data.phones.length} phones, ${errors} errors, ${all.length - errors} warnings`);
process.exit(errors ? 1 : 0);
```

`today` is UTC: a price checked on the evening of the PKT date before UTC midnight could read as "future" for up to 5 hours. Acceptable; noted in RESEARCH.md.

`src/lib/data.ts`:

```ts
import { crossCheck } from './crosscheck';
import { loadData, type DataSet } from './load';

let cache: DataSet | undefined;

export function getData(): DataSet {
  if (cache) return cache;
  const { data, issues } = loadData(process.cwd());
  const today = new Date().toISOString().slice(0, 10);
  const errors = [...issues, ...crossCheck(data, today)].filter((i) => i.level === 'error');
  if (errors.length) {
    throw new Error(`Invalid data:\n${errors.map((e) => `  ${e.file}: ${e.message}`).join('\n')}`);
  }
  cache = data;
  return data;
}
```

- [ ] **Step 7: Run the CLI against good, bad and real data**

Run: `npm run validate -- tests/fixtures/data-ok; echo "exit $?"; npm run validate -- tests/fixtures/data-bad; echo "exit $?"; npm run validate; echo "exit $?"`
Expected: `exit 0`, then error lines and `exit 1`, then real data (0 phones) with warnings only and `exit 0`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "Add bracket assignment, data loader, cross-checks and validate script"
```

### Task 5: CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: npm scripts `validate`, `test`, `check`, `build`. M5 Task 25 appends link check and Lighthouse jobs.

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run validate
      - run: npm test
      - run: npm run check
      - run: npm run build
```

- [ ] **Step 2: Push on a branch, open a PR, watch it**

Run: `git switch -c ci-workflow && git add .github/workflows/ci.yml && git commit -m "Add CI workflow" && git push -u origin ci-workflow && gh pr create --fill && gh pr checks --watch`
Expected: `verify` passes.

- [ ] **Step 3: Prove it fails on bad data**

Push a commit adding `data/phones/broken.json` with `{}` to the branch, confirm `verify` fails at `npm run validate`, then revert that commit and confirm green.

- [ ] **Step 4: Merge**

Run: `gh pr merge --squash --delete-branch`

### Task 6: Pages deploy workflow and live placeholder

**Files:**

- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Enable Pages with the Actions build type**

Run: `gh api -X POST repos/fahdi/mobile-under-pk/pages -f build_type=workflow`
Expected: JSON with `"build_type": "workflow"` (a 409 means it already exists; then `gh api -X PUT repos/fahdi/mobile-under-pk/pages -f build_type=workflow`).

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run validate
      - run: npm run build
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 3: Commit, push to main, watch the run**

Run: `git add .github/workflows/deploy.yml && git commit -m "Add GitHub Pages deploy workflow" && git push && gh run watch $(gh run list --workflow deploy.yml -L1 --json databaseId -q '.[0].databaseId') --exit-status`
Expected: build and deploy succeed.

- [ ] **Step 4: Verify live**

Run: `curl -sSI https://fahdi.github.io/mobile-under-pk/ | head -1 && curl -sS https://fahdi.github.io/mobile-under-pk/ | grep -o '<h1>[^<]*</h1>'`
Expected: `HTTP/2 200` and `<h1>MobileUnder.pk</h1>`. Also load it in a browser and confirm no console errors.

---

## Milestone 2: Data

### Task 7: Research guide and agent brief

**Files:**

- Create: `docs/RESEARCH.md`

- [ ] **Step 1: Write `docs/RESEARCH.md`** covering, with a blank line before every list:

  1. Scope: release year 2024 to 2026, cheapest PTA price up to 150,000 PKR, include discontinued with `status: "discontinued"`.
  2. Source priority (spec 11): official brand Pakistan store, PriceOye, WhatMobile, Daraz official stores, GSMArena for specs only (never for price).
  3. Price rule: lowest price from an official or PTA approved listing, rounded to the nearest 500, `priceCheckedAt` = the PKT date you looked (and note the UTC caveat from Task 4). Non-PTA listings may be recorded as separate variants with `pta: false` and `warranty: "none"`.
  4. `status`: `available` if two or more mainstream retailers list it in stock; `limited` if only one, or only grey market; `discontinued` if the brand lists it as discontinued or no PK retailer stocks it.
  5. Score rubric per key with anchors (1, 4, 7, 10) relative to the whole 20k to 150k range, so a 9 in the 30k bracket means excellent overall, not just for the price, except `value`, which is relative to its bracket. Reason must name the fact that drove the score.
  6. `rivals`: 2 to 3 slugs, same bracket, that a buyer would genuinely cross-shop. Only list a slug that exists or that another agent in this batch owns (see the allocation table in the issue).
  7. File naming: `data/phones/<brand>-<model-kebab>.json`, slug equals filename.
  8. Before committing: `npm run validate` must show 0 errors for your files.
  9. Images: leave `image` out unless you have a licence-clean source.

- [ ] **Step 2: Commit**

```bash
git add docs/RESEARCH.md && git commit -m "Add research guide"
```

### Tasks 8 to 16: Research one bracket group each (parallel agents)

The ten brackets are split into nine parallel units so each agent has 5 to 8 phones. Each unit is one GitHub issue and one agent.

| Task | Brackets (cheapest PTA price) | Target phones |
| --- | --- | --- |
| 8 | up to 20,000 | 5 |
| 9 | 20,001 to 25,000 | 5 |
| 10 | 25,001 to 30,000 | 5 |
| 11 | 30,001 to 40,000 | 7 |
| 12 | 40,001 to 50,000 | 7 |
| 13 | 50,001 to 60,000 | 7 |
| 14 | 60,001 to 80,000 | 8 |
| 15 | 80,001 to 100,000 and 100,001 to 120,000 | 10 (5 each) |
| 16 | 120,001 to 150,000 | 7 |

**Files (per task):** Create `data/phones/<slug>.json` for each phone in the range.

**Interfaces:**

- Consumes: `PhoneSchema` (Task 2), `data/brands.json` slugs (Task 3), `docs/RESEARCH.md` (Task 7).
- Produces: phone records whose cheapest PTA price falls in the task's range.

Steps per task (the agent brief):

- [ ] **Step 1: Shortlist.** List every 2024 to 2026 phone sold in Pakistan with a cheapest PTA price in the range, from PriceOye's price filter and WhatMobile's price list. Pick the target count, favouring the most searched and most stocked models, at least one per major brand present in the range.
- [ ] **Step 2: Post the shortlist** as a comment on the issue before writing files, so the orchestrator can resolve phones that two agents both claim (a phone belongs to the range its cheapest PTA price falls in today).
- [ ] **Step 3: Write each record** following `docs/RESEARCH.md`, sources for every variant.
- [ ] **Step 4: Validate.** Run `npm run validate`. Expected: 0 errors for your files. Rival errors pointing at another agent's not-yet-written phone are resolved in Task 17; list them in the issue comment instead of deleting the rival.
- [ ] **Step 5: Commit** on branch `data/bracket-<ceiling>`: `git add data/phones && git commit -m "Add phones for the <range> bracket"`.

### Task 17: Reconcile research, fill brands, confirm coverage

**Files:**

- Modify: `data/brands.json`, any `data/phones/*.json` with dangling rivals or duplicates.

- [ ] **Step 1: Merge the nine research branches** into one branch `data/v1`, resolving duplicate phones (keep the record with more sources and the newest `priceCheckedAt`).
- [ ] **Step 2: Fill `officialStoreUrl` and `warrantyNote`** for every brand that has at least one phone; delete brands with zero phones.
- [ ] **Step 3: Run `npm run validate`.** Expected: 0 errors, and no "fewer than 3 phones" warnings. Total phones between 50 and 70.
- [ ] **Step 4: Spot-check 10 random phones** against their first source URL by hand (price within 500 PKR, PTA flag right). Record the check in the PR description, including which ones were not checked.
- [ ] **Step 5: Open PR `data/v1`**, CI green, merge.

---

## Milestone 3: Core pages

### Task 18: Base path helper, scoring and comparison logic

**Files:**

- Create: `src/lib/paths.ts`, `src/lib/scoring.ts`, `src/lib/compare.ts`, `tests/paths.test.ts`, `tests/scoring.test.ts`, `tests/compare.test.ts`

**Interfaces:**

- Consumes: `Phone`, `Scores`, `ScoreKey`, `SCORE_KEYS`, `Preset`, `Weights`, `cheapestPtaVariant`.
- Produces:
  - `withBase(path: string, base?: string): string` (default base `import.meta.env.BASE_URL`)
  - `overallScore(scores: Scores, weights: Weights): number` (1 decimal; throws if weights sum to 0)
  - `interface Ranked { phone: Phone; overall: number; price: number }`
  - `rankPhones(phones: Phone[], preset: Preset): Ranked[]`
  - `topPicks(phones: Phone[], preset: Preset, n = 3): Ranked[]` (excludes `discontinued`)
  - `canonicalPair(a: string, b: string): [string, string]`
  - `comparePairs(phones: Phone[]): Array<[string, string]>` (deduplicated canonical pairs from `rivals`)
  - `pairSlug(a: string, b: string): string` returns `${a}-vs-${b}`

- [ ] **Step 1: Write failing tests**

`tests/paths.test.ts`:

```ts
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
```

`tests/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { overallScore, rankPhones, topPicks } from '../src/lib/scoring';
import { makePhone, makeVariant } from './fixtures/phone';
import type { Preset } from '../src/schema/data';

const balanced: Preset = { slug: 'balanced', name: 'B', description: 'd',
  weights: { camera: 1, performance: 1, battery: 1, display: 1, build: 1, software: 1, value: 1.25, availability: 1.25 } };
const s = (v: number) => ({ value: v, reason: 'reason text here' });
const uniform = (v: number) => ({ camera: s(v), performance: s(v), battery: s(v), display: s(v), build: s(v), software: s(v), value: s(v), availability: s(v) });

describe('overallScore', () => {
  it('is the weighted mean rounded to one decimal', () => {
    // fixture scores 7,6,7,8,8,9,6,9 with weights 1 x6, 1.25 x2: (45 + 7.5 + 11.25) / 8.5 = 7.5
    expect(overallScore(makePhone().scores, balanced.weights)).toBe(7.5);
  });
  it('treats missing weights as zero', () => {
    expect(overallScore(makePhone().scores, { camera: 1 })).toBe(7);
  });
  it('throws on all-zero weights', () => {
    expect(() => overallScore(makePhone().scores, { camera: 0 })).toThrow();
  });
});

describe('rankPhones', () => {
  it('sorts by overall descending', () => {
    const a = makePhone({ slug: 'a', scores: uniform(6) });
    const b = makePhone({ slug: 'b', scores: uniform(8) });
    expect(rankPhones([a, b], balanced).map((r) => r.phone.slug)).toEqual(['b', 'a']);
  });
  it('breaks ties by cheaper PTA price, then newer release, then slug', () => {
    const cheap = makePhone({ slug: 'cheap', scores: uniform(7), variants: [makeVariant({ pricePkr: 40000 })] });
    const dear = makePhone({ slug: 'dear', scores: uniform(7), variants: [makeVariant({ pricePkr: 45000 }), makeVariant({ pricePkr: 30000, pta: false })] });
    const newer = makePhone({ slug: 'newer', scores: uniform(7), releaseDate: '2026-01-01', variants: [makeVariant({ pricePkr: 45000 })] });
    const zed = makePhone({ slug: 'zed', scores: uniform(7), releaseDate: '2026-01-01', variants: [makeVariant({ pricePkr: 45000 })] });
    expect(rankPhones([zed, dear, newer, cheap], balanced).map((r) => r.phone.slug)).toEqual(['cheap', 'newer', 'zed', 'dear']);
  });
  it('safe-buy drops phones without an official-warranty PTA variant', () => {
    const safe: Preset = { ...balanced, slug: 'safe-buy', requireOfficialWarranty: true };
    const shop = makePhone({ slug: 'shop', variants: [makeVariant({ warranty: 'local-shop' })] });
    expect(rankPhones([shop, makePhone()], safe).map((r) => r.phone.slug)).toEqual(['samsung-galaxy-a55']);
  });
});

describe('topPicks', () => {
  it('skips discontinued phones', () => {
    const gone = makePhone({ slug: 'gone', status: 'discontinued', scores: uniform(10) });
    const ok = makePhone({ slug: 'ok', scores: uniform(5) });
    expect(topPicks([gone, ok], balanced).map((r) => r.phone.slug)).toEqual(['ok']);
  });
});
```

`tests/compare.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canonicalPair, comparePairs, pairSlug } from '../src/lib/compare';
import { makePhone } from './fixtures/phone';

describe('compare pairs', () => {
  it('orders alphabetically by slug', () => {
    expect(canonicalPair('xiaomi-x', 'oppo-y')).toEqual(['oppo-y', 'xiaomi-x']);
    expect(pairSlug('a', 'b')).toBe('a-vs-b');
  });
  it('dedupes symmetric rivals and keeps asymmetric ones once', () => {
    const phones = [
      makePhone({ slug: 'a', rivals: ['b', 'c'] }),
      makePhone({ slug: 'b', rivals: ['a'] }),
      makePhone({ slug: 'c', rivals: [] }),
    ];
    expect(comparePairs(phones)).toEqual([['a', 'b'], ['a', 'c']]);
  });
});
```

- [ ] **Step 2: Run, expect FAIL. Implement**

`src/lib/paths.ts`:

```ts
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const m = path.match(/^([^?#]*)(.*)$/)!;
  let p = m[1].replace(/^\/+/, '');
  const isFile = /\.[a-z0-9]+$/i.test(p);
  if (p && !isFile && !p.endsWith('/')) p += '/';
  const b = base.endsWith('/') ? base : `${base}/`;
  return `${b}${p}${m[2]}`;
}
```

`src/lib/scoring.ts`:

```ts
import { SCORE_KEYS, type Phone, type Scores } from '../schema/phone';
import type { Preset, Weights } from '../schema/data';
import { cheapestPtaVariant } from './brackets';

export interface Ranked { phone: Phone; overall: number; price: number }

export function overallScore(scores: Scores, weights: Weights): number {
  let sum = 0;
  let total = 0;
  for (const k of SCORE_KEYS) {
    const w = weights[k] ?? 0;
    sum += w * scores[k].value;
    total += w;
  }
  if (total <= 0) throw new Error('weights must sum to more than 0');
  return Math.round((sum / total) * 10) / 10;
}

export function rankPhones(phones: Phone[], preset: Preset): Ranked[] {
  return phones
    .filter((p) => !preset.requireOfficialWarranty
      || p.variants.some((v) => v.pta && v.warranty === 'official'))
    .flatMap((phone) => {
      const v = cheapestPtaVariant(phone);
      return v ? [{ phone, overall: overallScore(phone.scores, preset.weights), price: v.pricePkr }] : [];
    })
    .sort((a, b) => b.overall - a.overall
      || a.price - b.price
      || b.phone.releaseDate.localeCompare(a.phone.releaseDate)
      || a.phone.slug.localeCompare(b.phone.slug));
}

export function topPicks(phones: Phone[], preset: Preset, n = 3): Ranked[] {
  return rankPhones(phones.filter((p) => p.status !== 'discontinued'), preset).slice(0, n);
}
```

`src/lib/compare.ts`:

```ts
import type { Phone } from '../schema/phone';

export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function pairSlug(a: string, b: string): string {
  return `${a}-vs-${b}`;
}

export function comparePairs(phones: Phone[]): Array<[string, string]> {
  const seen = new Map<string, [string, string]>();
  for (const p of phones) {
    for (const r of p.rivals) {
      const pair = canonicalPair(p.slug, r);
      seen.set(pair.join('|'), pair);
    }
  }
  return [...seen.values()].sort((x, y) => x.join('|').localeCompare(y.join('|')));
}
```

- [ ] **Step 3: Run tests, expect PASS.** `npx vitest run tests/paths.test.ts tests/scoring.test.ts tests/compare.test.ts`
- [ ] **Step 4: Commit** `git add src/lib tests && git commit -m "Add base path, scoring and compare pair helpers"`

### Task 19: Layout, SEO helpers and shared components

**Files:**

- Create: `src/lib/seo.ts`, `src/lib/format.ts`, `src/layouts/Base.astro`, `src/components/Breadcrumbs.astro`, `src/components/PriceChecked.astro`, `src/components/PhoneTable.astro`, `src/components/PickCard.astro`, `src/components/ScoreList.astro`, `src/components/SpecTable.astro`, `src/styles/global.css`, `tests/seo.test.ts`, `tests/format.test.ts`

**Interfaces:**

- Consumes: `withBase`, `Ranked`, `Phone`, `bracketSlug`.
- Produces:
  - `formatPkr(n: number): string` returns `Rs 119,999` style (en-PK grouping `en-US` style thousands, matches local retailers)
  - `latestCheck(phones: Phone[]): string` (max `priceCheckedAt`, ISO)
  - `phoneName(p: Phone, brands: Brand[]): string` (`Samsung Galaxy A55`)
  - `breadcrumbLd(items: Array<{ name: string; path: string }>, site: URL): object`
  - `productLd(p: Phone, name: string, url: string): object` (`Product` + `AggregateOffer` in PKR across PTA variants, `offerCount`, `lowPrice`, `highPrice`, `priceValidUntil` omitted)
  - `itemListLd(items: Array<{ name: string; url: string }>): object`
  - `faqLd(faq: Array<{ q: string; a: string }>): object`
  - `Base.astro` props: `{ title: string; description: string; path: string; jsonLd?: object[]; ogImage?: string; noindex?: boolean }`

- [ ] **Step 1: Failing tests** for `formatPkr(119999) === 'Rs 119,999'`, `latestCheck` picks the max date across all variants, `productLd` has `offers.priceCurrency === 'PKR'` and `lowPrice` from PTA variants only, `breadcrumbLd` positions start at 1 with absolute URLs including the base path, `faqLd` maps q/a to `Question`/`acceptedAnswer`.
- [ ] **Step 2: Implement `seo.ts` and `format.ts`**, run tests to PASS.
- [ ] **Step 3: Implement `Base.astro`**: `<html lang="en-PK">`, title, description, `<link rel="canonical" href={new URL(withBase(path), Astro.site)}>`, Open Graph (`og:title`, `og:description`, `og:url`, `og:image` when given, `og:locale=en_PK`), Twitter card, `robots noindex` when asked, JSON-LD scripts via `set:html={JSON.stringify(ld)}`, header nav (Home, Finder, brackets), footer with "Prices are approximate" disclaimer, global CSS (system font stack, max-width 72rem, no web fonts, so Performance stays 95+).
- [ ] **Step 4: Implement components.** `PhoneTable` renders a `<table>` of `Ranked[]` with rank, linked name, cheapest PTA price, overall, status badge (`Discontinued` / `Limited stock`), PTA/warranty, each `<tr data-slug=...>` (the finder relies on this). `PriceChecked` renders `Prices last checked: 10 Oct 2026`. `ScoreList` renders the eight scores with reasons. `SpecTable` renders specs grouped as in the schema.
- [ ] **Step 5: Run `npm run check && npm test`**, expect 0 errors.
- [ ] **Step 6: Commit** `git commit -am "Add base layout, SEO helpers and shared components"`

### Task 20: Bracket pages

**Files:**

- Create: `src/pages/[landing].astro`, `src/lib/landing.ts`, `tests/landing.test.ts`
- Modify: `data/brackets.json` (FAQ copy)

**Interfaces:**

- Consumes: `getData`, `assignBracket`, `bracketSlug`, `rankPhones`, `topPicks`, components from Task 19.
- Produces: `landingPaths(data: DataSet): Array<{ params: { landing: string }; props: LandingProps }>` where `LandingProps = { kind: 'bracket'; ceiling: number } | { kind: 'intent'; ceiling: number; preset: string }`. Intent entries are added in Task 29.

- [ ] **Step 1: Failing test** in `tests/landing.test.ts`: given a fixture DataSet with phones in 50k and 60k brackets, `landingPaths` returns one bracket entry per bracket in `brackets.json`, including empty brackets only if they have at least 1 phone (an empty bracket page is a thin page; it is skipped and its neighbours link past it).
- [ ] **Step 2: Implement `landingPaths`**, test PASS.
- [ ] **Step 3: Write FAQ copy** into `data/brackets.json`, 3 to 4 Q&As per bracket (PTA tax at that price, official vs shop warranty, 4G vs 5G at that price, best brand for after-sales).
- [ ] **Step 4: Implement `[landing].astro`** for `kind: 'bracket'`: H1 `Best mobile under 50,000 in Pakistan (2026)`, intro, `PriceChecked`, top 3 `PickCard`s with the reason drawn from their highest-weighted score reasons, full `PhoneTable` under `balanced`, FAQ, links to previous and next non-empty brackets, JSON-LD `ItemList` + `FAQPage` + `BreadcrumbList`. Title template: `Mobile under 50,000 in Pakistan: best phones (Oct 2026)` using the latest check month.
- [ ] **Step 5: Build and inspect** `npm run build && grep -c '<tr data-slug' dist/mobile-under-50000-in-pakistan/index.html`, expected the number of phones in that bracket. Open `npm run preview` and view one page.
- [ ] **Step 6: Commit** `git add -A && git commit -m "Add bracket landing pages"`

### Task 21: Phone pages

**Files:**

- Create: `src/pages/phones/[slug].astro`

- [ ] **Step 1: Implement** with `getStaticPaths` over `getData().phones`: H1 `<Brand Model> price in Pakistan`, image or placeholder, variants table (RAM/storage, price, PTA, warranty, sources as `rel="nofollow noopener"` links, check date per variant), status warning box when not `available`, `ScoreList`, overall under `balanced`, `SpecTable`, rivals list linking to compare pages (canonical order), links to bracket, brand, year. JSON-LD `Product` + `BreadcrumbList`. Notes paragraph if present.
- [ ] **Step 2: Build and verify** `npm run build && ls dist/phones | wc -l` equals the phone count, and each page's JSON-LD parses: `node -e` script that reads every `dist/phones/*/index.html`, extracts `<script type="application/ld+json">` blocks and `JSON.parse`s them. Expected: no throw.
- [ ] **Step 3: Commit** `git commit -am "Add phone pages"` (after `git add`).

### Task 22: Brand and year pages

**Files:**

- Create: `src/pages/brands/[brand].astro`, `src/pages/year/[year].astro`

- [ ] **Step 1: Implement brand pages** for brands with at least one phone: phones sorted by cheapest PTA price ascending, warranty note, official store link, `ItemList` + `BreadcrumbList`. Title `Samsung mobile prices in Pakistan (Oct 2026)`.
- [ ] **Step 2: Implement year pages** for 2024, 2025, 2026 (skip a year with no phones): phones sorted by release date descending, `ItemList` + `BreadcrumbList`.
- [ ] **Step 3: Build** and confirm pages exist for every brand and year with phones.
- [ ] **Step 4: Commit** `git add -A && git commit -m "Add brand and year pages"`

### Task 23: Hub page

**Files:**

- Modify: `src/pages/index.astro` (replace placeholder)

- [ ] **Step 1: Implement**: H1, one-line pitch, bracket chips (only non-empty brackets, with phone counts), "Help me decide" link to the finder, overall top 5 under `balanced` in `PhoneTable`, latest price check date, brand list, JSON-LD `WebSite` + `BreadcrumbList`. Uses `Base.astro`.
- [ ] **Step 2: Build, preview, then deploy** by merging to main. Verify live: `curl -sS https://fahdi.github.io/mobile-under-pk/ | grep -c 'mobile-under-'` greater than 0 and click through hub, a bracket, a phone, a brand, a year in a browser with no 404s.
- [ ] **Step 3: Commit** `git commit -am "Replace placeholder with hub page"`

---

## Milestone 4: Compare and finder

### Task 24: Compare pages

**Files:**

- Create: `src/pages/compare/[pair].astro`, `src/layouts/Redirect.astro`

- [ ] **Step 1: Implement `getStaticPaths`**: for each `comparePairs` pair emit the canonical `a-vs-b` with `{ kind: 'page' }` and the reverse `b-vs-a` with `{ kind: 'redirect', to: 'a-vs-b' }`.
- [ ] **Step 2: Canonical page**: two-column spec and score table with the higher value highlighted per row (lower is better for `weightG` and price), overall under `balanced`, cheapest PTA prices, a verdict line generated from data: `Pick <A> for camera and software; pick <B> for battery and value.` (keys where each wins by 2 or more; "Too close to call on <keys>" otherwise). Breadcrumb + `ItemList` of the two products.
- [ ] **Step 3: `Redirect.astro`**: `<meta http-equiv="refresh" content="0; url=...">`, `<link rel="canonical">`, `<meta name="robots" content="noindex">`, a plain link.
- [ ] **Step 4: Build and verify** reverse URL HTML contains the refresh to the canonical URL with the base path.
- [ ] **Step 5: Commit** `git add -A && git commit -m "Add compare pages for declared rivals"`

### Task 25: Finder index, filters and URL state

**Files:**

- Create: `src/lib/index-entry.ts`, `src/lib/filters.ts`, `src/lib/url-state.ts`, `scripts/build-index.ts`, `tests/index-entry.test.ts`, `tests/filters.test.ts`, `tests/url-state.test.ts`
- Modify: `package.json` (`"build:index": "tsx scripts/build-index.ts"`, `"prebuild": "npm run build:index"`)

**Interfaces:**

- Produces:
  - `interface IndexEntry { slug: string; name: string; brand: string; price: number; ptaPrice: number; officialWarranty: boolean; status: Status; year: number; releaseDate: string; fiveG: boolean; nfc: boolean; jack: boolean; mah: number; hz: number; scores: number[] /* SCORE_KEYS order */ }`
  - `toIndexEntry(p: Phone, brandName: string): IndexEntry`
  - `interface FinderState { min?: number; max?: number; brands: string[]; years: number[]; statuses: Status[]; pta: boolean; official: boolean; fiveG: boolean; nfc: boolean; jack: boolean; battery?: number; hz?: number; sort: 'overall' | 'price' | 'release' | ScoreKey; preset: string; weights?: Weights }`
  - `DEFAULT_STATE: FinderState` (`sort: 'overall'`, `preset: 'balanced'`, all flags false, arrays empty)
  - `matchesFilters(e: IndexEntry, s: FinderState): boolean`
  - `sortEntries(es: IndexEntry[], s: FinderState, presets: Preset[]): Array<IndexEntry & { overall: number }>`
  - `toQuery(s: FinderState): string` (omits defaults; empty string for default state)
  - `fromQuery(q: string, known: { brands: string[]; presets: string[] }): FinderState`

- [ ] **Step 1: Failing tests**

`tests/index-entry.test.ts`: `price` is the cheapest of all variants, `ptaPrice` the cheapest PTA; `officialWarranty` true only if a PTA variant has `official`; 70 synthetic phones serialise to under 60,000 bytes (`JSON.stringify(entries).length < 60000`).

`tests/filters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, matchesFilters, sortEntries } from '../src/lib/filters';
import type { IndexEntry } from '../src/lib/index-entry';

const e = (o: Partial<IndexEntry> = {}): IndexEntry => ({
  slug: 'a', name: 'A', brand: 'samsung', price: 40000, ptaPrice: 45000, officialWarranty: true,
  status: 'available', year: 2025, releaseDate: '2025-02-01', fiveG: true, nfc: false, jack: true,
  mah: 5000, hz: 120, scores: [7, 6, 7, 8, 8, 9, 6, 9], ...o,
});

describe('matchesFilters', () => {
  it('default state matches everything', () => {
    expect(matchesFilters(e(), DEFAULT_STATE)).toBe(true);
  });
  it('price range uses PTA price when pta is on, any price otherwise', () => {
    expect(matchesFilters(e(), { ...DEFAULT_STATE, max: 42000 })).toBe(true);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, max: 42000, pta: true })).toBe(false);
  });
  it('min is inclusive and max is inclusive', () => {
    expect(matchesFilters(e(), { ...DEFAULT_STATE, min: 40000, max: 40000 })).toBe(true);
  });
  it('brand, year, status and flags narrow', () => {
    expect(matchesFilters(e(), { ...DEFAULT_STATE, brands: ['xiaomi'] })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, years: [2024] })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, statuses: ['discontinued'] })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, nfc: true })).toBe(false);
    expect(matchesFilters(e({ officialWarranty: false }), { ...DEFAULT_STATE, official: true })).toBe(false);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, battery: 5000, hz: 120 })).toBe(true);
    expect(matchesFilters(e(), { ...DEFAULT_STATE, battery: 5001 })).toBe(false);
  });
});

describe('sortEntries', () => {
  const presets = [{ slug: 'balanced', name: 'B', description: 'd', weights: { camera: 1 } }];
  it('sorts by overall with price tie-break, and by price ascending', () => {
    const list = [e({ slug: 'x', scores: [8, 1, 1, 1, 1, 1, 1, 1], ptaPrice: 50000 }), e({ slug: 'y', scores: [8, 1, 1, 1, 1, 1, 1, 1], ptaPrice: 30000 }), e({ slug: 'z', scores: [9, 1, 1, 1, 1, 1, 1, 1] })];
    expect(sortEntries(list, DEFAULT_STATE, presets).map((x) => x.slug)).toEqual(['z', 'y', 'x']);
    expect(sortEntries(list, { ...DEFAULT_STATE, sort: 'price' }, presets).map((x) => x.slug)).toEqual(['y', 'z', 'x']);
  });
  it('custom weights override the preset', () => {
    const list = [e({ slug: 'cam', scores: [9, 1, 1, 1, 1, 1, 1, 1] }), e({ slug: 'bat', scores: [1, 1, 9, 1, 1, 1, 1, 1] })];
    expect(sortEntries(list, { ...DEFAULT_STATE, weights: { battery: 1 } }, presets)[0].slug).toBe('bat');
  });
  it('falls back to balanced for an unknown preset', () => {
    expect(() => sortEntries([e()], { ...DEFAULT_STATE, preset: 'nope' }, presets)).not.toThrow();
  });
});
```

`tests/url-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fromQuery, toQuery } from '../src/lib/url-state';
import { DEFAULT_STATE } from '../src/lib/filters';

const known = { brands: ['samsung', 'xiaomi'], presets: ['balanced', 'gaming'] };

describe('url state', () => {
  it('round-trips a full state', () => {
    const s = { ...DEFAULT_STATE, min: 20000, max: 60000, brands: ['samsung', 'xiaomi'], years: [2025, 2026],
      statuses: ['available' as const], pta: true, official: true, fiveG: true, nfc: true, jack: true,
      battery: 5000, hz: 120, sort: 'camera' as const, preset: 'gaming', weights: { camera: 2, value: 3 } };
    expect(fromQuery(toQuery(s), known)).toEqual(s);
  });
  it('default state serialises to an empty string', () => {
    expect(toQuery(DEFAULT_STATE)).toBe('');
    expect(fromQuery('', known)).toEqual(DEFAULT_STATE);
  });
  it('drops garbage and keeps the valid parts', () => {
    const s = fromQuery('?max=abc&min=-5&brand=nokia,,samsung&year=1999,2025&sort=foo&preset=evil&w=camera:-5,value:2,speed:3&battery=5e3x', known);
    expect(s).toEqual({ ...DEFAULT_STATE, brands: ['samsung'], years: [2025], weights: { value: 2 } });
  });
  it('accepts a leading question mark or none', () => {
    expect(fromQuery('max=50000', known).max).toBe(50000);
  });
});
```

- [ ] **Step 2: Implement** the three modules (query keys: `min`, `max`, `brand`, `year`, `status`, `pta`, `official`, `5g`, `nfc`, `jack`, `battery`, `hz`, `sort`, `preset`, `w` as `key:weight` comma list; numbers must match `/^\d+$/` and be positive; flags are `1`). `sortEntries` reuses `overallScore` by rebuilding a `Scores`-shaped object from the array, and uses the same tie-breaks as `rankPhones` with `ptaPrice`.
- [ ] **Step 3: Implement `scripts/build-index.ts`**: `loadData`, fail on any error issue, write `public/phones.index.json` (minified), print byte size.
- [ ] **Step 4: Run** `npx vitest run && npm run build:index` expected PASS and a size under 60 KB.
- [ ] **Step 5: Commit** `git add -A && git commit -m "Add finder index, filters and URL state"`

### Task 26: Finder page and island

**Files:**

- Create: `src/pages/finder.astro`, `src/scripts/finder.ts`

- [ ] **Step 1: `finder.astro`** server-renders: a `<form id="finder" method="get">` with every filter as a real input (so it works without JS through a GET reload of the same page, which still shows the full default list since the page is static; acceptable, and the form fields are the JS state UI), preset `<select>`, an `<details>` "Advanced" with eight `<input type="range" min="0" max="3" step="0.25">` weights, and the full `PhoneTable` of all phones under `balanced`. Each row also gets a `<span data-overall>`.
- [ ] **Step 2: `finder.ts`** (vanilla, target under 300 lines): on load `fetch(withBase('/phones.index.json'))`, `fromQuery(location.search)`, write state into the form, then on every `input` event: read form to `FinderState`, `matchesFilters` + `sortEntries`, set `hidden` on non-matching rows, `append` rows in sorted order, update `data-overall` text and rank numbers, `history.replaceState` with `toQuery`, update a live result count in an `aria-live="polite"` region. On fetch failure leave the server list untouched and show a one-line notice.
- [ ] **Step 3: Verify in a browser** (Playwright MCP or manual): set max 50000 and 5G, confirm the URL updates, reload and confirm the state restores, set camera weight to 3 and confirm order changes, disable JS and confirm the full list renders. Record `wc -l src/scripts/finder.ts`; if over 300, stop and discuss Preact.
- [ ] **Step 4: Commit** `git add -A && git commit -m "Add finder page and vanilla island"`

---

## Milestone 5: SEO polish

### Task 27: OG images

**Files:**

- Create: `src/lib/og.ts`, `src/pages/og/[...path].png.ts`, `src/assets/fonts/Inter-Bold.ttf`, `src/assets/fonts/Inter-Regular.ttf`, `tests/og.test.ts`
- Modify: every page passes `ogImage` to `Base.astro`

**Interfaces:**

- Produces: `renderOg(input: { title: string; subtitle?: string; price?: string }): Promise<Uint8Array>` (1200x630 PNG). Route path mirrors the page path: `/og/phones/samsung-galaxy-a55.png`, `/og/mobile-under-50000-in-pakistan.png`, `/og/index.png`.

- [ ] **Step 1: Install** `npm install -D satori@0.47.1 @resvg/resvg-js@2.6.2` and download Inter TTFs from the rsms/inter GitHub release (OFL, licence file committed alongside).
- [ ] **Step 2: Failing test**: `renderOg({ title: 'Samsung Galaxy A55', price: 'Rs 120,000' })` returns bytes starting with the PNG signature `89 50 4E 47` and the decoded width is 1200 (read bytes 16 to 19 of the IHDR chunk).
- [ ] **Step 3: Implement** with satori (object-tree markup, no JSX needed) then `new Resvg(svg).render().asPng()`.
- [ ] **Step 4: Implement the endpoint** with `getStaticPaths` covering hub, brackets, intent pages, phones, brands, years, compare (canonical only).
- [ ] **Step 5: Build** and confirm `ls dist/og/phones/*.png | wc -l` equals the phone count and total build time increase is noted.
- [ ] **Step 6: Commit** `git add -A && git commit -m "Generate Open Graph images at build"`

### Task 28: Sitemap and robots

**Files:**

- Create: `src/pages/robots.txt.ts`
- Modify: `astro.config.mjs` (add `@astrojs/sitemap` with a `filter` that excludes reverse compare redirect pages)

- [ ] **Step 1: Install** `npx astro add sitemap --yes` (pins `@astrojs/sitemap`), add `filter: (page) => !redirectUrls.has(page)` where `redirectUrls` is computed in the config from `comparePairs` over `loadData(process.cwd())` reverse slugs.
- [ ] **Step 2: robots.txt endpoint**: `User-agent: *`, `Allow: /`, `Sitemap: <site><base>sitemap-index.xml`.
- [ ] **Step 3: Build and verify**: `dist/sitemap-index.xml` exists, every `<loc>` starts with `https://fahdi.github.io/mobile-under-pk/` and ends with `/`, no `-vs-` URL appears twice for the same pair.
- [ ] **Step 4: Commit** `git add -A && git commit -m "Add sitemap and robots.txt"`

### Task 29: Intent landing pages

**Files:**

- Modify: `src/lib/landing.ts`, `src/pages/[landing].astro`, `tests/landing.test.ts`

- [ ] **Step 1: Failing test**: for presets with `intent`, `landingPaths` emits `best-<intent>-phone-under-<ceiling>` only when the preset's `topPicks` slugs differ from `balanced`'s `topPicks` slugs for that bracket (spec 15 thin-page rule), and never for a bracket with fewer than 3 phones.
- [ ] **Step 2: Implement** and render the intent variant of `[landing].astro`: H1 `Best camera phone under 60,000 in Pakistan`, top 3 under the preset with the preset's driving score reasons, ranked table under the preset, link back to the bracket page.
- [ ] **Step 3: Run tests, build**, list generated intent URLs in the PR description.
- [ ] **Step 4: Commit** `git add -A && git commit -m "Add intent landing pages"`

### Task 30: Link check and Lighthouse gate in CI

**Files:**

- Create: `scripts/stage-site.sh`, `lighthouserc.json`
- Modify: `package.json`, `.github/workflows/ci.yml`

- [ ] **Step 1: `scripts/stage-site.sh`**

```bash
#!/usr/bin/env bash
# Serve dist/ under the same base path GitHub Pages uses.
set -euo pipefail
rm -rf dist-ci && mkdir -p dist-ci && cp -R dist dist-ci/mobile-under-pk
```

- [ ] **Step 2: Scripts** `"ci:links": "bash scripts/stage-site.sh && linkinator dist-ci --server-root dist-ci --recurse --skip '^https?://(?!localhost)' /mobile-under-pk/"` (confirm linkinator 8 flag names against its README before committing; adjust if `--server-root` is named differently) and `"ci:lhci": "bash scripts/stage-site.sh && lhci autorun"`.
- [ ] **Step 3: `lighthouserc.json`**: `staticDistDir: "dist-ci"`, URLs for hub, `mobile-under-50000-in-pakistan/`, one phone page, `finder/`; assertions `categories:seo` minScore 1, `categories:performance` 0.95, `categories:accessibility` 0.95; `upload.target: "temporary-public-storage"` off (use `filesystem`).
- [ ] **Step 4: Prove the link check fails** by temporarily adding a link to `/mobile-under-pk/nope/` in the footer, run `npm run build && npm run ci:links`, expect non-zero exit; remove it, expect zero.
- [ ] **Step 5: Add a CI job** `quality` (needs `verify`, builds, runs `ci:links` and `ci:lhci`), push a PR, watch it go green.
- [ ] **Step 6: Commit** `git add -A && git commit -m "Gate CI on link check and Lighthouse"`

---

## Milestone 6: Launch

### Task 31: README and research guide final pass

**Files:**

- Modify: `README.md`, `docs/RESEARCH.md`

- [ ] **Step 1: README**: what it is, live URL, local dev (`npm ci`, `npm run dev`), data layout, how scores and brackets work (link to spec sections 6 and 8), how to add a phone (link RESEARCH.md), CI gates, custom domain switch (`SITE_URL`, `BASE_PATH`).
- [ ] **Step 2: RESEARCH.md**: add the monthly price refresh routine (spec 15): which sources in order, update `pricePkr` and `priceCheckedAt` per variant, re-run `npm run validate`, flip `status` when stock disappears, one PR per refresh titled `Price refresh YYYY-MM`.
- [ ] **Step 3: Commit** `git commit -am "Finalise README and research guide"`

### Task 32: First price refresh pass

- [ ] **Step 1: Refresh every variant** per the routine, oldest `priceCheckedAt` first. Commit on `data/price-refresh-YYYY-MM`.
- [ ] **Step 2: `npm run validate`** 0 errors; PR description lists phones whose bracket changed and any status flips.
- [ ] **Step 3: Merge**, confirm deploy, spot-check 5 changed prices on the live site.

### Task 33: Launch checklist

- [ ] **Step 1: Verify live** on the deployed site: hub, every bracket page, 5 phone pages, 2 compare pages (both orders), finder with a shared URL, `robots.txt`, `sitemap-index.xml`, an OG image URL.
- [ ] **Step 2: Rich results**: run 3 page types through Google's Rich Results Test (Product, ItemList/FAQ, Breadcrumb) and record results in the issue.
- [ ] **Step 3: Search Console**: add the property for `https://fahdi.github.io/mobile-under-pk/` (needs Fahad; HTML file verification goes in `public/`), submit the sitemap.
- [ ] **Step 4: Record** what was verified and what was not in the issue, close the milestone.
