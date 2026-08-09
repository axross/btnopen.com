# Version and Tooling

Apply this reference when checking whether a rule still holds, upgrading a major version, arriving in a codebase from an older major, or reaching for the framework's own diagnostic tooling.

## Read the Docs at the Project's Version

This framework changes fast enough that recalled knowledge goes stale between releases, and the documentation site defaults to the newest version — which is not necessarily the one the project runs. The rules in this skill are written against **16.2.x**; a project on a different line needs its own line's documentation.

**Guidelines:**

- MUST check the installed version in `package.json` before applying a version-specific rule, rather than assuming the latest.
- MUST consult the current documentation before asserting an API's signature, default, or stability, rather than relying on recall.
- MUST state the version a claim was verified against when a change turns on version-specific behaviour.
- SHOULD prefer the API reference page for a specific function over a guide, since the reference carries the version-history table.

## Upgrading

```bash
npx @next/codemod@canary upgrade latest
```

The v16 codemod, catalogued in the [upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16), migrates the Turbopack config location, replaces `next lint` with the ESLint CLI, renames `middleware` to `proxy`, strips `unstable_` prefixes from stabilized APIs, and removes the `experimental_ppr` segment config. A targeted codemod exists for the proxy rename alone (`middleware-to-proxy`).

**Guidelines:**

- SHOULD run the codemod first and review its diff, rather than migrating by hand.
- MUST run an upgrade as its own change with its own review; it touches config, conventions, and behaviour at once.
- MUST re-run the full verification suite against a production build after an upgrade, since most of what changed does not appear in development.
- MUST NOT mix an upgrade with a feature change in one pull request.

## Arriving from 15

A checklist for a codebase that has just crossed the major boundary. Each item is a silent behaviour change — nothing errors to tell you it applies.

| Area            | What changed                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Request APIs    | Sync access to `cookies`, `headers`, `draftMode`, `params`, `searchParams` removed                        |
| Image/sitemap   | `params` and `id` in image generation and `sitemap` are now promises                                      |
| Proxy           | `middleware` deprecated → `proxy`; Node.js runtime; `skipProxyUrlNormalize`                               |
| Caching         | `revalidateTag` requires a profile argument; `updateTag` and `refresh` added                              |
| Cache flags     | `experimental.ppr`, `experimental_ppr`, `dynamicIO`, `useCache` → `cacheComponents`                       |
| Bundler         | Turbopack default; a custom webpack config fails the build                                                |
| Parallel routes | Every slot now requires `default.js` or the build fails                                                   |
| Images          | `minimumCacheTTL` 4h; `qualities` `[75]`; no `16` in `imageSizes`; local IP blocked; `maximumRedirects` 3 |
| Config          | `serverRuntimeConfig`/`publicRuntimeConfig` removed; `next lint` removed; AMP removed                     |
| Turbopack cfg   | `experimental.turbopack` → top-level `turbopack`                                                          |
| Compiler        | `experimental.reactCompiler` → top-level `reactCompiler` (stable, off by default)                         |
| Build output    | `size` and `First Load JS` columns removed                                                                |
| Scroll          | Smooth-scroll override needs `data-scroll-behavior="smooth"` on `<html>`                                  |
| Removed         | `unstable_rootParams`; `next/legacy/image` deprecated; `images.domains` deprecated                        |
| Dev output      | `next dev` writes to `.next/dev`; dev and build can run concurrently                                      |

**Guidelines:**

- MUST walk this checklist item by item on arrival rather than waiting for a failure to surface each one.
- MUST re-verify image behaviour explicitly; every image default that changed does so silently.
- SHOULD treat enabling `cacheComponents` as a separate migration after the version upgrade lands, not as part of it.

## Required Versions

| Requirement | Minimum on v16                              |
| ----------- | ------------------------------------------- |
| Node.js     | 20.9.0 (Node 18 unsupported)                |
| TypeScript  | 5.1.0                                       |
| React       | 19.2 (the App Router tracks a React canary) |
| Browsers    | Chrome/Edge/Firefox 111+, Safari 16.4+      |

**Guidelines:**

- MUST align `package.json`'s `engines.node`, the CI Node version, and the runtime image with the framework's minimum.
- MUST check the browser baseline against the project's own support matrix; the framework's floor may be higher than what the project promises.
- SHOULD upgrade `@types/react` and `@types/react-dom` alongside React, since a stale type package produces errors that look like application bugs.

## The DevTools MCP and the In-App Endpoint

The framework ships an MCP server (`next-devtools-mcp`) that an agent can query about the running application — the upgrade path, cache-component migration, and route-level diagnostics. A running dev server also exposes an in-app endpoint at `/_next/mcp` answering questions about the current build.

**Guidelines:**

- SHOULD query the DevTools MCP for upgrade and migration work rather than reconstructing the steps by hand.
- SHOULD use the in-app endpoint to inspect the running application's own routes and build state, since it reports what this build did rather than what the docs describe.
- MUST verify a claim the tooling makes against the documentation before writing it into a durable rule; tool output is evidence, not a citation.
- MUST NOT expose the MCP endpoint from a production deployment; it is development tooling.

## Diagnosing a Slow Build

Build time is usually concentrated in a few routes rather than spread evenly, and the usual culprit is prerendering more pages than intended. Measure which routes before changing anything.

**Guidelines:**

- SHOULD use `--debug-build-paths` to find which routes a build spent its time on, before optimizing anything.
- SHOULD suspect an unbounded `generateStaticParams` first when build time grows with the data set.
- SHOULD enable the Turbopack filesystem dev cache when cold restarts dominate local iteration, accepting that it is beta.
- MUST NOT infer bundle-size regressions from build output; those metrics were removed — see the bundling reference.

**Review checks:**

- A version-specific claim asserted with no check against the installed version — **Major**; half of v16's changes invert a v15 rule.
- An upgrade bundled into a feature change — **Major**; neither can be reviewed properly.
- A deprecated or removed API introduced in new code (`middleware`, `next/legacy/image`, `images.domains`, `getConfig`, single-argument `revalidateTag`) — **Critical** where it fails the build, **Major** where it merely warns.
- An MCP endpoint reachable from a production deployment — **Major**.
