# Codecs

Apply this reference when a boundary has to be crossed in both directions — decoding a wire format into a domain value and encoding that value back — and when deciding between a codec and a one-way transform.

Verified against `zod@4.4.3` — <https://zod.dev/codecs>. `z.invertCodec()` requires 4.4 or later.

## What a Codec Is For

`.transform()` is one-way. A schema carrying one can parse a wire value into a domain value and cannot go back — and a schema with a transform anywhere in it **throws at runtime** if encoding is attempted.

That is fine for a read-only boundary. It is not fine for the common case where the same boundary is crossed both ways: a document read from a store and written back, a value serialized into a cache and revived, state encoded into a URL and decoded from it, a timestamp that arrives as a string and must leave as one.

`z.codec(inputSchema, outputSchema, { decode, encode })` models that pair as one object, so the two directions cannot drift apart.

**Example:**

```ts
const IsoDatetimeToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});

IsoDatetimeToDate.decode("2026-05-04T00:00:00.000Z"); // Date
IsoDatetimeToDate.encode(new Date()); // ISO string
```

**Guidelines:**

- MUST use a codec rather than a transform when the boundary is crossed in both directions.
- MUST keep the two directions in one `z.codec()` call rather than as a transform plus a separate serializer, so neither can be updated without the other.
- SHOULD leave a genuinely read-only boundary as a transform; a codec whose `encode` is never called is unverified code.

## Decoding and Encoding

Each direction has four forms: throwing, safe, synchronous, and asynchronous.

| Direction | Throwing    | Safe            | Async            | Safe + async         |
| --------- | ----------- | --------------- | ---------------- | -------------------- |
| Decode    | `.decode()` | `.safeDecode()` | `.decodeAsync()` | `.safeDecodeAsync()` |
| Encode    | `.encode()` | `.safeEncode()` | `.encodeAsync()` | `.safeEncodeAsync()` |

Standalone equivalents exist as `z.decode(codec, value)` and `z.encode(codec, value)`, which is the form to use when the codec arrives as a parameter rather than as a known local.

One property distinguishes these from `.parse()`: they accept a **strongly typed** argument rather than `unknown`, so passing the wrong side of the boundary is a compile error rather than a runtime failure.

`z.invertCodec(codec)` derives the reverse codec — swapping the input and output schemas and the two functions — so a pair needed in both orientations is written once.

**Guidelines:**

- MUST choose the safe or throwing form on the same basis as `parse` versus `safeParse` (see [parsing.md](./parsing.md)): throwing when a failure is a bug, safe when it is an outcome.
- MUST use the async forms when either function is asynchronous.
- SHOULD use `z.invertCodec()` rather than hand-writing the mirrored pair.

## The Asymmetries

Four behaviours apply in one direction only, and each is a live source of surprise:

- **`.default()` and `.prefault()` apply on decode only.** Encoding does not substitute a default for a missing value.
- **`.catch()` applies on decode only.** An encode failure is not caught.
- **`.transform()` anywhere in the chain makes encoding throw** a plain runtime error — not a `ZodError` — since a one-way function cannot be reversed. `.safeEncode()` does not contain it.
- **Refinements run in both directions**, and encoding performs a two-pass validation — so a refinement that assumes it only ever sees decoded values will run against encoded ones too.

The first three mean an encode path needs its own testing rather than inheriting confidence from a working decode path. The fourth means a refinement inside a codec must be valid on both sides of the boundary.

**Guidelines:**

- MUST NOT place a `.transform()` inside a schema that will be encoded; use `.overwrite()` for a type-preserving change or express the conversion as the codec itself.
- MUST write refinements inside a codec so they hold in both directions, since encoding runs them too.
- MUST test the encode direction explicitly rather than assuming a working decode implies it (see [testing-schemas.md](./testing-schemas.md)).
- SHOULD NOT rely on a default or a `.catch()` to apply during encoding; supply the value before encoding instead.

## The Documented Codec Templates

Zod's documentation publishes a set of ready-made codecs for the conversions that recur across projects. They are **not exports** — the [codec reference](https://zod.dev/codecs) states outright that they "are not included as first-class APIs in Zod itself", and the package has no `./codecs` subpath. They are source to copy into a project and adapt, and reading them before writing a codec by hand is the point:

| Group      | Templates                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| Numeric    | `stringToNumber`, `stringToInt`, `stringToBigInt`, `numberToBigInt`             |
| Temporal   | `isoDatetimeToDate`, `epochSecondsToDate`, `epochMillisToDate`                  |
| Structured | `json(schema)`                                                                  |
| Binary     | `utf8ToBytes`, `bytesToUtf8`, `base64ToBytes`, `base64urlToBytes`, `hexToBytes` |
| URL        | `stringToURL`, `stringToHttpURL`, `uriComponent`                                |

The `json(schema)` template is the one most often reimplemented from scratch: it decodes a JSON **string** into a value validated by the inner schema, and encodes back — replacing the `JSON.parse` followed by a separate parse that appears in most caching and storage code.

Do not confuse it with `z.json()`, which **is** a real export and a different thing: a recursive schema matching an already-parsed JSON _value_. It performs no decoding, so substituting it for the template silently skips the parse.

**Guidelines:**

- MUST copy a documented template into the project rather than importing it; none of the names above is exported by the package.
- MUST NOT substitute `z.json()` for the `json(schema)` template; the export validates a parsed value and decodes nothing.
- SHOULD read the templates before hand-writing a codec for a common conversion, so the two directions start from a form that already pairs them.

## Total Codecs

A codec's functions can be written so they **cannot fail** — handling every input by passing it through unchanged rather than rejecting it. That is normally the wrong instinct, and occasionally exactly right.

The case where it is right: a path where a failure would be worse than imprecision. A response sanitizer that strips private fields from a document whose shape varies — by query depth, by draft state, by locale — cannot validate the content, because any legitimate variation would fail the parse and turn a real response into an empty one. Making the codec total, so it allowlists keys and passes values through untouched, keeps the sanitization guarantee while removing the failure mode.

The trade must be stated where it is made: a total codec provides **no** shape guarantee. It is a projection, not a validation, and downstream code must not treat its output as validated.

**Guidelines:**

- MUST document, at the codec, why a total codec is total, and what guarantee it therefore does not provide.
- MUST NOT treat a total codec's output as validated data; it is projected, not checked.
- SHOULD still wrap the call in a failure path that logs and returns an explicit error payload, so an unexpected throw is visible rather than silently producing an empty response.
- SHOULD prefer a validating codec wherever the shape is stable enough to model.
