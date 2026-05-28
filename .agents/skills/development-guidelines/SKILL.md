---
name: development-guidelines
description: Apply this skill at the start of EVERY task in this project. Covers the Biome format/lint loop, scoped change management, current-docs lookup triggers, npm run-scripts, verification requirements, Payload migration handling, Playwright e2e expectations, and Conventional Commits. Use even when the user does not mention formatting, linting, testing, dependencies, migrations, docs, commands, or commit wording.
---

# Development Guidelines

Apply these rules at the start of every task, regardless of the nature of the work.

## Code Quality

See [code-quality.md](./code-quality.md) for non-negotiable code quality rules:

- Biome formatting and linting workflow
- TypeScript compliance requirements
- Comment casing in TS/JS source files
- Import hygiene

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Change Management

See [change-management.md](./change-management.md) for how to manage changes safely:

- Staying within the scope of the task
- Making incremental, verifiable changes
- Following existing patterns before introducing new ones
- Adding npm dependencies and modifying the database schema

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Verification

See [verification.md](./verification.md) for how to confirm the application produces correct output:

- Which output surfaces are put at risk by a given change
- Manual and automated verification steps
- How to maintain test coverage and respond to failures
- CI pipeline behavior

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Current External Documentation

See [current-docs.md](./current-docs.md) for when implementation must be checked against current official docs:

- Next.js App Router, metadata, caching, route handlers, and config behavior
- Payload CMS collections, fields, access control, admin behavior, and migrations
- Sentry Next.js initialization, instrumentation, source maps, and event capture
- Vercel runtime/deployment behavior, Playwright, and Biome behavior when those surfaces change

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Dev Commands

See [dev-commands.md](./dev-commands.md) for the project's npm run-scripts:

- Development, build, and production-start commands
- Playwright e2e command and snapshot update flow
- Payload migration commands
- Biome format and lint commands

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Commit Messages

See [commit-messages.md](./commit-messages.md) for the Conventional Commits v1.0.0 rules used in this repo:

- Overall `<type>[scope][!]: <description>` header format
- Required types (`feat`, `fix`) and allowed additional types (`build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`, `revert`)
- Scope, description, body, and footer conventions
- Breaking-change markers (`!` and `BREAKING CHANGE:` footer) and their SemVer correlation

**Guidelines:**

- SHOULD read the linked reference when work touches this topic.

## Topic-Specific Guidelines

Consult the appropriate skill for detailed guidance on each area:

| Topic | Skill |
|---|---|
| Project stack, repository layout, and file placement | [Project Structure](../project-structure/SKILL.md) |
| Routing, URL structure, route directory/file conventions | [Routing Guidelines](../routing-guidelines/SKILL.md) |
| React component conventions, client-vs-server split, styling, testability | [React Component Guidelines](../react-component-guidelines/SKILL.md) |
| Visual design tone, CSS property usage, UI copy/wording, accessibility | [UI Design Principles](../ui-design-principles/SKILL.md) |
| Error handling, Sentry reporting, and Pino logging | [Observability Guidelines](../observability-guidelines/SKILL.md) |
| Markdown parsing, plugins, and rendering pipeline | [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md) |
| End-to-end test structure, conventions, and commands | [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md) |

**Guidelines:**

- MUST consult the matching topic skill when implementation touches that area.
- SHOULD load only the references relevant to the changed files or requested behavior.
- MUST defer detailed project rules to the owning topic skill instead of restating them here.
