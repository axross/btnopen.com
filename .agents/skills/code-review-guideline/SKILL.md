---
name: code-review-guideline
description: Apply this skill at the start of EVERY code review task in this project, regardless of the topic. Covers the cross-cutting reviewer process — scoping the review against `git diff`/`git status`, severity classification (Critical / Major / Minor / Nit), evidence-based reporting with `file:line` citations and code-snippet fixes, the constructive review tone, the structured review-report output format, and the strict reporting boundary (the reviewer reports back to its caller only — it never mutates the codebase or invokes other subagents). It also routes to the four topic-specific review lenses: maintainability/code design, quality assurance (e2e coverage, snapshots, flakiness), application security (OWASP applied to Next.js + Payload CMS on Vercel), and performance/reliability (Payload queries, RSC/client boundary, `"use cache"`, bundle weight, error handling). Use this even when the user does not name a specific lens — any "review", "look at this PR", "check this change", "audit this code", or post-change verification request goes through this skill first.
user-invocable: false
---

# Code Review Guideline

Apply these rules at the start of every code review, regardless of the change type or domain.

## Review Scoping

See [scoping.md](./scoping.md) for how to bound the review:

- Discovering what changed via `git diff` / `git status` / `gh pr diff`
- Distinguishing in-scope (the diff) from out-of-scope (pre-existing)
- Reading surrounding code to understand caller/callee context
- Handling untracked files and partial diffs

## Severity Classification

See [severity.md](./severity.md) for how to label each finding:

- Critical, Major, Minor, Nit definitions with concrete project examples
- Required severity for each major issue category (security, data loss, broken e2e, etc.)
- How severity drives the final verdict (Approve / Approve with Nits / Request Changes)

## Evidence-Based Reporting

See [evidence.md](./evidence.md) for the required reporting format:

- Mandatory `file:line` citations
- Diff-style fix snippets (`-` removed / `+` added)
- The full review-report structure (Summary, Strengths, Findings by severity, Recommended Actions)
- Linking findings to the topic-specific guideline that was violated

## Review Tone

See [tone.md](./tone.md) for communication norms:

- Constructive, blame-free language
- Stating the "why" behind each concern
- Explicit assumption-flagging when uncertain
- Acknowledging strengths

## Escalation

See [escalation.md](./escalation.md) for the reviewer's reporting boundary:

- The reviewer reports back to its caller only — it MUST NOT mutate the codebase or invoke other subagents
- How to make findings trivially applicable by the caller without instructing peer agents
- How to surface recurring guideline gaps as a "Guideline gap:" note in the report
- When a finding requires the caller's decision (framed as a "Decision needed:" entry)

## Topic-Specific Guidelines

Consult the appropriate skill for detailed review checklists in each lens. These are the **reviewer's** lens; they layer on top of the developer-facing guidelines linked at the bottom and add "what to flag" rather than "how to write".

| Lens | Skill |
|---|---|
| Readability, naming, complexity, abstraction boundaries, scope discipline, dead code | [Maintainable Code Guidelines](../maintainable-code-guidelines/SKILL.md) |
| Verifying e2e coverage, snapshot handling, flakiness, manual verification, lint/format gate | [Quality Assurance Guidelines](../quality-assurance-guidelines/SKILL.md) |
| OWASP-lens for Next.js + Payload CMS on Vercel — secrets, input validation, access control, XSS, SSRF, auth, supply chain | [Application Security Requirements](../application-security-requirements/SKILL.md) |
| Payload N+1, RSC/client boundary cost, `"use cache"` / `cacheLife` correctness, image optimization, bundle weight, error and observability hooks | [Performance and Reliability Requirements](../performance-and-reliability-requirements/SKILL.md) |

## Developer-Facing Guidelines (defer, do not duplicate)

The reviewer MUST defer to these existing developer-facing skills when checking that a change conforms to project conventions. Do not re-state their rules in a review — instead cite the guideline and link to it.

| Topic | Skill |
|---|---|
| Biome format/lint loop, change scope discipline, npm dep / migration rules | [Development Guidelines](../development-guidelines/SKILL.md) |
| Routing, URL structure, route directory/file conventions | [Routing Guidelines](../routing-guidelines/SKILL.md) |
| React component conventions, client-vs-server split, styling, testability | [React Component Guidelines](../react-component-guidelines/SKILL.md) |
| Visual design tone, CSS property usage, UI copy/wording, accessibility | [UI Design Principles](../ui-design-principles/SKILL.md) |
| Sentry / Pino error handling and logging | [Observability Guidelines](../observability-guidelines/SKILL.md) |
| Markdown parsing pipeline, custom plugins, Shiki highlighting | [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md) |
| End-to-end test structure, conventions, and commands | [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md) |
