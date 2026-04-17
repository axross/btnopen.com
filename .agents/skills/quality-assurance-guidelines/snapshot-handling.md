# Snapshot Handling

Apply these rules to verify visual snapshot changes are intentional and adequately reviewed.

## Snapshot Path Awareness

The project's `playwright.config.ts` uses this template:

```
e2e/tests/{testFileDir}/__snapshots__/{testFileName}{/platform}/{projectName}-{arg}{ext}
```

The `{/platform}` segment means snapshots are **OS-specific**. The reviewer MUST be aware:

- A local macOS `npm run test:e2e -- --update-snapshots` updates only the macOS snapshots in the diff, not the Linux snapshots used by CI.
- CI runs with `--update-snapshots` and auto-creates a snapshot PR. That auto-PR still needs review for visual intent.

## When Snapshots Are Regenerated

- MUST flag a snapshot file change that lacks an accompanying explanation in the PR description, commit message, or review thread. The author MUST justify what visually changed and why.
- MUST flag a snapshot change paired with a non-visual code change (e.g., a refactor of a server-side helper) — it indicates either an unintentional regression or a hidden behavioral change.
- MUST flag a snapshot **deletion** that is not paired with a removed or renamed test. Silent deletion hides regressions.
- SHOULD ask the author to attach the screenshot diff or describe the visible change concretely (e.g., "header padding increased by 8px because the cover image now has rounded corners").

## When Snapshots Should Have Been Regenerated But Weren't

- MUST flag a Critical when the diff visibly changes the rendered output of a component covered by a snapshot test (e.g., a new element added to `BlogPostHeader`) but no snapshot file changed. Either the test does not cover the affected route, or the author skipped the regeneration step.
- SHOULD ask the author to run `npm run test:e2e -- --update-snapshots` locally and re-push.

## Cross-Platform Drift

- MUST flag when the macOS snapshot differs from the Linux snapshot in non-trivial ways (font hinting, anti-aliasing) — these are unavoidable, but if a Linux snapshot's diff includes layout-level changes, that is a real bug, not OS drift.
- MAY recommend the author rely on CI's auto-snapshot-PR for the Linux snapshot, while updating macOS locally.

## Snapshot Scope

- SHOULD flag a `toHaveScreenshot()` assertion taken on the entire `page` when a narrower locator (e.g., the changed component's root) would isolate the visual contract — broad screenshots churn on every unrelated visual change.
- SHOULD flag a snapshot taken without first awaiting all relevant Suspense boundaries to settle (e.g., snapshotting before `BlogPostContent` finishes loading). The skeleton state and loaded state are different visual contracts and should be snapshotted separately if both matter.
