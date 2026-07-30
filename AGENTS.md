# AGENTS.md

## Project Overview

This is a personal blogging website. It displays a portrait, a bio, and links to the author's social media accounts. Blog posts are the primary content type, supporting tags, cover images, and rich Markdown including syntax-highlighted code blocks and embedded web content previews. Content is written primarily in Japanese, with English provided as a fallback for readers in other locales.

Writing and editing blog post *content* — and the CMS operations that apply it through the Payload MCP server — is driven by a separate agent-skills library. This repository owns the CMS content model (see the [README](README.md)) and the MCP server itself, not the authoring or CMS-editing workflow.

For the tech stack, repository layout, and every "how does this project do it" convention, consult the [Project Structure](.claude/skills/project-structure/SKILL.md) skill. For commands, deployment pipelines, and environment setup, read the [README](README.md) — it is this project's contributor documentation and the source of truth for how to operate it.

## Response Approach

This section is the whole of how work runs here. Four things apply to every session; nothing below them is optional, and nothing about a request makes them not apply.

**Load `professional-behavior` first, before anything else.** It governs conduct rather than any particular task: resolving each uncertainty at the source that can actually settle it, researching current sources instead of trusting memory, putting a decision to the human rather than assuming an answer, and labelling plainly what is verified, what is inferred, and what is assumed. Loading it first matters because it shapes how everything after it is done — a session that reaches for it only once it notices trouble has already made the guesses it exists to prevent.

**Load and apply `loop-engineering` on every change.** Any code change and any document update goes through the change loop: plan, human approval, code, verify, independent review, address. The skill is model-invoked, so describing the work is enough to enter it — there is no command to run. Nothing lands outside the loop, and its two gates are real: no implementation begins before the human approves the plan, and no change is called done on the author's own assessment rather than a separate reviewer's.

**Consult `software-development` at every task that touches this project.** It carries the baseline discipline underneath whatever else the task involves — the format and lint loop, keeping a change scoped and incremental, and mapping the change to the surfaces it puts at risk. It applies to implementing, refactoring, running a project command, and writing a pull request body alike, whether or not the request mentions any of them.

**Read the [README](README.md) yourself before running a repository command or changing a dependency-governed surface.** It holds the commands and the development gotchas — what each script does and when to run it, both deploy pipelines, the environment setup. This one needs deliberate effort in a way the others do not: no skill trigger surfaces the README, and skill discovery will never route you to it, so it gets read only because you decide to open it. Inferring a command from `package.json` instead is the failure this prevents, because a plausible-looking invocation can succeed while doing the wrong thing.

Beyond those four, load whichever installed skill matches the surface you are changing. Discovery resolves them by their own `description` and `when_to_use`, so there is no index here to consult or keep current — read the frontmatter of what discovery surfaces and load every skill whose trigger matches, not merely the first. Where an installed skill and a project skill cover the same topic, they are halves of one answer: the installed one states the practice, and the project one states this repository's convention within it.

## Skills

Agent guidance here comes from two places, and the difference matters when you go to change one.

**Installed skills** are copied from the shared [axross/skills](https://github.com/axross/skills) library into `.claude/skills/` and pinned by [`skills-lock.json`](skills-lock.json). They are generated artifacts, so hand-editing one is pointless — the next install discards the edit silently. A change to an installed skill goes upstream instead, as an issue or pull request against the library. When the copies need regenerating, use the refresh command in the [README](README.md) and commit the regenerated directories together with `skills-lock.json`.

**Project skills** are this repository's own, holding only what the library cannot know about it. There are three: [Project Structure](.claude/skills/project-structure/SKILL.md), [Visual Identity](.claude/skills/visual-identity/SKILL.md), and [Markdown Processing Guidelines](.claude/skills/markdown-processing-guidelines/SKILL.md). Each states its own scope in its frontmatter; everything else this repository once maintained was replaced by its library counterpart.

## Working Agreement

`loop-engineering` owns the delivery loop, `software-development` owns change discipline, `code-review` owns review method, and `professional-behavior` owns conduct. What follows is only what is specific to this repository.

Ask a concrete question whenever progress depends on a product, platform, privacy, compatibility, or scope decision that local context cannot settle. Before implementing a user-facing change, establish its design intent — hierarchy, interaction states, accessibility intent, responsive behavior, copy — and express that intent in user-facing terms before translating it into components and CSS.

Run the verification the changed surface requires, using the commands in the [README](README.md), and report what ran, what was skipped, and the residual risk that leaves. Treat auth, access control, markdown and XSS, SSRF and embed fetching, migrations, public route contracts, production configuration, data-loss risk, and large refactors as high-risk: route them to the independent review in [REVIEW.md](REVIEW.md) rather than self-certifying them.

Begin every agent-authored GitHub comment with this project's one fixed marker line, `<!-- agent -->`, reused identically across every run and session, so a later run can tell its own output from human input. The installed `github-operation` skill owns the practice and defers the string to the host project, falling back to `<!-- ai-agent -->` only where none is defined; this line is what defines it here, and it is what every existing agent comment already carries.

Never push to the default branch. Work on a `claude/`-prefixed branch and leave merging to the maintainer, @axross. When work exposes a durable convention this repository owns, propose a skill update for it — and when skill maintenance was deliberately skipped, say so rather than leaving it unmentioned.
