---
name: development-guidelines
description: Apply this skill at the start of EVERY task in this project, regardless of the topic. Covers the non-negotiable code quality loop (Biome format → lint → fix → re-lint → test), change-management rules (stay in scope, follow existing patterns, safely add npm deps, handle Payload CMS migrations), verification requirements (which output surfaces a change puts at risk, manual dev-server checks, running the Playwright e2e suite, responding to flaky/failing tests), and the Conventional Commits v1.0.0 commit-message format used across the repo. Use this even when the user does not explicitly mention formatting, linting, testing, dependencies, migrations, or commit wording — any code change in this repo is expected to pass through this workflow.
user-invocable: false
---

# Development Guidelines

Apply these rules at the start of every task, regardless of the nature of the work.

## Code Quality

See [code-quality.md](./code-quality.md) for non-negotiable code quality rules:

- Biome formatting and linting workflow
- TypeScript compliance requirements
- Comment casing in TS/JS source files
- Import hygiene

## Change Management

See [change-management.md](./change-management.md) for how to manage changes safely:

- Staying within the scope of the task
- Making incremental, verifiable changes
- Following existing patterns before introducing new ones
- Adding npm dependencies and modifying the database schema

## Verification

See [verification.md](./verification.md) for how to confirm the application produces correct output:

- Which output surfaces are put at risk by a given change
- Manual and automated verification steps
- How to maintain test coverage and respond to failures
- CI pipeline behavior

## Commit Messages

See [commit-messages.md](./commit-messages.md) for the Conventional Commits v1.0.0 rules used in this repo:

- Overall `<type>[scope][!]: <description>` header format
- Required types (`feat`, `fix`) and allowed additional types (`build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`, `revert`)
- Scope, description, body, and footer conventions
- Breaking-change markers (`!` and `BREAKING CHANGE:` footer) and their SemVer correlation

## Topic-Specific Guidelines

Consult the appropriate skill for detailed guidance on each area:

| Topic | Skill |
|---|---|
| Routing, URL structure, route directory/file conventions | [Routing Guidelines](../routing-guidelines/SKILL.md) |
| React component conventions, client-vs-server split, styling, testability | [React Component Guidelines](../react-component-guidelines/SKILL.md) |
| Visual design tone, CSS property usage, UI copy/wording, accessibility | [UI Design Principles](../ui-design-principles/SKILL.md) |
| Error handling, Sentry reporting, and Pino logging | [Observability Guidelines](../observability-guidelines/SKILL.md) |
| Markdown parsing, plugins, and rendering pipeline | [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md) |
| End-to-end test structure, conventions, and commands | [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md) |
