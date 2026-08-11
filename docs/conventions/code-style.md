# Code Style

How a comment reads in TypeScript and JavaScript source here, and what an import
is allowed to point at.

The general discipline — comment intent over mechanics, doc-comment coverage —
belongs to the installed software-development capability. What follows is the
house voice, which nothing outside this repository could infer.

## Comment Voice

This project distinguishes **doc-comments** (JSDoc, documenting an API) from
**line comments** (explaining a specific spot), and the house voice governs
**line comments only**: in `.ts` / `.tsx` / `.js` source, `//` and `/* */`
comments MUST begin with a lowercase letter, including each visually-line-starting
sentence inside a multi-line one. Existing source files are the authority, and
the neighbourhood MUST be read before writing.

Natural casing MUST be kept for proper nouns (`Chromium`, `React`, `Next.js`),
code identifiers (`Promise.all`, `<Table>`), acronyms (`API`, `JSON`, `GFM`), and
deliberate all-caps emphasis — the voice governs how a sentence opens, not how a
name is spelled. A `biome-ignore` directive MUST keep the tool's required casing,
with its trailing human-readable reason starting lowercase —
`// biome-ignore lint/suspicious/noExplicitAny: external library type is untyped`.

JSDoc is deliberately **out of scope**, and a JSDoc block MUST NOT be lowercased
to satisfy this voice; the rule does not reach it. The software-development
capability owns doc-comments, and what it prescribes for them is a *standard*
(JSDoc/TSDoc) and its coverage, never a voice — so casing there follows its "read
the surrounding source files and match their voice" instruction rather than a rule
stated here.

This voice MUST NOT be applied outside TS/JS source comments either: CSS `/* */`
comments, Markdown prose, and commit messages follow their own conventions.

No lint rule enforces the voice: Biome ships no comment-casing rule, so it is
checked in review rather than by the gate.

```typescript
// delete this page before fetching the next, so a large store stays bounded
await del(blobs.map((blob) => blob.url));
```

## Imports

A barrel drags its whole re-exported surface into every consumer, which costs
bundle weight on the client and obscures what a module actually depends on. A
barrel re-export file (an `index.ts` re-exporting everything) MUST NOT be used as
an import source when a direct module path is available; import from the module
file itself. A barrel file that a `"use client"` module then imports MUST NOT be
created at all — it pulls the whole re-exported surface into the client bundle.
