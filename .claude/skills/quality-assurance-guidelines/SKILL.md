---
name: quality-assurance-guidelines
description: The reviewer's QA lens — whether a change carries adequate verification evidence — on top of development-verification and e2e-testing rules. Covers format/lint proof, e2e coverage under `e2e/tests/routes/...`, required `data-testid` hooks, intentional Playwright snapshot updates, scenario-coverage evidence (the `e2e/scenarios.md` journey catalog, `@scenario`/`@area`/`@priority` tags, and `must`-priority gaps), flaky-test investigation, manual checks for draft/preview/not-found states, skipped checks, and residual risk.
when_to_use: Use when reviewing whether a change has adequate verification evidence — "are tests good", "did this break anything", "is the scenario catalog complete", or "should I bump snapshots". Not for how to write the tests — use the e2e testing guidelines (Playwright) or the unit test guidelines (Jest).
user-invocable: false
---

# Quality Assurance Guidelines

Apply these rules when reviewing whether a change has been adequately verified before merge. This is the reviewer's lens — flag missing evidence and link to the developer-facing rule.

## Verification Evidence

See [verification-evidence.md](./references/verification-evidence.md) for:

- Commands run, exit status, and relevant output
- Manual browser checks matched to changed output surfaces
- Skipped required checks and residual risk
- Second-pass verification after fixing Critical or Major findings

## Lint and Format Gate

See [lint-and-format-gate.md](./references/lint-and-format-gate.md) for:

- The author ran `npm run format` and `npm run lint` per the project's development guidelines (code-quality rules)
- No new `// biome-ignore …` directives without an inline justification
- No new lint warnings introduced into modified files

## E2E Coverage

See [e2e-coverage.md](./references/e2e-coverage.md) for:

- Every new route, page section, or user-facing feature has a co-located test under `e2e/tests/routes/<route>/…`
- New visually distinct UI elements expose `data-testid` per the project's React component guidelines (testable-components rules)
- Test files use the project's required locator and structure conventions per the project's e2e testing guidelines
- API helpers under `e2e/helpers/api/` are used (not duplicated inline in the test file)
- Scenario-coverage evidence: a new user-facing journey is cataloged in `e2e/scenarios.md` and tagged on the asserting test, and a `must`-priority gap blocks `npm run coverage:scenarios`

## Snapshot Handling

See [snapshot-handling.md](./references/snapshot-handling.md) for:

- A regenerated snapshot is paired with an explanation of the visual change in the diff
- The author understands that local `--update-snapshots` only updates the local platform's snapshot (the `{/platform}` segment in the snapshot path)
- CI's auto-snapshot-PR is reviewed for visual intent, not auto-merged
- Removed snapshots are accompanied by removed or restructured tests, not silent deletion

## Flakiness Tolerance

See [flakiness-tolerance.md](./references/flakiness-tolerance.md) for:

- A test that intermittently passes was investigated, not "fixed" by retry, polling, or `await new Promise(r => setTimeout(r, …))`
- `repeatEach: 2` and `failOnFlakyTests: true` in `playwright.config.ts` are not weakened
- Committed `.only()` and `.skip()` markers are flagged, including how CI's `forbidOnly: isCI` handles `.only`

## Manual Verification Evidence

See [manual-verification.md](./references/manual-verification.md) for:

- The author exercised both published and draft states (`?draft=true`) when the change touches a CMS-driven route
- The not-found UI was verified for routing changes
- The Payload live-preview path was verified when the change touches `posts/[slug]` or any route using `PayloadLivePreview`
- The development server output (`npm run dev`) was checked for new Pino warn/error lines or Sentry reports
