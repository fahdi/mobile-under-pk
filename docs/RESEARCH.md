# Research guide

How to add or update a phone in `data/phones/`. Every record must pass `npm run validate` with 0 errors before it is committed.

## Scope

- Released in 2024, 2025 or 2026 (`releaseDate`, ISO `YYYY-MM-DD`; use the global launch date).
- Cheapest PTA approved variant at or below 150,000 PKR.
- Sold in Pakistan. Discontinued phones are included with `"status": "discontinued"`.

## Sources, in priority order

1. The brand's official Pakistan store or website.
2. PriceOye (priceoye.pk).
3. WhatMobile (whatmobile.com.pk).
4. Daraz official brand stores (daraz.pk, "Official Store" badge only).
5. GSMArena for specs only. Never use GSMArena for a PKR price.

Every variant needs at least one source URL that shows the price you recorded. Link the product page, not a search results page.

## Prices

- Record the lowest price from an official or PTA approved listing for that exact RAM and storage.
- Round to the nearest 500 PKR (119,999 becomes 120,000). Unrounded prices raise a validation warning.
- `priceCheckedAt` is the date you looked, as an ISO date in PKT. The validator compares against the UTC date, so a check made after 19:00 PKT can read as "in the future" until UTC midnight; use the UTC date if that happens.
- A non-PTA (grey market) listing may be recorded as its own variant with `"pta": false` and `"warranty": "none"`. Brackets and headline prices always use the cheapest PTA variant.

## Status

- `available`: two or more mainstream retailers list it in stock.
- `limited`: only one retailer, or only grey market stock.
- `discontinued`: the brand lists it as discontinued, or no Pakistani retailer stocks it.

## Warranty

- `official`: brand warranty through the brand's Pakistan service network.
- `local-shop`: warranty from the seller only.
- `none`: no warranty.

## Scores

Eight scores, each an integer 1 to 10 with a one-sentence reason. The reason must name the fact that drove the score ("120Hz AMOLED at 1,800 nits", not "great screen").

All scores except `value` are absolute across the whole 20k to 150k range, so a 9 means excellent for any phone on this site. `value` is relative to the phone's own bracket.

| Score | 1 to 3 | 4 to 6 | 7 to 8 | 9 to 10 |
| --- | --- | --- | --- | --- |
| camera | Single usable camera, poor in low light | Decent daylight main camera, no OIS | OIS main camera, usable ultrawide | Flagship-class main, telephoto, strong low light |
| performance | Entry chip, lag in daily use | Smooth daily use, light gaming | Handles most games at medium to high | Near-flagship chip, sustained gaming |
| battery | Under a day | A full day | A full day plus, 33W or faster | Two days, or a full day plus 67W or faster |
| display | HD+ LCD, 60Hz | FHD+ LCD or 90Hz | FHD+ AMOLED 120Hz | Bright LTPO or 1,500+ nits AMOLED |
| build | Plastic, no IP rating | Plastic with IP5x | Glass or metal frame, IP54 or better | Glass and metal, IP67 or IP68 |
| software | 1 OS update or none | 2 OS updates | 3 OS updates | 4 or more OS updates |
| value | Clearly worse than rivals at this price | Fair for the price | Better than most rivals at this price | Best in bracket for the money |
| availability | Grey market only | One retailer or shop warranty only | Widely stocked, official warranty | Stocked everywhere, official warranty and service centres |

Never store an `overall` score. It is computed.

## Rivals

`rivals` lists 2 to 3 slugs of phones in the same bracket that a buyer would genuinely cross-shop. Each must exist in `data/phones/`. Only listed pairs get a `/compare/` page.

## Files

- Path: `data/phones/<brand>-<model-kebab>.json`, for example `data/phones/samsung-galaxy-a55.json`.
- `slug` equals the filename without `.json`. `brand` must be a slug in `data/brands.json`.
- Specs: `ip` and `build.front` are `null` when the phone has none. `peakNits` may be omitted when unknown.

## Official photo (required)

Every phone needs one official product photo. Validation fails without it.

- Source, in order: the brand's Pakistan website, the brand's global website, the brand's newsroom or press kit. Never a retailer, review site or search engine thumbnail.
- A clean studio shot on a plain or transparent background, front view (or front and back), at least 800 px tall. No lifestyle shots or banners with text.
- Add it with:

```bash
npm run add-photo -- <slug> <file or https image URL> "<credit name>" <https page the image appears on>
```

This trims the background, fits the phone into a 600x800 transparent WebP at `public/images/phones/<slug>.webp`, and sets `image` and `imageCredit` in the phone's JSON. The credit is shown under the photo on the phone page.

## Before committing

```bash
npm run validate
```

Expected: `0 errors` for your files.
