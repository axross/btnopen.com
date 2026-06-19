# Spec Structure And Naming

The Jest output should read like a behavior report. The full test name is the concatenation of `describe(...)` and `it(...)`, so use the outer subject for the exported contract and the scenario name for condition plus expected behavior.

**Good:**

```ts
describe("deleteNodeInBlogPostBodyTool()", () => {
	describe("when delete location is invalid", () => {
		it("rejects negative indexes without updating the post", async () => {
			// arrange
			// act
			// assert
		});

		it("rejects out-of-range indexes without updating the post", async () => {
			// arrange
			// act
			// assert
		});
	});
});
```

**Avoid:**

```ts
describe("deleteNodeInBlogPostBodyTool", () => {
	test("deleteNodeInBlogPostBodyTool handles bad input", async () => {
		// vague condition, repeated subject, no callable suffix, and test(...)
	});
});
```

**Guidelines:**

- MUST import Jest APIs from `@jest/globals`; this includes `afterEach`, `beforeEach`, `describe`, `expect`, `it`, `jest`, and any other Jest API used in the file.
- MUST use `it(...)` for scenarios and MUST NOT use `test(...)`.
- MUST group scenarios with `describe(...)` by the exported function, method, custom MCP tool object, schema, codec, object contract, or type contract under test.
- MUST suffix function, method, or custom MCP tool definition names in `describe(...)` or `it(...)` titles with `()`, such as `describe("formatLocation()")`, `describe("deleteNodeInBlogPostBodyTool()")`, or `it("calls sanitize()")`.
- MUST NOT suffix non-callable schemas, codecs, object contracts, or type names with `()`, such as `describe("McpBlogPostResponse")`.
- MUST write `it(...)` names as sentence-like behavior statements that describe what the scenario verifies or ensures.
- MUST NOT repeat the outer `describe(...)` subject in every child `it(...)` name.
- MUST name condition-specific scenarios with the relevant condition, such as `when input is a paginated response`, `when location is invalid`, or `when draft mode is enabled`.
- MUST group multiple scenarios that share the same condition or situation under a nested `describe("when ...")` block.
- SHOULD split one broad `it(...)` into multiple scenarios when it verifies different conditions, such as `null` vs primitive input, negative vs out-of-range indexes, or paginated vs single-document input.

## Adapting Method State Expected Naming

Some unit-testing guidance recommends names shaped like `method_state_expected`. In this project, that maps to nested Jest names instead of one long string.

| Generic idea | Project shape |
|---|---|
| method | outer `describe("methodName()")` |
| state | nested `describe("when ...")` or a `when ...` clause in `it(...)` |
| expected | child `it("returns...", "throws...", "preserves...", "rejects...")` |

**Examples:**

```ts
describe("getErrorMessage()", () => {
	it("returns the message when the thrown value is an Error instance", () => {
		expect(getErrorMessage(new Error("Failed"))).toBe("Failed");
	});
});
```

```ts
describe("BlogPostBodyMutationParametersBase", () => {
	describe("when location is invalid", () => {
		it("rejects fractional location indexes", () => {
			expect(() => Parameters.parse({ slug: "hello", location: [1.5] })).toThrow(
				z.ZodError,
			);
		});
	});
});
```

**Guidelines:**

- SHOULD use the full Jest output name to preserve method, condition, and expected behavior without repeating the method name in every `it(...)`.
- SHOULD use shallow condition grouping; avoid deeply nested `describe(...)` blocks that make setup hard to track.
- SHOULD avoid `beforeEach(...)` for mutable setup unless repeated setup is truly incidental and the scenario-specific inputs remain obvious.
