# Handoff - MobileUnder.pk

Last updated: 2026-10-10 14:20 PKT

## State

- Spec approved 2026-10-10. Plan: `docs/superpowers/plans/2026-10-10-mobile-under-pk.md` (deviations noted inline in the plan).
- All six milestones built and live at https://fahdi.github.io/mobile-under-pk/ (2026-10-10, about 14:15 PKT): 56 phones across all ten brackets, each with an official photo; bracket, phone, brand, year, compare, intent and finder pages; sitemap, robots, JSON-LD and an OG image per page.
- CI (`ci.yml`): validate, ~197 tests (unit, Astro components, end-to-end build on `tests/fixtures/site-data`), astro check, build, `check:site`, Lighthouse mobile (median of 3; SEO 100, perf and a11y 95+). `deploy` needs `verify` and `lighthouse`, main only.
- Open issues: #8, #10, #13 (brackets short of target, held-back phones listed there), #32 (first price refresh, due about 2026-11-10), #33 (Rich Results Test and Search Console need Fahad).
- Held-back phone files (doubtful prices) live only in the session scratchpad, not the repo; details on #10 and #13.

## Working rules learned this session

- Work TDD: failing test first, every time, including workflow and config changes (Fahad, 2026-10-10).
- Merge only after `gh pr checks --watch` succeeds; one PR was merged with a failed Lighthouse check before the gate moved to median of 3.
- Push with `GIT_SSH_COMMAND="ssh -o BatchMode=yes"` and a timeout; a plain push hung on a prompt once.
- Verify research agents' output yourself: look at every processed photo, re-check doubtful prices, hold back phones whose only in-bracket price is a list price contradicted by retailers.
- In zsh, put multiple paths in an array (`F=(a b)`, `"${F[@]}"`); `$F` does not split.

## Read first

- `docs/superpowers/specs/2026-10-10-mobile-under-pk-design.md` - the PRD. Sections 5 (decisions), 6 (data model), 12 (repo layout), 14 (milestones) are the ones implementation depends on.

## Next steps, in order (original list, all done except where the State section says otherwise)

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
