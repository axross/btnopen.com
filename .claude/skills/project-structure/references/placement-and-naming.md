# Placement and Naming

Apply this reference when deciding where a new file goes and what to call it. The general placement discipline — put shared logic at the lowest tier with more than one caller, match a file's name to its neighborhood — belongs to the code maintainability capability. This reference names the tiers, the paths, and the conventions it defers to.

## Directory Tier

The project has three tiers, plus a separate realm for the Payload data layer and a realm-neutral tier the two share. Resolve the tier from the caller count, not from where a file is convenient to drop.

| Tier | Path | When to use |
| --- | --- | --- |
| Route-local | `app/(app)/<route>/_components/`, `app/(app)/<route>/_/` | Used only by `page.tsx` / `layout.tsx` / sibling files of one route |
| Route-group-shared | `app/(app)/_/components/`, `app/(app)/_/helpers/`, `app/(app)/_/repositories/` | Used by two or more routes inside `(app)/` |
| Payload realm | `payload/collections/`, `payload/globals/`, `payload/helpers/` | Runs inside the Payload CMS realm only |
| Realm-neutral | `shared/` | Imported by **both** `app/` and `payload/` — the only way the Payload realm reaches shared logic without importing `app/` |

**Guidelines:**

- MUST pull a file placed in `app/(app)/_/` down into a route's `_/` or `_components/` when only that one route consumes it.
- MUST promote a file from a route-local `_components/` to `app/(app)/_/components/` once a second route imports it.
- MUST place CMS schema, hook, access-control, and admin customization code under `payload/`, never under `app/(app)/_/`.
- MUST promote a module to `shared/` once the Payload realm needs it, rather than importing it from `app/` or copying it; a module used by only one realm belongs to that realm, so `shared/` stays small enough to read.
- MUST keep `shared/` free of React, Next.js, and Payload imports. `payload/config.ts` is loaded by the Payload CLI outside Next's bundler, so a framework import here breaks `npm run migrate:*` rather than failing at build time.
- MUST NOT add files under `app/(payload)/` — Payload owns that route segment.
- MUST NOT place a helper or component at the repository root or directly inside `app/` (outside an `_/` or `_components/` directory); Next.js would treat the directory as a route segment.
- MUST place static public assets under `public/`; route-generated metadata images belong under the route segment that owns them.
- MUST keep generated, dependency, build, cache, and local-data directories out of source-placement decisions unless the task explicitly concerns them.

## File Naming

A file that breaks the surrounding convention is harder to locate and makes readers and tooling second-guess what kind of module it is. Every component that renders styled DOM carries its stylesheet as a same-named sibling, so the pair is found and moved together.

**Guidelines:**

- MUST name `.ts` / `.tsx` / `.module.css` files in kebab-case — `blog-post-header.tsx`, not `BlogPostHeader.tsx` or `blog_post_header.tsx`.
- MUST pair a component that renders styled DOM with a same-named CSS-module sibling — `blog-post-header.tsx` with `blog-post-header.module.css`.
- SHOULD match a CSS module's base name to its component file; `blog-post-header.tsx` paired with `header.module.css` is the finding.

## Identifier Naming

A symbol named or cased unlike its neighbors makes the reader stop to check whether the difference carries meaning. These are the patterns this codebase has settled on.

**Guidelines:**

- MUST prefix repository functions with `get…` to match their siblings (`getBlogPost`, `getBlogPosts`, `getWebsite`); `fetchBlogPost` is the finding.
- MUST set a child logger's `module` emoji from the category table in [observability-conventions.md](./observability-conventions.md) — the emoji names a category of work, so modules doing the same kind of work share one deliberately, and a new emoji means a new category and a new row in that table.
- SHOULD carry the `Promise` suffix alias on an unresolved async prop at the receiving component, so a promise prop reads as one at its destination.
- SHOULD prefer full words over opaque abbreviations in new identifiers — `blogPost`, not `bp`; `user`, not `usr`.

## Values That Should Not Be Literals

A bare literal forces every later reader to reverse-engineer what it means, and scatters a value that should have one authoritative definition. Two kinds recur here — origins, which have a runtime source, and dimensional values, which have a design token.

**Guidelines:**

- MUST source an origin or absolute URL from `urlOrigin`, exported by `app/(app)/_/runtime.ts`, rather than hard-coding `"https://btnopen.com"` or `"http://localhost:3000"`.
- MUST pair a magic number or string with one of: a design token (`var(--spacing-4)`, per the project's visual-identity conventions), a named constant, or a `// biome-ignore lint/style/noMagicNumbers: <reason>` comment explaining the meaning.
- MAY use a regex for a tightly bounded match — `mediaSrcRegex` in `app/(app)/_/helpers/media-src.ts` is the established example — rather than forcing `String.prototype.split` or `URL.parse` where they read worse.
