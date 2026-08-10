# Filtering and Tags

Apply this reference when running a subset of a suite, organizing tests into categories, or bounding what CI runs.

Verified against Vitest 4.1.10; test tags require 4.1.0+, `TestRunner.matchesTags()` 4.1.1+ — <https://vitest.dev/guide/test-tags>

## Narrowing a Run

A positional argument matches file paths — `vitest run basic` matches `basic.test.ts`, `basic-foo.test.ts`, and `basic/foo.test.ts`. `-t` / `--testNamePattern` filters by name including enclosing `describe` blocks. A `file.test.ts:10` suffix targets a location, and needs the full filename with extension.

`--changed` runs tests for changed files; `--related <paths>` runs tests covering given sources; `--dir`, `--project`, and `--bail` bound the run further.

**Guidelines:**

- SHOULD pair a name pattern with a path; the pattern alone still loads every file.
- MUST use the complete filename for line targeting; a partial path does not resolve.

## The Focused-Test Guard

`.only` skips everything else **in its file**. Left behind, it silently reduces a file to one test, and the run stays green.

Vitest fails the run when `.only` is present and `process.env.CI` is set, unless `allowOnly` permits it. That default is the guard, and it is worth keeping.

`.skip` leaves a test visible in the report; `.todo` marks one as planned with no body.

**Guidelines:**

- MUST leave `allowOnly` at its default so a committed `.only` fails CI.
- SHOULD prefer a path or name filter over editing `.only` into a file while iterating, so nothing can be committed by accident.

## Tags

Tags are declared in config before use, which is what prevents a typo becoming a silently empty filter:

```ts
test: {
  tags: [
    { name: "db", timeout: 60_000 },
    { name: "flaky", description: "Known-unstable; excluded from the merge gate." },
  ],
}
```

A tag may carry `timeout`, `retry`, and `priority`; where several apply, lower `priority` wins, and a test's own options beat any tag's. Tests inherit tags from enclosing suites. A `@module-tag` JSDoc at the top of a file tags **every** test in it — not a per-test mechanism.

TypeScript can enforce the available set by augmenting the `TestTags` interface.

**Guidelines:**

- MUST declare every tag in config; an undeclared tag is an error rather than a silently unmatched filter.
- MUST NOT use a module tag for a per-test distinction; it applies to the whole file.

## Filtering on Tags

`--tags-filter` takes a boolean expression over tag names; the linked reference has the full operator set and its syntax.

Three properties of it bite in practice. Precedence is `not` > `and` > `or`, so `unit or e2e and not slow` does not group the way it reads and needs parentheses. Repeated `--tags-filter` flags combine with **AND**, not OR. And a tag may not be named `and`, `or`, or `not`, nor contain `( ) & | ! *` or a space — the parser would otherwise read the name as syntax.

```bash
vitest run --tags-filter="(unit || e2e) && !slow"
```

`--list-tags` prints the declared set, with `=json` for machine output.

`TestRunner.matchesTags()` lets setup skip work the current filter does not need — seeding a database only when `db`-tagged tests will actually run. It returns `true` when no filter is active.

**Guidelines:**

- SHOULD guard expensive setup with `TestRunner.matchesTags()` rather than paying for it on every filtered run.
- SHOULD tag by what a test needs from the environment — a database, a network, a browser — since that is what a filter usually selects on.

## The Cost No Filter Escapes

Filters apply **per test file**: Vitest still loads and evaluates every matching file to discover which tests match. A name filter on a large suite therefore saves execution time, not startup time.

`experimental.preParse` discovers test names without full evaluation.

**Guidelines:**

- MUST NOT expect `-t` alone to make a large suite fast; combine it with a path.
- SHOULD use `vitest list` (`--json`, `--filesOnly`) to inspect what a filter selects before running it.
