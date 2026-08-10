# Model Structured Output

Apply this reference when a schema is the output contract for a language-model call, a tool definition, or an agent-facing server's tool parameters.

Verified against `zod@4.4.3` — <https://zod.dev/json-schema>. SDK-specific option names are a lookup against the installed SDK.

## A Schema as the Output Contract

Structured-output APIs take a schema, convert it to JSON Schema, constrain the model's generation with it, and validate the result. That makes the schema do three jobs at once — it is the prompt's specification of the output, the generation constraint, and the runtime check — where an ordinary boundary schema does only the third.

Two consequences follow, and both are covered below: field descriptions become prompt surface rather than documentation, and the schema is subject to whatever subset of JSON Schema the provider's strict mode supports.

Where an SDK wants a raw shape rather than a schema object — several tool-definition APIs do — `satisfies z.ZodRawShape` keeps the object type-checked without wrapping it:

```ts
export const toolParameters = {
  slug: BlogPost.shape.slug.describe("Current slug of the post."),
  locale: Locale.optional().default("ja-JP").describe("Locale to mutate."),
} satisfies z.ZodRawShape;
```

**Guidelines:**

- MUST validate a model's output against the schema even when the provider claims constrained generation; a constrained generation is not a guarantee.
- MUST use `satisfies z.ZodRawShape` rather than an untyped object literal where an SDK takes a raw shape, so the fields are still checked.
- SHOULD look up the installed SDK's own schema option rather than assuming a parameter name, since these APIs move between majors.

## Descriptions Are Prompt Surface

`.describe()` and `.meta()` text is converted into the JSON Schema the model sees. It is therefore **instruction**, not documentation, and should be written as such: what the field means, what units it is in, what to do when the answer is unknown.

The practical difference is that a description worth writing for a human reader ("The post title") is usually worthless to a model, while one that resolves an ambiguity ("The average, as a decimal, over a full turn; 0 when the card produces none") measurably changes output quality.

This is also the highest-value use of metadata in the library, and it interacts with the instance-binding rule in [metadata-and-json-schema.md](./metadata-and-json-schema.md): a description attached before a `.optional()` is lost, and the model never sees it.

**Guidelines:**

- MUST describe every field in a structured-output schema; an undescribed field is an unspecified field.
- MUST write descriptions that resolve ambiguity for a model rather than restating the field name.
- MUST verify descriptions survive into the generated JSON Schema after any derivation, since metadata binds to an instance.
- SHOULD state the expected value for the unknown or not-applicable case in the description, rather than relying on the model to infer it.

## Strict Mode Rejects Some Optionality

A provider's strict structured-output mode supports a subset of JSON Schema. The recurring incompatibility is optionality: `.optional()` and `.nullish()` generate constructs that a strict mode rejects, and the request fails — often reported as a content filter or a generic schema error rather than as the optionality problem it is.

`.nullable()` is the construct that survives. A field that may have no value is modelled as nullable rather than optional, and the absent case becomes an explicit `null` in the output.

Which subset is supported is provider-specific and changes, so the rule is a lookup against the provider's current documentation rather than a fixed list. The symptom is worth recognising: a schema that parses fine locally and is rejected at the API.

**Guidelines:**

- MUST model an absent value as `.nullable()` rather than `.optional()` or `.nullish()` in a schema used with a provider's strict structured-output mode.
- MUST check the provider's current JSON Schema subset when a structured-output request is rejected, before investigating the prompt.
- SHOULD generate and inspect the JSON Schema (see [metadata-and-json-schema.md](./metadata-and-json-schema.md)) when diagnosing a rejected schema, rather than reasoning about it from the Zod source.

## Tying Model Output to the Domain Type

A model's output usually feeds a domain type. Declaring the output schema independently means two definitions of the same field that drift — the domain widens a range, the model schema does not, and the mismatch surfaces as a parse failure at the join.

Reusing the domain schema's own field schemas removes the possibility:

```ts
const result = await generateObject({
  model,
  schema: z.object({
    averageAetherProduction: Card.shape.averageAetherProduction,
    minimumAetherProduction: Card.shape.minimumAetherProduction,
  }),
  prompt,
});
```

**Guidelines:**

- MUST derive a structured-output schema's fields from the domain schema they feed, rather than restating their constraints.
- SHOULD keep the model-facing schema narrow — only the fields being generated — rather than reusing a whole domain object the model does not produce.

## Recovering From Nearly Valid Output

A model returning output that fails the schema is an expected outcome, not an exception. The recovery is to re-prompt with the validation failure, since the issue list names exactly what was wrong and where.

`z.prettifyError()` produces a form suited to that (see [errors.md](./errors.md)). What does not work is hand-patching the output — filling a missing field with a guess, coercing a wrong type — which produces data that passes the schema and is wrong, with nothing recording that it was invented.

A retry loop needs a bound. Without one, a model that cannot satisfy the schema produces an unbounded spend.

**Guidelines:**

- MUST bound the number of repair attempts, and surface a failure rather than looping.
- MUST NOT patch invalid model output into a passing shape; re-prompt or fail.
- SHOULD include the formatted validation failure in the repair prompt, rather than a generic instruction to try again.
- SHOULD accept a caller-supplied schema generically (`<S extends z.ZodType>`) in a generation helper, so the repair loop is written once (see [interop-and-library-code.md](./interop-and-library-code.md)).

## Sanitizing What Goes Back Out

An agent-facing server returning documents has the inverse problem: the response leaves the system, and a field the schema did not model still reaches the caller unless something removes it.

A response schema does that — `z.object()` strips (see [objects-and-collections.md](./objects-and-collections.md)). But where the document's shape varies with query depth, draft state, or locale, a validating response schema fails on legitimate variation and turns a real response into an empty one.

That is the case a total codec exists for; [codecs.md](./codecs.md) owns it and the conditions it carries.

**Guidelines:**

- MUST apply a response-side schema or sanitizer to any document leaving an agent-facing surface; an inbound schema does not constrain what goes out.
- MUST allowlist the fields that may leave, rather than denylisting the ones that may not.
- SHOULD reach for a total codec, per [codecs.md](./codecs.md), where a validating response schema would fail on legitimate query-depth, draft, or locale variation.
