# Type and In-Source Tests

Apply this reference when asserting on types rather than values, or when colocating tests inside a source file.

Verified against Vitest 4.1.10 — <https://vitest.dev/guide/testing-types>

## Type Tests

Files matching `*.test-d.ts` are type tests by default; `typecheck.include` changes the pattern. `--typecheck` runs them, invoking `tsc --noEmit` (or `vue-tsc --noEmit`) — so a project with type tests does not need a separate type-check script.

Two APIs: `expectTypeOf` with a fluent matcher chain, and the simpler `assertType`.

```ts
expectTypeOf(parseConfig).returns.toEqualTypeOf<Config>();
expectTypeOf<UserId>().not.toEqualTypeOf<string>();
```

Options: `typecheck.only` runs type tests alone, `typecheck.ignoreSourceErrors` suppresses errors originating in source rather than test files, and `typecheck.tsconfig` selects a config.

**Guidelines:**

- MUST run type tests through `--typecheck`; they are inert in a normal run.
- SHOULD assert on the types a package exports to its callers, not on internal aliases that carry no contract.

## Type Tests Do Not Execute

They are statically analyzed and never run. The consequence people trip on: **a dynamic test name is not evaluated**, so `test.each` and `test.for` produce no useful names in a type test.

Error messages also read backwards, because the assertion is `expectTypeOf<Actual>().toEqualTypeOf<Expected>()` — the reported mismatch names the expected type where a value assertion would name the actual.

**Guidelines:**

- MUST use literal test names in type tests; a computed name is not evaluated.
- SHOULD read a type-test failure as actual-versus-expected in that order, rather than the value-assertion order.

## In-Source Tests

`import.meta.vitest` guards tests written at the bottom of a source file, sharing the module's closure so private state is reachable without exporting it:

```ts
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it("normalizes an empty slug", () => expect(slugify("")).toBe(""));
}
```

`includeSource` tells Vitest which source files to scan. `"vitest/importMeta"` in the `tsconfig` `types` array types the API.

**Guidelines:**

- MUST add the source globs to `includeSource`; without it the colocated tests are never discovered.
- MUST add `"vitest/importMeta"` to `tsconfig` types, or `import.meta.vitest` is untyped.

## The Setting Without Which Tests Ship

The production build must define `import.meta.vitest` as `undefined` so the guarded block is dead code and gets eliminated:

```ts
define: { "import.meta.vitest": "undefined" }
```

Vitest documents the equivalent for Vite, Rolldown, Rollup, unbuild, and webpack. **Omit it and the tests — plus anything they import — are bundled and shipped to users.** Nothing in the test run detects this; it is visible only in the built output.

**Guidelines:**

- MUST configure the production-build `define` before adding the first in-source test, and verify the built output does not contain it.
- MUST re-check that `define` when the project changes bundler, since it is bundler-specific.

## Scope

Vitest scopes in-source testing to small utilities, prototyping, and inline assertions, and says to use separate test files for component and end-to-end testing.

**Guidelines:**

- SHOULD use a separate test file once a colocated test needs setup, fixtures, or more than a few cases.
- MUST NOT colocate component or end-to-end tests in source; the documentation excludes them.
