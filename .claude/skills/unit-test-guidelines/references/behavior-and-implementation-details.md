# Behavior And Implementation Details

A unit test should fail when the public behavior breaks and keep passing when the implementation is refactored without changing behavior. This is the practical boundary from implementation-detail-free testing: test the unit like a real caller uses it.

**Good:**

```ts
describe("findBlogPostBySlug()", () => {
	it("returns null when no document matches the slug", async () => {
		const req = {
			payload: {
				find: async () => ({ docs: [] }),
			},
			user: { id: 1 },
		} as unknown as PayloadRequest;

		await expect(
			findBlogPostBySlug(req, "missing", {
				draft: false,
				locale: "en-US",
				select: { id: true },
			}),
		).resolves.toBeNull();
	});
});
```

**Avoid:**

```ts
// Avoid importing private helpers only to reach an internal branch.
// Avoid asserting temporary variable names or exact local branch order.
// Avoid checking a mocked dependency call unless that call shape is part of the contract.
```

**Guidelines:**

- MUST exercise exported functions, exported schemas, exported tool objects, or documented side effects.
- MUST NOT assert private helper names, local variable names, intermediate implementation steps, or source-code structure.
- MUST NOT mock the module under test or its internal helper imports to force a branch.
- SHOULD choose inputs that naturally reach the branch or failure mode a caller cares about.
- SHOULD assert call options only when the downstream call shape is part of the behavior, such as Payload access flags, locale, draft mode, selected collection, or preserved `_status`.
- SHOULD assert stable error contracts, not every word of a third-party formatter unless the exact text is part of this project's API.
- SHOULD keep one primary act per scenario; split tests when they call different methods, trigger different events, or verify unrelated outcomes.

## Arrange Act Assert

AAA is useful when it keeps tests readable, but do not turn it into noisy comments. The test body should have clear phases even when comments are unnecessary.

**Good:**

```ts
it("preserves published status when updating a published post outside draft mode", async () => {
	const body = createBody();
	let receivedOptions: PayloadUpdateOptions | undefined;
	const req = createUpdateRequest((options) => {
		receivedOptions = options;
		return { id: options.id, body: options.data.body, _status: options.data._status };
	});

	const result = await updateBlogPostBody(
		req,
		{ id: 42, slug: "hello-world", _status: "published" } as BlogPost,
		body,
		{ draft: false, locale: "ja-JP" },
	);

	expect(result._status).toBe("published");
	expect(receivedOptions?.data._status).toBe("published");
});
```

**Guidelines:**

- SHOULD order tests as arrange, act, assert when the unit has setup, execution, and verification phases.
- MUST NOT add empty AAA comments when spacing and variable names already make the phases obvious.
- MUST NOT include loops, conditionals, retries, or branching inside a test unless the branching itself is the unit's public behavior.
- SHOULD split a test if it needs multiple unrelated acts or assertions for unrelated outcomes.

## Caller Perspective Checklist

Use this checklist before adding an assertion:

1. Who calls this export?
2. What input, action, or event does that caller control?
3. What result, error, or side effect can that caller observe?
4. Would the caller care if the implementation changed but this observation stayed the same?

**Guidelines:**

- SHOULD rewrite tests that fail the caller-perspective checklist.
- SHOULD prefer an observable result over an internal call count.
- SHOULD prefer a real parser/schema decode over a hand-maintained mock shape when the schema is the behavior.
