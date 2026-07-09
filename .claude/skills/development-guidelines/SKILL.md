---
name: development-guidelines
description: Apply this skill at the start of EVERY task in this project. Covers the Biome format/lint loop, scoped change management, current-docs lookup triggers, npm run-scripts, TypeScript type-safety discipline, source-comment and doc-comment conventions, verification requirements, Payload migration handling, Playwright e2e expectations, Conventional Commits, pull request descriptions, and the per-PR Turso-branch preview-deployment pipeline. Use even when the user does not mention formatting, linting, testing, type casts, comments, doc-comments, dependencies, migrations, docs, commands, commit wording, pull request bodies, branch/preview deploys, or Turso database branching.
---

# Development Guidelines

Apply these rules at the start of every task, regardless of the nature of the work.

## Code Quality

See [code-quality.md](./references/code-quality.md) for:

- The Biome format/lint workflow
- TypeScript compliance requirements
- Type-safety discipline (unchecked casts and non-null assertions)
- Doc-comment and line-comment conventions in source files
- Import hygiene

## Change Management

See [change-management.md](./references/change-management.md) for:

- Staying within the scope of the task
- Making incremental, verifiable changes
- Following existing patterns before introducing new ones
- Adding npm dependencies and modifying the Payload CMS data layer

## Verification

See [verification.md](./references/verification.md) for:

- Which output surfaces are put at risk by a given change
- Manual and automated verification steps
- How to maintain test coverage and respond to failures
- CI pipeline behavior

## Preview Deployments

See [preview-deployments.md](./references/preview-deployments.md) for:

- the per-PR Turso-branch preview-deployment pipeline (`preview-deploy.yaml`) and how it isolates production
- the one-time Turso/GitHub/Vercel setup, including scoping production credentials to the Production environment
- first-run verification, orphan cleanup, cost, and the media-isolation limitation

## Current External Documentation

See [current-docs.md](./references/current-docs.md) for:

- Next.js App Router, metadata, caching, route handlers, and config behavior
- Payload CMS collections, fields, access control, admin behavior, and migrations
- Sentry Next.js initialization, instrumentation, source maps, and event capture
- Vercel runtime/deployment behavior, Playwright, and Biome behavior when those surfaces change

## Dev Commands

See [dev-commands.md](./references/dev-commands.md) for:

- Development, build, and production-start commands
- Jest unit test command, Playwright e2e command, and snapshot update flow
- Payload migration commands
- Biome format and lint commands

## Commit Messages

See [commit-messages.md](./references/commit-messages.md) for:

- Overall `<type>[scope][!]: <description>` header format
- Required types (`feat`, `fix`) and allowed additional types (`build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`, `revert`)
- Scope, description, body, and footer conventions
- Breaking-change markers (`!` and `BREAKING CHANGE:` footer) and their SemVer correlation
- Pull request titles (the same header format applies to PR titles, not just commits)

## Pull Request Descriptions

See [pull-request-descriptions.md](./references/pull-request-descriptions.md) for:

- What a pull request body contains, and why the "why" leads
- Using the repository's pull request template (`.github/pull_request_template.md`), including bodies authored programmatically
- Issue linking, verification evidence, risk disclosure, and reviewer guidance
- Keeping the description current across review rounds

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
