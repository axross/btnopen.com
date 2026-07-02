# Plan Phase

The plan phase turns a raw issue into an approved, buildable specification. It runs across one or more sessions: the agent investigates, asks blocking questions and yields, resumes on human replies, and finally writes a comprehensive plan into the issue and stops at the approval gate.

## Investigate

**Guidelines:**

- MUST read the issue title, description, and full comment thread, then classify the work (UI-bearing, implementation-only, exploratory, mixed) per the [Response Approach](../../../../AGENTS.md).
- MUST investigate the smallest useful code and documentation context before proposing a plan, and consult every project skill whose routing condition matches the surface the issue touches.
- SHOULD research external, current documentation when the issue depends on Next.js, Payload, Sentry, Vercel, Playwright, or Biome behavior, per [current-docs.md](../../development-guidelines/references/current-docs.md).
- MUST inspect independent discovery targets in parallel when their outputs do not depend on each other.

## Ask and Yield

**Guidelines:**

- MUST post open questions as a single marked comment (`<!-- loop-agent -->`, `@axross`) that lists each question and states the assumption the agent would otherwise make.
- MUST set `loop:awaiting-answer`, release the `loop:active` lock, and exit rather than block waiting for a reply.
- MUST NOT ask what local investigation can answer; reserve questions for product, scope, privacy, platform, or design decisions the thread cannot resolve.
- SHOULD batch every currently-known question into one comment to minimize human round-trips.

## Resume

A human reply on an `loop:awaiting-answer` issue re-triggers the loop.

**Guidelines:**

- MUST reconstruct the full state from the thread on resume, treating unmarked comments as the human's answers.
- MUST continue investigating in place without re-applying `loop:plan`; re-applying it would re-fire the dispatch bridge and spawn a duplicate session. Keep `loop:awaiting-answer` while questions remain, and repeat the ask-and-yield cycle until nothing is unclear.

## Write the Plan and Refine the Issue

When everything is clear, the agent writes the plan into the issue and refines it in place.

**Guidelines:**

- MUST rewrite the issue body to contain the comprehensive plan with these sections, omitting any that genuinely do not apply and saying why:
  1. **Product requirement** — the user-facing outcome and constraints.
  2. **UI design** — hierarchy, states, responsive and accessibility intent, and copy constraints, in user-facing terms (per [UI Design Principles](../../ui-design-principles/SKILL.md)), when the change is UI-bearing.
  3. **System design / architecture** — data flow, Payload/collections, routes, and module placement (per [Project Structure](../../project-structure/SKILL.md)), when applicable.
  4. **Testing strategy** — the E2E and unit coverage to add or update (per [E2E Testing Guidelines](../../e2e-testing-guidelines/SKILL.md) and [Unit Test Guidelines](../../unit-test-guidelines/SKILL.md)), when applicable.
  5. **Acceptance criteria** — a checklist a reviewer can verify against the finished pull request.
- MUST refine the issue title to state the concrete deliverable.
- MUST move the original, unedited description into a collapsed section at the end of the body using the [collapsed-section](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections) format:

  ```markdown
  <details>
  <summary>Original issue description</summary>

  ...original text verbatim...

  </details>
  ```
- MUST use `issue_write` to update the title and body in a single edit, preserving all other content.

## Stop at the Approval Gate

**Guidelines:**

- MUST set `loop:plan-review`, post a marked comment that @mentions `@axross` summarizing the plan and requesting approval, release the lock, and exit.
- MUST NOT start implementation; the human moves the issue to `loop:ready-to-build` after reviewing the refined issue.
- SHOULD treat post-approval change requests (an unmarked comment while in `loop:plan-review`) as a reason to revise the plan and re-request approval, not to build.
