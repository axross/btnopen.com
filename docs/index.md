# Documentation

Everything btnopen.com knows about itself. Which body answers your question:

- **What does the product do?** → `specs/` — how the site behaves today, for a
  reader and for its author.
- **How is the code written?** → `conventions/` — the rules and shapes a change
  has to satisfy.
- **How is the repository built and run?** → `operations/` — the pipelines, the
  setup, and the procedures.

`decisions/` sits beside all three and holds why a constraint exists, for the
constraints whose reasoning cannot be recovered from the code. The vocabulary all
four bodies use is in [glossary.md](./glossary.md), split into the product's words
and the repository's.

Documents under `conventions/` and `operations/` use MUST, MUST NOT, SHOULD,
SHOULD NOT, and MAY as
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html) describes. Documents under
`specs/` describe rather than instruct, and use none of them.

The [README](../README.md) covers what this project is, how to start it, and the
commands it has — it is the source of truth for the commands.
[`CLAUDE.md`](../CLAUDE.md) is the working agreement for agent sessions.

## Specifications

- [specs/blog-posts.md](./specs/blog-posts.md) — the site's only content type: its
  fields, localization, slugs, and the draft-to-published lifecycle.
- [specs/markdown-rendering.md](./specs/markdown-rendering.md) — what a post body
  renders into, and the content-safety guarantees around CMS-authored content.
- [specs/comments.md](./specs/comments.md) — reader comments: availability,
  submission, moderation, and what is stored about a commenter.
- [specs/reader-surfaces.md](./specs/reader-surfaces.md) — the routes, the
  responsive tiers, and the loading, not-found, empty, and error states.
- [specs/content-authoring.md](./specs/content-authoring.md) — the admin, the
  agentic view, the authoring artifacts, and the MCP server's content model.

## Conventions

- [conventions/directory-structure.md](./conventions/directory-structure.md) — the
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
- [conventions/visual-identity.md](./conventions/visual-identity.md) — the brand a
  surface has to carry: colour, type, shape, motion, imagery, copy voice, and the
  accessibility commitments.
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
- [operations/dependency-advisories.md](./operations/dependency-advisories.md) —
  the `npm audit` ledger: the current counts, the reachability judgement behind
  anything still open, and why no audit step gates CI.
- [operations/agent-skills.md](./operations/agent-skills.md) — installing and
  refreshing the agent skills, and the register of deviations and gaps.
- [operations/claude-code.md](./operations/claude-code.md) — session hooks, local
  quality hooks, and telemetry configuration.
- [operations/payload-mcp.md](./operations/payload-mcp.md) — connecting an
  MCP-capable agent to the CMS.

## Decisions

- [decisions/](./decisions/) — why a constraint exists, and what was traded away.
  Each record is named for the decision it holds and dated the day it was made; a
  decision is replaced by a new record rather than by editing the old one.
