---
name: quality-assurance-guidelines
description: Use this skill when reviewing whether a change has been **adequately verified** in this project — that the lint/format gate has been respected, that the e2e suite under `e2e/tests/routes/...` covers the changed output surface, that new visually distinct UI has the right `data-testid` hooks, that snapshots were regenerated only for intentional visual changes (and the platform-suffix nuance was understood), that flakiness is investigated rather than retried (since `playwright.config.ts` sets `repeatEach: 2` + `failOnFlakyTests: true`), and that draft / preview / not-found states were exercised manually before merge. This is the **reviewer's** verification lens — what to demand evidence of — and layers on top of [development-guidelines › verification](../development-guidelines/verification.md) and [e2e-testing-guidelines](../e2e-testing-guidelines/SKILL.md), which the developer follows when writing the code and tests. Use even when the user only asks "are tests good", "did this break anything", or "should I bump the snapshots".
---

# Quality Assurance Guidelines

Apply these rules when reviewing whether a change has been adequately verified before merge. This is the reviewer's lens — flag missing evidence and link to the developer-facing rule.

## Lint and Format Gate

See [lint-and-format-gate.md](./lint-and-format-gate.md) for what to verify:

- The author ran `npm run format` and `npm run lint` per [development-guidelines › code-quality](../development-guidelines/code-quality.md)
- No new `// biome-ignore …` directives without an inline justification
- No new lint warnings introduced into modified files

## E2E Coverage

See [e2e-coverage.md](./e2e-coverage.md) for what to verify:

- Every new route, page section, or user-facing feature has a co-located test under `e2e/tests/routes/<route>/…`
- New visually distinct UI elements expose `data-testid` per [react-component-guidelines › testable-components](../react-component-guidelines/testable-components.md)
- Test files use the project's required locator and structure conventions per [e2e-testing-guidelines](../e2e-testing-guidelines/SKILL.md)
- API helpers under `e2e/helpers/api/` are used (not duplicated inline in the test file)

## Snapshot Handling

See [snapshot-handling.md](./snapshot-handling.md) for what to verify:

- A regenerated snapshot is paired with an explanation of the visual change in the diff
- The author understands that local `--update-snapshots` only updates the local platform's snapshot (the `{/platform}` segment in the snapshot path)
- CI's auto-snapshot-PR is reviewed for visual intent, not auto-merged
- Removed snapshots are accompanied by removed or restructured tests, not silent deletion

## Flakiness Tolerance

See [flakiness-tolerance.md](./flakiness-tolerance.md) for what to verify:

- A test that intermittently passes was investigated, not "fixed" by retry, polling, or `await new Promise(r => setTimeout(r, …))`
- `repeatEach: 2` and `failOnFlakyTests: true` in `playwright.config.ts` are not weakened
- `.only()` and `.skip()` are not committed (CI's `forbidOnly: isCI` will catch `.only`, but the reviewer flags both)

## Manual Verification Evidence

See [manual-verification.md](./manual-verification.md) for what to verify:

- The author exercised both published and draft states (`?draft=true`) when the change touches a CMS-driven route
- The not-found UI was verified for routing changes
- The Payload live-preview path was verified when the change touches `posts/[slug]` or any route using `PayloadLivePreview`
- The development server output (`npm run dev`) was checked for new Pino warn/error lines or Sentry reports
