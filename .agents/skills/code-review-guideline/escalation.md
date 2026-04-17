# Escalation

Apply these rules to decide what stays inside the review report versus what must be deferred back to the caller. The reviewer's only output is the review report — it does not act on the codebase, and it does not communicate with anyone other than the caller that invoked it (the user or a parent agent).

## The Reviewer Reports, It Does Not Act

- MUST NOT mutate the codebase. Applying fixes is the caller's responsibility (or whoever the caller subsequently invokes).
- MUST NOT invoke, dispatch, or address other subagents. The reviewer has exactly one audience: the caller. Frame every finding so the caller — not a peer agent — is the reader.
- SHOULD make each Critical and Major finding so specific (file path, line number, diff-style fix snippet per [evidence.md](./evidence.md)) that the caller can hand the report directly to a developer (human or agent) without re-deriving context.

## Make Fixes Trivially Applicable by the Caller

- MUST list, under **Recommended Actions**, the verification step (`npm run lint`, `npm run test:e2e`, manual route check per [development-guidelines › verification](../development-guidelines/verification.md)) the eventual fixer will need to run after each Critical or Major fix.
- SHOULD phrase recommendations as imperative checklist items written to the future fixer ("Apply fix #1, then run `npm run lint`"), never as instructions to a named agent ("Ask `nextjs-developer` to …").

## Surface Recurring Guideline Gaps to the Caller

- SHOULD note in the report when the same defect class has appeared multiple times in the diff and no current guideline rule cleanly covers it. Use a **Guideline gap:** bullet under Recommended Actions and propose a concrete location (e.g., "Consider adding a rule under `application-security-requirements/secret-handling.md` covering …") so the caller can later choose to revise the skill suite.
- MUST NOT add or modify guideline files itself.

## Defer Decisions to the Caller

The reviewer MUST defer the decision back to the caller — it does not pick a side — when a finding involves any of:

- A trade-off between two SHOULD rules with no MUST to break the tie.
- A breaking change to a public route, OG metadata, or sitemap that affects users already linking to the URL.
- A change to a Payload CMS migration that will be irreversible once applied to production (e.g., dropping a non-empty column).
- A cost / performance trade-off that requires production-environment data to evaluate (e.g., choosing `cacheLife("hours")` vs `"days"` — the rule is "use one", but which is a judgment call).
- Adoption of a new third-party service or API key with a budget implication.

Frame deferred items under the **Recommended Actions** section as **Decision needed:** entries with at least two enumerated options and the reviewer's tentative recommendation.

## Do Not Surface as Guideline Gaps

- Lint or format errors — the developer's [code-quality](../development-guidelines/code-quality.md) loop covers them; flag them as Critical findings and let the fixer run `npm run format` / `npm run lint`.
- Snapshot regenerations — flag whether the change is intentional per [quality-assurance-guidelines](../quality-assurance-guidelines/SKILL.md) and let the fixer re-run with `--update-snapshots`.
- Anything resolvable by re-reading an existing guideline file.
