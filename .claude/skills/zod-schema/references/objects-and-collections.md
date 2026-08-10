# Objects and Collections

Apply this reference when modelling an object, deciding what happens to keys the schema does not describe, modelling a structure that contains itself, or modelling an array, tuple, record, map, set, file, or opaque JSON value.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## Unknown Keys Are Stripped by Default

`z.object()` **removes** keys the schema does not model. The parsed result contains exactly the modelled fields and nothing else. This is worth naming explicitly rather than leaving as trivia, because it is the single most consequential default in the library: it means a parse at a boundary is also a projection, and a field an attacker adds to a request body does not survive into the object your code passes to a database.

Three variants change that behaviour:

| Constructor         | Unknown keys                                   |
| ------------------- | ---------------------------------------------- |
| `z.object()`        | Removed from the result                        |
| `z.strictObject()`  | Cause a parse failure                          |
| `z.looseObject()`   | Preserved in the result                        |
| `.catchall(schema)` | Preserved, and each validated against `schema` |

The deprecated method forms `.strict()`, `.passthrough()`, and `.strip()` still compile and should be replaced with the constructors.

Choose `z.strictObject()` when an unexpected key means a producer changed and you want to know. Choose `z.looseObject()` only when the extra keys are genuinely wanted downstream — and read [security-posture.md](./security-posture.md) first, because it is the choice that re-admits exactly what the default excludes.

**Guidelines:**

- MUST use `z.object()` unless there is a stated reason for another variant; its stripping is a deliberate protection, not an incidental behaviour.
- MUST NOT use `z.looseObject()` or `.passthrough()` on a payload that flows into a write, a template, or another system, without stating what the preserved keys are for.
- MUST replace the deprecated `.strict()` / `.passthrough()` / `.strip()` methods with the constructor forms when editing a schema that uses them.
- SHOULD use `z.strictObject()` for a schema over an internal or version-controlled producer, where an unrecognised key is a signal rather than noise.
- SHOULD use `.catchall()` rather than `z.looseObject()` when the extra keys have a known shape, so they are validated rather than merely admitted.

## Two Behaviours That Changed Within Zod 4

Both are silent — the schema still compiles, and only the parse result differs.

`z.unknown()` and `z.any()` **no longer imply an optional key**. A field declared with either is required: the key must be present, though its value may be anything. A schema relying on the older behaviour needs an explicit `.optional()`.

As of 4.4, a **required `z.undefined()` property requires the key to be present** — the value must be `undefined`, and an absent key is a failure. Where an absent key is what is meant, the field is `.optional()`.

**Guidelines:**

- MUST add an explicit `.optional()` to a field whose key may be absent, rather than relying on `z.unknown()` or `z.any()` to imply it.
- MUST distinguish "the key is absent" from "the key is present and undefined" when writing a `z.undefined()` field, and use `.optional()` for the former.

## Reshaping an Object Schema

The derivation methods — `.shape`, `.extend`, `.safeExtend`, `.pick`, `.omit`, `.partial`, `.required`, `.keyof` — are covered in [schema-modules.md](./schema-modules.md), which owns the rule that a variant is derived rather than restated.

One property is worth stating here: in Zod 4 refinements live **inside** the schema rather than wrapping it. A `.refine()` no longer produces a wrapper type that blocks `.extend()` or `.pick()`, so a refined object schema keeps its full method surface. The exception is `.merge()`, which as of 4.4 throws when the receiving schema carries refinements.

**Guidelines:**

- MUST NOT restructure a schema to move a `.refine()` to the end of a chain; refinements no longer block the object methods.
- SHOULD re-verify a refinement's assumptions after `.pick()` or `.omit()` removes a field the refinement reads.

## Recursive Structures

A schema that contains itself is expressed with a **getter**, which defers evaluation until the reference resolves:

```ts
const Category = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(Category);
  },
});
```

Mutually recursive schemas use the same idiom in both directions. Where TypeScript reports a circularity error — it cannot infer a type that refers to itself through the getter — the fix is an explicit return-type annotation on the getter:

```ts
const Activity = z.object({
  name: z.string(),
  get subactivities(): z.ZodNullable<z.ZodArray<typeof Activity>> {
    return z.nullable(z.array(Activity));
  },
});
```

A separate hazard has nothing to do with the schema: **cyclical input data causes an infinite loop**. A recursive schema is safe; an object graph containing a reference back to itself is not, whatever the schema. Depth also matters — see [security-posture.md](./security-posture.md) for a recursive schema as a denial-of-service surface.

**Guidelines:**

- MUST express self-reference through a getter, not through a variable referenced before its initialization.
- MUST add an explicit return-type annotation to the getter when TypeScript reports a circularity error, rather than casting the schema.
- MUST NOT pass a cyclical object graph to a parse; the loop is in the data, and no schema construct prevents it.
- SHOULD bound recursion depth on a schema parsing external input.

## Arrays and Tuples

`z.array(item)` with `.min()`, `.max()`, and `.length()` covers a homogeneous list. `.nonempty()` in Zod 4 produces `T[]`, not the `[T, ...T[]]` tuple type it produced in Zod 3 — where the tuple type is what is wanted, `z.tuple()` is the construct that gives it.

`z.tuple([a, b])` models a fixed-length heterogeneous sequence and accepts a variadic rest element for a known prefix followed by an open tail. As of 4.4, defaults inside a tuple materialize their output values correctly, and a hole is rejected before a required default applies.

Validating a list means parsing the **array schema once**, not calling an item schema inside a loop — see [performance-and-footprint.md](./performance-and-footprint.md).

**Guidelines:**

- MUST use `z.tuple()` where a fixed-length tuple type is required; `.nonempty()` no longer produces one.
- MUST bound an array from external input with `.max()` (see [security-posture.md](./security-posture.md)).
- SHOULD parse a collection through its array schema in one call rather than mapping an item schema across it.

## Records, Maps, and Sets

`z.record(keySchema, valueSchema)` takes **both** a key schema and a value schema in Zod 4. The single-argument form does not error — it silently defaults the key type to `z.string()` and uses the one schema given only as the **value** type, so `z.record(z.string())` accepts `{ a: "x" }` and rejects `{ a: 1 }`. Anyone carrying over the Zod 3 habit of writing the value schema alone gets a record whose keys are never checked against the schema they passed, with no construction-time complaint to point at.

Two further behaviours follow from the key schema:

- A record keyed by an **enum** is **exhaustive** — every enum member is a required key. `z.partialRecord()` is the form where they are optional.
- `z.looseRecord()` relaxes key validation where the key set is genuinely open.

Also as of 4.4, a transform on the key schema actually runs, so a record whose keys are normalised behaves as written.

`z.map()` and `z.set()` model the corresponding built-ins; `z.set()` takes `.min()`, `.max()`, and `.size()`. As of 4.4 a default on either is **cloned** rather than shared, so two parses no longer receive the same mutable instance — a real bug class in earlier versions.

**Guidelines:**

- MUST pass both a key schema and a value schema to `z.record()`; a single argument is accepted and reused as the value type, which fails silently rather than at construction.
- MUST use `z.partialRecord()` when an enum-keyed record does not require every member; `z.record()` with an enum key demands all of them.
- SHOULD prefer an object schema to a record when the key set is known and small, so each value can be typed independently.

## Files and Opaque JSON

`z.file()` validates a `File` instance, with `.min()` and `.max()` for size and `.mime()` for content type. It is the schema for an upload boundary, and the size bound is the one that matters — an unbounded upload is a resource problem no downstream check fixes.

`z.json()` accepts any JSON-encodable value: the recursive union of string, number, boolean, null, array, and record. It is the right schema for a payload that is only ever stored or forwarded, and the wrong one for anything the code reads fields out of, where it provides no more guarantee than `unknown` and costs a full traversal.

**Guidelines:**

- MUST set a size bound with `.max()` on any `z.file()` schema over an upload.
- MUST validate the content type with `.mime()` rather than trusting a filename extension.
- MUST NOT use `z.json()` as a substitute for modelling a payload whose fields the code actually reads.
- SHOULD prefer `z.unknown()` to `z.json()` for a value that is stored opaquely and never traversed, since the traversal buys nothing.
