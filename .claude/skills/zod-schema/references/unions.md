# Unions

Apply this reference when a value arrives in more than one shape, when combining two schemas that must both hold, or when deciding whether a union is the right model at all.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## Prefer a Discriminated Union

`z.discriminatedUnion("kind", [...])` models a payload whose branches are told apart by a single field. It is the default choice for any tagged shape, and it beats a plain `z.union()` on three axes at once:

- **Narrowing.** The inferred type is a discriminated union TypeScript can narrow in a `switch`, so downstream code needs no type guards.
- **Errors.** A failure reports against the branch the discriminator selected, so the message names the actual problem rather than listing every branch that did not match.
- **Speed.** One field read selects the branch, rather than attempting each branch in order.

A plain `z.union()` over tagged objects gives up all three for no gain.

**Example:**

```ts
export const FetchResult = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: BlogPost }),
  z.object({ status: z.literal("failed"), error: z.string() }),
]);
```

**Guidelines:**

- MUST use `z.discriminatedUnion()` rather than `z.union()` whenever the branches share a field that identifies them.
- MUST NOT introduce a discriminator field into a payload the producer does not send; a discriminated union describes the wire format, it does not impose one.
- SHOULD add a discriminator to a shape you control when it is currently distinguished only by which optional fields are present.

## What a Discriminator Has to Be

The discriminating field must be a literal — or a set of literals — in every branch. Zod 4 widened what is acceptable around that: a discriminated union may now contain **nested unions**, **pipes**, and **other discriminated unions**, so composing one from smaller ones works rather than requiring a flattened list.

Where the branches genuinely cannot be told apart by one field, `z.union()` is correct. Its failure lists what every branch objected to, which is verbose but honest — nothing else could be said.

**Guidelines:**

- MUST ensure every branch fixes the discriminator to a literal value; a branch where it is a free `z.string()` cannot be selected.
- SHOULD compose a large discriminated union from smaller ones rather than maintaining one flat list of branches.
- SHOULD use `z.union()` only when no single field distinguishes the branches, and expect its error to be less specific.

## Exclusive Unions

`z.xor([...])` requires **exactly one** branch to match. Zero matches fail, as in any union — and so do two or more.

That second property is what it is for. A union of overlapping object shapes silently accepts a value satisfying both, and the branch that wins is an ordering accident. `z.xor()` turns that ambiguity into a parse failure, which is usually the correct outcome: a payload matching both a card-payment shape and a bank-payment shape is malformed, not merely ambiguous.

A schema that fails `z.xor()` where you expected it to pass is telling you the branches overlap. That is a modelling finding, not a validation inconvenience.

**Guidelines:**

- MUST use `z.xor()` where branches are mutually exclusive by contract and a value matching two is a defect.
- MUST NOT use `z.xor()` merely as a stricter-sounding `z.union()`; overlapping branches that are legitimately overlapping will fail.
- SHOULD treat an unexpected `z.xor()` failure as evidence that two branches need distinguishing fields, rather than relaxing it to `z.union()`.

## Intersections

`z.intersection(a, b)` requires both schemas to hold. It is the narrower tool it appears to be, and has one behaviour worth knowing: when the two results cannot be merged, it throws a plain `Error`, **not** a `ZodError`. Code that catches only `ZodError` around a parse will not catch it.

For two object schemas, `.extend()` is almost always the better construct — it produces one object schema with a known shape, keeps the object methods available, and cannot produce an unmergeable result.

**Guidelines:**

- MUST combine two object schemas with `.extend()` rather than `z.intersection()` unless one of them is not an object schema.
- MUST expect a plain `Error` rather than a `ZodError` from an unmergeable intersection, and not rely on `safeParse` to contain it.
- SHOULD avoid intersecting schemas that both transform, where the merge semantics are hard to reason about.

## The Union That Should Have Been One Object

A frequent modelling error is a union of shapes differing only in which optional fields are present. It produces a type that is awkward to narrow, an error listing every branch, and a parse that tries each in turn.

The question worth asking is whether the branches represent genuinely different **kinds** of thing, or one kind with varying completeness. Different kinds justify a union — ideally discriminated. Varying completeness is one object with optional fields, and reads better as one.

**Guidelines:**

- MUST model varying completeness of one concept as a single object with optional fields, not as a union of shapes.
- SHOULD reach for a union only when the branches differ in kind, and add a discriminator when the producer can supply one.
