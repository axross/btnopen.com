# Bundle and Dependency Weight

Apply these rules to verify Client Component additions do not balloon the JS shipped to the browser.

## Server-Only Imports in Client Files

The bundler follows every import edge regardless of how little of a module is used, so one wrong import in a `"use client"` file drags a server-sized payload into what every visitor downloads.

**Guidelines:**

- MUST flag a Critical when a `"use client"` file imports any of these (each pulls in tens to hundreds of KB or breaks the build):
  - `payload`, `@payloadcms/*`
  - `unified`, `remark-*`, `rehype-*`, `mdast-*`, `@shikijs/*`, `shiki`
  - `metascraper`, `metascraper-*`
  - `pino`, `pino-pretty`
  - `@sentry/nextjs`'s server-only entries (e.g., `captureRequestError`)
  - `node:*` modules
  - `server-only` (the literal package; importing it in a client file is a build error by design)
- MUST flag a Critical when a `"use client"` file imports from `@/repositories/*` or `@/payload/*` — these tiers contain server-only code per [maintainable-code-guidelines › abstraction-boundaries](../../maintainable-code-guidelines/references/abstraction-boundaries.md).

## Heavy Client Dependencies

Server-side code costs the server once per request; client-side code costs every visitor's download, parse, and execution time — so where a library runs matters as much as what it does.

**Guidelines:**

- MUST flag a Major when a `"use client"` file imports a heavyweight library whose work could happen server-side, or that has a smaller equivalent. Examples observed in this project:
  - `date-fns` is OK but flag if the diff uses ≥ 5 separate `date-fns` modules and the work could happen server-side in a Server Component.
  - `mixpanel-browser` is necessarily client-side (analytics) — do not flag.
  - `clsx` is tiny; do not flag.
- MUST flag a Major when a new dependency added to `package.json` has an installed size > 200 KB and is imported into a `"use client"` file. Cross-reference with [application-security-requirements › supply-chain](../../application-security-requirements/references/supply-chain.md).

## Re-Exports and Barrel Files

A barrel import hands the bundler the whole index, and everything the re-exports touch rides along unless tree-shaking can prove it unused — which it often cannot.

**Guidelines:**

- MUST flag a Critical when a new barrel file (`index.ts` that re-exports everything) is created and imported from a `"use client"` file. Per [development-guidelines › code-quality](../../development-guidelines/references/code-quality.md), the project rule is to import directly from the source module.
- MUST flag a Major when a new client component imports from a file that itself re-exports server-only modules. The transitive pull will fail the build at best and bloat the client bundle at worst.

## `serverExternalPackages`

`next.config.ts` lists `["re2", "pino", "pino-pretty"]` as packages that Next does NOT bundle for the server runtime (they remain `require`-loaded from `node_modules`). This list should stay minimal.

**Guidelines:**

- MUST flag a Critical when a new package is added to `serverExternalPackages` without a stated reason. The legitimate reasons are:
  - Native binary (e.g., `re2`)
  - Stream-based or pino-style logger (`pino`, `pino-pretty`)
  - Module that uses `node:` builtins incompatible with the bundler
- MUST flag a Critical when a package legitimately requiring `serverExternalPackages` is also imported from a `"use client"` file. The directive does not protect the client bundle.

## Dynamic Import Patterns

Lazy loading moves a component's cost from every visitor's initial load to the moment the component is actually needed.

**Guidelines:**

- SHOULD flag a Minor recommendation to `next/dynamic` (with `ssr: false` when appropriate) when a new Client Component is large, only used on a single route, and not above the fold.
- MUST flag a Critical when `next/dynamic({ ssr: false })` is used for a component that the reviewer would expect to be server-rendered (e.g., an SEO-critical above-the-fold element). `ssr: false` removes it from the initial HTML.

## Tree-Shaking

Tree-shaking works by proving exports unused, and default or namespace imports of CommonJS-shaped modules make that proof impossible.

**Guidelines:**

- MUST flag a Major when a `"use client"` file uses a default import (`import _ from "lodash"`) instead of named imports for a library that supports tree-shaking. Default imports often defeat tree-shaking for CommonJS-shaped libraries.
- SHOULD flag a Minor when a new icon library or UI library is imported wholesale (`import * as Icons from "…"`). Import only the icons used.
