# Transforms and Pipes

Apply this reference when reshaping a validated value, fixing up an input before validation, chaining two schemas, or reasoning about the difference between the type a schema accepts and the type it produces.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## Transform, Preprocess, and Pipe

Three constructs move a value through a schema, and they differ in **when** they run relative to validation.

| Construct             | Runs                | Use it for                                       |
| --------------------- | ------------------- | ------------------------------------------------ |
| `.transform(fn)`      | After validation    | Projecting a validated value into another shape  |
| `z.preprocess(fn, s)` | Before validation   | Fixing an input up so the schema can validate it |
| `.pipe(other)`        | Between two schemas | Feeding one schema's output into another         |

`z.transform(fn)` is the standalone form of `.transform()`, usable where a schema is expected.

Like refinements, **a transform must never throw**. To signal a failure from inside one, push an issue and return `z.NEVER` — a constant typed `never`, so the surrounding types stay honest about the fact that no value was produced:

```ts
const ParsedCount = z.transform((value, ctx) => {
  const parsed = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed)) {
    ctx.issues.push({ code: "custom", message: "Not a number", input: value });

    return z.NEVER;
  }

  return parsed;
});
```

As of 4.4 a transform's context also offers `ctx.addIssue()`, matching the refinement API.

**Guidelines:**

- MUST NOT throw from a transform; push an issue and return `z.NEVER`.
- MUST use `z.preprocess()` rather than `.transform()` when the fix-up has to happen before the schema can validate at all.
- SHOULD annotate a preprocessor's parameter type when the accepted input is narrower than `unknown`, so the schema's input type is not needlessly wide.
- SHOULD keep a transform total and deterministic; it may run in contexts other than the one you wrote it for.

## Overwrite

`.overwrite(fn)` applies a runtime change **without** changing the schema's type or destroying its introspectability. `.transform()` produces an opaque transform node: JSON Schema generation cannot see through it, encoding cannot reverse it, and metadata-driven tooling loses the underlying type.

Where the change is type-preserving — normalising whitespace, rounding, canonicalising case — `.overwrite()` keeps the schema legible to `z.toJSONSchema()` and to anything else that inspects it.

**Guidelines:**

- MUST use `.overwrite()` rather than `.transform()` for a type-preserving change, so introspection and JSON Schema generation still work.
- SHOULD reach for `.transform()` only when the output type genuinely differs from the input type.

## Input Type Versus Output Type

Most schemas have identical input and output types. A schema carrying a transform, a coercion, a default, or a pipe does not, and three helpers name the two sides:

| Helper               | Yields                   |
| -------------------- | ------------------------ |
| `z.input<typeof S>`  | What the schema accepts  |
| `z.output<typeof S>` | What the schema produces |
| `z.infer<typeof S>`  | The same as `z.output`   |

`z.infer` being an alias for the **output** type is the source of a recurring bug class. Three places need the input type and are routinely given the output type instead:

- **A form's default values.** The form holds what the user types, which is the input type. See [forms.md](./forms.md).
- **A request body being constructed.** The sender builds the input type; the receiver's parse produces the output type.
- **A test fixture.** A fixture is input. Typing it as the output type makes it uncompilable as soon as a transform is added. See [testing-schemas.md](./testing-schemas.md).

**Example:**

```ts
const Comment = z
  .object({ body: z.string(), authorName: z.string().nullish() })
  .transform((c) => ({ body: c.body, authorName: c.authorName ?? null }));

type CommentInput = z.input<typeof Comment>; // authorName?: string | null | undefined
type CommentOutput = z.infer<typeof Comment>; // authorName: string | null
```

**Guidelines:**

- MUST use `z.input` for a value being supplied to a schema and `z.output`/`z.infer` for a value the schema produced.
- MUST NOT type a form's values, a constructed request body, or a test fixture with `z.infer` when the schema transforms.
- SHOULD state both types in the module's exports when a schema's two sides are both consumed, so neither call site re-derives them.

## Where Decoding Ends

A transform at a boundary is decoding: turning the producer's shape into the shape the application works with. Renaming a field, collapsing a nullable to a canonical absent value, selecting a nested image size, combining two fields into one.

At some point that becomes business logic — computing a derived total, applying a pricing rule, filtering by permission. Those belong in the domain, not in the schema, for the same reasons a stateful refinement does (see [refinements.md](./refinements.md)): they need context the schema does not have, they are invisible to anyone reading the business code, and they make the schema untestable in isolation.

The workable line: a transform may **reshape** what the producer sent; it may not **decide** anything the domain is responsible for.

**Guidelines:**

- MUST keep a transform to reshaping the producer's data; move a decision requiring domain context into the domain.
- MUST NOT perform I/O inside a transform; that forces async parsing on every consumer (see [refinements.md](./refinements.md)).
- SHOULD prefer a codec to a transform when the reshaping will need to be reversed, since a transform cannot be (see [codecs.md](./codecs.md)).
