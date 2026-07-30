---
name: software-development
description: The ability to make a well-formed, verified change in a project — the baseline discipline every project-touching task runs on. Covers the format/lint loop, scoped and incremental change management, mapping a change to the surfaces it puts at risk, consulting the project's own contributor documentation for how to operate it and closing gaps in that documentation, refreshing vendor docs for fast-moving dependencies, source-comment and doc-comment conventions, and pull request descriptions.
when_to_use: Apply at the start of EVERY task that touches a project — implementing, refactoring, running a project command, or writing a pull request body — even when the request never mentions formatting, linting, comments, doc-comments, dependencies, docs, commands, or pull request descriptions. Also apply when you need to know how to run one of the project's operations (tests, dev server, build, lint, deploy) and must find it documented or ask. Not for a session that touches nothing — a quick question, an explanation, or a review-only pass, where the conduct baseline applies instead.
user-invocable: false
---

# Software Development

This skill equips you to make a change the way a project expects: formatted and linted, kept to the smallest scope that satisfies the task, verified against the surfaces it puts at risk, operated through the commands the project documents, grounded in current vendor docs where a dependency moves fast, and landed as a well-described pull request. Reach for it on every task that touches the project — it is the baseline the other, more specific skills build on.

Load only the reference sections a given task touches; each one below routes to the detail.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## Code Quality

See [code-quality.md](./references/code-quality.md) for:

- running the format → lint → fix → re-lint loop after any change
- language compliance and import hygiene
- doc-comment and line-comment conventions in source files

## Change Management

See [change-management.md](./references/change-management.md) for:

- staying within the scope of the task
- making incremental, independently verifiable changes
- following existing patterns before introducing new ones
- weighing whether to add a dependency

## Project Documentation

See [project-docs.md](./references/project-docs.md) for:

- consulting the project's own contributor documentation before running a project-specific operation
- asking the human rather than inferring a command when that documentation is silent
- recording the answer, with approval, so the next task finds it documented

## Verification

See [verification.md](./references/verification.md) for:

- mapping changed files to the output surfaces they put at risk before choosing a verification path
- the manual verification steps that confirm a change before it is called done, and why a passing gate is not one of them

## Current External Documentation

See [current-docs.md](./references/current-docs.md) for:

- when to consult current official docs for a fast-moving framework, service, or tool the project depends on
- treating official docs as the primary source and reporting what was consulted

## Commit Messages

The commit-message header format — its allowed types, scope and description conventions, breaking-change markers, SemVer correlation, and runnable header validator — is owned by the project's Conventional Commits practices, which govern pull request titles under the same contract. Consult that capability whenever you author a commit message or title a pull request; this skill deliberately does not restate the format.

## Pull Request Descriptions

See [pull-request-descriptions.md](./references/pull-request-descriptions.md) for:

- what a pull request body contains, and why the "why" leads
- reproducing the repository's pull request template in an API-authored body
- issue linking, verification evidence, risk disclosure, and reviewer guidance
- keeping the description current across review rounds

## Topic-Specific Skills

A project may define its own topic skills — covering repository structure, a component or routing convention, or any authoring-domain rules. Consult those skills when a change touches the area they own, if they have been defined.

**Guidelines:**

- MUST consult the matching topic skill when a change touches the area that skill owns.
- SHOULD load only the references relevant to the changed files or requested behavior.
- MUST defer detailed project rules to the owning topic skill instead of restating them here.
