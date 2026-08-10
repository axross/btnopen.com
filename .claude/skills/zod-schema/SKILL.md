---
name: zod-schema
description: A change touching Zod — `z.object`, `z.infer`, `safeParse`, `z.codec`, `z.coerce`, `z.brand`, `z.discriminatedUnion`, `.refine`, `.transform`, `zodResolver`, `z.toJSONSchema`, `ZodError`, a schema module, a validation boundary, or an unvalidated `fetch` or `JSON.parse` result. For which inputs are untrusted at all, use an application-security capability. Modelling a type schema with Zod 4, decoding and encoding across a boundary, and enforcing validation where untrusted data enters. Covers the one-parse boundary, schema-derived types, codecs, coercion traps, error shape, and what a passing parse still does not make safe.
user-invocable: false
---

# Zod Schema

Use this capability whenever a change touches Zod — a schema being written, a parse being placed, a payload being decoded, or an error being surfaced. It owns the **schema layer**: the shape, the parse call, the type that shape yields, the error it produces, and the codec that carries data between a wire format and a domain model.

It does **not** own four neighbouring questions, each owned by a capability of its own:

- **Whether an input is untrusted at all**, and so must be checked — an application-security capability's judgment. This skill assumes that judgment is made and says how Zod carries it out.
- **That a hook exists for the parse to sit inside** — a route handler, a server function, a form action — a framework capability's fact.
- **When a fetched payload is refetched, cached, or invalidated** — a server-state capability's concern. This skill only puts a parse inside the query function it owns.
- **How a component receives, renders, and is tested against the parsed result** — a component-development capability's concern.

Where a rule here has a counterpart in one of those, this skill states the Zod mechanism and names the other as owner.

**Version discipline.** This skill is written against **Zod 4 only**. Zod 3 is out of scope as a supported line: no migration path, no `zod/v3` guidance, and no rule stated in its Zod 3 form. The one place Zod 3 appears is as a **detection signal** — a list of superseded idioms, so stale code can be recognised and replaced with the current form. That is a Zod 4 rule about a Zod 4 codebase, not coverage of Zod 3. The boundary matters more than usual here, because Zod 3 answers still outrank Zod 4 answers across tutorials, forum posts, and model recall — and most Zod 3 idioms still compile against a Zod 4 install, so "it runs" is not evidence a rule is current. Zod 4 also moves within its own major: `z.xor`, `z.invertCodec`, and the `.brand` direction parameter all arrived after 4.0. Every version-sensitive statement here names what it was verified against, and where a surface is known to move the rule is a **lookup** — consult the installed version's own documentation at <https://zod.dev/> — rather than a frozen API name. Treat an unversioned claim about a Zod API, in this skill or anywhere else, as suspect.

**Verified against** `zod@4.4.3`, published 2026-05-04 — <https://zod.dev/> — with TypeScript 5.5+ and `strict: true` as stated prerequisites. Each reference file carries its own `Verified against` line with the upstream page its rules were checked against.

**Out of scope.** Zod 3 in every form. The `4.5.0-canary` line, which no rule here was derived against. Other validation libraries except where a boundary is shared with one — Standard Schema interop is covered, Valibot's or ArkType's own APIs are not. Code generation tools that emit Zod schemas are named where they change what you must still write by hand, but their own configuration is theirs.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## The Validation Boundary

See [validation-boundary.md](./references/validation-boundary.md) for:

- placing the one parse at the edge data enters, and never re-parsing inward of it
- `unknown` upstream of the parse and `z.infer<typeof Schema>` downstream, never a hand-written interface
- which questions belong to an application-security, framework, server-state, or component capability
- the cases a schema costs without buying — internal data, an already-parsed value, a per-item loop
- running Zod beside a second validator, and converting between them at one place

## Version and Packages

See [version-and-packages.md](./references/version-and-packages.md) for:

- telling `zod.dev` (Zod 4) from `v3.zod.dev` (Zod 3) before trusting a page
- picking between `zod`, `zod/mini`, `zod/locales`, and the `zod/v4/*` permalinks
- the assumed TypeScript 5.5+ and `strict: true`, without which inferred optionality is unsound
- the minor-version floors for `z.xor`, `z.invertCodec`, `.safeExtend`, `z.property`, and the `.brand` direction
- the Zod 3 idioms that still compile against Zod 4, as a staleness signal

## Schema Modules

See [schema-modules.md](./references/schema-modules.md) for:

- the `const X` / `type X` and `zX` naming conventions, and picking one per repository
- shared `EntityId`, `Timestamp`, and `NonEmptyString` primitives as the vocabulary other schemas compose from
- `.brand<"Name">()`, its `"out"`/`"in"`/`"inout"` direction, and the fixtures it forces through a parse
- deriving with `.shape`, `.extend`, `.safeExtend`, `.pick`, `.omit`, and `.merge()`'s 4.4 throw on refinements
- hoisting every schema to module scope rather than rebuilding it per request or render

## Primitives and Formats

See [primitives-and-formats.md](./references/primitives-and-formats.md) for:

- the top-level `z.email()`, `z.url()`, `z.uuid()`, and `z.iso.datetime()` that replaced the `z.string().x()` methods
- choosing strict `z.uuid()` over permissive `z.guid()`, and `z.httpUrl()` over `z.url()` for a fetched URL
- `z.stringFormat()` for a project's own format and `z.templateLiteral()` for a template-literal type
- `z.int()`'s safe-integer range, the rejection of `Infinity`, and the fixed-width `z.int32()` and `z.float64()`
- `z.enum()` over the deprecated `z.nativeEnum()`, with `.exclude()` and `.extract()`

## Objects and Collections

See [objects-and-collections.md](./references/objects-and-collections.md) for:

- `z.object()` stripping unmodelled keys, and `z.strictObject()`, `z.looseObject()`, and `.catchall()` changing that
- self-reference through a getter, and the return-type annotation a circularity error needs
- `z.record()`'s two required arguments, exhaustive enum keys, and `z.partialRecord()`
- `z.tuple()` where `.nonempty()` no longer yields a tuple type, plus `z.file()` and `z.json()`
- parsing an array schema once instead of an item schema per element

## Unions

See [unions.md](./references/unions.md) for:

- `z.discriminatedUnion()` for narrowing, error quality, and parse speed over a plain `z.union()`
- the literal discriminator every branch must fix, and the nested unions and pipes Zod 4 allows inside one
- `z.xor()` for the case where a value matching two branches is a defect
- `z.intersection()` throwing a plain `Error` rather than a `ZodError` on an unmergeable result
- the union of optional-field shapes that should have been one object

## Optionality and Defaults

See [optionality-and-defaults.md](./references/optionality-and-defaults.md) for:

- choosing `.optional()`, `.nullable()`, or `.nullish()` from what the producer actually emits
- `.default()` short-circuiting on the output type versus `.prefault()` parsing on the input type
- `.catch()` turning a parse failure into a fallback, and when that hides a drifting producer
- `.nullish().transform((v) => v ?? null)` to collapse a mixed null-and-undefined producer
- what `exactOptionalPropertyTypes` does to an optional property's inferred type

## Refinements

See [refinements.md](./references/refinements.md) for:

- `.refine()`, `.superRefine()`, and `.check()`, and the rule that none of them may throw
- `ctx.addIssue()`, `z.NEVER`, and the `path` that lands an error on a specific field
- `abort` to stop a chain, and 4.4's `when` to skip a check whose inputs are already invalid
- an async refinement forcing `.parseAsync()` on every existing caller of the composed schema
- a permission, quota, or uniqueness rule belonging in the domain rather than the schema

## Transforms and Pipes

See [transforms-and-pipes.md](./references/transforms-and-pipes.md) for:

- `.transform()` after validation, `z.preprocess()` before it, and `.pipe()` between two schemas
- `.overwrite()` where the value changes but the type and its introspectability must not
- `z.input` versus `z.output`/`z.infer`, and the form and fixture bugs from confusing them
- `ctx.issues.push` or 4.4's `ctx.addIssue` with `z.NEVER` to fail from inside a transform
- where reshaping the producer's data ends and a domain decision begins

## Codecs

See [codecs.md](./references/codecs.md) for:

- `z.codec(input, output, { decode, encode })` for a boundary `.transform()` cannot reverse
- `.decode()` and `.encode()` with their `safe*` and `*Async` forms, plus `z.invertCodec()`
- the documented `isoDatetimeToDate`, `json`, `stringToURL`, and `base64ToBytes` templates — copied, not imported
- defaults and `.catch()` applying on decode only, and a `.transform()` making encode throw a non-`ZodError`
- the total codec that cannot fail, and the shape guarantee it therefore does not give

## Coercion and Configuration

See [coercion-and-config.md](./references/coercion-and-config.md) for:

- `z.coerce.number().parse("")` returning `0`, and `z.coerce.boolean().parse("false")` returning `true`
- `z.stringbool()` as the construct that rejects a value in neither the truthy nor the falsy set
- query strings, form data, and environment variables as the three string-valued sources
- parsing configuration once at startup and terminating rather than surfacing `undefined` later
- keeping secret configuration out of logs and out of a client bundle

## Parsing

See [parsing.md](./references/parsing.md) for:

- `.parse()` when a failure is a defect, `.safeParse()` when it is an outcome to branch on
- `.parseAsync()` being mandatory rather than optional once any check in the schema is async
- the deep clone a parse returns, and the reference identity it therefore breaks
- remapping `ZodError` to a domain error so Zod stays out of domain signatures
- logging the boundary and the issue paths, never the input that failed

## Errors

See [errors.md](./references/errors.md) for:

- `error.issues` with its `code` and `path`, and the dropped `.errors` and `.formErrors` aliases
- `z.treeifyError()`, `z.flattenError()`, and `z.prettifyError()`, chosen by consumer
- the unified `error` parameter that replaced `message`, `invalid_type_error`, and `errorMap`
- the precedence — schema, per-parse, `z.config({ customError })`, locale — that reversed in Zod 4
- `reportInput` putting untrusted input into an error that travels to a tracker or a client

## Metadata and JSON Schema

See [metadata-and-json-schema.md](./references/metadata-and-json-schema.md) for:

- `.meta()`, `z.registry()`, `z.globalRegistry`, and extending `GlobalMeta` by declaration merging
- metadata binding to a schema instance, so `.optional()` or `.extend()` orphans it
- `z.toJSONSchema()`'s `target`, `io`, `unrepresentable`, `cycles`, `reused`, and `uri` options
- `io: "input"` producing a different document from the default output view
- the `date`, `map`, `set`, `transform`, and `bigint` types with no JSON Schema representation

## Model Structured Output

See [model-structured-output.md](./references/model-structured-output.md) for:

- a schema as a `generateObject` or tool contract, and `satisfies z.ZodRawShape` where a raw shape is wanted
- `.describe()` text reaching the model as instruction rather than as documentation
- `.nullable()` surviving a provider's strict mode where `.optional()` and `.nullish()` are rejected
- reusing `.shape.field` so model output cannot drift from the domain type it feeds
- re-prompting from a `ZodError` under a bounded retry, rather than patching invalid output

## Forms

See [forms.md](./references/forms.md) for:

- a Zod-specific resolver for Zod's own issue detail, or a Standard Schema one for library independence
- `z.input` for the form's values and default values, `z.output` for the submit handler
- `path` on a cross-field refinement as the only way an error reaches the right input
- the empty string a blank numeric field submits, and the absent key an unchecked checkbox sends
- the server-side re-parse that a client-side schema never replaces

## Data Store Boundaries

See [data-store-boundaries.md](./references/data-store-boundaries.md) for:

- the stored shape and the domain model as two schemas with a transform between them
- read and write halves written as one pair, so a renamed field cannot drift between them
- `.partial()` for a patch and `.omit().extend()` for a create input carrying store sentinels
- `z.instanceof()` for a driver's own types and `z.property()` to constrain one of their fields
- a payload varying by query depth, draft state, or locale — and the all-optional schema that is not the answer

## Performance and Footprint

See [performance-and-footprint.md](./references/performance-and-footprint.md) for:

- the published ~14x, ~7x, and ~6.5x parse gains, and the ~25,000-to-~175 type-instantiation drop
- `zod/mini`'s functional API and 1.88 kB core, and why a server should not adopt it
- schema construction hoisted out of a hot path, and a collection parsed once rather than per item
- `.check()` over `.refine()` and a discriminated union over a linear one, on a measured path
- `z.looseObject()` skipping the key-stripping pass, and the protection that trades away

## Security Posture

See [security-posture.md](./references/security-posture.md) for:

- `z.object()`'s stripping as mass-assignment protection, and what `z.looseObject()` re-admits
- a passing parse being neither HTML escaping, SQL parameterization, nor a safe-fetch guarantee
- `.max()` placed before a `.regex()` or an expensive refinement, to bound attacker-controlled work
- unbounded arrays, unbounded recursion depth, and cyclical input that loops forever
- an allowlisting response schema, without which a private field leaves with the payload

## Testing Schemas

See [testing-schemas.md](./references/testing-schemas.md) for:

- why asserting that `z.email()` rejects `"nope"` tests Zod rather than the schema
- `z.input<typeof Schema>` as the fixture type, built from an observed payload rather than the schema
- asserting a rejection through `.safeParse().success` or `.toThrow()`, and on `path`/`code` not the message
- round-tripping through the codec's own `.decode()` and `.encode()` rather than re-implementing either
- generated data being unable to show that the schema itself is wrong

## Interop and Library Code

See [interop-and-library-code.md](./references/interop-and-library-code.md) for:

- `<S extends z.ZodType>` preserving the caller's schema where a bare `z.ZodType<T>` loses it
- Standard Schema's `~standard` for a consumer that must not care which library produced the schema
- `zod/v4/core` with `zod` as a `^4.0.0` peer dependency for library code
- `._zod.def` and the `$Zod*` types as an explicitly unstable surface
