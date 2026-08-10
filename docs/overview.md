# Overview

What btnopen.com is, who it serves, where its boundary sits — and how the
repository behind it is built and run.

## The Product

btnopen.com is one person's blog. It presents the author's portrait, bio, and
social links on a single landing page, and serves blog posts — the primary content
type — each with tags, a cover image, and a rich Markdown body carrying
syntax-highlighted code and embedded previews of linked pages. Readers who are
signed in with GitHub can leave comments, which the author approves before they
appear.

The audience is developers. That shows in the product rather than only in the
subject matter: the identity is developer-flavoured, error headings are shaped
like JavaScript expressions, and technical numerics are set in monospace rather
than hidden. Content is authored primarily in **Japanese**, with English as a
fallback for readers in other locales.

The site is also, deliberately, an **agent-writable** product. Its CMS exposes a
Model Context Protocol server, and a post carries authoring artifacts — an outline
and authoring notes — durable enough that a fresh agent session can resume writing
it from CMS state alone.

### Where the boundary sits

It is a personal blog, and several things follow from that:

- **One author.** There is no multi-author workflow, no editorial roles, and no
  per-author archive.
- **One content type.** Blog posts, with tags and comments attached. There is no
  page builder, no newsletter, no series or category hierarchy.
- **No reader accounts.** A reader signs in with GitHub only to comment; there is
  nothing to log into otherwise, and no profile, preference, or subscription
  attached to that identity.
- **No search, no pagination.** The landing page lists the posts.
- **The authoring workflow lives elsewhere.** How a post gets written — the
  editorial craft, the voice, the end-to-end drafting loop — belongs to a separate
  agent-skills library. This repository owns the content model that library reads
  and writes.

### The domains

| Domain | Covers |
| --- | --- |
| [specs/blog-posts.md](./specs/blog-posts.md) | What a post carries, its localization, and how it moves from draft to published |
| [specs/markdown-rendering.md](./specs/markdown-rendering.md) | What a post body renders into, and the content-safety guarantees around it |
| [specs/comments.md](./specs/comments.md) | Signing in, submitting, moderation, and what is stored about a commenter |
| [specs/reader-surfaces.md](./specs/reader-surfaces.md) | The routes, the responsive tiers, and the loading, not-found, and empty states |
| [specs/visual-identity.md](./specs/visual-identity.md) | The brand — colour, type, shape, motion, imagery, copy, and the accessibility commitments |
| [specs/content-authoring.md](./specs/content-authoring.md) | The admin, the agentic view, the authoring artifacts, and the MCP server |

## The Repository

A single Next.js application on the App Router, with **Payload CMS running
in-process** rather than as a separate service. TypeScript throughout, Biome for
formatting and linting, Jest for unit tests and Playwright for end-to-end tests,
deployed on Vercel and backed by Turso (SQLite) with media in Vercel Blob. Clerk
brokers GitHub OAuth for commenters, Sentry and Pino carry errors and logs, and
Mixpanel carries analytics. The [README](../README.md) holds the command table and
how to start it.

**Two realms, one process.** `app/` owns the UI and `payload/` owns the CMS
configuration, and neither imports the other: the app reaches CMS data only
through repository functions calling Payload's local API, and the few modules both
need live in a realm-neutral tier they each import. That seam is what keeps the
Payload CLI able to load its config outside Next's bundler.
[conventions/repository-map.md](./conventions/repository-map.md) is the map, and
[conventions/react-components.md](./conventions/react-components.md) states which
imports may cross which way.

**Two deploy pipelines, both building on CI.** A push to the default branch runs
lint and the end-to-end suite, then migrates the production database *before*
building and promoting the new code, so production never serves code whose schema
outruns its database. Every pull request gets its own preview at a stable URL,
backed by a fresh database seeded from fixtures and a media namespace of its own,
both destroyed when the pull request closes — so a preview holds no production
data. Both build on the GitHub Actions runner and let Vercel publish only the
result. See [operations/production-deployment.md](./operations/production-deployment.md)
and [operations/preview-deployment.md](./operations/preview-deployment.md).

**Agent-assisted development.** Work runs through a plan → approve → code →
verify → independent review loop, on `claude/`-prefixed branches, with merging
left to the maintainer. The capabilities that drive it are installed from a shared
library and pinned by a lockfile; this repository owns no skill of its own. See
[operations/development-workflow.md](./operations/development-workflow.md) and
[operations/agent-skills.md](./operations/agent-skills.md).

### How to build here

| Question | Document |
| --- | --- |
| Where does this file go, and what is it called? | [conventions/repository-map.md](./conventions/repository-map.md) |
| How is a route laid out? | [conventions/routing.md](./conventions/routing.md) |
| How do I write this comment or import? | [conventions/code-style.md](./conventions/code-style.md) |
| How is a component built, and which side of the server/client seam? | [conventions/react-components.md](./conventions/react-components.md) |
| Which token, breakpoint, or template does this style use? | [conventions/styling.md](./conventions/styling.md) |
| How do I gate a collection, bound a query, or invalidate a cache? | [conventions/payload.md](./conventions/payload.md) |
| Where does this environment value, fetch, or input get validated? | [conventions/security.md](./conventions/security.md) |
| Which logger, level, and what may not reach telemetry? | [conventions/observability.md](./conventions/observability.md) |
| How is this tested, and what is a test id called? | [conventions/testing.md](./conventions/testing.md) |
| How does the markdown pipeline fit together? | [conventions/markdown-pipeline.md](./conventions/markdown-pipeline.md) |
| How do I add a directive, block, or language? | [conventions/markdown-extensions.md](./conventions/markdown-extensions.md) |

### How to run it

| Question | Document |
| --- | --- |
| How does a change reach production? | [operations/production-deployment.md](./operations/production-deployment.md) |
| How does a pull request get a preview? | [operations/preview-deployment.md](./operations/preview-deployment.md) |
| How does a change get delivered here? | [operations/development-workflow.md](./operations/development-workflow.md) |
| How are the agent skills installed and refreshed? | [operations/agent-skills.md](./operations/agent-skills.md) |
| How do I set up a Claude Code session? | [operations/claude-code.md](./operations/claude-code.md) |
| How do I connect an agent to the CMS? | [operations/payload-mcp.md](./operations/payload-mcp.md) |

## Why Things Are the Way They Are

The [decision log](./decisions/) holds the choices that constrain future work and
whose reasoning is not recoverable from the code — why destructive schema changes
are split across two releases, why previews are seeded rather than branched from
production, why the build runs on CI rather than on Vercel, and why this
repository keeps its conventions in documents rather than in skills.
