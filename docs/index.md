# Documentation

This is the documentation root for btnopen.com. It holds three bodies, kept apart
by directory, and the one you want depends on the question you have:

- **What does the product do?** → `overview.md`, `glossary.md`, and `specs/`.
  These describe the site in the present tense — what it is, what its words mean,
  and how it behaves today.
- **How is the code written?** → `conventions/`. The rules a change follows, and
  the shapes this repository has settled on.
- **How is the repository built and run?** → `operations/`. The pipelines, the
  setup, and the procedures.

`decisions/` sits beside all three: it records why a constraint exists, for the
constraints whose reasoning cannot be recovered from the code.

The [README](../README.md) covers what this project is, how to start it, and the
commands it has. [`CLAUDE.md`](../CLAUDE.md) is the working agreement for agent
sessions.

Documents under `conventions/` and `operations/` use the keywords MUST, MUST NOT,
SHOULD, SHOULD NOT, and MAY as described in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## The Product

- [overview.md](./overview.md) — what btnopen.com is, who it serves, where its
  boundary sits, and how the repository behind it is built and run.
- [glossary.md](./glossary.md) — the vocabulary, in two halves: the product's
  words and the repository's.

### Specifications

- [specs/blog-posts.md](./specs/blog-posts.md) — the primary content type: its
  fields, localization, slugs, and the draft-to-published lifecycle.
- [specs/markdown-rendering.md](./specs/markdown-rendering.md) — what a post body
  renders into, and the content-safety guarantees around CMS-authored content.
- [specs/comments.md](./specs/comments.md) — reader comments: availability,
  submission, moderation, and what is stored about a commenter.
- [specs/reader-surfaces.md](./specs/reader-surfaces.md) — the routes, the
  responsive tiers, and the loading, not-found, and empty states.
- [specs/visual-identity.md](./specs/visual-identity.md) — the brand: colour,
  type, shape, motion, imagery, copy voice, and the accessibility commitments.
- [specs/content-authoring.md](./specs/content-authoring.md) — the admin, the
  agentic view, the authoring artifacts, and the MCP server's content model.

## Conventions

- [conventions/repository-map.md](./conventions/repository-map.md) — the
  directory tree, the placement tiers, path aliases, naming, support files, and
  the enforced complexity budget.
- [conventions/routing.md](./conventions/routing.md) — route-path shape, route
  groups, and where each route file goes.
- [conventions/code-style.md](./conventions/code-style.md) — the comment voice and
  the import rules.
- [conventions/react-components.md](./conventions/react-components.md) — component
  anatomy, the server/client split, the loaded/loading triad, and the seams a
  component must not cross.
- [conventions/styling.md](./conventions/styling.md) — the design tokens, the
  breakpoints, and the four templates a surface copies verbatim.
- [conventions/payload.md](./conventions/payload.md) — collection access, drafts,
  query bounds, caching and invalidation, and migrations.
- [conventions/security.md](./conventions/security.md) — the environment barrels,
  SSRF, CSRF, input validation, and the CI supply chain.
- [conventions/observability.md](./conventions/observability.md) — the logger and
  its module emoji, log levels, Sentry wiring, and what the services capture.
- [conventions/testing.md](./conventions/testing.md) — the runners, the layout,
  scenario coverage, manual verification, and test ids.
- [conventions/markdown-pipeline.md](./conventions/markdown-pipeline.md) — the
  unified chain, its ordering, and the server-only execution model.
- [conventions/markdown-extensions.md](./conventions/markdown-extensions.md) —
  adding a directive, a rich-text block, a GFM construct, or a language.

## Operations

- [operations/production-deployment.md](./operations/production-deployment.md) —
  the production pipeline, its credential sourcing, and its fail-loud guards.
- [operations/preview-deployment.md](./operations/preview-deployment.md) — the
  per-pull-request preview pipeline, its one-time setup, and its isolation rules.
- [operations/development-workflow.md](./operations/development-workflow.md) — how
  a unit of work gets delivered here.
- [operations/agent-skills.md](./operations/agent-skills.md) — installing and
  refreshing the agent skills, and the register of deviations and gaps.
- [operations/claude-code.md](./operations/claude-code.md) — session hooks, local
  quality hooks, and telemetry configuration.
- [operations/payload-mcp.md](./operations/payload-mcp.md) — connecting an
  MCP-capable agent to the CMS.

## Decisions

- [decisions/](./decisions/) — the log of constraints whose rationale cannot be
  recovered from the code. Each record is named for the decision it holds and
  dated the day it was made; a decision is replaced by a new record rather than
  by editing the old one.
