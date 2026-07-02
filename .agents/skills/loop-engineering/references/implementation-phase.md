# Implementation Phase

The implementation phase builds the approved plan, opens a draft pull request, drives the review loop to convergence, and hands a review-ready pull request back to the human. It starts when the human applies `loop:ready-to-build`.

## Build

**Guidelines:**

- MUST implement strictly from the plan recorded in the issue body, keeping edits within the smallest surface that satisfies the acceptance criteria.
- MUST work on a `claude/issue-<n>` branch (the routine's `claude/`-prefixed branch convention) and never push to `main`.
- MUST follow every project skill whose routing condition matches the changed files, and add or update the E2E and unit coverage the plan named.
- MUST perform the reviewer-mode reset and fix Critical/Major self-review findings before opening the pull request, per [Code Review Guideline](../../code-review-guideline/SKILL.md).

## Verify

**Guidelines:**

- MUST run `npm run format` and `npm run lint` after code or documentation edits.
- MUST run `npm run test:unit`, and run `npm run test:e2e` when the change affects a UI output surface or e2e coverage.
- MUST run `npm run build` when the change affects routes, metadata, Payload config, runtime config, dependencies, or TypeScript signatures.
- MUST run `npm run migrate:create` after any Payload schema change and report migration status.
- MUST report which verification commands ran, their result, and any skipped check with its residual risk, in the pull request body.

## Open the Draft Pull Request

**Guidelines:**

- MUST open the pull request in **draft** state with `Closes #<n>` in the body so merging closes the issue.
- MUST structure the body from any repository pull-request template, summarizing the change, the verification evidence, and the acceptance criteria with their status.
- MUST set `loop:in-review` on the issue, then post a marked comment on the issue linking the pull request.
- SHOULD enable the PR watch (Auto-fix, or `subscribe_pr_activity` within a live session) so review comments and CI failures re-enter the loop; see [operator-setup.md](./operator-setup.md).

## Watch and Address

Each PR event (a human review comment, a CI failure) re-triggers the loop on the pull request.

**Guidelines:**

- MUST, on entry, re-read the pull request diff, unresolved review threads, and CI status before acting.
- MUST address and resolve each actionable human review comment, pushing fixes to the same branch, then reply on the thread with a marked comment noting what changed.
- MUST use `AskUserQuestion`-style escalation — a marked comment that @mentions `@axross` — when a review comment is ambiguous or needs a product/architecture decision, rather than guessing.
- MUST re-run the relevant verification after each batch of fixes and keep the pull request body's evidence current.
- MUST treat CI-green and mergeability as signals the webhook may not deliver; re-check them on every run rather than assuming.

## Comprehensive Self-Review

After the pull request opens and again whenever all outstanding review comments are resolved, run a full self-review.

**Guidelines:**

- MUST review the whole diff through every matching lens in [Code Review Guideline](../../code-review-guideline/SKILL.md): correctness/bugs, maintainability, security, performance/reliability, UI/UX, routing, markdown, observability, and e2e coverage.
- MUST post each surviving finding as its **own** marked review comment with a severity label, `file:line` evidence, and a concrete fix, so the watch step picks it up as a separate item.
- MUST NOT post Nit-only noise as blocking findings; a clean round means no Critical, Major, or Minor finding remains.
- SHOULD also address the findings the same session raised, rather than depending only on event re-entrancy, since self-authored comments may not re-trigger the watcher under the shared identity.

## Termination Guard

The self-review-then-fix cycle has no natural stop, and unbounded rounds burn the daily routine cap and metered usage.

**Guidelines:**

- MUST track a round counter in a single pinned `<!-- loop-agent -->` tracking comment on the pull request, incrementing it each self-review round.
- MUST stop the loop and set `loop:blocked` with an `@axross` escalation if the review has not converged after **4** rounds, summarizing what still fails.
- MUST end the loop when a full self-review round produces zero Critical/Major/Minor findings and no unresolved human comments remain.

## Hand Back

**Guidelines:**

- MUST flip the pull request from draft to ready for review only after a clean self-review round and green CI.
- MUST set `loop:done` on the issue and post a marked comment on the issue that @mentions `@axross` with a short outcome summary (what shipped, verification status, and any residual risk or deferred follow-up).
- MUST NOT merge the pull request; merging remains the human's decision.
