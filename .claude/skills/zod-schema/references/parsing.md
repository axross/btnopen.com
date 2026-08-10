# Parsing

Apply this reference when choosing a parse method, placing a parse call, converting a validation failure into a domain error, or deciding what a failed parse should record.

Verified against `zod@4.4.3` — <https://zod.dev/basics>.

## Throwing or Returning

| Method              | On failure                          | Use it when                                   |
| ------------------- | ----------------------------------- | --------------------------------------------- |
| `.parse(value)`     | Throws a `ZodError`                 | A failure is a bug and should propagate       |
| `.safeParse(value)` | Returns `{ success: false, error }` | A failure is an expected outcome to branch on |

The choice follows from **who is at fault when it fails**. A response from a service you control that does not match its own contract is a bug: `.parse()` throws, an error tracker records it, and nobody writes a branch pretending it was expected. A form submission from a user is not a bug: `.safeParse()` returns a result, and the caller renders the errors.

The middle case — a third-party API whose shape may drift — is a judgment call. `.safeParse()` is usually right there, because it forces the caller to decide what a drifted response means rather than letting an exception escape into a render.

`.safeParse()` returns a discriminated union, so `result.success` narrows to `result.data` or `result.error` without a cast.

**Guidelines:**

- MUST use `.safeParse()` where a failure is an expected outcome the caller must handle, and `.parse()` where a failure is a defect.
- MUST NOT wrap `.parse()` in a `try`/`catch` that swallows the error to emulate `.safeParse()`; use `.safeParse()`.
- MUST NOT ignore the `success` discriminant and read `.data` optimistically.
- SHOULD prefer `.safeParse()` at any boundary whose producer you do not control.

## Asynchronous Parsing

`.parseAsync()` and `.safeParseAsync()` are **required** — not merely available — for any schema containing an async refinement or transform. A synchronous parse against such a schema fails at runtime, and the failure names the async check rather than the call site, so it reads as a schema problem rather than a call problem.

The obligation is transitive: composing a schema with an async check into a larger object makes the larger schema async too, and every existing synchronous parse of that larger schema breaks. See [refinements.md](./refinements.md) for why keeping the lookup out of the schema is usually the better structure.

A **promise is never the thing parsed**. `z.promise()` is deprecated, and the replacement is to await the value and parse what it resolved to. A schema wrapping a promise buys nothing — the shape worth validating is the resolved value's, awaiting first keeps the parse synchronous, and a rejection is then an ordinary error at the `await` rather than a validation failure with no stack.

```ts
const body: unknown = await response.json();
const parsed = BlogPost.parse(body);
```

**Guidelines:**

- MUST use the async parse methods for any schema containing an async check, at every call site including tests.
- MUST audit existing parse call sites before composing an async schema into a shared one.
- MUST await a promise and parse its resolved value rather than reaching for the deprecated `z.promise()`.

## The Result Is a Clone

A successful parse returns a **deep clone**, not the input. Two consequences follow:

- **Identity is not preserved.** A reference comparison between the input and the output fails, and any object identity the caller was relying on — a cache key, a `Map` entry, a React dependency — is broken.
- **The cost is proportional to the payload.** Parsing a large object copies it. On a hot path over a large document, that copy can dominate the validation itself.

Neither is a reason to avoid parsing; both are reasons to parse once, at the boundary, rather than repeatedly (see [validation-boundary.md](./validation-boundary.md)).

**Guidelines:**

- MUST NOT rely on reference identity between a parse's input and its output.
- SHOULD account for the clone when parsing a large payload in a hot path, rather than assuming validation is the only cost.

## Keeping the Library Out of Domain Signatures

A `ZodError` escaping into a domain function's signature couples every caller to the validation library. The function's contract becomes "this may throw something from Zod", which the caller cannot handle meaningfully and which changes if the library is ever replaced.

The boundary is where the remapping happens: catch or branch on the validation failure and produce the domain's own error — a typed result, a domain error class, a null with a logged cause — so the library's type stops at the boundary module.

**Example:**

```ts
export async function lookupWord(lemma: string): Promise<DictionaryEntry[]> {
  const response = await fetch(endpoint(lemma));
  const result = DictionaryResponse.safeParse(await response.json());

  if (!result.success) {
    throw new DictionaryLookupError(
      `Dictionary response for "${lemma}" did not match the expected schema.`,
      { cause: result.error },
    );
  }

  return result.data;
}
```

**Guidelines:**

- MUST convert a validation failure into the domain's own error type at the boundary, rather than letting `ZodError` propagate into callers.
- MUST attach the original error as a `cause` when remapping, so the detail survives for diagnosis.
- SHOULD keep the remapping in the same module as the schema and the parse, so all three move together.

## Where a Parse Belongs

| Placement                                             | Correct?                               |
| ----------------------------------------------------- | -------------------------------------- |
| A repository or data-access function, on the response | Yes — the boundary                     |
| A store converter's read and write halves             | Yes — the boundary                     |
| A route handler, on the request body or parameters    | Yes — the boundary                     |
| A query or mutation function, on the fetched payload  | Yes — the boundary                     |
| A test helper, on a fixture read from a real service  | Yes — the boundary                     |
| A component, on props                                 | No — the compiler already checked them |
| A render path, on data parsed at its boundary         | No — repeated cost, no added guarantee |
| An internal function, on its own arguments            | No — asserting the compiler is broken  |

**Guidelines:**

- MUST place the parse in the module that owns the boundary, not in the consumer that first reads the value.
- MUST NOT parse component props or internal function arguments.
- SHOULD parse in a test helper that reads from a real service, so a contract drift fails the test rather than producing a confusing assertion failure.

## What a Failure Records

A failed parse is a diagnostic event and should be logged as one. Two constraints govern the content:

- **Log enough to identify the boundary and the shape problem**: which schema, which boundary, which identifier was being fetched, and the issue paths.
- **Do not log the offending value**, which is the untrusted input itself and may contain credentials, personal data, or an entire request body. The `reportInput` option that embeds it in issues is discussed in [errors.md](./errors.md), and the same reasoning applies to logging.

The identifiers that make a failure reproducible — the slug, the record id, the endpoint — are what belong in the log line.

**Guidelines:**

- MUST log a parse failure with the boundary, the schema, and the issue paths, rather than silently returning a fallback.
- MUST NOT log the raw input that failed to parse.
- SHOULD include the identifiers that make the fetch reproducible, so the failure can be investigated without the payload.
