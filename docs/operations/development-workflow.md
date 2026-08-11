# Development Workflow

How a change gets from an idea to a merged pull request here.

Development in this repository is agent-assisted via
[Claude Code](https://claude.com/claude-code). The working agreement lives in
[`CLAUDE.md`](../../CLAUDE.md). It states how every session runs and defers the
detail to the skills under [`.claude/skills/`](../../.claude/skills/), which
agents find through their own frontmatter, and to the documents under `docs/`.
Another assistant reading this repository should treat `CLAUDE.md` as its working
agreement, the way the tool-agnostic [AGENTS.md](https://agents.md) convention
would otherwise signal.

Human and agent contributors follow the same loop — plan → implement →
self-review → verify → report — and changes made without an agent meet the same
bar: branch, implement, run the checks the [README](../../README.md) lists, open a
pull request, and get it reviewed before merge.

## Delivering a Unit of Work End-to-End

The change loop is the installed `loop-engineering` capability. It runs
model-invoked — there is no slash command — so describing the work is enough: a
GitHub issue, a pull request, or a free-form request drives from intake to a
merge-ready pull request in one continuing session.

1. **Plan** — reads the issue and its thread, asks the product and scope
   questions the spec leaves open, and rewrites the issue body into a reviewable
   plan with acceptance criteria. It then **pauses for approval**: nothing is
   built until you review the plan and say to continue.
2. **Code + verify** — implements on an agent-namespaced `claude/` branch, runs
   the checks the changed surface requires, and self-reviews the diff.
3. **Independent review** — opens a draft pull request and requests the CI
   reviewer, a separate bot session, so the code's author never certifies its own
   work.
4. **Address** — fixes review findings and CI failures, tying each resolved
   thread to the resolving commit, for up to eight rounds.
5. **Ready** — flips the pull request to ready once CI is green and the review is
   clean. Merging always stays a human decision.

The run pauses whenever it genuinely needs a human — an ambiguous requirement,
the plan approval, a judgment call on conflicting changes — and telling the
session to continue picks it back up where it stopped.

The policy a posted review applies is [`REVIEW.md`](../../REVIEW.md).

## Branches and Merging

A session MUST NOT push to the default branch. Work on a `claude/`-prefixed
branch and leave merging to the maintainer, @axross.

Every agent-authored GitHub comment MUST begin with the fixed marker line
`<!-- agent -->`, reused identically across every run and session, so a later run
can tell its own output from human input.

## Blog Post Authoring

Writing and editing blog post content — driving a post from an idea or outline to
a reviewed draft, and refining existing posts — is handled by a separate
agent-skills library that connects to this site through the Payload MCP server
and operates on drafts you review before publishing. This repository is the source
of truth for the content model those skills read and write — see
[../specs/content-authoring.md](../specs/content-authoring.md) — and keeps the
code-facing conventions here.
