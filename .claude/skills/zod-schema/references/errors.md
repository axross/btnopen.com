# Errors

Apply this reference when reading a validation failure, reshaping it for a caller, replacing a default message, localizing messages, or deciding what a message may contain.

Verified against `zod@4.4.3` — <https://zod.dev/error-customization>.

## The Error Shape

A `ZodError` carries an `issues` array. Each issue has a `code`, a `path` array locating it in the parsed structure, a `message`, and code-specific fields — `expected` on a type mismatch, `keys` on unrecognised keys, `maximum` on a bound.

`path` is the load-bearing part. It is how a nested failure is located, and it is the contract between a schema and any per-field error display (see [forms.md](./forms.md)).

Several accessors are gone or deprecated and still appear in code copied from a Zod 3 source. As in [version-and-packages.md](./version-and-packages.md), read this from what is in the code to what replaces it:

| Found in the code                  | Write instead      |
| ---------------------------------- | ------------------ |
| `error.errors`, `error.formErrors` | `error.issues`     |
| `error.format()`                   | `z.treeifyError()` |
| `error.flatten()`                  | `z.flattenError()` |
| `error.addIssue()`, `.addIssues()` | push to `issues`   |
| `z.formatError()`                  | `z.treeifyError()` |

**Guidelines:**

- MUST read failures from `error.issues`; the `.errors` and `.formErrors` aliases no longer exist.
- MUST NOT introduce the deprecated `error.format()` or `error.flatten()` methods in new code.
- SHOULD branch on an issue's `code` rather than matching its `message`, which is localizable and not a stable identifier.

## Reshaping a Failure for a Caller

Three functions convert the flat issue list into the shape a particular consumer needs (see the [error-formatting reference](https://zod.dev/error-formatting)):

| Function            | Produces                                                                   |
| ------------------- | -------------------------------------------------------------------------- |
| `z.treeifyError()`  | A nested object mirroring the schema, with `errors`, `properties`, `items` |
| `z.flattenError()`  | `{ formErrors, fieldErrors }` — only useful for a single-level schema      |
| `z.prettifyError()` | A human-readable string with the failing paths marked                      |

Pick by consumer: a nested form wants the tree, a flat form wants the flattened shape, a log line or a CLI wants the pretty string. `z.flattenError()` on a nested schema silently loses the nesting, which is the usual reason a deep field's error goes missing.

**Guidelines:**

- MUST use `z.treeifyError()` rather than `z.flattenError()` for a schema with nested objects or arrays.
- SHOULD use `z.prettifyError()` for a log line, a test failure, or a developer-facing message rather than assembling one from `issues`.
- SHOULD keep the transport shape of a validation failure stable across an API, so clients are not rewritten when a schema gains nesting.

## Customizing a Message

Zod 4 replaced four separate mechanisms with one `error` parameter, accepted by nearly every API. It takes a string, or a function receiving the issue.

| Found in the code    | Write instead                            |
| -------------------- | ---------------------------------------- |
| `{ message: "…" }`   | `{ error: "…" }`                         |
| `invalid_type_error` | `error` callback branching on `iss.code` |
| `required_error`     | `error` callback branching on `iss.code` |
| `errorMap`           | `error` callback                         |

An `error` callback may return `undefined` to decline, which falls through to the next level of customization rather than producing an empty message.

**Example:**

```ts
const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
  error: "Use lowercase letters, numbers, and hyphens.",
});
```

**Guidelines:**

- MUST use the `error` parameter; `message`, `invalid_type_error`, `required_error`, and `errorMap` are deprecated.
- MUST return `undefined` from an `error` callback for cases it does not handle, rather than an empty string.
- SHOULD write a message that tells the reader what to do, not what the checker did — "Use lowercase letters, numbers, and hyphens" rather than "Invalid string".

## Three Levels, and Which Wins

Customization applies at three levels beyond the built-in locale, and Zod 4 **reversed** the precedence relative to Zod 3. From highest to lowest:

1. **Schema-level** — the `error` on the schema or check itself.
2. **Per-parse** — an error map passed to `.parse()` or `.safeParse()`.
3. **Global** — `z.config({ customError })`.
4. **Locale** — the loaded locale's messages.

Schema-level now wins over per-parse. Code written against Zod 3 that relied on a per-parse map overriding a schema's own message silently stops working, with no compile error.

**Guidelines:**

- MUST re-verify any per-parse error map carried over from Zod 3, since a schema-level message now overrides it.
- SHOULD set project-wide message conventions through `z.config({ customError })` once, rather than repeating an `error` on every schema.
- SHOULD reserve a schema-level `error` for a message genuinely specific to that field, since it now overrides everything else.

## Localizing Messages

Zod ships locales importable from `zod/locales` or reachable as `z.locales`, loaded through `z.config(z.locales.en())`. Regular Zod loads English by default; **Zod Mini loads no locale at all** and produces messages only once one is configured (see [performance-and-footprint.md](./performance-and-footprint.md)).

A locale covers the built-in messages. Any message supplied through an `error` parameter is a literal string the locale cannot reach, so a localized product either routes those through its own translation layer or does not hard-code them.

**Guidelines:**

- MUST configure a locale explicitly when using Zod Mini, which loads none by default.
- MUST NOT hard-code a user-facing `error` string in a localized product without routing it through the project's translation layer.
- SHOULD load a non-default locale dynamically where bundle size matters, rather than importing the whole set.

## What a Message May Contain

The `reportInput` option embeds the offending value in the issue. It is genuinely useful in development and is a data-exposure decision everywhere else: the offending value is untrusted input, and at a login, payment, or profile boundary it is a credential, a card number, or personal data — which then travels wherever the error travels, including into an error tracker and a client response.

The same applies to a message assembled by interpolating the input, and to the `input` field on an issue added by `ctx.addIssue()` (see [refinements.md](./refinements.md)).

**Guidelines:**

- MUST NOT enable `reportInput` on a boundary handling credentials, payment details, or personal data.
- MUST NOT interpolate the failing value into a message that reaches a client or an error tracker.
- SHOULD return a generic failure to the client and keep the detailed issues server-side, where the boundary handles sensitive input.
- SHOULD name the failing field rather than the failing value, which is enough for a user to correct it.
