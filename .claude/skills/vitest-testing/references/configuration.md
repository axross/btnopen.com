# Configuration

Apply this reference when creating a Vitest config, adding an option to one, or reviewing a config someone else wrote.

Verified against Vitest 4.1.10 — <https://vitest.dev/config/>

## Where the Config Lives

A Vitest config **is** a Vite config. Plugins, `resolve.alias`, and `define` are already solved there, which is why a Vitest project needs no transform pipeline, no module-name mapping, and no separate resolution story of its own.

Two shapes are valid: a `test` block inside `vite.config.ts`, or a dedicated `vitest.config.ts` that takes precedence when both exist. The dedicated file earns itself when test-only plugins or aliases would otherwise leak into the production build; a project without that pressure is better served by one file.

`defineConfig` must be imported from `vitest/config`, not from `vite` — the Vite export does not type the `test` block.

**Guidelines:**

- MUST import `defineConfig` from `vitest/config` in any config carrying a `test` block.
- SHOULD keep the `test` block in `vite.config.ts` until a test-only plugin or alias would otherwise reach the production build.
- MUST use `mergeConfig` rather than object spread when composing a shared base, so nested keys merge instead of replacing.

## File Discovery

`include` and `exclude` define what runs; `includeSource` adds source files carrying colocated tests; `root` and `dir` bound where Vitest looks at all.

Vitest 4 shrank the default exclusion set to `node_modules` and `.git` only. Directories v3 excluded implicitly — `dist`, `.cache`, `.output`, `.temp`, `cypress` — are now scanned unless excluded, which can surface a built copy of the test files and run everything twice.

**Guidelines:**

- MUST add build-output directories to `exclude` on a project upgraded to v4, rather than relying on the v3 defaults.
- SHOULD scope `include` to the directories that actually hold tests instead of globbing the repository root.
- SHOULD set `dir` when tests live under one subtree, so discovery stops descending elsewhere.

## Globals

`globals` is `false` by default, and should stay that way. Every test file importing its own `describe` / `it` / `expect` from `vitest` is explicit about where those symbols come from, survives a move between projects, and needs no ambient type registration.

Setting `globals: true` injects them instead, and then requires `vitest/globals` in the `tsconfig` `types` array or TypeScript does not know they exist. It buys nothing a project starting fresh needs.

**Guidelines:**

- MUST keep `globals: false` and import the test API explicitly in each file, unless an existing project convention requires otherwise.
- MUST add `vitest/globals` to the `tsconfig` `types` array when a project does set `globals: true`, or the injected symbols are untyped.
- MUST NOT mix the two styles within one project.

## Mock Hygiene as Configuration

`clearMocks`, `mockReset`, `restoreMocks`, `unstubEnvs`, and `unstubGlobals` each apply their corresponding reset between tests. Setting them is strictly better than a `beforeEach` in every file, because configuration cannot be forgotten in the one new file that leaks state into its neighbours.

`restoreMocks: true` in particular is the documented fix for spies left unrestored — the most common way one test's stubbing silently changes another's result.

**Guidelines:**

- MUST enable `restoreMocks` (or `mockReset`) rather than relying on per-file cleanup hooks.
- MUST enable `unstubEnvs` and `unstubGlobals` in any project that calls `vi.stubEnv` or `vi.stubGlobal`; stubs otherwise persist across tests.
- SHOULD remove per-file reset hooks that the configuration now covers, rather than leaving both.

## Timeouts

`testTimeout` defaults to 5,000 ms; `hookTimeout` and `teardownTimeout` cover hooks and teardown separately, so a slow global fixture does not need the per-test budget raised to accommodate it.

`vi.setConfig({ testTimeout })` overrides the value for one file at runtime, and the per-test option overrides it for one case — three scopes, narrowest winning.

**Guidelines:**

- MUST raise the narrowest scope that covers the slow thing — the per-test option or `hookTimeout` — rather than the suite-wide `testTimeout`.
- SHOULD state the reason in a comment beside any non-default timeout, so a later reader can tell a measured value from an inherited one.

## Other Options Worth Setting Deliberately

`allowOnly` (leave `false` so a focused test fails CI), `passWithNoTests`, `printConsoleTrace`, `onConsoleLog`, `env`, `alias`, `css`, and `chaiConfig`.

`dangerouslyIgnoreUnhandledErrors` suppresses the unhandled-rejection failure that catches missing `await`s. Its name is accurate.

The `experimental` block — `viteModuleRunner`, `fsModuleCache`, `importDurations`, `preParse`, `openTelemetry` — is a different risk class from the rest of the config: these options change semantics and can be withdrawn between releases.

**Guidelines:**

- MUST NOT set `dangerouslyIgnoreUnhandledErrors` to quiet a failing run; it disables a real check.
- MUST record why any `experimental` option is enabled, and re-check it on every Vitest upgrade.
- SHOULD leave `allowOnly` at its default so a stray focused test fails CI rather than silently skipping its file.
