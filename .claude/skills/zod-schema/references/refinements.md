# Refinements

Apply this reference when adding a constraint no built-in check expresses, reporting a validation error against a specific field, controlling when a check runs, or validating against something asynchronous.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## Three Levels of Custom Check

| API              | Use it for                                                           |
| ---------------- | -------------------------------------------------------------------- |
| `.refine()`      | One predicate, one message. The default.                             |
| `.superRefine()` | Several issues from one check, or a non-`custom` issue code.         |
| `.check()`       | The low-level path, when a measurement showed the others too costly. |

`.refine()` takes a predicate returning a falsy value to signal failure, plus an options object carrying `error`, `path`, `abort`, and `when`.

The single most important property of all three: **a refinement must never throw**. A thrown error is not a validation failure — it escapes `safeParse`, which is documented to return a result rather than throw, and it will surface somewhere that has no idea a validation was running.

**Example:**

```ts
const Password = z
  .object({ password: z.string(), confirm: z.string() })
  .refine((data) => data.password === data.confirm, {
    error: "Passwords don't match",
    path: ["confirm"],
  });
```

**Guidelines:**

- MUST return a falsy value from a refinement to signal failure; never throw from inside one.
- MUST keep a refinement pure and side-effect free — it may run more than once, including in both directions of a codec.
- SHOULD use `.refine()` unless several issues or a specific issue code are needed, and reach for `.check()` only against a measured cost.

## Reporting Against the Right Field

`path` on a refinement's options decides which field the resulting issue is attached to. Without it, a cross-field check on an object attaches its error to the object itself, where a form has no input to render it against.

This is the contract between a schema and a form's per-field error display, and it is the most common reason a validation message appears in the wrong place or nowhere at all — see [forms.md](./forms.md).

`.superRefine()` extends this to multiple issues: `ctx.addIssue()` may be called repeatedly, each with its own `code`, `path`, and message, so one check reports every problem it found rather than the first.

**Example:**

```ts
const UniqueTags = z.array(z.string()).superRefine((value, ctx) => {
  if (value.length !== new Set(value).size) {
    ctx.addIssue({
      code: "custom",
      message: "No duplicates allowed.",
      input: value,
    });
  }
});
```

**Guidelines:**

- MUST set `path` on a cross-field refinement so the issue lands on the field a user can correct.
- MUST use `.superRefine()` rather than chained `.refine()` calls when the checks are independent and the caller should see all failures at once.
- SHOULD choose the issue `code` that describes the failure — `too_big`, `invalid_value` — rather than defaulting everything to `custom`, so a consumer can branch on it.
- SHOULD include `input` in an added issue only where the value is safe to surface (see [security-posture.md](./security-posture.md)).

## Controlling When a Check Runs

Two options govern execution rather than outcome:

- **`abort: true`** stops the chain at this refinement, so later checks do not run against a value already known to be invalid.
- **`when(payload)`** — available on `.superRefine()` as of 4.4 — skips the check entirely unless the predicate holds.

`when` solves a specific and common annoyance: a cross-field check whose inputs are themselves invalid produces a second, confusing error on top of the real one. Gating the check on the relevant fields having parsed suppresses that.

**Guidelines:**

- MUST NOT gate a security-relevant check behind `when`; a skipped check is not a passed one.
- SHOULD use `when` to suppress a cross-field check whose inputs have not themselves validated, so the caller sees the root failure alone.
- SHOULD use `abort` when a later check would be meaningless or expensive against a value this one already rejected.

## Asynchronous Refinements

A refinement may be `async`. Doing so has a consequence that reaches every caller: the schema can then **only** be parsed with `.parseAsync()` or `.safeParseAsync()`, and a synchronous parse against it fails at runtime.

That cost is worth weighing before adding one. A uniqueness check against a database inside a schema turns every parse of that schema — including in tests, in unrelated code paths, and in any consumer that composed it into a larger object — into an async operation with a network dependency.

Usually the better structure is to keep the schema synchronous and perform the lookup in the calling code, where the failure can be handled with the domain's own error type. See [parsing.md](./parsing.md) for the parse-method consequences.

**Guidelines:**

- MUST use `.parseAsync()` or `.safeParseAsync()` for any schema containing an async refinement or transform, at every call site.
- MUST NOT add an async refinement to a widely composed schema without accounting for every existing synchronous parse of it.
- SHOULD perform an external lookup in the calling code rather than inside a refinement, so the schema stays synchronous and the failure carries a domain error.

## Where a Rule Does Not Belong

A refinement is for constraints intrinsic to the **shape** of the data: a password confirmation matching, a date range ordered correctly, a list without duplicates. It is not for business rules that depend on state outside the value — permissions, quotas, workflow position, whether a name is already taken.

Putting those in a schema produces three problems: the schema now needs context it was not given, the failure surfaces as a validation error rather than a domain outcome, and the rule is invisible to anyone reading the business logic.

**Guidelines:**

- MUST keep a rule requiring external state or context out of a schema; it belongs in the code that owns that state.
- SHOULD express a constraint as a built-in check where one exists, rather than reimplementing it in a refinement.
- SHOULD move a refinement into domain logic when it starts needing arguments the schema cannot supply.
