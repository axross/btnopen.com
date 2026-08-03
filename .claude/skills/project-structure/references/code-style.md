# Code Style

Apply this reference when writing comments or imports in TypeScript and JavaScript source. The general discipline — comment intent over mechanics, doc-comment coverage — belongs to the software development capability. What follows is the house voice, which nothing outside this repository could infer.

## Comment Voice

This project distinguishes **doc-comments** (JSDoc, documenting an API) from **line comments** (explaining a specific spot). The line-comment voice is lowercase-first: `//`, `/* */`, JSDoc, and each visually-line-starting sentence inside a multi-line comment begin with a lowercase letter. Existing source files are the authority — read the neighbourhood before writing.

**Example:**

```typescript
// delete this page before fetching the next, so a large store stays bounded
await del(blobs.map((blob) => blob.url));
```

**Guidelines:**

- MUST start `//`, `/* */`, and JSDoc comments lowercase in `.ts` / `.tsx` / `.js` source, including each visually-line-starting sentence of a multi-line comment.
- MUST keep natural casing for proper nouns (`Chromium`, `React`, `Next.js`), code identifiers (`Promise.all`, `<Table>`), acronyms (`API`, `JSON`, `GFM`), and deliberate all-caps emphasis.
- MUST keep a `biome-ignore` directive in the tool's required casing, with its trailing human-readable reason starting lowercase — `// biome-ignore lint/suspicious/noExplicitAny: external library type is untyped`.
- MUST document the conditions under which a function throws, using the `@throws` tag.
- MUST NOT apply this voice outside TS/JS source comments: CSS `/* */` comments, Markdown prose, and commit messages follow their own conventions.

## Imports

A barrel drags its whole re-exported surface into every consumer, which costs bundle weight on the client and obscures what a module actually depends on.

**Guidelines:**

- MUST NOT use a barrel re-export file (an `index.ts` re-exporting everything) as an import source when a direct module path is available; import from the module file itself.
- MUST NOT create a barrel file that a `"use client"` module then imports — it pulls the whole re-exported surface into the client bundle.
