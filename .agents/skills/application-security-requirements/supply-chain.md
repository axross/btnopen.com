# Supply Chain

Apply these rules to verify new npm dependencies are justified, trustworthy, and do not bring along risky transitive code.

## Dependency Justification

- MUST flag a Major when the diff adds a new entry to `dependencies` or `devDependencies` in `package.json` without a justification per [development-guidelines › change-management](../development-guidelines/change-management.md). The author should have considered ≥ 2 alternatives and chosen the most popular / well-maintained / platform-agnostic option.
- MUST flag a Major when a new dependency duplicates functionality already available in:
  - A package already in `package.json` (e.g., adding `lodash` when `change-case` and native ES already cover the use)
  - A built-in Node API (e.g., `node:crypto`, `node:url`, `node:path`)
  - A built-in Web API (e.g., `URL`, `URLPattern`, `Headers`, `fetch`)
- SHOULD flag a Minor when the new dependency is a thin wrapper around a single function and the diff only uses one export — inline the logic.

## Lockfile

- MUST flag a Critical when the diff modifies `package.json` but `package-lock.json` is unchanged, or vice versa — they must move together.
- MUST flag a Major when a `package-lock.json` change introduces ≥ 50 new transitive packages for a single new direct dependency. That is a signal the dependency is heavyweight.

## Dependency Quality Signals

For each new direct dependency, the reviewer SHOULD verify (and request from the author if not stated in the PR description):

- Recent activity (commits within the last 12 months, ideally)
- Reasonable weekly download count (loosely: > 10k for a niche utility, > 100k for a general-purpose lib)
- Active issue tracker, no recent unaddressed CVEs
- TypeScript types either built-in or via `@types/*`
- Permissive license (MIT / ISC / Apache-2.0); flag a Critical on copyleft licenses (GPL, AGPL) since this is a closed-source personal site

## Postinstall and Lifecycle Scripts

- MUST flag a Critical when a new dependency declares a `postinstall`, `preinstall`, `prepare`, or `prepublish` script in its own `package.json` (visible in `package-lock.json`) that runs a shell command, downloads a binary, or runs `node` against an arbitrary file. The existing `sharp`, `@parcel/watcher`, `@biomejs/biome`, `re2` are known-good binary-installer dependencies — new ones in that category need explicit justification.

## Platform Specificity

- MUST flag a Major when a new dependency is platform-specific (e.g., a macOS-only native module) when a platform-agnostic alternative exists. The project deploys to Vercel (Linux) and develops on the maintainer's macOS — both must work.
- MUST flag a Major when a new dependency requires a runtime feature not present in Node 24 (the project's `devEngines.runtime` floor) or in Vercel's Edge Runtime (when the consuming module runs on the edge).

## Bundling Implications

- MUST flag a Major when the new dependency lacks tree-shaking support (no ESM, no `sideEffects: false`) and is imported into a Client Component or shared module that gets bundled into the client. Cross-reference with [performance-and-reliability-requirements › bundle-weight](../performance-and-reliability-requirements/bundle-weight.md).
- MUST flag a Critical when a new dependency is added to `serverExternalPackages` in `next.config.ts` without justification — the existing entries (`re2`, `pino`, `pino-pretty`) are there because they are native or stream-based and incompatible with Next's bundler.

## Transitive CVEs

- SHOULD recommend the author run `npm audit` and report findings before merge when the diff changes `package-lock.json`. Severities `high` and `critical` from `npm audit` MUST be resolved or explicitly deferred with rationale.
