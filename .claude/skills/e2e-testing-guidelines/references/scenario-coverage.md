# E2E Scenario Coverage

Apply these rules when tagging tests, extending the journey catalog, or reading the coverage report. This project measures e2e coverage as **scenario coverage** — which real user journeys the Playwright suite *asserts* — not lines of application code executed.

## Why Scenario Coverage, Not E2E Line Coverage

Scenario coverage is a deliberate choice over instrumenting the app and collecting e2e *line* coverage. Line coverage was rejected because:

- **Noisy and gameable.** Executed ≠ asserted: a line runs when a test merely walks past it, so line coverage overstates how well journeys are *verified*.
- **Slow and heavy.** It needs an instrumented coverage build, which is fragile under modern bundlers and slows the default e2e run. Scenario coverage is pure bookkeeping over test tags, so it adds near-zero cost.
- **Cannot express gaps.** Line coverage has no notion of an *intended* journey nobody has tested yet, so it can never say "the cancel journey is untested." A traceability catalog can — that visible-gap capability is the whole point.

The trade-off: the denominator is a **human judgment call** — an incomplete catalog inflates the percentage — so the catalog is reviewed alongside the code, and only critical journeys are hard-gated.

## Mechanism

Three pieces, joined by a stable scenario id:

- **Catalog** — a human-authored journey list at `e2e/scenarios.md`, one markdown-table row per journey: a stable dotted id (e.g. `post.header`), a title, an area, and a priority of `must` | `should` | `may`. This table is the coverage *denominator*.
- **Tags** — each test declares which journeys it asserts through Playwright's `tag` option (`test("…", { tag: [...] }, async …)`): a `@scenario:<id>` join tag (a test may carry several), the matching `@area:<area>` and `@priority:<priority>` facet tags for filtered runs (`--grep @priority:must`) and grouped reporting, and an optional `@smoke` selection tag marking the fast core-loop subset.
- **Reporter** — `e2e/reporters/scenario-coverage.ts`, a custom Playwright reporter registered in `playwright.config.ts`. It parses the catalog, tallies for every row whether at least one **passing** test carries its scenario tag, prints `covered/total` overall and per priority and per area plus the uncovered list, and writes `e2e/.scenario-coverage/summary.json` for the gate.

The `must` gate runs through `npm run coverage:scenarios` (`playwright test` then `node e2e/check-scenario-coverage.mjs`); `SCENARIO_GATE` toggles enforce (`must`, the default) ↔ report-only.

**Guidelines:**

- MUST author the catalog as a human-reviewable file, not a list in code, so journey completeness is judged in review.
- MUST add a catalog row when a change introduces a new user-facing journey, in the same change as the test that asserts it.
- MUST tag the test that **asserts** the journey's outcome — never a test that merely passes through the journey on its way elsewhere; executed ≠ asserted, and a tag on a pass-through test overstates coverage.
- MUST NOT rename a scenario id without updating every tag that references it in the same change — the id is the contract between catalog and tests.
- MUST keep facet tags (area, priority) consistent with the tagged scenario's catalog row, so filtered runs and grouped reports stay trustworthy.
- SHOULD keep genuinely-untested journeys in the catalog with an honest priority so the report shows real gaps; writing tests for surfaced gaps is follow-up work, not a prerequisite for reading the metric.
- MUST count a scenario as covered only when a **passing** test carries its tag; a failing or skipped test leaves it uncovered.

## Phased Gate

Gating in phases lets the metric land before coverage is complete: pin the critical journeys first, grow breadth without blocking every merge.

**Guidelines:**

- MUST hard-gate `must`-priority scenarios at 100% first: a `must` row with no passing asserting test blocks `npm run coverage:scenarios`.
- MUST fail the run on structural tag errors — an unknown scenario id or a facet tag that disagrees with the catalog — in every phase; a silently mis-joined tag corrupts the metric. The reporter fails `playwright test` itself on these, so the default `npm run test:e2e` catches them.
- SHOULD keep `should` / `may` coverage report-only until the `must` gate is stable, then tighten deliberately.
- SHOULD keep the default e2e run threshold-free for the `must` gate (report + structural errors only) so it stays fast, and enforce the `must` threshold in `npm run coverage:scenarios` or a dedicated CI job.
