# Fixtures, Fakes, And AHA

AHA testing means "avoid hasty abstraction." Do not extract a setup helper just because two tests share a few lines. Extract when the helper makes the scenario easier to read by hiding incidental framework shape while preserving the meaningful input, action, and expected result.

**Good Local Helper:**

```ts
function createDeleteRequestWithBody(body: BlogPost["body"]): {
	req: PayloadRequest;
	wasUpdateCalled: () => boolean;
} {
	let updateCalled = false;
	const req = {
		payload: {
			find: async () => ({ docs: [{ id: 1, slug: "hello", body }] }),
			update: async () => {
				updateCalled = true;
				return {};
			},
		},
		user: { id: 1 },
	} as unknown as PayloadRequest;

	return { req, wasUpdateCalled: () => updateCalled };
}
```

**Avoid Opaque Helper:**

```ts
const { req } = setup({ mode: "bad-location-case-2" });
```

**Guidelines:**

- MUST build fixtures that satisfy the real schema or parser used by the unit under test.
- SHOULD keep fixture factories local to the spec file until at least two spec files need the same factory or the helper names a real shared test boundary.
- SHOULD create setup helpers when they reveal meaningful inputs, outputs, or side effects better than repeated inline setup.
- MUST NOT hide the condition under test behind generic helper options, nested conditionals, magic modes, or opaque fixture factories.
- SHOULD inline setup when the repeated code is short and the differences between scenarios are more important than the duplication.
- SHOULD name magic values with local constants when the value itself explains the condition, such as `fractionalLocationIndex`, `invalidMediaRelation`, or `missingSlug`.

## Payload And Framework Fakes

Payload request objects are large framework-owned boundaries. Unit tests should fake the smallest part of the boundary the unit actually calls.

**Good:**

```ts
interface PayloadFindOptions {
	collection: string;
	draft?: boolean;
	fallbackLocale?: false;
	locale?: "en-US" | "ja-JP";
	where?: {
		slug?: {
			equals?: string;
		};
	};
}

const req = {
	payload: {
		find: async (options: PayloadFindOptions) => {
			expect(options.collection).toBe("blog-posts");
			return { docs: [{ id: 1, slug: "hello-world" }] };
		},
	},
	user: { id: 1 },
} as unknown as PayloadRequest;
```

**Guidelines:**

- MUST type fake boundary options with small local interfaces rather than broad `any`.
- SHOULD use `as unknown as ExternalType` only at the final boundary when mocking framework objects that are too large to construct fully.
- SHOULD assert fake boundary options when those options are part of the unit's public behavior.
- MUST keep tests independent: each scenario creates its own mutable data, fakes, and captured side effects unless a shared immutable constant is sufficient.
- SHOULD avoid `beforeEach(...)` for mutable fake state because it makes each scenario's starting state less visible.

## Mocks And Spies

Mocks are useful for expensive, external, nondeterministic, or framework-owned boundaries. They are not a shortcut for changing the unit's internal path.

**Guidelines:**

- SHOULD use manual fakes for Payload request objects, filesystem/network boundaries, clocks, and loggers.
- SHOULD NOT mock neighboring pure helpers unless the test specifically covers how the unit handles that dependency's failure.
- MUST keep `jest.mock(...)` declarations visible near the imports they affect.
- MUST import `jest` from `@jest/globals` before using `jest.fn`, `jest.mock`, `jest.spyOn`, or `jest.mocked`.
- SHOULD prefer typed mocks, for example `jest.fn<() => Promise<Result>>()`, when a mock has non-trivial arguments or return values.
- SHOULD restore spies and replaced globals in `afterEach` imported from `@jest/globals`.
