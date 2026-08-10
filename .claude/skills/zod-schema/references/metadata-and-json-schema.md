# Metadata and JSON Schema

Apply this reference when attaching descriptive metadata to a schema, defining a project's own metadata shape, or emitting a JSON Schema document from a Zod schema.

Verified against `zod@4.4.3` — <https://zod.dev/metadata>.

## Attaching Metadata

`.meta({ … })` attaches metadata to a schema and registers it in the global registry. Called with no argument, it returns what was attached. See the [metadata and registries reference](https://zod.dev/metadata) for the full registry API.

The global registry accepts `id`, `title`, `description`, `deprecated`, and `examples`, plus any additional keys. `id` is special: registering two schemas under the same `id` throws.

`.describe("…")` is the older shorthand for `.meta({ description: "…" })`. It still works and is no longer the recommended form, since it can express only one of the fields.

**Example:**

```ts
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .meta({
    id: "slug",
    title: "Slug",
    description:
      "URL-safe identifier: lowercase letters, numbers, and hyphens.",
  });
```

**Guidelines:**

- MUST use `.meta()` rather than `.describe()` for new metadata, since `.describe()` reaches only the description field.
- MUST keep `id` values unique across the project; a collision throws at registration, not at parse.
- SHOULD write a description that says what the value means, not what the type is — the type is already in the schema.

## Metadata Binds to an Instance

Zod's operations are immutable: `.optional()`, `.extend()`, `.nullable()`, and every other derivation return a **new** schema instance. Metadata attached to the original does not travel to the derivative.

This is the single most common metadata bug, because nothing reports it — the derived schema simply has no metadata, and a generated JSON Schema or a model prompt quietly loses every description.

**Guidelines:**

- MUST attach metadata to the schema instance that is actually consumed, not to one an operation was subsequently applied to.
- MUST re-check generated output after adding a derivation to a schema chain that carries metadata.
- SHOULD attach metadata last in a chain, so no later operation can orphan it.

## Project-Defined Registries

`z.registry<Meta>()` creates a registry with a project's own strongly typed metadata, and `.register(registry, meta)` adds a schema to it. Unlike every other method, `.register()` returns the **original** schema unchanged, so it composes inline without producing a new instance.

A registry's second type parameter constrains which schemas may be added — `z.registry<Meta, z.ZodString>()` accepts only string schemas — which catches a mis-registration at the definition rather than at the consumer.

`z.$output` and `z.$input` let metadata be typed against the schema it annotates, so a field holding examples is typed as that schema's own output rather than `unknown`.

To extend the **global** registry's accepted fields instead, declaration-merge `GlobalMeta` in a `zod.d.ts`.

**Guidelines:**

- MUST use a project-defined registry rather than arbitrary keys on the global registry when the metadata has a fixed shape worth type-checking.
- MUST declaration-merge `GlobalMeta` rather than casting when adding a field to the global registry's accepted shape.
- SHOULD constrain a registry with its second type parameter when only one kind of schema should ever be registered.

## Emitting a JSON Schema

`z.toJSONSchema(schema, options)` converts a schema into a JSON Schema document, replacing the third-party converters that predate it. The full option surface is in the [JSON Schema reference](https://zod.dev/json-schema); the ones below are the ones that change the output in ways a caller notices.

| Option            | Controls                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| `target`          | The dialect: `draft-2020-12` (default), `draft-07`, `draft-04`, `openapi-3.0` |
| `io`              | Whether the input or the output type is represented; output is the default    |
| `metadata`        | The registry whose metadata is folded in                                      |
| `unrepresentable` | `"throw"` (default) or `"any"` for types with no representation               |
| `cycles`          | `"ref"` (default) or `"throw"` for recursive schemas                          |
| `reused`          | `"inline"` (default) or `"ref"` to extract shared subschemas into `$defs`     |
| `uri`             | A function turning a registered `id` into a fully qualified reference URI     |
| `override`        | A callback for conversion the built-in rules get wrong                        |

Two behaviours are worth knowing before the first surprise:

**`io` matters for any schema that is not symmetric.** A coerced, transformed, or piped schema produces a different document for its input than for its output, and the default is the output. An API documenting what a client should _send_ wants `io: "input"`.

**`additionalProperties` follows the object variant.** `z.object()` and `z.strictObject()` set it to `false`; `z.looseObject()` never sets it to `false` — it emits `additionalProperties: {}` instead, permitting any additional value. The key is present either way, so detecting a loose object by its absence does not work. A consumer rejecting extra properties is reflecting the schema's own key policy (see [objects-and-collections.md](./objects-and-collections.md)).

**Guidelines:**

- MUST set `target` to the dialect the consumer actually parses rather than accepting the default.
- MUST set `io: "input"` when documenting what a caller should send to a schema that transforms or coerces.
- SHOULD pass `reused: "ref"` when several fields share a subschema, so the document stays readable.
- SHOULD regenerate and diff the document as part of verification when a schema changes, since a consumer depends on it.

## Types With No Representation

Some Zod constructs have no JSON Schema equivalent: `bigint`, `symbol`, `undefined`, `void`, `date`, `map`, `set`, `transform`, `nan`, and `custom`. By default `z.toJSONSchema()` **throws** on encountering one, which is the right default — a silently degraded document is worse than a failed generation.

`unrepresentable: "any"` renders them as an unconstrained `{}`, which is appropriate only where the consumer genuinely does not need the constraint. The `override` callback is the alternative where a project-specific representation exists.

The deeper signal is usually that the schema is modelling the wrong thing at that boundary: a `date` in a schema destined for JSON Schema generation usually wants to be `z.iso.datetime()` (see [primitives-and-formats.md](./primitives-and-formats.md)), and a `transform` usually wants to be a codec or an `.overwrite()` (see [transforms-and-pipes.md](./transforms-and-pipes.md)).

**Guidelines:**

- MUST NOT set `unrepresentable: "any"` to make generation succeed without checking what constraint was lost.
- SHOULD model a wire-facing schema with JSON-representable constructs, rather than converting an unrepresentable one after the fact.
- SHOULD use `override` rather than `"any"` when a project-specific representation exists for the type.
