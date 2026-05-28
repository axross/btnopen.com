---
name: code-review-guideline
description: Apply this skill at the start of EVERY review task, including post-implementation self-review. Covers reviewer-mode reset, diff scoping with `git status`/`git diff`, severity labels, file-line evidence, fix snippets, verification evidence, second-pass re-review after fixes, escalation for high-risk changes, and topic-specific lenses for maintainability, QA, security, performance, structure, routing, markdown, UI, observability, and e2e tests. Use for "review", "PR", "audit", "check this change", or self-review prompts.
---

# Code Review Guideline

Apply these rules at the start of every code review, regardless of the change type or domain.

## Reviewer-Mode Reset

Self-review is not independent review, so this project makes it a separate required phase with explicit evidence. After implementation, the reviewer stops editing, rereads the request, inspects the diff, and reviews the produced change as if another author wrote it.

**Guidelines:**

- MUST perform a reviewer-mode reset before post-implementation self-review.
- MUST inspect `git status` and the relevant `git diff` before reading surrounding files.
- MUST judge only the diff and affected behavior, not the implementation intent.
- MUST fix Critical or Major findings in a later implementation phase, then perform a second-pass re-review.
- MUST report verification evidence or skipped verification before completion.
- SHOULD escalate high-risk changes per [escalation.md](./escalation.md) instead of calling them merge-ready based on self-review alone.

## Review Scoping

See [scoping.md](./scoping.md) for how to bound the review:

- Discovering what changed via `git diff` / `git status` / `gh pr diff`
- Distinguishing in-scope (the diff) from out-of-scope (pre-existing)
- Reading surrounding code to understand caller/callee context
- Handling untracked files and partial diffs

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Severity Classification

See [severity.md](./severity.md) for how to label each finding:

- Critical, Major, Minor, Nit definitions with concrete project examples
- Required severity for each major issue category (security, data loss, broken e2e, etc.)
- How severity drives the final verdict (Approve / Approve with Nits / Request Changes)

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Evidence-Based Reporting

See [evidence.md](./evidence.md) for the required reporting format:

- Mandatory `file:line` citations
- Diff-style fix snippets (`-` removed / `+` added)
- The full review-report structure (Summary, Strengths, Findings by severity, Recommended Actions)
- Linking findings to the topic-specific guideline that was violated

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Review Tone

See [tone.md](./tone.md) for communication norms:

- Constructive, blame-free language
- Stating the "why" behind each concern
- Explicit assumption-flagging when uncertain
- Acknowledging strengths

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Escalation

See [escalation.md](./escalation.md) for the reviewer's reporting boundary:

- How to make findings trivially applicable by the caller without requiring another reviewer to reinterpret them
- How to surface recurring guideline gaps as a "Guideline gap:" note in the report
- When a finding requires the caller's decision (framed as a "Decision needed:" entry)
- When high-risk changes require user review, CI/PR review, or explicit acceptance before being called merge-ready

**Guidelines:**

- MUST keep the review phase reporting-only; it MUST NOT mutate the codebase or delegate the review.
- SHOULD read the linked reference when work touches this topic.

## Topic-Specific Guidelines

Consult the appropriate skill for detailed review checklists in each lens. These are the **reviewer's** lens; they layer on top of the developer-facing guidelines linked at the bottom and add "what to flag" rather than "how to write".

| Lens | Skill |
|---|---|
| Readability, naming, complexity, abstraction boundaries, scope discipline, dead code | [Maintainable Code Guidelines](../maintainable-code-guidelines/SKILL.md) |
| Verifying e2e coverage, snapshot handling, flakiness, manual verification, lint/format gate | [Quality Assurance Guidelines](../quality-assurance-guidelines/SKILL.md) |
| OWASP-lens for Next.js + Payload CMS on Vercel — secrets, input validation, access control, XSS, SSRF, auth, supply chain | [Application Security Requirements](../application-security-requirements/SKILL.md) |
| Payload N+1, RSC/client boundary cost, `"use cache"` / `cacheLife` correctness, image optimization, bundle weight, error and observability hooks | [Performance and Reliability Requirements](../performance-and-reliability-requirements/SKILL.md) |
| Project stack, repository layout, path aliases, support files, and file placement | [Project Structure](../project-structure/SKILL.md) |

**Guidelines:**

- MUST choose every topic-specific lens that materially overlaps the diff before reporting findings.
- SHOULD cite the owning lens when a finding depends on a specialized project rule.
- MUST NOT treat this table as exhaustive when the diff has an obvious topic covered by a developer-facing skill below.

## Developer-Facing Guidelines (defer, do not duplicate)

Developer-facing skills own how to write project-conforming code. The review skill owns how to report whether the diff followed those rules.

| Topic | Skill |
|---|---|
| Biome format/lint loop, change scope discipline, npm dep / migration rules | [Development Guidelines](../development-guidelines/SKILL.md) |
| Project stack, repository layout, and file placement | [Project Structure](../project-structure/SKILL.md) |
| Routing, URL structure, route directory/file conventions | [Routing Guidelines](../routing-guidelines/SKILL.md) |
| React component conventions, client-vs-server split, styling, testability | [React Component Guidelines](../react-component-guidelines/SKILL.md) |
| Visual design tone, CSS property usage, UI copy/wording, accessibility | [UI Design Principles](../ui-design-principles/SKILL.md) |
| Sentry / Pino error handling and logging | [Observability Guidelines](../observability-guidelines/SKILL.md) |
| Markdown parsing pipeline, custom plugins, Shiki highlighting | [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md) |
| End-to-end test structure, conventions, and commands | [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md) |

**Guidelines:**

- MUST defer to these developer-facing skills when checking that a change conforms to project conventions.
- MUST cite and link the owning guideline instead of restating its detailed rule in the review report.
