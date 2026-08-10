# Performance and Footprint

Apply this reference when a schema is on a measured hot path, when bundle size is a stated constraint, or when compilation time has become a problem.

Verified against `zod@4.4.3` — <https://zod.dev/v4>. All figures below are the library's own published benchmarks for Zod 4 against Zod 3, not independent measurements.

## What the Library Costs

Three cost axes, with the published Zod 4 figures:

| Axis              | Figure                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| Parse throughput  | ~14x faster on strings, ~7x on arrays, ~6.5x on objects, against Zod 3 |
| Compile-time cost | ~25,000 type instantiations reduced to ~175 on a simple object schema  |
| Bundle, core      | 12.47 kB gzipped on Zod 3, 5.36 kB on Zod 4, 1.88 kB on Zod Mini       |

The compile-time figure is the one most likely to matter and least likely to be attributed correctly: a chain of `.extend()` and `.omit()` calls that took seconds to typecheck on Zod 3 typechecks in a fraction of that on Zod 4. A project with a slow `tsc` and heavy Zod 3 usage was often paying that cost without knowing where it came from.

**Guidelines:**

- MUST measure before optimizing a schema; the runtime cost is usually not where a slow path actually is.
- SHOULD attribute a slow typecheck to the schema layer only after checking the instantiation count, rather than assuming.
- SHOULD quote a figure with the version it belongs to, since all three axes moved substantially within the library's history.

## The Tree-Shakable Distribution

`zod/mini` implements the same functionality through a **functional** API — wrapper functions instead of chained methods — because bundlers can eliminate unused top-level functions and cannot eliminate unused methods on a class instance. See the [Zod Mini reference](https://zod.dev/packages/mini).

```ts
// zod
z.string().optional().nullable().min(5);

// zod/mini
z.nullable(z.optional(z.string().check(z.minLength(5))));
```

The parse methods are unchanged, as are `.brand()`, `.register()`, `.meta()`, and the mutating checks.

The published comparison: a trivial `z.boolean().parse(true)` costs 2.12 kB gzipped on Mini against 5.91 kB on regular Zod; an object schema with several types costs 4.0 kB against 13.1 kB.

**When Mini is worth it** is narrower than it first appears. On a server, the library's own guidance is that ~17 kB adds a fraction of a millisecond to a cold start — against which the discoverability cost of the functional API is a bad trade. On a client where a round trip already costs 100–200 ms, saving 10 kB of download is not obviously worth it either. The case that survives is a genuinely bundle-constrained client: a slow or metered connection, a strict performance budget that has been measured.

One behavioural difference matters independently of size: **Mini loads no locale by default**, so error messages are absent until `z.config(z.locales.en())` or another locale is configured (see [errors.md](./errors.md)).

**Guidelines:**

- MUST configure a locale explicitly when using `zod/mini`, or error messages will be missing.
- MUST NOT adopt `zod/mini` on a server; the size saving is immaterial against the developer-experience cost.
- MUST NOT mix `zod` and `zod/mini` imports within one module (see [version-and-packages.md](./version-and-packages.md)).
- SHOULD adopt `zod/mini` only against a measured bundle budget, not as a general preference.

## What Dominates a Hot Path

Two placement mistakes account for most real schema slowness, and neither is fixed by choosing different constructs:

- **Constructing a schema inside a function.** Every call rebuilds the schema. Hoisting it to module scope is the fix, and it is covered as a rule in [schema-modules.md](./schema-modules.md).
- **Parsing per item instead of per collection.** Calling an item schema inside a `map` pays the per-parse overhead once per element. Parsing `z.array(Item)` once does the same validation in one traversal.

A third is a validation that should not be happening at all — re-parsing data already parsed at its boundary (see [validation-boundary.md](./validation-boundary.md)). The fastest parse is the one that was deleted.

**Guidelines:**

- MUST hoist schema construction out of any function that runs more than once.
- MUST parse a collection through its array schema rather than mapping an item schema across it.
- SHOULD delete a redundant parse before optimizing it.

## Cheaper Constructs

Where a path is measured and the placement is already right, three substitutions are measurably cheaper:

- **`z.discriminatedUnion()` over `z.union()`** for tagged shapes — one field read instead of attempting each branch. This is also better for errors and narrowing, so it is the default regardless of performance (see [unions.md](./unions.md)).
- **`.check()` over `.refine()`** for a custom constraint — lower-level and more verbose, which is why it is not the default.
- **`z.looseObject()` over `z.object()`** avoids the key-stripping pass, and `z.strictObject()` adds a per-key check. The differences are small and only visible on objects with many keys or very high parse volume — and the stripping that `z.looseObject()` skips is a protection (see [security-posture.md](./security-posture.md)), so this one trades safety for speed.

**Guidelines:**

- MUST NOT switch from `z.object()` to `z.looseObject()` for performance without accounting for the keys that then pass through.
- SHOULD substitute `.check()` for `.refine()` only on a path where a measurement showed the difference, since it costs readability.
- SHOULD use `z.discriminatedUnion()` for tagged shapes as the default, rather than as a performance optimization.

## Build-Time Compilation

Third-party tools compile a schema into a specialized validation function at build time, trading a build step and a dependency for a substantial parse speedup. They are a legitimate answer to a measured, dominant validation cost in a hot path.

They are not a default. The added cost is real — a build step that can break, a tool whose Zod version support lags, and schemas that must stay within the subset the compiler handles.

**Guidelines:**

- MUST establish that validation is a dominant cost, by measurement, before adopting a build-time compiler.
- SHOULD verify the tool's supported Zod version range before adopting it, since these tools trail the library.
