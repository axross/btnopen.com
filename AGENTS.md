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
- Writing and editing blog post *content* — and the CMS operations that apply it through the Payload MCP server — is driven by a separate agent-skills library; this repository owns the CMS content model (see [README](README.md)) and the MCP server itself, not the authoring or CMS-editing workflow.
- For the tech stack, repository layout, and every "how does this project do it" convention, consult the [Project Structure](.claude/skills/project-structure/SKILL.md) skill.
- For commands, deployment pipelines, and environment setup, consult the [README](README.md) — it is this project's contributor documentation and the source of truth for how to operate it.

## Skills

Agent guidance here comes from two places, and the difference matters when you go to change one.

**Installed skills** are copied from the shared [axross/skills](https://github.com/axross/skills) library into `.claude/skills/` and pinned by [`skills-lock.json`](skills-lock.json). They are **generated artifacts**.

- MUST NOT hand-edit an installed skill or any of its reference files; the next install discards the edit.
- MUST take a change to an installed skill upstream, as an issue or pull request against the library, rather than patching the copy here.
- MUST regenerate the copies with the install command in the [README](README.md) and commit them together with `skills-lock.json`.

**Project skills** are this repository's own, and hold only what the library cannot know about it. There are three; everything else was replaced by its library counterpart.

| Project skill | Owns |
| ------------- | ---- |
| [Project Structure](.claude/skills/project-structure/SKILL.md) | Stack, directory tree and tier model, path aliases, support files, placement and naming, architecture boundaries, routing conventions, component anatomy, Payload access/queries/caching, environment and security surfaces, observability wiring, source-comment voice, testing conventions |
| [Visual Identity](.claude/skills/visual-identity/SKILL.md) | The site's design language — palette, shape, motion, imagery, responsive tiers, theming, Japanese-primary copy, loading and 404 aesthetics — and the CSS conventions that encode it |
| [Markdown Processing Guidelines](.claude/skills/markdown-processing-guidelines/SKILL.md) | The Remark/Rehype/Shiki pipeline, custom directives, Lexical rich-text blocks, component mapping, and the content-safety rules for CMS-authored markdown |

### Always-On Skills

Installing a skill makes it *discoverable*, not binding. These three govern how work happens here, and apply whether or not a request mentions them.

- MUST apply **`professional-behavior`** in every session — resolving each uncertainty at its right source, researching current sources over memory, asking rather than assuming, and labelling what is verified, inferred, or assumed.
- MUST apply **`software-development`** at the start of every task that touches this project — the format/lint loop, scoped change management, and consulting the README for how to run anything.
- MUST use **`loop-engineering`** as the default change loop for any code or document change delivered end-to-end: plan → human approval → code → verify → independent review → address. It runs model-invoked, so describing the work is enough.

### Routing to the Rest

Consult the skill whose trigger matches the surface being changed. Discovery resolves these by `description` / `when_to_use`, so a name here is a pointer, not a path.

| Working on | Consult |
| ---------- | ------- |
| Reviewing a diff, pull request, or your own change before calling it done | `code-review`, plus `quality-assurance` for whether the verification is adequate |
| A spec, plan document, or issue description | `product-requirement-document-authoring` |
| A commit message or pull request title | `conventional-commits` |
| Any GitHub read or write | `github-operation` |
| Naming, complexity, abstraction boundaries, dead code | `code-maintainability` |
| Secrets, untrusted input, injection, SSRF, access control, dependencies | `application-security` |
| Logging, error handling, error reporting, analytics events | `software-instrumentation` |
| Jest unit tests | `unit-testing` |
| Playwright end-to-end tests | `end-to-end-testing` |
| App Router mechanics — rendering, caching, route handlers, metadata, the server/client boundary | `next-app-development` |
| A React component's composition, props, or state | `react-component-development` |
| A CSS Module, token, or theme | `react-component-styling` |
| Visual design with real color, type, and states | `high-fidelity-ui-design` |
| Low-fidelity layout exploration | `wireframe-design` |
| Creating or auditing a skill | `agent-skill-authoring`; for installing and refreshing them, `agent-skill-management` |

**Guidelines:**

- MUST consult every skill whose routing condition matches the changed surface, not only the first one that matches.
- MUST pair a general capability with the project skill holding this repository's half of the same topic — the general one states the practice, the project one states the convention.
- MUST keep this index synchronized when a skill is installed, removed, or added, and when the library's inventory changes.

## Working Agreement

`loop-engineering` owns the delivery loop, `software-development` owns change discipline, `code-review` owns review method, and `professional-behavior` owns conduct. This section records only what is specific to this repository.

**Guidelines:**

- MUST ask a concrete question when progress depends on a product, platform, privacy, compatibility, or scope decision that local context cannot settle.
- MUST establish design intent before implementing a user-facing change — hierarchy, interaction states, accessibility intent, responsive behavior, copy — and express it in user-facing terms before translating it into components and CSS.
- MUST run the verification the changed surface requires, using the commands in the [README](README.md), and report what ran, what was skipped, and the residual risk.
- MUST treat auth, access control, markdown/XSS, SSRF and embed fetching, migrations, public route contracts, production config, data-loss risk, and large refactors as high-risk, and route them to the independent review in [REVIEW.md](REVIEW.md) rather than self-certifying.
- MUST NOT push to the default branch; work on a `claude/`-prefixed branch and leave merging to the maintainer, @axross.
- SHOULD propose a skill update when work exposes a durable convention this repository owns, and say so when skill maintenance was deliberately skipped.
