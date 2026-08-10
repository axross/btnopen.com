# Interop and Library Code

Apply this reference when writing code that accepts a schema from its caller, when consuming a schema without depending on which library produced it, or when publishing a package that integrates with Zod.

Verified against `zod@4.4.3` — <https://zod.dev/library-authors>.

## Accepting a Caller's Schema

A helper that takes a schema and returns a value typed by it — a generation wrapper, a fetch wrapper, a cache accessor — needs a generic that **preserves** what was passed:

```ts
export interface TextGenerator {
  generate<S extends z.ZodType>(prompt: string, schema: S): Promise<z.infer<S>>;
}
```

The constraint is `<S extends z.ZodType>`, and the return type is `z.infer<S>`. What must be avoided is a bare `z.ZodType<T>` parameter, which erases the concrete schema type: the caller passes a `ZodObject` and the function forgets it was one, so `.shape` and every other subclass member is gone from anything derived downstream.

Where the helper needs a specific kind of schema, constrain to it — an object-only helper takes `<S extends z.ZodObject>` — so a mismatch is a compile error at the call site rather than a runtime failure inside.

**Guidelines:**

- MUST accept a caller's schema through a generic constrained with `extends`, not as a bare `z.ZodType<T>` parameter.
- MUST derive the return type from the generic with `z.infer<S>` rather than a separate type parameter the caller must supply.
- SHOULD constrain to the narrowest schema type the helper actually requires, so a wrong argument fails at the call site.

## Consuming a Schema Library-Agnostically

Standard Schema is a shared interface implemented by several validation libraries, exposed on a `~standard` property, and specified at <https://standardschema.dev/>. A tool consuming it validates through that interface and does not care which library produced the schema.

It is the better contract in two situations: a library whose users may reasonably prefer a different validator, and a shared component in a codebase that already runs more than one (see [validation-boundary.md](./validation-boundary.md)).

It is the worse contract when the consumer needs anything Zod-specific — a schema's `.shape`, its metadata registry, JSON Schema generation, codec directions. The shared interface deliberately exposes validation and type inference and nothing else.

**Guidelines:**

- MUST use the shared interface rather than a Zod-typed parameter when the consumer needs only validation and inferred types and its users may use another library.
- MUST NOT reach for a Zod-specific API through a value typed as the shared interface; constrain to Zod explicitly where Zod features are needed.
- SHOULD offer the shared interface as the public contract and Zod specifics as an opt-in, rather than choosing one for every consumer.

## Publishing a Package

A library that integrates with Zod depends on it differently from an application:

- **Import from `zod/v4/core`**, not from `zod`. It is documented as a permalink for this major, so a consumer's package version does not change what the library resolves.
- **Declare `zod` as a peer dependency**, at `^4.0.0`, and as a dev dependency. A direct dependency risks two copies of the library in one install, with schemas from one failing `instanceof` checks in the other.
- **Constrain generics with `$ZodType`** from the core module, following the preservation rule above.
- **Parse through the core module's top-level functions** rather than calling methods, which is the surface the core module exposes.

Where a runtime check is genuinely needed, a Zod 4 schema is identifiable by the presence of a `_zod` property.

**Guidelines:**

- MUST import from `zod/v4/core` in library code, not from `zod`.
- MUST declare `zod` as a peer dependency and a dev dependency, never as a direct dependency.
- MUST NOT constrain a generic with a bare `$ZodType<T>`; use `extends` so the concrete type survives.
- SHOULD state the supported Zod range in the package's documentation, since a consumer's failure will otherwise look like a bug in the library.

## The Internals Are Not a Surface

`z.core` exposes the library's substrate: `._zod.def`, the `$Zod*` issue types, the internal check representations. It exists so libraries can build on Zod, and it is explicitly not a stable API — Zod 4 already moved `._def` to `._zod.def` and removed the `ZodEffects` and `ZodBranded` classes that helper code reached for.

Code touching these is code that breaks on a minor upgrade with no compile error at the boundary that caused it.

The usual reason to reach for internals is introspection — walking a schema to generate something. `z.toJSONSchema()` and the metadata registries cover most of that need through supported APIs (see [metadata-and-json-schema.md](./metadata-and-json-schema.md)), and are the first thing to check.

**Guidelines:**

- MUST NOT depend on `._zod.def` or the `$Zod*` internals from application code.
- MUST pin an exact Zod version and test against upgrades when library code does depend on internals.
- SHOULD reach for `z.toJSONSchema()` or a metadata registry before walking a schema's internal representation.
