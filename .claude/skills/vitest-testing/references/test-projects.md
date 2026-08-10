# Test Projects

Apply this reference when one repository needs more than one test configuration — a monorepo, a Node suite beside a browser suite, or fast and slow tiers with different isolation.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/projects>

## Projects Replaced Three Mechanisms

`test.projects` is the single way to run several configurations in one process. It replaced the v3 `workspace` option **and** the separate `vitest.workspace.ts` file, and it is also the replacement for `poolMatchGlobs` and `environmentMatchGlobs`, which were removed with no like-for-like option.

A project list accepts glob patterns, paths to config files, and inline configuration objects, and `!` negates an entry. Nested layouts use bracket syntax — `packages/!(business)` includes a parent's subfolders while excluding the parent itself.

**Guidelines:**

- MUST express per-glob environment or pool differences as projects; the matching options that once did this no longer exist.
- MUST NOT keep a `vitest.workspace.ts` file on v4; it is not read.

## Naming Rules

A file used as a project config must be named `vitest.config.*`, `vite.config.*`, or the `vitest.<name>.config.*` / `vite.<name>.config.*` form where `<name>` is letters, digits, underscores, or hyphens. A file outside those patterns is not picked up.

Every project must have a unique `name`; duplicates are an error, not a warning. `--project` filters by that name and is repeatable.

**Guidelines:**

- MUST give every project an explicit, unique `name`, since it is what `--project` and the reporters address.
- MUST name a project config file to match the required patterns, or it is silently not a project.

## Inheritance Is Off by Default

A project does **not** inherit the root config. This surprises people: shared aliases, setup files, and environment settings are absent from every project until asked for.

Two ways to opt in — `extends: true` on the project entry, or `mergeConfig` composing a shared base explicitly. And the root config is not itself treated as a project unless it appears in the list.

**Guidelines:**

- MUST set `extends: true`, or compose with `mergeConfig`, on any project that needs root-level plugins, aliases, or setup files.
- MUST add the root config to the project list explicitly when its tests should still run.

## Process-Wide Options

Some options configure the whole run and are therefore illegal inside a project: `coverage`, `reporters`, and `resolveSnapshotPath`. Coverage is collected once across everything; reporters format one run.

**Guidelines:**

- MUST configure `coverage`, `reporters`, and `resolveSnapshotPath` at the root only.
- SHOULD keep per-project configuration to what genuinely differs — environment, pool, isolation, setup files, timeouts — rather than duplicating the root.

## What Projects Are Actually For

The common wins are a `node` project beside a `jsdom` or browser project so neither pays the other's startup cost; a unit project with isolation on beside an integration project with `fileParallelism: false` because it shares a database; and `isolate: false` enabled for the subset of tests that provably clean up after themselves rather than suite-wide.

**Guidelines:**

- SHOULD split by what the tests need from the runner — environment, isolation, timeout — rather than by directory alone.
- SHOULD scope a risky performance setting to one project instead of applying it globally.
