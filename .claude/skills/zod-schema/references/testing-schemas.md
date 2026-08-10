# Testing Schemas

Apply this reference when writing a fixture for a schema, asserting a parse failure, or round-tripping a codec.

Verified against `zod@4.4.3` — <https://zod.dev/ecosystem>.

What counts as adequate coverage — which schemas and codecs earn a test, what a rejection test must assert, and whether an encoded output is part of the public contract — belongs to a unit-testing capability. This reference owns only the Zod-specific mechanics of writing those tests.

## What Zod Already Tests

The coverage floor is a unit-testing capability's, and it is unconditional there. What is Zod-specific is a line inside it: the library's own checks are already tested by the library, so a test asserting that `z.email()` rejects `"nope"` or that `z.int()` rejects `1.5` measures Zod, not the schema.

What is worth asserting is the part the schema's author chose — an optionality decision, a transform's output, a refinement's verdict, a codec's encode direction. Those are hand-written, so they are where a schema is wrong.

**Guidelines:**

- MUST NOT write a test that asserts one of Zod's own built-in checks works; the assertion belongs to the library's suite, not the project's.
- MUST target an assertion at what the schema's author decided — an optionality choice, a transform, a refinement — rather than at a constructor's documented behaviour.

## Fixtures Are Input

A fixture is what goes **into** a parse, so it is typed with `z.input<typeof Schema>`, not `z.infer` (see [transforms-and-pipes.md](./transforms-and-pipes.md)).

Typing a fixture with the output type works until the schema gains a transform, at which point every fixture fails to compile — or, worse, keeps compiling because the two types happen to coincide and silently stops representing what a producer sends.

**Example:**

```ts
type BlogPostInput = z.input<typeof BlogPost>;

const baseBlogPost: BlogPostInput = {
  slug: "example-post",
  title: "Example post",
  coverImage: null,
  publishedAt: "2026-05-04T00:00:00.000Z",
};
```

A branded schema (see [schema-modules.md](./schema-modules.md)) adds a wrinkle: a branded value cannot be written as a literal, so a fixture holding one must be produced by parsing. That is the cost of branding, and it is paid in the fixtures.

**Guidelines:**

- MUST type a fixture with `z.input<typeof Schema>`.
- MUST build a fixture from a real observed payload where one is available, rather than from the schema's own field list — a fixture derived from the schema cannot detect that the schema is wrong.
- SHOULD construct variant fixtures by spreading a base fixture, so a new required field breaks one declaration rather than twenty.

## Assert the Failures

A unit-testing capability owns how much rejection coverage a schema needs. What is Zod-specific is how a rejection is asserted, and the paired form that keeps a relaxation bounded — one test that a permitted edge case is accepted, one that a neighbouring case is still rejected:

```ts
it("accepts a null cover image so autosaved drafts still parse", () => {
  expect(BlogPost.parse({ ...base, coverImage: null }).coverImage).toBeNull();
});

it("still rejects a cover image missing its Open Graph size", () => {
  const { sizes: _omitted, ...withoutSizes } = coverImage;

  expect(() => BlogPost.parse({ ...base, coverImage: withoutSizes })).toThrow();
});
```

**Guidelines:**

- MUST assert a Zod rejection through `.safeParse().success` or by expecting `.parse()` to throw, not by asserting on the thrown value's shape.
- MUST pair a relaxation with a test that the neighbouring case is still rejected, so the relaxation is bounded.
- SHOULD assert on the issue `path` or `code` rather than the message, which is localizable (see [errors.md](./errors.md)).

## Round-Tripping a Codec

Whether a codec's encoded output is part of the public contract, and so earns a test, is a unit-testing capability's call. What Zod adds is a reason that call is easy to get wrong: a codec's read half is exercised by every read path, its write half usually is not, and the asymmetries in [codecs.md](./codecs.md) mean a passing decode implies nothing at all about encode.

The Zod-specific shape of the test is a round trip through the codec's own two directions — `.encode()` over a `.decode()` result — which catches the field the decode side reads and the encode side forgets.

**Guidelines:**

- MUST round-trip through the codec's own `.decode()` and `.encode()` rather than re-implementing either direction in the test.
- MUST assert what a deliberately lossy codec drops, rather than treating a failed round trip as the test being wrong.
- SHOULD exercise `z.invertCodec()` separately where the inverted codec is used anywhere in the codebase, since inversion is its own construct.

## Generated and Fuzzed Data

Tools exist to generate values from a schema — for fuzzing, and for mock data. They are useful for what they can establish and routinely over-credited.

What they establish: the schema does not throw unexpectedly on values it should accept, and a downstream consumer handles the range of shapes the schema permits.

What they cannot establish: that the schema matches what the producer actually sends. Generated data is derived **from the schema**, so it can never detect that the schema is wrong — which is the failure mode that reaches production. A real observed payload is the only fixture that can.

**Guidelines:**

- MUST NOT rely on schema-generated data as the primary fixture for a boundary; it cannot detect a wrong schema.
- SHOULD use generated data to exercise a consumer across the range a schema permits, alongside real observed fixtures.
- SHOULD check a generation tool's supported Zod version before adopting it, since these tools trail the library.
