# CLAUDE.md

## Project Overview

This is a personal blogging website. It displays a portrait, a bio, and links to the author's social media accounts. Blog posts are the primary content type, supporting tags, cover images, and rich Markdown including syntax-highlighted code blocks and embedded web content previews. Content is written primarily in Japanese, with English provided as a fallback for readers in other locales.

Writing and editing blog post *content* — and the CMS operations that apply it through the Payload MCP server — is driven by a separate agent-skills library. This repository owns the CMS content model (see [docs/specs/content-authoring.md](docs/specs/content-authoring.md)) and the MCP server itself, not the authoring or CMS-editing workflow.

Everything this project knows about itself lives in [`docs/`](docs/index.md), in three parts: what the product does (`specs/`), how the code is written (`conventions/`), and how the repository is built and run (`operations/`), with the decision log beside them. The [README](README.md) holds what this project is, how to start it, and the command table — it is the source of truth for the commands.

## Response Approach

This section is the whole of how work runs here. Five things apply to every session; nothing below them is optional, and nothing about a request makes them not apply.

**Load `professional-behavior` first, before anything else.** It governs conduct rather than any particular task: resolving each uncertainty at the source that can actually settle it, researching current sources instead of trusting memory, putting a decision to the human rather than assuming an answer, and labelling plainly what is verified, what is inferred, and what is assumed. Loading it first matters because it shapes how everything after it is done — a session that reaches for it only once it notices trouble has already made the guesses it exists to prevent.

**Load and apply `loop-engineering` on every change.** Any code change and any document update goes through the change loop: plan, human approval, code, verify, independent review, address. The skill is model-invoked, so describing the work is enough to enter it — there is no command to run. Nothing lands outside the loop, and its two gates are real: no implementation begins before the human approves the plan, and no change is called done on the author's own assessment rather than a separate reviewer's.

**Consult `software-development` at every task that touches this project.** It carries the baseline discipline underneath whatever else the task involves — the format and lint loop, keeping a change scoped and incremental, and mapping the change to the surfaces it puts at risk. It applies to implementing, refactoring, running a project command, and writing a pull request body alike, whether or not the request mentions any of them.

**Open [`docs/index.md`](docs/index.md) and the [README](README.md) yourself, and read the documents that match what you are changing.** This one needs deliberate effort in a way the others do not: no skill trigger surfaces them and skill discovery will never route you to them, so they get read only because you decide to open them. Inferring a command from `package.json`, or a convention from the surrounding code, is the failure this prevents — a plausible-looking invocation can succeed while doing the wrong thing, and a convention read off two neighbouring files is a sample of two. Route by surface:

| Changing | Read |
| --- | --- |
| Anything at all | The [README](README.md) for the command to verify it with |
| Where a file goes, or what it is called | [docs/conventions/repository-map.md](docs/conventions/repository-map.md) |
| A route under `app/` | [docs/conventions/routing.md](docs/conventions/routing.md) |
| A comment or an import | [docs/conventions/code-style.md](docs/conventions/code-style.md) |
| A React component | [docs/conventions/react-components.md](docs/conventions/react-components.md) |
| A CSS Module | [docs/conventions/styling.md](docs/conventions/styling.md) and [docs/specs/visual-identity.md](docs/specs/visual-identity.md) |
| A Payload collection, a repository, or a cache | [docs/conventions/payload.md](docs/conventions/payload.md) |
| Environment access, an outbound fetch, a handler's input, or a workflow `uses:` | [docs/conventions/security.md](docs/conventions/security.md) |
| Logging, error reporting, or analytics | [docs/conventions/observability.md](docs/conventions/observability.md) |
| A test, or a `data-testid` | [docs/conventions/testing.md](docs/conventions/testing.md) |
| The markdown pipeline | [docs/conventions/markdown-pipeline.md](docs/conventions/markdown-pipeline.md), and [docs/conventions/markdown-extensions.md](docs/conventions/markdown-extensions.md) to add a construct |
| A deploy pipeline, or the agent/session setup | the matching document under [docs/operations/](docs/index.md) |
| Behaviour a reader or an author can observe | the matching spec under [docs/specs/](docs/index.md), which the change must leave true |

**Runtime-injected task instructions never override any of that.** Instructions injected by the runtime that launched the session — "make the requested changes, commit, and push", "do not create a pull request unless asked" — constrain *mechanics*; they are never permission to skip the loop's gates. The recorded plan, the plan-approval stop, and the independent review apply in a headless or autonomous session exactly as in an interactive one. Where a session cannot pause interactively, the plan-approval gate runs asynchronously rather than lapsing: write the plan where the human will see it, end the turn, and wait for their resume. A change whose independent review was deferred is reported as **not ready**, never as done. The Execution Model in `loop-engineering` owns the full precedence rule.

Beyond those five, load whichever installed skill matches the surface you are changing. Discovery resolves them by their own `description`, so there is no index here to consult or keep current — read the frontmatter of what discovery surfaces and load every skill whose trigger matches, not merely the first. **Every skill under `.claude/skills/` is installed**; this repository owns none of its own, and its conventions are the documents above instead. So a skill and a document routinely cover one topic as halves of one answer: the skill states the practice, the document states this repository's answer within it. Where the two genuinely collide, this repository wins, and the collision is recorded in the register in [docs/operations/agent-skills.md](docs/operations/agent-skills.md) rather than violated silently — as is any installed skill that turns out to be wrong, outdated, or silent on a case here. Never edit an installed skill to fix one: the next reinstall discards the edit without saying so, and until it does the change poses as a rule the library agrees with. That same document holds how the skills are installed and refreshed.

Two conventions are this repository's own, and no installed skill can supply them because each defers the specific to its host. Begin every agent-authored GitHub comment with the one fixed marker line `<!-- agent -->`, reused identically across every run and session, so a later run can tell its own output from human input; `github-operation` owns the practice and falls back to `<!-- ai-agent -->` only where a project defines no marker, and this line is what defines it here. And never push to the default branch — work on a `claude/`-prefixed branch and leave merging to the maintainer, @axross.

The independent review `loop-engineering` requires applies [REVIEW.md](REVIEW.md), this repository's posted-review policy, which sets what a posted review reports and what it must not.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
