# Handoff - MobileUnder.pk

Last updated: 2026-10-10 11:25 PKT

## State

- Spec approved by Fahad on 2026-10-10. Do not re-litigate decisions in it.
- Repo created and pushed: https://github.com/fahdi/mobile-under-pk (public, `main`).
- Local path: `/Users/isupercoder/Code/mobile-phone-under` (folder name differs from repo name, that is fine).
- Nothing built yet. No scaffold, no data, no issues.

## Read first

- `docs/superpowers/specs/2026-10-10-mobile-under-pk-design.md` - the PRD. Sections 5 (decisions), 6 (data model), 12 (repo layout), 14 (milestones) are the ones implementation depends on.

## Next steps, in order

1. Write the implementation plan with the `superpowers:writing-plans` skill from the spec. Save under `docs/superpowers/plans/`.
2. Create GitHub issues on `fahdi/mobile-under-pk` from the plan, one per task, grouped by the six milestones in spec section 14. Use labels `milestone:1-foundation` ... `milestone:6-launch` plus `area:data`, `area:site`, `area:seo`, `area:ci`.
3. Start Milestone 1: Astro + TypeScript scaffold, Zod schema in `src/schema/phone.ts`, `scripts/validate.ts`, Vitest, CI workflow, Pages deploy workflow with a placeholder page. Confirm the site is live at `https://fahdi.github.io/mobile-under-pk/` before moving on.
4. Milestone 2: phone research. Fan out parallel agents by bracket (spec 6.2 brackets). Each agent writes `data/phones/*.json` that passes the schema. Sources priority is in spec section 11.

## Rules that apply to this repo

- GitHub issues ARE allowed here. Fahad made an explicit exception to the "Jira only" rule for this personal public project.
- No em-dashes anywhere. Blank line before every markdown list.
- Commits end with the attribution block the session provides. Never add "Generated with Claude Code" to commit messages.
- Prices are PKR, approximate, every variant has `priceCheckedAt` and at least one source.
- Only phones released in 2024, 2025, 2026. Launch price up to 150,000 PKR. Discontinued phones included and flagged.

## Open implementation choices (decide while building, note in plan)

- Finder island: vanilla TypeScript preferred if under ~300 lines, otherwise Preact.
- OG image generation approach (satori vs a prebuilt static template).
