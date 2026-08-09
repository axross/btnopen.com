# Bundling

Apply this reference when a client bundle grows unexpectedly, a server package breaks a build, a dynamic import is introduced, or a review needs to judge what a change ships to the browser.

## The Boundary Is Transitive

`"use client"` marks an **entry point**, not a single component. Every module that file imports — and everything those import — joins the client graph. One directive on a component that imports a utility that imports a date library ships the date library.

This is the mechanism behind almost every surprise in this reference.

**Guidelines:**

- MUST place `"use client"` at the interactive leaf, not at a page or layout that contains one.
- MUST trace what a newly-marked client file imports transitively before accepting the directive; the import list is the bundle.
- SHOULD split a mixed module — half browser logic, half shared helpers — so the client entry point pulls in only the browser half.

## Server Packages Reaching the Client

A server-only package imported into the client graph fails in one of two ways: a build error naming a Node built-in, or a silent inclusion that ships code and, worse, whatever constants it captured.

**Guidelines:**

- MUST fence server modules with `import "server-only"` so this fails at build time rather than at runtime or not at all.
- MUST NOT silence a `Module not found: Can't resolve 'fs'` error with a resolve-alias fallback; that hides the real problem, which is that client code is reaching a server module. Refactor the import instead.
- MAY use `turbopack.resolveAlias` to map a Node built-in to an empty module only as a last resort, and record why.
- MUST list packages that must stay outside the server bundle — native modules, packages that read from disk at runtime — in `serverExternalPackages`.
- SHOULD add a dependency shipping untranspiled modern syntax to `transpilePackages` rather than working around its parse errors.

## Barrels and Namespace Imports

A barrel file re-exporting a whole directory, and a namespace import (`import * as X`), both defeat tree-shaking: the bundler must retain the module's side-effectful surface because it cannot prove which exports are unused.

The cost is largest with icon and component libraries, where importing one symbol through a barrel can retain hundreds.

**Guidelines:**

- SHOULD import from the defining module rather than through a barrel, especially for large third-party packages.
- MUST NOT use `import * as` for a package you consume a few named exports from.
- SHOULD add heavily-barrelled dependencies to `optimizePackageImports`, which rewrites barrel imports to direct ones.
- SHOULD prefer fixing the import shape over relying on the optimization; the option is a mitigation, not a substitute.

## `next/dynamic`

`next/dynamic` code-splits a component so it loads on demand. Passing `ssr: false` additionally excludes it from the server render.

That second flag has a consequence people discover late: **the component's content is not in the initial HTML.** A crawler that does not execute JavaScript never sees it, and the content does not count toward the largest contentful paint.

**Guidelines:**

- SHOULD use `next/dynamic` for heavy components that are below the fold, behind an interaction, or conditionally rendered.
- MUST NOT set `ssr: false` on anything that carries indexable content or primary page copy.
- MUST reserve space with a `loading` fallback matching the eventual size, or the page shifts when the chunk arrives.
- MUST NOT use `next/dynamic` with `ssr: false` inside a Server Component; the option is meaningful only in a Client Component.
- SHOULD NOT dynamic-import a small component; the extra request costs more than the bytes saved.

## The React Compiler

[`reactCompiler`](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler) is stable in v16, promoted out of `experimental`, and off by default. When enabled it auto-memoizes components, which changes the calculus on hand-written memoization.

**Guidelines:**

- MUST check whether the compiler is enabled before adding `memo`, `useMemo`, or `useCallback`; under it, most hand-memoization is redundant.
- SHOULD NOT remove existing hand-memoization wholesale when enabling the compiler; do it as its own change, with measurement.
- SHOULD expect longer dev and build times when enabling it, since it runs through Babel.
- MUST NOT rely on the compiler to fix a re-render caused by an unstable context value or a component defined inside another component; it does not.

## Measuring What Shipped

v16 removed the `size` and `First Load JS` columns from `next build` output. They were inaccurate for server-driven architectures, and the two bundlers disagreed on how to attribute client payload.

**Guidelines:**

- MUST NOT cite the removed build-output metrics as evidence about bundle size; they no longer exist.
- SHOULD measure with a bundle analyzer for composition, and with Lighthouse or a field-data tool for what users actually download.
- SHOULD compare against a baseline build rather than an absolute threshold when judging whether a change regressed.

**Review checks:**

- A `"use client"` file importing a server-only package, a database client, or a secret-reading module — **Critical**; a trust boundary is crossed.
- `"use client"` added to a layout or page to satisfy one interactive child — **Major**; the subtree joins the client bundle.
- A resolve-alias fallback added to silence a Node-built-in resolution error — **Major**; it hides client code reaching server code.
- `ssr: false` on a component carrying indexable content — **Major**; it disappears from the HTML crawlers read.
- A `next/dynamic` import with no `loading` fallback on an above-the-fold component — **Minor**; the page shifts on arrival.
- A namespace import of a large package, or a new barrel over one — **Minor**; tree-shaking stops working.
- Hand-written memoization added in a project with the compiler enabled, with no measurement — **Minor**.
