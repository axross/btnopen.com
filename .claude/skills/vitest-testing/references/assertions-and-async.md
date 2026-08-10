# Assertions and Async Tests

Apply this reference when choosing a matcher, asserting on a promise, waiting for a value to settle, or writing a custom matcher.

Verified against Vitest 4.1.10 — <https://vitest.dev/api/expect>

## The Three Equality Matchers

`toBe` compares by `Object.is` — reference identity for objects, value for primitives. `toEqual` compares structurally. `toStrictEqual` compares structurally **and** checks types, rejecting sparse arrays and treating a present-but-`undefined` key as different from an absent one.

That last distinction is the one to know: `toEqual` and `toStrictEqual` disagree exactly when a key is present with an `undefined` value, or an array is sparse.

**Guidelines:**

- MUST use `toBe` for primitives and identity; it does not compare structure.
- SHOULD pick between `toEqual` and `toStrictEqual` on whether the `undefined`-key and sparse-array distinction is part of the contract — which assertion a test should make at all is owned by the tool-agnostic unit-testing capability.

## Asymmetric Matchers

Asymmetric matchers match a shape rather than a value, and compose inside `toEqual`, `toMatchObject`, `toHaveBeenCalledWith`, and the other structural matchers: `expect.any`, `expect.anything`, `expect.objectContaining`, `expect.arrayContaining`, `expect.stringContaining`, `expect.stringMatching`, `expect.closeTo`, and `expect.schemaMatching`, which validates against a Standard Schema v1 implementation.

**Guidelines:**

- MUST NOT use `expect.anything()` where a concrete matcher applies; it asserts only that a value is neither `null` nor `undefined`.
- SHOULD use `expect.schemaMatching` rather than a hand-written shape where the project already defines a Standard Schema validator for the type.
- SHOULD consult the tool-agnostic unit-testing capability for how much of a payload an assertion ought to pin; this reference owns the matchers available to do it.

## Promises

`.resolves` and `.rejects` unwrap a promise and **must be awaited**. In Vitest 4 an unawaited one fails the test rather than passing silently, which is a correction — the same code was a false pass before.

An unhandled rejection anywhere fails the run by default, which is what catches a missing `await` on a fire-and-forget call.

```ts
await expect(loadUser(1)).resolves.toMatchObject({ name: "Alice" });
await expect(loadUser(-1)).rejects.toThrow("not found");
```

**Guidelines:**

- MUST `await` every `.resolves` and `.rejects` assertion.
- MUST NOT set `dangerouslyIgnoreUnhandledErrors` to silence a rejection; find the unawaited call.
- MUST make the test function `async` and await it, rather than returning a promise from a chain the runner cannot see.

## Waiting for a Value

Three primitives, with different failure semantics:

| Primitive      | Retries until                | Notes                                                 |
| -------------- | ---------------------------- | ----------------------------------------------------- |
| `vi.waitFor`   | the callback stops throwing  | advances fake timers itself                           |
| `vi.waitUntil` | the callback returns truthy  | a thrown error aborts immediately                     |
| `expect.poll`  | the wrapped assertion passes | no snapshots, no `.resolves`/`.rejects`, no `toThrow` |

**Guidelines:**

- MUST NOT use a fixed sleep in place of these; a sleep is either flaky or slow.
- MUST choose `expect.poll` only for assertions it supports; the excluded forms fail confusingly rather than clearly.
- SHOULD reach for a fake clock before a waiter when the thing being waited on is a timer the test controls.

## Guarding a Test That Asserts Nothing

An assertion inside a callback or a `.then` chain may never run, and the test still passes. `expect.hasAssertions()` and `expect.assertions(n)` close that hole; `expect.unreachable()` marks a branch that should not be taken.

`expect.soft` collects several failures in one run instead of stopping at the first — useful when the assertions are independent, misleading when a later one only makes sense if an earlier one held.

**Guidelines:**

- MUST call `expect.hasAssertions()` in any test whose assertions live inside a callback.
- SHOULD NOT use `expect.soft` for dependent assertions; the cascade of failures obscures the first cause.

## Custom Matchers

`expect.extend` takes matchers returning a `MatcherResult`: `pass`, a `message` function, and optionally `actual` and `expected` to drive the diff. The matcher context exposes `isNot`, `equals`, `utils`, and the current test's name and path.

**Do not branch `pass` on `isNot`** — Vitest inverts the result itself, and doing it twice cancels out.

Registration belongs in `setupFiles`; types come from augmenting the `Matchers` interface in a declaration file included by `tsconfig`.

**Guidelines:**

- MUST NOT alter `pass` based on `isNot`; only the message wording varies with it.
- MUST register custom matchers in `setupFiles` and augment the `Matchers` interface, or they are untyped.
- SHOULD supply `actual` and `expected` so a failure renders a diff rather than only a sentence.
- SHOULD keep to one assertion dialect per project rather than mixing the Chai-style spy assertions with the `expect(...)` forms.
