# Schemas And Type Contracts

Schema modules should be tested with real valid and invalid inputs. Type-only modules should still have compile-time coverage when they define reusable public contracts.

**Zod Defaults Example:**

```ts
describe("BlogPostBodyMutationParametersBase", () => {
	it("applies locale and draft defaults when optional parameters are omitted", () => {
		const params = Parameters.parse({
			slug: "hello-world",
			location: [0],
		});

		expect(params.locale).toBe("ja-JP");
		expect(params.draft).toBe(false);
	});
});
```

**Codec Decode Example:**

```ts
describe("McpBlogPostResponse", () => {
	it("decodes collection results when input is a paginated response", () => {
		expect(
			z.decode(McpBlogPostResponse, {
				totalDocs: 1,
				docs: [{ id: 1, slug: "hello", _status: "draft" }],
			}),
		).toMatchObject({
			totalDocs: 1,
			docs: [{ id: 1, slug: "hello", status: "draft" }],
		});
	});
});
```

**Type Contract Example:**

```ts
const response = {
	content: [{ type: "text", text: "ok" }],
} satisfies McpTextResponse;

expect(response.content).toEqual([{ type: "text", text: "ok" }]);
```

**Guidelines:**

- MUST test Zod defaults, accepted values, rejected values, and decoded output shape for public schemas/codecs.
- SHOULD include at least one collection/list-shaped input when a schema supports both single documents and collection responses.
- SHOULD test encode behavior when the codec's encoded output is part of the public contract, such as mapping `status` back to `_status`.
- SHOULD use `satisfies` in specs for exported TypeScript interfaces and type aliases that have no runtime representation.
- MUST NOT duplicate the entire schema in the assertion; assert behavior future edits could accidentally break.
- SHOULD prefer real schema parsing or decoding over hand-maintained mock return shapes when the schema is the unit under test.
- SHOULD group schema specs by schema or codec name without `()`, because schemas and codecs are object contracts rather than callable functions in test titles.

## Invalid Input Cases

Invalid input tests should name the rejected condition and should not combine unrelated invalid inputs unless the same condition is being parameterized.

**Good:**

```ts
describe("when location is invalid", () => {
	it("rejects an empty location array", () => {
		expect(() => {
			Parameters.parse({ slug: "hello-world", location: [] });
		}).toThrow(z.ZodError);
	});

	it("rejects fractional location indexes", () => {
		expect(() => {
			Parameters.parse({ slug: "hello-world", location: [1.5] });
		}).toThrow(z.ZodError);
	});
});
```

**Guidelines:**

- MUST name the invalid condition in the `it(...)` title or enclosing `describe("when ...")` block.
- SHOULD split unrelated invalid conditions into separate scenarios.
- MAY use `it.each(...)` for a table of equivalent invalid cases, but MUST keep the table small and the case label readable.
- MUST NOT use `test.each(...)`; use `it.each(...)` if table-driven cases are justified.
