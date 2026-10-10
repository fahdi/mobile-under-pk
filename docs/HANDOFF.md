# Handoff - MobileUnder.pk

Last updated: 2026-10-10 12:41 PKT

## State

- Spec approved by Fahad on 2026-10-10. Do not re-litigate decisions in it.
- Repo created and pushed: https://github.com/fahdi/mobile-under-pk (public, `main`).
- Local path: `/Users/isupercoder/Code/mobile-phone-under` (folder name differs from repo name, that is fine).
- Plan written: `docs/superpowers/plans/2026-10-10-mobile-under-pk.md` (33 tasks, six milestones, plus a table of implementation choices it made).
- Issues #1 to #33 created, issue number = plan task number, labelled by milestone and area.
- Milestone 1 done (#1 to #6 closed): Astro 7 + TS 6 scaffold, Zod schemas, loader, cross-checks, `npm run validate`, Vitest (29 tests), CI (`verify` job, proven red on bad data via PR #34), Pages deploy. Live at https://fahdi.github.io/mobile-under-pk/ with a placeholder, no console errors.
- Pipeline hardened (PR #35): one workflow `ci.yml`, `deploy` job `needs: verify` and runs on main only, runners pinned to `ubuntu-24.04`, and `astro build` itself fails on invalid data. `tests/workflows.test.ts` pins these rules. Work TDD: failing test first, every time (Fahad, 2026-10-10).
- Thin slice shipped (PR #36), done ahead of plan order at Fahad's request so something usable is live: 7 phones in the 50,000 bracket, `/mobile-under-50000-in-pakistan/`, `/phones/<slug>/`, hub listing brackets. Closed #7, #18, #19. Partly done: #12 (caveats in its comment), #20 (bracket FAQ copy missing), #21 (brand, year, compare links pending #22 and #24).
- `tests/e2e/site.test.ts` builds the site against `tests/fixtures/site-data` (`DATA_ROOT` env) and fails on any broken internal link.
- Local dev: `npx astro dev` daemonises in Astro 7 (`astro dev stop` / `astro dev status`).

## Read first

- `docs/superpowers/specs/2026-10-10-mobile-under-pk-design.md` - the PRD. Sections 5 (decisions), 6 (data model), 12 (repo layout), 14 (milestones) are the ones implementation depends on.

## Next steps, in order

Steps 1 to 3 are done. Continue from step 4, starting with plan Task 7 (#7, `docs/RESEARCH.md`) before fanning out.

1. (done) Write the implementation plan with the `superpowers:writing-plans` skill from the spec. Save under `docs/superpowers/plans/`.
2. (done) Create GitHub issues on `fahdi/mobile-under-pk` from the plan, one per task, grouped by the six milestones in spec section 14. Use labels `milestone:1-foundation` ... `milestone:6-launch` plus `area:data`, `area:site`, `area:seo`, `area:ci`.
3. (done) Start Milestone 1: Astro + TypeScript scaffold, Zod schema in `src/schema/phone.ts`, `scripts/validate.ts`, Vitest, CI workflow, Pages deploy workflow with a placeholder page. Confirm the site is live at `https://fahdi.github.io/mobile-under-pk/` before moving on.
4. Milestone 2: phone research. Write `docs/RESEARCH.md` (#7), then fan out the nine bracket agents (#8 to #16, plan Tasks 8 to 16), then reconcile (#17). Each agent writes `data/phones/*.json` that passes the schema. Sources priority is in spec section 11.

## Rules that apply to this repo

- GitHub issues ARE allowed here. Fahad made an explicit exception to the "Jira only" rule for this personal public project.
- No em-dashes anywhere. Blank line before every markdown list.
- Commits end with the attribution block the session provides. Never add "Generated with Claude Code" to commit messages.
- Prices are PKR, approximate, every variant has `priceCheckedAt` and at least one source.
- Only phones released in 2024, 2025, 2026. Launch price up to 150,000 PKR. Discontinued phones included and flagged.

## Implementation choices

Decided in the plan's "Decisions made in this plan" table: vanilla TS finder (Preact only if it passes 300 lines), satori + resvg for OG images, TypeScript pinned to 6.x because `@astrojs/check` does not support TS 7 yet.
