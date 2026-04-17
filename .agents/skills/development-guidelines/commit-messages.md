# Commit Messages

Apply these rules whenever you author a Git commit or amend an existing one in this project. The project follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) — the normative rules below are summarized so no network fetch is required.

## Overall Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

- MUST prefix every commit with a `<type>`, followed by an OPTIONAL scope, an OPTIONAL `!` breaking-change marker, a REQUIRED colon, and a REQUIRED single space before the description.
- MUST keep the first line (the header: `type(scope)!: description`) a single line with no trailing period.
- MUST separate the header, body, and footers with exactly one blank line each when they are present.

## Type

- MUST use `feat` when the commit adds a user-facing feature — correlates to a SemVer **MINOR** bump.
- MUST use `fix` when the commit fixes a user-facing bug — correlates to a SemVer **PATCH** bump.
- MAY use any of these additional types for non-release-affecting changes:
  - `build` — build system or external dependencies (e.g., `package.json`, `next.config.ts`).
  - `chore` — housekeeping that does not fit another type (e.g., skill edits, config tweaks, repo metadata).
  - `ci` — CI/CD configuration (e.g., `.github/workflows/`, Vercel project settings).
  - `docs` — documentation only (`AGENTS.md`, `.agents/skills/**`, `README.md`).
  - `style` — formatting / whitespace only, no behavior change (Biome-driven, typically).
  - `refactor` — code change that neither fixes a bug nor adds a feature.
  - `perf` — performance improvement.
  - `test` — adding or correcting tests (`e2e/**`).
  - `revert` — reverts a prior commit; see the revert example below.
- MUST treat types as case-insensitive in parsing but SHOULD write them lowercase for consistency with the existing git log.

## Scope

- MAY include a scope in parentheses immediately after the type, e.g., `fix(markdown): ...`.
- MUST make the scope a noun identifying the affected section of the codebase — prefer names that match the existing layout: `routing`, `markdown`, `payload`, `e2e`, `observability`, `react`, `skills`, or a specific route like `(index)` / `posts`.
- SHOULD omit the scope when the change spans the whole project and no single section is primary.

## Description

- MUST place the description immediately after `: ` and keep it a short imperative summary of the change (e.g., "add Polish language", not "added" or "adds").
- SHOULD keep the full header (`type(scope)!: description`) under ~72 characters so `git log --oneline` stays readable.
- MUST NOT end the description with a period.

## Body

- MAY provide a body one blank line after the description to add context, rationale, or migration notes — use it whenever the "why" is not obvious from the diff.
- MAY consist of any number of newline-separated paragraphs. Body text is free-form.
- SHOULD wrap body lines at ~72 characters for terminal readability, except for URLs and code spans.

## Footers

- MAY place one or more footers one blank line after the body (or after the description, if the body is omitted).
- MUST write each footer as a word token, followed by either `: ` (colon + space) or ` #` (space + hash), followed by the value. Tokens MUST use `-` instead of whitespace, e.g., `Reviewed-by:`, `Acked-by:`, `Co-authored-by:`, `Refs: #123`, `Closes: #45`.
- `BREAKING CHANGE` is the only token allowed to contain a space. `BREAKING-CHANGE` (hyphenated) is synonymous and equally valid.
- Footer values MAY span spaces and newlines; a value terminates only when the next valid footer token is parsed.

## Breaking Changes

A breaking change MUST be indicated in at least one of two ways (both MAY be used together):

1. **`!` after the type/scope prefix**, e.g., `feat(api)!: drop support for Node 18`. When `!` is used, the `BREAKING CHANGE:` footer MAY be omitted and the description itself serves as the breaking-change note.
2. **`BREAKING CHANGE:` footer** (uppercase required), e.g.:
   ```
   BREAKING CHANGE: `extends` key in config file is now used for extending other config files
   ```

- Breaking changes MUST correlate to a SemVer **MAJOR** bump, regardless of whether the type is `feat`, `fix`, or anything else.
- `BREAKING CHANGE` MUST be uppercase; all other Conventional Commits tokens are case-insensitive for parsing but SHOULD be written lowercase.

## SemVer Correlation

| Commit shape | SemVer bump |
|---|---|
| `fix: ...` | PATCH |
| `feat: ...` | MINOR |
| Any type with `!` or a `BREAKING CHANGE:` footer | MAJOR |
| `chore`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `perf`, `revert` without `!` | No release bump |

## Examples

**Simple, no scope, no body:**
```
docs: correct spelling of CHANGELOG
```

**With scope:**
```
feat(lang): add Polish language
```

**Breaking change via `!`:**
```
feat!: send an email to the customer when a product is shipped
```

**Breaking change via `!` with scope:**
```
feat(api)!: drop support for Node 18
```

**Breaking change via footer (no `!`):**
```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

**With body and multiple footers:**
```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from the latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```

**Revert:**
```
revert: feat(lang): add Polish language

Refs: 676104e, a215868
```

## Tooling Notes

- The repository does not currently enforce commit messages with a commit hook or CI check, so authors (human or agent) MUST self-enforce this format.
- When amending or rewriting history, re-check that every rewritten commit still conforms — especially that breaking changes carry either `!` or the footer.
