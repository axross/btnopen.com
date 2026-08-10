# Version and Packages

Apply this reference when choosing an import path, checking whether a remembered or researched API is current, or judging whether an existing schema uses a superseded idiom.

Verified against `zod@4.4.3`, published 2026-05-04 — <https://zod.dev/>.

## Zod 4 Is the Baseline, and the Web Disagrees

This capability covers Zod 4 only. That boundary needs stating repeatedly because of an unusual hazard: Zod 3 was the dominant version for years, so tutorials, blog posts, forum answers, and model recall are all weighted toward it — and **most Zod 3 idioms still compile against Zod 4**, because the library deprecated rather than removed them. Code that runs is therefore no evidence that it is current.

The documentation sites are distinguishable and worth checking before trusting a page:

| Site         | Version                 |
| ------------ | ----------------------- |
| `zod.dev`    | Zod 4 — the current one |
| `v3.zod.dev` | Zod 3 — out of scope    |

A search result, an answer, or a recalled snippet that does not identify its version is a Zod 3 candidate until shown otherwise.

**Guidelines:**

- MUST establish which major a source describes before applying anything from it; an unversioned Zod claim is not usable evidence.
- MUST NOT treat "it compiles" or "it runs" as confirmation that an API is current, since the superseded surface is deprecated rather than removed.
- SHOULD prefer the official documentation for the installed version over any secondary source when the two disagree.

## The Export Map

The published package exposes several entry points, declared in its own `exports` map. Which one to import from depends on what is being written; the library-facing ones are documented at <https://zod.dev/library-authors>.

| Entry point      | Use it for                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `zod`            | Application code. The default, and correct almost everywhere.     |
| `zod/mini`       | A bundle-constrained client, at a real developer-experience cost. |
| `zod/locales`    | Loading a non-default locale for error messages.                  |
| `zod/v4/core`    | Library code that accepts a caller's schemas. A stable permalink. |
| `zod/v4`         | The versioned permalink for the current major's full surface.     |
| `zod/v4/mini`    | The versioned permalink for the tree-shakable surface.            |
| `zod/v4/locales` | The versioned permalink for the locale set.                       |

The `zod/v4/*` paths are permalinks: they are documented to keep resolving to this major across future package versions, which is precisely why library code targets them and application code does not need to.

Two entry points are deliberately unlisted here because they are out of scope: the Zod 3 surface, and the pre-4.0 mini alias. Neither belongs in new code.

**Guidelines:**

- MUST import from `zod` in application code unless a stated constraint — a bundle budget, a library's peer-dependency contract — requires another entry point.
- MUST import from `zod/v4/core` rather than `zod` in a library that accepts schemas from its callers (see [interop-and-library-code.md](./interop-and-library-code.md)).
- MUST NOT mix entry points within one module; a schema built from one surface and checked through another is a source of confusing type errors.
- SHOULD consult the installed package's own export map when an import path fails to resolve, rather than guessing a variant.

## Prerequisites the Library Assumes

Zod 4 documents two hard requirements, and both fail in ways that do not name Zod:

- **TypeScript 5.5 or later.** Below it, inference on the newer generic shapes degrades or errors in ways that read as a Zod bug.
- **`strict: true` in `tsconfig.json`.** Without it, inferred optionality and nullability are unsound, so a schema that correctly models an absent field produces a type that silently permits `undefined` everywhere.

`exactOptionalPropertyTypes` is separate, is not required, and does change inferred optional-property types where it is on — see [optionality-and-defaults.md](./optionality-and-defaults.md).

**Guidelines:**

- MUST confirm `strict` is enabled before trusting any inferred type from a schema; inference is unsound without it.
- MUST check the installed TypeScript version against the 5.5 floor when inference behaves inexplicably, before investigating the schema itself.
- SHOULD state the TypeScript and Zod versions when reporting a schema-typing problem, since both change the answer.

## Checking a Claim Against the Installed Version

Zod 4 moves within its own major. `z.xor`, `z.invertCodec`, the `.brand` direction parameter, `.safeExtend`, `z.property`, and several 4.4 behaviour corrections all arrived after 4.0 — so "Zod 4" is not by itself a version a rule can be pinned to. A minor-version floor is part of any claim about a newer API.

The check is cheap and worth making rather than skipping: read the version the project actually installed, then read that version's documentation, rather than the newest published one.

**Guidelines:**

- MUST verify a version-sensitive API against the version the project has installed, not against `latest`.
- MUST state a minor-version floor alongside any API introduced after 4.0, rather than attributing it to Zod 4 generally.
- MUST report the discrepancy rather than working around it silently when the installed version lacks an API a rule assumes.
- SHOULD prefer an API present since 4.0 when a newer one offers no material advantage, so the schema does not impose an upgrade.

## Superseded Idioms That Still Compile

The following are deprecated, not removed. Each is a signal that a file was written against Zod 3 or copied from a Zod 3 source, and each has a current replacement covered in the reference named.

Read this table in one direction only: **from a construct found in a Zod 4 codebase, to what should replace it.** It is a detection aid for stale code, not a migration guide — it says nothing about how a Zod 3 project upgrades, and a project still on Zod 3 is outside this capability's scope entirely.

| Found in the code                                  | Write instead                                       | Covered in                                                 |
| -------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `z.string().email()`, `.uuid()`, `.url()`, …       | `z.email()`, `z.uuid()`, `z.url()`, …               | [primitives-and-formats.md](./primitives-and-formats.md)   |
| `z.nativeEnum(…)`                                  | `z.enum(…)`                                         | [primitives-and-formats.md](./primitives-and-formats.md)   |
| `.strict()`, `.passthrough()`, `.strip()`          | `z.strictObject()`, `z.looseObject()`, `z.object()` | [objects-and-collections.md](./objects-and-collections.md) |
| `.merge(other)`                                    | `.extend(other.shape)`                              | [schema-modules.md](./schema-modules.md)                   |
| `{ message: … }`, `invalid_type_error`, `errorMap` | the unified `error` parameter                       | [errors.md](./errors.md)                                   |
| `ZodError.format()`, `.flatten()`, `z.formatError` | `z.treeifyError()`, `z.flattenError()`              | [errors.md](./errors.md)                                   |
| `z.promise(…)`                                     | awaiting before the parse                           | [parsing.md](./parsing.md)                                 |

Several Zod 3 APIs were removed outright rather than deprecated — `.deepPartial()`, `.ip()`, `.cidr()`, `z.ostring()`, the static `.create()` factories, `ctx.path` inside a refinement, and `z.function()`'s schema form. Those fail at compile time and need no detection rule.

**Guidelines:**

- MUST replace a superseded idiom when editing the schema that contains it, rather than matching the surrounding style.
- MUST NOT introduce a superseded idiom in new code on the grounds that neighbouring code uses it.
- SHOULD leave an untouched superseded idiom alone rather than widening a change's diff to sweep the file, unless the task is explicitly that sweep.
