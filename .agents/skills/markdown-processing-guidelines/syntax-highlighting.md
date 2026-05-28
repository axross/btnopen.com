# Syntax Highlighting

Syntax Highlighting sets the required project default: use the singleton Shiki highlighter from `app/(app)/_/helpers/shiki.ts`.

**Guidelines:**

- MUST use the singleton Shiki highlighter from `app/(app)/_/helpers/shiki.ts`.
- MUST use the `css-variables` theme with prefix `--snippet-` — MUST NOT use a hardcoded color theme.
- MUST add only the `@shikijs/langs/<language>` import to the `langs` array in `getSingletonHighlighter` when adding support for a new language.
- MUST NOT import the full Shiki language bundle.
- MUST NOT create a new highlighter instance per render call.
