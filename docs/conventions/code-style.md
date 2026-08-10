# Code Style

Read this when writing comments or imports in TypeScript and JavaScript source.
The general discipline — comment intent over mechanics, doc-comment coverage —
belongs to the installed software-development capability. What follows is the
house voice, which nothing outside this repository could infer.

## Comment Voice

This project distinguishes **doc-comments** (JSDoc, documenting an API) from
**line comments** (explaining a specific spot), and the house voice governs
**line comments only**: `//` and `/* */` comments, and each visually-line-starting
sentence inside a multi-line one, begin with a lowercase letter. Existing source
files are the authority — read the neighbourhood before writing.

JSDoc is deliberately **out of scope**. The software-development capability owns
doc-comments, and what it prescribes for them is a *standard* (JSDoc/TSDoc) and
its coverage, never a voice — so casing there follows its "read the surrounding
source files and match their voice" instruction rather than a rule stated here.

No lint rule enforces the voice: Biome ships no comment-casing rule, so it is
checked in review rather than by the gate.

```typescript
// delete this page before fetching the next, so a large store stays bounded
await del(blobs.map((blob) => blob.url));
```

**Rules:**

- MUST start `//` and `/* */` comments lowercase in `.ts` / `.tsx` / `.js`
  source, including each visually-line-starting sentence of a multi-line comment.
- MUST keep natural casing for proper nouns (`Chromium`, `React`, `Next.js`),
  code identifiers (`Promise.all`, `<Table>`), acronyms (`API`, `JSON`, `GFM`),
  and deliberate all-caps emphasis.
- MUST keep a `biome-ignore` directive in the tool's required casing, with its
  trailing human-readable reason starting lowercase —
  `// biome-ignore lint/suspicious/noExplicitAny: external library type is untyped`.
- MUST NOT lowercase a JSDoc block to satisfy this voice; the rule does not reach
  it.
- MUST NOT apply this voice outside TS/JS source comments: CSS `/* */` comments,
  Markdown prose, and commit messages follow their own conventions.

## Imports

A barrel drags its whole re-exported surface into every consumer, which costs
bundle weight on the client and obscures what a module actually depends on.

**Rules:**

- MUST NOT use a barrel re-export file (an `index.ts` re-exporting everything) as
  an import source when a direct module path is available; import from the module
  file itself.
- MUST NOT create a barrel file that a `"use client"` module then imports — it
  pulls the whole re-exported surface into the client bundle.
