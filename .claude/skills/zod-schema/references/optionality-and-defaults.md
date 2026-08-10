# Optionality and Defaults

Apply this reference when deciding how a field expresses absence, supplying a fallback value, deliberately swallowing a parse failure, or normalising a producer that treats null and undefined as interchangeable.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## Absent, Null, or Either

Three constructs express three different facts, and the choice is decided by **what the producer actually emits**, not by which reads more naturally:

| Construct     | Accepts                           | Model it when                                           |
| ------------- | --------------------------------- | ------------------------------------------------------- |
| `.optional()` | The value or `undefined`          | The key may be missing entirely                         |
| `.nullable()` | The value or `null`               | The key is always present and may hold an explicit null |
| `.nullish()`  | The value, `null`, or `undefined` | The producer uses both, or you cannot rule either out   |

The way to decide is to look at a real payload rather than reason about it. A JSON API that omits empty fields wants `.optional()`. A SQL row wants `.nullable()`, because a column is always selected and may be `NULL`. A CMS or document store that has accumulated both wants `.nullish()` — and that is a legitimate answer, not a lazy one, when both genuinely occur.

`.nullish()` used as a blanket hedge is the failure mode: it widens every downstream type with two absent cases the code must then handle, permanently, to avoid one investigation.

**Guidelines:**

- MUST choose between `.optional()`, `.nullable()`, and `.nullish()` from an observed payload, not from a guess about the producer.
- MUST NOT use `.nullish()` as a default hedge across a schema; each use widens the consumer's type with a case it must handle forever.
- SHOULD narrow an existing `.nullish()` to `.optional()` or `.nullable()` once the producer's behaviour is established.

## Defaults and Prefaults

Both supply a value when the input is `undefined`. They differ in **whether that value is parsed**, and the distinction is not cosmetic.

- **`.default(value)`** short-circuits. The value must be assignable to the schema's **output** type, and it is returned as-is without passing through the schema's checks or transforms.
- **`.prefault(value)`** substitutes the value as **input** and parses it. The value must be assignable to the schema's **input** type, and every check, transform, and mutation runs over it.

The difference shows immediately on a mutating chain:

```ts
z.string().trim().toUpperCase().prefault("  tuna  ").parse(undefined); // "TUNA"
z.string().trim().toUpperCase().default("  tuna  ").parse(undefined); // "  tuna  "
```

`.default()` is the right choice for a plain constant on a plain schema. `.prefault()` is the right choice whenever the schema transforms, mutates, or coerces — which is exactly where the silent `.default()` result is wrong.

Zod 4 also **applies a default inside an optional field**: `z.string().default("x").optional()` now yields the default rather than `undefined`. A schema written against the older behaviour changes meaning without changing text.

**Guidelines:**

- MUST use `.prefault()` rather than `.default()` on a schema that transforms, mutates, or coerces, so the fallback receives the same treatment as real input.
- MUST supply a `.default()` value assignable to the schema's output type and a `.prefault()` value assignable to its input type; the two differ wherever the schema transforms.
- MUST re-check the intent of any `.default()` nested inside an `.optional()`, since Zod 4 applies it where earlier versions did not.
- SHOULD pass a function to `.default()` when the value must be computed per parse, rather than sharing one instance across every call.

## Catch

`.catch(value)` replaces a **parse failure** with a fallback, rather than replacing an absent input. It takes a value or a callback receiving the error, and it turns any failure of that subschema into a success.

That makes it a real tool and a real hazard. It is honest where a malformed optional field should not fail the whole payload — a stale cached preference, an unrecognised enum member in a display field. It is negligent where it hides a producer that has started emitting the wrong shape, because the parse now reports success forever and the fallback is indistinguishable from a real value.

As of 4.4.3, `.catch()` handling on an **absent object key** was restored, so a caught schema behaves consistently whether the key is missing or malformed.

**Guidelines:**

- MUST NOT use `.catch()` on a field whose correctness the code depends on; it converts a detectable failure into silent wrong data.
- MUST make a caught value distinguishable from a legitimately parsed one where the difference matters downstream, rather than substituting an indistinguishable fallback.
- SHOULD log through the callback form when catching, so a producer's drift is observable rather than absorbed.
- SHOULD prefer `.optional()` with an explicit downstream default over `.catch()` when the real situation is "this field may be absent", not "this field may be malformed".

## Normalising a Mixed Producer

Where a source genuinely emits both `null` and `undefined` for the same absent field, the schema should absorb that inconsistency at the boundary so no consumer repeats the check. The idiom is `.nullish()` followed by a transform to one canonical absent value:

```ts
const authorName = z
  .string()
  .nullish()
  .transform((value) => value ?? null);
```

This is the one place `.nullish()` is unambiguously right: it is not hedging, it is describing a producer accurately and then collapsing the variation so it stops propagating.

**Guidelines:**

- MUST collapse a mixed null/undefined producer to one canonical absent value at the boundary, rather than letting both flow into consumer types.
- SHOULD pick `null` as the canonical absent value for data that will be serialized, since `undefined` does not survive JSON.

## Strict Optional Property Types

`exactOptionalPropertyTypes` is a TypeScript setting, not a Zod one, and it changes what an optional property's inferred type means: with it on, `{ a?: string }` permits the key to be absent but **not** to be present holding `undefined`.

That interacts directly with the `.optional()` versus `.nullable()` choice above, and with any code that builds an object by assigning `undefined` to signal absence. It is not required by Zod — unlike `strict`, which is (see [version-and-packages.md](./version-and-packages.md)) — but where a project has it on, a schema modelling "present and undefined" needs to say so explicitly.

**Guidelines:**

- MUST check whether `exactOptionalPropertyTypes` is enabled before diagnosing an inferred-optionality type error as a schema problem.
- SHOULD model "present but undefined" explicitly rather than relying on `.optional()` to express it under `exactOptionalPropertyTypes`.
