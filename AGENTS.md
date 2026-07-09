# AGENTS.md

## Requirement Level Keywords

Apply these keywords consistently in this document and the documents linked from this document.

| Keyword | Synonym | Meaning |
| ------- | ------- | ------- |
| "MUST" | "REQUIRED" | Non-negotiable requirement; no exceptions. |
| "MUST NOT" |  | Non-negotiable prohibition; no exceptions. |
| "SHOULD" | "RECOMMENDED" | Strongly preferred; deviation is allowed only after weighing the implications. |
| "SHOULD NOT" | "NOT RECOMMENDED" | Strongly discouraged; allowed only after weighing the implications. |
| "MAY" | "OPTIONAL" | Genuinely optional; no preference implied. |

## Project Overview

- This is a personal blogging website. It displays a portrait, a bio, and links to the author's social media accounts.
- Blog posts are the primary content type. They support tags, cover images, and rich Markdown including syntax-highlighted code blocks and embedded web content previews.
- Content is written primarily in Japanese, with English provided as a fallback for readers in other locales.
- For tech stack, third-party services, and directory placement, consult [Project Structure](.claude/skills/project-structure/SKILL.md).
- For npm run-scripts, current-docs lookup rules, and verification commands, consult [Development Guidelines](.claude/skills/development-guidelines/SKILL.md).

## Skill Index

`AGENTS.md` is the master routing index for project skills. Consult the relevant skill before acting on matching work.

| Skill | When to apply |
| ----- | ------------- |
| [Agent Skills Best Practices](.claude/skills/agent-skills-best-practices/SKILL.md) | Creating, refining, splitting, renaming, deleting, or auditing project skills or this skill index |
| [Application Security Requirements](.claude/skills/application-security-requirements/SKILL.md) | Reviewing secrets, environment variables, validation, Payload access control, markdown XSS, SSRF/embed fetching, auth/session behavior, privacy exposure, preview/branch deployment data exposure, analytics/error-reporting data, or npm dependency risk |
| [Blog Post Authoring Guidelines](.claude/skills/blog-post-authoring-guidelines/SKILL.md) | Drafting, rewriting, refining, translating, or reviewing blog post content, titles, briefs, tags, structure, tone, grammar, and authorial style |
| [Code Review Guideline](.claude/skills/code-review-guideline/SKILL.md) | Reviewing a diff, pull request, local change, or post-implementation self-review |
| [Development Guidelines](.claude/skills/development-guidelines/SKILL.md) | Implementing, refactoring, running commands, preparing commits, writing pull request descriptions, adding dependencies, checking current docs, changing migrations, or working on the preview-deployment pipeline |
| [E2E Testing Guidelines](.claude/skills/e2e-testing-guidelines/SKILL.md) | Writing, running, reviewing, or maintaining Playwright tests, snapshots, route coverage, or browser assertions |
| [GitHub Operations](.claude/skills/github-operations/SKILL.md) | Reading from or writing to GitHub — issues, pull requests, comments, labels, reviews, or branches — through a proxied single-operator identity: agent-comment markers, issue-vs-PR targets, untrusted content |
| [Maintainable Code Guidelines](.claude/skills/maintainable-code-guidelines/SKILL.md) | Reviewing readability, naming, abstraction boundaries, complexity, dead code, or scope discipline |
| [Markdown Processing Guidelines](.claude/skills/markdown-processing-guidelines/SKILL.md) | Writing, reviewing, or modifying markdown rendering, Remark/Rehype plugins, Shiki setup, custom nodes, or web embeds |
| [Observability Guidelines](.claude/skills/observability-guidelines/SKILL.md) | Throwing, catching, reporting, or logging errors with Sentry or Pino |
| [Payload CMS MCP](.claude/skills/payload-cms-mcp/SKILL.md) | Inspecting or mutating existing Payload CMS content through MCP, including blog posts, media, tags, locales, drafts, and metadata; use this for existing blog post edits even when MCP is not mentioned |
| [Performance and Reliability Requirements](.claude/skills/performance-and-reliability-requirements/SKILL.md) | Reviewing Payload query cost, RSC/client boundaries, caching, image optimization, bundle weight, or runtime failure behavior |
| [Product Requirement Guidelines](.claude/skills/product-requirement-guidelines/SKILL.md) | Writing, refining, or reviewing a product requirement, feature spec, or issue description; framing scope/non-goals, testable acceptance criteria, or a spec's UI-design or architecture sections |
| [Project Structure](.claude/skills/project-structure/SKILL.md) | Navigating the repository, locating files, placing new modules, checking stack/service context, import aliases, or directory conventions |
| [Quality Assurance Guidelines](.claude/skills/quality-assurance-guidelines/SKILL.md) | Reviewing verification evidence, e2e coverage, snapshots, flakiness, lint/format evidence, or manual checks |
| [React Component Guidelines](.claude/skills/react-component-guidelines/SKILL.md) | Writing, reviewing, or refactoring React components, Server/Client component boundaries, styling, CSS conventions, or `data-testid` contracts |
| [Routing Guidelines](.claude/skills/routing-guidelines/SKILL.md) | Creating, moving, renaming, or reviewing App Router routes, route handlers, route groups, dynamic params, or search params |
| [Unit Test Guidelines](.claude/skills/unit-test-guidelines/SKILL.md) | Writing, refactoring, reviewing, or running Jest unit tests, including `@jest/globals` imports, mocks/fakes, fixtures, schema tests, and behavior-focused assertions |
| [UI Design Principles](.claude/skills/ui-design-principles/SKILL.md) | Designing, implementing, or reviewing user-facing surfaces, responsive behavior, visual tone, copy, accessibility, loading states, or theme behavior |

## Response Approach

Use this workflow for single-agent work in this repository. The agent owns planning, implementation, investigation, verification, review, and reporting directly.

### Overall Strategy

Non-trivial work should move through the same decision sequence even when some steps are brief.

1. Classify the request and load the relevant project guidance.
2. Define success criteria, constraints, affected surface, dependencies, and verification expectations.
3. Inspect the smallest useful code and documentation context.
4. Draft an ordered local workflow with acceptance criteria.
5. Implement, investigate, or review within the narrowest scope that satisfies the request.
6. Self-review the result as a separate phase.
7. Run or report the relevant verification.
8. Update or propose skill guidance when the work exposes reusable project learning.
9. Summarize outcome, verification status, trade-offs, and open follow-ups.

**Guidelines:**

- MUST consult [Development Guidelines](.claude/skills/development-guidelines/SKILL.md) at the start of every task.
- MUST classify non-trivial work as UI-bearing, implementation-only, review-only, skill-maintenance, exploratory, or mixed workflow before editing files.
- MUST consult every skill whose routing condition matches the changed surface or requested review lens.
- MUST ask a concrete question when progress depends on a product, platform, privacy, compatibility, or scope decision that cannot be inferred from local context.
- SHOULD compress the sequence for small answer-only requests without skipping relevant safety checks.

### Planning and Execution

Planning exists to make the work checkable. It should name what changes, what must stay unchanged, and how the result will be verified.

**Guidelines:**

- MUST restate success criteria, constraints, affected surface, and verification expectations before non-trivial edits.
- MUST preserve public behavior during refactors unless the requested change intentionally modifies it.
- MUST keep edits scoped to the smallest surface that satisfies the acceptance criteria.
- SHOULD inspect independent discovery targets in parallel when their outputs do not depend on each other.
- SHOULD revise the plan when new evidence changes affected files, risks, or acceptance criteria.

### UI-Bearing Work

User-facing changes need design intent before implementation mechanics. The single agent owns both, but the phases must stay distinct.

**Guidelines:**

- MUST establish design intent before implementing UI-bearing changes: hierarchy, interaction states, accessibility intent, responsive behavior, and copy constraints.
- MUST consult [UI Design Principles](.claude/skills/ui-design-principles/SKILL.md) for design decisions and [React Component Guidelines](.claude/skills/react-component-guidelines/SKILL.md) for implementation mechanics.
- MUST express design intent in user-facing terms before translating it into components, CSS, or tests.
- MUST verify that text, layout, focus behavior, loading states, and responsive behavior remain coherent across relevant viewports.
- SHOULD keep design-system rules in design vocabulary and link to implementation-mechanics skills instead of duplicating CSS wiring rules.

### Review Independence Gates

A single agent cannot provide true independent review. This repository compensates with a mandatory separate review phase for ordinary work and external review gates for high-risk work.

**Guidelines:**

- MUST perform a reviewer-mode reset after non-trivial implementation: stop editing, reread the request, inspect `git status` and `git diff`, and review only the produced diff.
- MUST apply [Code Review Guideline](.claude/skills/code-review-guideline/SKILL.md) during self-review, including severity labels, file-line evidence, concrete fixes, and an explicit verdict when findings exist.
- MUST load topic-specific review lenses when relevant: maintainability, quality assurance, security, performance/reliability, UI design, routing, markdown, observability, or e2e testing.
- MUST judge the actual diff and observed behavior, not the implementation intent.
- MUST fix Critical or Major self-review findings before claiming completion.
- MUST perform a second-pass re-review after fixing any blocking self-review finding.
- MUST report verification evidence before completion: commands run, manual checks, failures, skipped checks, and residual risk.
- MUST escalate high-risk changes to user review, CI/PR review, or an explicitly requested secondary review before calling them merge-ready.
- SHOULD route that escalation through the project's independent-review channel — the posted-review policy in [REVIEW.md](./REVIEW.md).
- SHOULD treat auth, access control, markdown/XSS, SSRF/embed fetching, migrations, public route contracts, production config, data-loss risk, and large refactors as high-risk.

### Verification

Verification should match the changed surface. Documentation-only changes need link and format checks; route, UI, Payload, markdown, and runtime changes need stronger evidence.

**Guidelines:**

- MUST run the relevant verification commands after non-trivial changes, or report why they could not run.
- MUST run `npm run format` and `npm run lint` after code or documentation edits.
- MUST run `npm run test:unit` when a change affects code the unit suite covers.
- MUST run `npm run test:e2e` when a change affects a UI output surface or e2e coverage.
- MUST run `npm run build` when a change affects Next.js routes, metadata, Payload config, runtime config, dependencies, or TypeScript signatures.
- SHOULD perform focused manual checks when browser behavior, crawler metadata, custom protocol behavior, responsive layout, or CMS preview behavior changes.
- MUST report unverified acceptance criteria and residual risk in the final summary.

### Skill Maintenance

Skill maintenance keeps reusable workflow learning close to the project rules. It should happen when a change reveals durable guidance, not after every narrow fix.

**Guidelines:**

- MUST consult [Agent Skills Best Practices](.claude/skills/agent-skills-best-practices/SKILL.md) when adding, renaming, moving, deleting, splitting, or cross-linking skills, changing reference files, or updating this index.
- MUST keep this skill index synchronized when skills are added, renamed, moved, or removed.
- MUST make one skill the source of truth for a rule instead of copying detailed guidance across multiple skills.
- SHOULD propose or implement skill updates when the workflow exposes a reusable convention, outdated guidance, recurring review issue, or missing project rule.
- SHOULD skip skill maintenance when the workflow produced no generalizable learning, and state that it was skipped.

### Communication

User-facing communication should expose decisions, blockers, verification, and outcomes without narrating every local inspection step.

**Guidelines:**

- MUST keep progress updates concise and focused on decisions, blockers, and outcomes.
- MUST summarize changed files, verification status, trade-offs, unresolved risks, and deferred follow-ups at completion.
- MUST state whether skill maintenance was performed, skipped, or blocked when skill guidance governed the work.
- SHOULD include detailed plans, command logs, or iteration logs only when the user asks for auditability or when the outcome depends on them.
- MUST ask a concrete question when progress depends on a product, platform, privacy, or scope decision.
