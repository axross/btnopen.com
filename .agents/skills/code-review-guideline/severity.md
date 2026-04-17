# Severity Classification

Apply these rules to label every finding before reporting it. Severity drives both the final verdict and the order findings appear in the report.

## Severity Definitions

- **Critical** — MUST block merge. The change introduces a defect that will cause data loss, a security breach, a production outage, a broken `main` branch (lint/build/e2e failure), or a violation of a developer-facing MUST rule that any user will hit on the first request.
- **Major** — SHOULD block merge unless deferred deliberately. The change introduces a defect that will degrade correctness, performance, or reliability in a way users will notice, or violates a developer-facing SHOULD rule with no documented justification.
- **Minor** — SHOULD be addressed but does not block merge. Readability, naming, or small refactor opportunities; missing-but-non-critical test coverage; non-load-bearing convention drift.
- **Nit** — Optional polish. Style preferences, alternative phrasings, micro-optimizations with no measurable benefit.

## Required Severity Floors

These categories MUST always be at least the listed severity, regardless of perceived "smallness":

| Category | Minimum severity |
|---|---|
| Hardcoded secret, token, or credential committed to the repo | Critical |
| Missing or incorrect Payload CMS access control on a non-public collection field | Critical |
| Unsanitized user input flowing into a Payload `where` clause, route handler, or markdown pipeline | Critical |
| New `route.ts` / server action that reads or mutates data without verifying the request's authenticated identity | Critical |
| Lint error introduced (`npm run lint` would fail) | Critical |
| New e2e test failure introduced, or removal of an existing assertion that covered changed behavior | Critical |
| Missing `await` on a Promise returned from a Payload or `fetch` call | Critical |
| Importing a Server Component (or `server-only` module) from a `"use client"` file | Critical |
| New dependency added without justification per [development-guidelines › change-management](../development-guidelines/change-management.md) | Major |
| Snapshot regenerated without explanation when the visual change was intentional but undocumented | Major |
| New Server Component that fetches data without `"use cache"` + `cacheLife()` when the data is cacheable | Major |
| Client Component pulled into a tree that previously was server-only, materially increasing JS bundle weight, with no interactivity justification | Major |
| Missing `data-testid` on a new visually distinct element that an e2e test would target | Major |
| `try`/`catch` placed in a nested helper instead of the root call site | Major |
| `logger.error()` used instead of `captureException()` | Major |
| Magic value introduced where a CSS variable or named constant exists | Minor |
| Inconsistent file/identifier naming (e.g., camelCase file in a kebab-case directory) | Minor |

## Verdict Mapping

The reviewer MUST emit one of these three verdicts in the report Summary, derived from the severity counts:

- **Request Changes** — at least one Critical finding, OR more than two Major findings.
- **Approve with Nits** — zero Critical, at most two Major, and at least one Minor or Nit.
- **Approve** — zero Critical, zero Major, zero Minor, and at most a few Nits.

## When in Doubt

- SHOULD escalate uncertain severity upward, not downward. A finding labeled Major that turns out to be Minor wastes the author's attention; a Critical mislabeled as Minor causes a production incident.
- MUST state the assumption that drove the severity choice when uncertain (e.g., "Critical because I'm assuming this route is public; downgrade to Major if it's behind admin auth").
