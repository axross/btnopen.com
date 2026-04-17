---
name: development-guidelines
description: Master development guidelines for all work on this project. Covers development workflow, code quality, change management, and application reliability. Read this before any topic-specific skill.
user-invocable: false
---

# Development Guidelines

Apply these rules at the start of every task, regardless of the nature of the work.

## Code Quality

See [code-quality.md](./code-quality.md) for non-negotiable code quality rules:

- Biome formatting and linting workflow
- TypeScript compliance requirements
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

## Topic-Specific Guidelines

Consult the appropriate skill for detailed guidance on each area:

| Topic | Skill |
|---|---|
| Routing and URL structure | [Routing Guidelines](../routing-guidelines/SKILL.md) |
| React component conventions, styling, testability | [React Component Guidelines](../react-component-guidelines/SKILL.md) |
| React composition and component API design | [React Composition Patterns](../vercel-composition-patterns/SKILL.md) |
| React and Next.js performance optimization | [React Best Practices](../vercel-react-best-practices/SKILL.md) |
| Next.js file conventions, RSC, data patterns, metadata | [Next.js Best Practices](../next-best-practices/SKILL.md) |
| Error handling, Sentry reporting, and logging | [Observability Guidelines](../observability-guidelines/SKILL.md) |
| Markdown parsing, plugins, and rendering pipeline | [Markdown Processing Guidelines](../markdown-processing-guidelines/SKILL.md) |
| End-to-end test structure, conventions, and commands | [E2E Testing Guidelines](../e2e-testing-guidelines/SKILL.md) |
| UI design review, accessibility, and UX compliance | [Web Design Guidelines](../web-design-guidelines/SKILL.md) |
