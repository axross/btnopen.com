# Coercion and Configuration

Apply this reference when converting a value whose type the producer got wrong, reading booleans or numbers out of strings, or validating a process's configuration.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## Coercion Runs JavaScript's Own Conversions

`z.coerce.string()`, `z.coerce.number()`, `z.coerce.boolean()`, and `z.coerce.bigint()` apply the corresponding JavaScript constructor before validating. In Zod 4 their input type is `unknown`, so the type system no longer constrains what may be handed to them.

That means they inherit JavaScript's conversion semantics **exactly**, including the results nobody wants:

| Expression                           | Result        | Why it matters                                  |
| ------------------------------------ | ------------- | ----------------------------------------------- |
| `z.coerce.number().parse("")`        | `0`           | An empty numeric input passes a `.min(0)` check |
| `z.coerce.boolean().parse("false")`  | `true`        | Any non-empty string is truthy                  |
| `z.coerce.boolean().parse("0")`      | `true`        | Same reason                                     |
| `z.coerce.string().parse(undefined)` | `"undefined"` | An absent value becomes a nine-character string |
| `z.coerce.bigint().parse("")`        | `0n`          | As with `number`                                |

None of these is a bug in Zod; all of them are bugs in code that reached for coercion expecting parsing. The empty-string cases are the ones that reach production, because an untouched form field and a missing query parameter both produce `""`.

**Guidelines:**

- MUST NOT use `z.coerce.boolean()` to read a boolean out of a string; use `z.stringbool()`.
- MUST guard against the empty string explicitly before `z.coerce.number()` or `z.coerce.bigint()`, since both convert it to zero and pass a lower-bound check.
- MUST NOT use `z.coerce.string()` on a value that may be absent, which produces the literal `"undefined"`.
- SHOULD prefer an explicit `z.preprocess()` or a codec to `z.coerce.*` whenever the conversion has any subtlety, so the behaviour is written down rather than inherited.

## Reading a Boolean Out of a String

`z.stringbool()` is the correct construct. It matches a configurable set of truthy and falsy strings — `truthy`, `falsy`, and `case` options control which — and **fails** on anything in neither set, rather than silently returning `true`.

That last property is the whole point: `"maybe"` is a configuration error, and `z.stringbool()` reports it where `z.coerce.boolean()` would return `true` and carry on.

**Example:**

```ts
const FeatureFlag = z.stringbool();

FeatureFlag.parse("false"); // false
FeatureFlag.parse("no"); // false
FeatureFlag.parse("maybe"); // throws
```

**Guidelines:**

- MUST use `z.stringbool()` for any boolean arriving from an environment variable, a query string, a form field, or a header.
- SHOULD set the `truthy` and `falsy` sets explicitly when the producer uses vocabulary outside the defaults, rather than pre-converting the string.

## The Three String-Shaped Sources

Every value from these three arrives as a string, whatever it represents:

- **Query strings and route parameters** — including numbers, booleans, dates, and arrays.
- **Form data** — including checkboxes, which submit a string or nothing at all.
- **Environment variables** — including ports, flags, and numeric limits.

There is no way to avoid the conversion; the only question is whether it is explicit. A schema that models these as `z.number()` fails on real input; one that models them with `z.coerce.number()` accepts `""` as zero. `z.preprocess()` or a codec, which state the conversion, do neither.

**Guidelines:**

- MUST model a value from a query string, form data, or the environment as a string first, then convert deliberately.
- MUST handle the absent case for each of these explicitly — an unchecked checkbox submits nothing, not `"false"`.
- SHOULD use a codec when the value must also be re-encoded back into the same medium, such as state round-tripped through a URL (see [codecs.md](./codecs.md)).

## Validating Configuration

A process's configuration is a boundary like any other, with one distinguishing property: a failure is not recoverable and should not be deferred. A missing or malformed variable discovered at startup is a clear error at a known moment; the same variable discovered as `undefined` three layers into a request handler is a null-dereference with no context.

The pattern is one module that parses the entire environment once at startup, exports the typed result, and lets the parse failure terminate the process. Everything else imports that module rather than reading the raw environment.

Two further properties matter and are not about Zod:

- **The public and secret split.** Where a framework exposes variables to a client bundle by naming convention, a schema is a place to enforce that split — the secret group and the public group are separate schemas, and only the public one is referenced from client-reachable code.
- **The failure should happen at build time too**, so a missing variable fails a deployment rather than the first request against it.

**Guidelines:**

- MUST parse configuration once at startup in one module, and import that module rather than reading raw environment values elsewhere.
- MUST let a configuration parse failure terminate the process rather than catching it into a default; an application running on invented configuration is worse than one that did not start.
- MUST keep secret and public configuration in separate schemas, so a client-reachable module cannot import a secret by accident.
- MUST NOT log the parsed configuration object, or include it in an error report; it holds every secret the process has.
- SHOULD run the same validation during a build so a missing variable fails the deployment rather than the first request.
- SHOULD name the specific missing or malformed variables in the startup failure, since that message is the entire diagnostic.
