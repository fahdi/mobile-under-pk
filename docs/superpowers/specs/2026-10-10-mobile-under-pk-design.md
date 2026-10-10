# MobileUnder.pk - Product Requirements Document

Status: draft for review
Date: 2026-10-10
Repo: https://github.com/fahdi/mobile-under-pk
Live: https://fahdi.github.io/mobile-under-pk/

## 1. Problem

Buying a phone in Pakistan is a different problem from buying one anywhere else.
The spec sheet is the same, but the decision depends on local facts that no
international review site tracks:

- The PKR price, which moves week to week and differs between official stores,
  PriceOye and the local market.
- Whether the unit is PTA approved, and whether the warranty is official,
  shop-only or nonexistent.
- Whether the phone is actually in stock in Pakistan or only exists on
  GSMArena.
- Which phones in a given bracket are "safe buys" versus good on paper.

Buyers with a budget (for example 150,000 PKR) end up with 20 browser tabs and
no way to compare across them. MobileUnder.pk is a decision tool for that
buyer: pick a budget, see the phones that are genuinely available in
Pakistan, sort by what matters to you, and compare the finalists side by side.

## 2. Goals

- Help an undecided buyer go from "I have X PKR" to "I will buy Y" in one
  sitting.
- Rank well in Pakistan for "mobile under [price] in Pakistan" and related
  queries, with one landing page per price bracket.
- Keep every price and claim traceable to a source and a check date.
- Stay cheap to run: static files, no backend, free hosting on GitHub Pages.

## 3. Non-goals (v1)

- No user accounts, saved lists, reviews or comments.
- No affiliate links or price alerts.
- No automatic price scraping. Prices are researched and updated by hand,
  with a visible check date.
- No phones released before 2024.
- No phones above 150,000 PKR launch price.

## 4. Users

- **Primary:** a Pakistani buyer with a fixed budget who wants a shortlist and
  a clear reason for each pick.
- **Secondary:** someone who already has two or three phones in mind and
  wants a direct comparison with local availability and warranty info.
- **Tertiary:** people searching "best camera phone under 60000 in Pakistan"
  and similar intent queries from Google.

## 5. Decisions already made

| Decision | Choice | Reason |
| --- | --- | --- |
| Name and repo | `mobile-under-pk`, branded MobileUnder.pk | Exact match for how people search ("mobile under 40000 in Pakistan") |
| Framework | Astro + TypeScript | Pure static HTML output, zero JS by default, single island for the finder |
| Data format | One JSON file per phone, Zod validated at build | Easy to review in PRs, impossible to ship a malformed record |
| Hosting | GitHub Pages via GitHub Actions | Free, fits a static site, public repo |
| Task tracking | GitHub issues on this repo | Personal public project; explicit exception to the Jira rule |
| Release window | 2024, 2025, 2026 only | Keeps the dataset current and small |
| Price scope | Up to 150,000 PKR, all brackets | Full spread from 20k to 150k |
| Discontinued phones | Included, flagged `discontinued` | Broader data, buyer sees the warning |
| Prices | PKR, approximate, with `priceCheckedAt` | PKR prices are volatile; honesty beats precision |
| Scores | Editorial 1 to 10 with a written reason | Sortable, explainable, no fake benchmark precision |

## 6. Data model

### 6.1 Phone record

Path: `data/phones/<brand>-<model>.json`. One file per phone. Validated by a
Zod schema in `src/schema/phone.ts`. Build fails on any invalid record.

```json
{
  "slug": "samsung-galaxy-a55",
  "brand": "samsung",
  "model": "Galaxy A55",
  "releaseDate": "2024-03-11",
  "status": "available",
  "image": "/images/phones/samsung-galaxy-a55.webp",
  "variants": [
    {
      "ram": 8,
      "storage": 128,
      "pricePkr": 119999,
      "priceCheckedAt": "2026-10-10",
      "pta": true,
      "warranty": "official",
      "sources": [
        { "name": "Samsung Pakistan", "url": "https://www.samsung.com/pk/..." },
        { "name": "PriceOye", "url": "https://priceoye.pk/..." }
      ]
    }
  ],
  "specs": {
    "chipset": "Exynos 1480",
    "display": { "size": 6.6, "type": "Super AMOLED", "refreshHz": 120, "resolution": "1080x2340", "peakNits": 1000 },
    "battery": { "mah": 5000, "wiredW": 25, "wirelessW": 0 },
    "cameras": {
      "rear": [
        { "mp": 50, "type": "wide", "ois": true },
        { "mp": 12, "type": "ultrawide", "ois": false },
        { "mp": 5, "type": "macro", "ois": false }
      ],
      "front": { "mp": 32 },
      "video": "4K@30fps"
    },
    "build": { "frame": "aluminium", "back": "glass", "front": "Gorilla Glass Victus+", "ip": "IP67" },
    "software": { "os": "Android 14, One UI 6.1", "osUpdates": 4, "securityYears": 5 },
    "connectivity": { "fiveG": true, "nfc": true, "jack35": false, "esim": false },
    "weightG": 213
  },
  "scores": {
    "camera": { "value": 7, "reason": "Reliable daylight shots with OIS; weak low light and no telephoto." },
    "performance": { "value": 6, "reason": "Exynos 1480 handles daily use well; throttles in sustained gaming." },
    "battery": { "value": 7, "reason": "Full day easily, but 25W charging is slow for this price." },
    "display": { "value": 8, "reason": "Bright 120Hz AMOLED, one of the best in the bracket." },
    "build": { "value": 8, "reason": "Glass and aluminium with IP67; feels like a flagship." },
    "software": { "value": 9, "reason": "4 OS updates and 5 years of patches, class leading." },
    "value": { "value": 6, "reason": "Pays a premium for brand and updates over Chinese rivals." },
    "availability": { "value": 9, "reason": "Stocked everywhere, official Samsung Pakistan warranty." }
  },
  "tags": ["safe-buy", "long-updates"],
  "rivals": ["xiaomi-redmi-note-13-pro-plus", "oppo-reno-11"],
  "notes": "Pakistan units ship with 25W charger in the box."
}
```

Field rules:

- `slug` is unique, lowercase, matches the filename.
- `status` is one of `available`, `limited`, `discontinued`. `limited` means
  in stock at some retailers only or grey-market only.
- `warranty` is one of `official`, `local-shop`, `none`.
- Every variant must carry at least one source and a `priceCheckedAt` date.
- All eight scores are required. `overall` is computed, never stored.
- `rivals` lists slugs of phones in the same bracket that deserve a
  `/compare/` page. Only pairs listed here get a compare page.

### 6.2 Supporting data

- `data/brands.json`: slug, display name, country, official PK store URL,
  warranty policy note.
- `data/brackets.json`: ordered list of price ceilings with SEO copy per
  bracket. v1 brackets: 20k, 25k, 30k, 40k, 50k, 60k, 80k, 100k, 120k, 150k.
  A phone appears in the lowest bracket that fits its cheapest PTA approved
  variant.
- `data/presets.json`: named weight sets for the finder (see 8.2).

### 6.3 Derived data (built, never committed)

- `public/phones.index.json`: compact array with the fields the finder needs
  (slug, name, cheapest price, scores, status, release year, key flags).
  Target under 60 KB for 70 phones.

## 7. Pages

All routes are generated at build from the data. Trailing slashes
everywhere. Base path `/mobile-under-pk/` for GitHub Pages, with a config
switch for a custom domain later.

| Route | Content | Primary query |
| --- | --- | --- |
| `/` | Hub: bracket chips, "help me decide" entry, latest price check date | "best mobile in pakistan 2026" |
| `/mobile-under-[N]-in-pakistan/` | Top 3 picks with reasons, full ranked table, FAQ, related brackets | "mobile under 50000 in pakistan" |
| `/phones/[slug]/` | Full specs, all scores with reasons, variants with PTA and warranty, rivals | "[model] price in pakistan" |
| `/brands/[brand]/` | Brand's phones sorted by price, warranty policy note | "samsung mobile price in pakistan" |
| `/year/[2024\|2025\|2026]/` | Phones released that year | "new mobile 2026 pakistan" |
| `/compare/[a]-vs-[b]/` | Side by side specs and scores, verdict line | "[a] vs [b]" |
| `/finder/` | Client side filter and sort, state in URL | tool page, noindex not needed but low SEO priority |
| `/best-camera-phone-under-[N]/` and similar | Intent landing pages generated from a preset plus a bracket | "best camera phone under 60000" |

Compare pages are generated only for pairs declared in `rivals`, in both
orders redirecting to one canonical order (alphabetical by slug), to avoid
thin duplicate pages.

## 8. Ranking

### 8.1 Overall score

`overall = weighted mean of the eight scores` using the active preset's
weights, rounded to one decimal. The default preset weights value and
availability slightly higher because the site's job is to recommend what a
Pakistani buyer can actually purchase.

### 8.2 Presets

Stored in `data/presets.json`:

- `balanced` (default)
- `camera-first`
- `battery-first`
- `gaming` (performance and display)
- `safe-buy` (availability, software, build; requires `warranty: official`)
- `value` (value score and price)

Each preset is a map of score key to weight. The finder exposes the weights
as sliders behind an "advanced" toggle.

### 8.3 Tie breaking

Ties on overall go to the cheaper PTA approved variant, then to the newer
release date.

## 9. Finder (the only client side JS)

- Astro island, Preact or vanilla TypeScript (decide in implementation;
  vanilla preferred if it stays under 300 lines).
- Loads `phones.index.json` once.
- Filters: price range, brands, release year, status, PTA only, official
  warranty only, 5G, NFC, headphone jack, minimum battery, minimum refresh
  rate.
- Sort: any single score, overall under the selected preset, price, release
  date.
- State serialised into the query string so a filtered view can be shared.
- Works without JS: the page server renders the full ranked list under the
  default preset, and the island enhances it.

## 10. SEO requirements

- Unique `title` and `meta description` per page, generated from data with
  a template per page type.
- JSON-LD: `Product` with `Offer` in PKR on phone pages, `ItemList` on
  bracket and brand pages, `FAQPage` on bracket pages, `BreadcrumbList`
  everywhere.
- `sitemap.xml` and `robots.txt` generated at build.
- Canonical URL on every page.
- Open Graph image per page, generated at build (static template with
  phone name and price).
- Visible "prices last checked" date on every page that shows a price.
- `lang="en-PK"`.
- Internal linking: every phone page links to its bracket, brand, year and
  rivals; every bracket page links to neighbouring brackets.
- Lighthouse targets in CI: SEO 100, Performance 95+, Accessibility 95+.

## 11. Research process

- Sources, in priority order: official brand Pakistan store, PriceOye,
  WhatMobile, Daraz official stores, GSMArena for specs.
- Every variant price is the lowest price from an official or PTA approved
  listing, rounded to the nearest 500 PKR, with the check date recorded.
- Scores are written by the researcher with a one sentence reason. The
  reason must mention the fact that drove the score.
- Research is done in parallel by brand or bracket, each producing JSON that
  must pass the schema before merge.
- A `scripts/validate.ts` command runs the schema and cross-checks (rivals
  exist, slugs match filenames, brackets cover all phones).
- Target for v1: 50 to 70 phones across all ten brackets, at least 3 per
  bracket.

## 12. Repository layout

```
mobile-under-pk/
  data/
    phones/*.json
    brands.json
    brackets.json
    presets.json
  docs/
    superpowers/specs/      this document and later specs
    RESEARCH.md             how to add or update a phone
  public/
    images/phones/*.webp
  scripts/
    validate.ts
    build-index.ts
  src/
    schema/                 Zod schemas
    lib/                    scoring, filtering, bracket assignment
    components/
    layouts/
    pages/
  tests/                    Vitest unit tests for lib
  .github/workflows/
    ci.yml                  validate, test, build, lighthouse
    deploy.yml              build and publish to Pages on main
```

## 13. Testing

- Schema validation of all data in CI.
- Vitest unit tests for: overall score computation, tie breaking, bracket
  assignment, filter predicates, URL state serialisation.
- Build must succeed with zero broken internal links (Astro check plus a
  link crawler step).
- Lighthouse CI on the hub, one bracket page, one phone page and the finder.

## 14. Milestones

1. **Foundation:** Astro scaffold, schema, validate script, CI, Pages
   deploy with a placeholder page.
2. **Data:** research and commit 50 to 70 phones with sources.
3. **Core pages:** bracket, phone, brand, year pages with JSON-LD.
4. **Compare and finder:** compare pages, finder island, presets.
5. **SEO polish:** OG images, sitemap, intent landing pages, Lighthouse
   gate.
6. **Launch:** README, research guide, first price refresh pass.

## 15. Open risks

- **Price drift:** PKR prices change weekly. Mitigation: visible check
  dates and a documented monthly refresh routine.
- **Thin pages:** too many generated pages with little text hurt rankings.
  Mitigation: compare pages only for declared rivals, intent pages only
  where the preset changes the top 3.
- **Subjective scores:** readers may disagree. Mitigation: every score has
  a reason and the raw specs are shown alongside.
- **GitHub Pages base path:** breaks absolute links if not handled.
  Mitigation: Astro `base` config and a link check in CI.
