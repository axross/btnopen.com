# Primitives and Formats

Apply this reference when validating a formatted string, a number, an integer, a date or timestamp, or a closed set of values.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## String Formats Are Top-Level Functions

Zod 4 moved every string format from a method on `z.string()` to a top-level function. `z.string().email()` still compiles and is deprecated; `z.email()` is current.

Every format is now a top-level `z.<name>()` — `z.email()`, `z.url()`, `z.uuid()`, `z.ipv4()`, `z.base64()`, `z.jwt()`, and the rest; the full set is in the [string-format reference](https://zod.dev/api). The chainable constraints (`.min()`, `.max()`, `.regex()`, `.trim()`, `.toLowerCase()`, …) remain methods and compose onto any of them.

What the reference does not tell you is which one to reach for, which is what the rest of this section covers.

**Guidelines:**

- MUST use the top-level format function (`z.email()`) rather than the deprecated method form (`z.string().email()`).
- MUST use the format function that names the constraint rather than a hand-written `.regex()` when one exists; a bespoke email or URL pattern is a defect waiting to be found.
- SHOULD bound a string with `.max()` before an expensive check runs on it (see [security-posture.md](./security-posture.md)).

## Strict and Permissive Variants

Several formats tightened in Zod 4, and where the looser behaviour is still legitimately wanted, a separate function provides it. Picking the wrong one either rejects valid production data or admits values the name implies it excludes.

| Need                                                  | Use                        |
| ----------------------------------------------------- | -------------------------- |
| An RFC-conformant UUID                                | `z.uuid()`                 |
| Any dash-delimited hex GUID, including non-conformant | `z.guid()`                 |
| One specific UUID version                             | `z.uuidv4()` / `v6` / `v7` |
| Any URL the platform can parse                        | `z.url()`                  |
| An HTTP or HTTPS URL only                             | `z.httpUrl()`              |

Three further tightenings have no permissive counterpart and are worth knowing because they reject data an older schema accepted: `z.base64url()` rejects padding, `z.base64()` rejects embedded whitespace as of 4.4, and `z.ipv6()` validates through the platform URL parser rather than a pattern.

**Guidelines:**

- MUST choose between `z.uuid()` and `z.guid()` from what the producer actually emits, not from which name reads better.
- MUST use `z.httpUrl()` rather than `z.url()` when the value will be fetched or rendered as a link; `z.url()` admits schemes that are not safe to follow.
- SHOULD verify against real production values when tightening an existing string format, since the stricter form may reject data already stored.

## Dates and Timestamps

`z.date()` validates a `Date` instance. It is the right schema for a value that is already a `Date` — a driver's output, an in-memory model — and the wrong one for anything that arrived as JSON, where no `Date` exists.

For a wire format, validate the string: `z.iso.datetime()` for a full timestamp, `z.iso.date()` for a calendar date, `z.iso.time()` for a time of day, `z.iso.duration()` for an interval. `z.iso.datetime()` takes `offset`, `local`, and `precision` options that decide whether an offset is required, whether a bare local time is accepted, and how many fractional-second digits are allowed.

An ISO string is also the only one of the two that survives a JSON round trip, has a JSON Schema representation, and compares lexicographically. Where a `Date` object genuinely is wanted downstream, the conversion is a codec, not a schema choice — see [codecs.md](./codecs.md).

**Guidelines:**

- MUST validate a timestamp that arrived as text with `z.iso.datetime()`, not `z.coerce.date()` or `z.date()`.
- MUST set the `offset` and `local` options deliberately when the producer's timestamps are not uniformly offset-bearing, rather than accepting the defaults and discovering the mismatch in production.
- SHOULD model a timestamp as an ISO string through the wire layer and convert at the boundary, rather than carrying `Date` objects across serialization.

## Numbers and Integers

`z.number()` rejects `Infinity` and `-Infinity` in Zod 4. `z.int()` accepts only safe integers — within `Number.MIN_SAFE_INTEGER` and `Number.MAX_SAFE_INTEGER` — and the Zod 3 `.safe()` method is gone, having become identical to `.int()`.

Fixed-width numeric schemas exist where a range is part of the contract: `z.int32()`, `z.uint32()`, `z.float32()`, `z.float64()`, alongside `z.bigint()` for values beyond the safe-integer range and `z.nan()` for the rare schema that must accept it.

The comparison and constraint methods — `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.positive()`, `.nonnegative()`, `.negative()`, `.nonpositive()`, `.multipleOf()` — apply across the numeric family.

**Guidelines:**

- MUST use `z.int()` rather than `z.number()` for a value that must be a whole number; `z.number()` accepts fractions.
- MUST use `z.bigint()` for an identifier or counter that can exceed the safe-integer range, rather than `z.number()` which will silently lose precision.
- SHOULD choose the fixed-width schema when the consumer has a width contract — a database column, a binary format — so the constraint is stated once rather than as a pair of bounds.
- SHOULD apply `.multipleOf()` cautiously on floating-point values, where representation error makes the check surprising.

## Closed Sets of Values

`z.enum(["a", "b", "c"])` models a closed set and is the current form. `z.nativeEnum()` is deprecated: `z.enum()` accepts a TypeScript enum object directly. The Zod 3 `.Enum` and `.Values` accessors are gone; `.enum` is the survivor, and `.exclude()` and `.extract()` derive narrower sets.

`z.literal()` accepts a single value or an array of values, which makes a two-member set expressible either way. It no longer accepts symbols.

The choice against a plain `z.string()` is the usual one: an enum makes an unexpected value a parse failure at the boundary rather than a bug that surfaces in a `switch` three layers later.

**Example:**

```ts
export const Locale = z.enum(["ja-JP", "en-US"]);
export type Locale = z.infer<typeof Locale>;

export const PublicStatus = z
  .enum(["pending", "approved", "rejected"])
  .exclude(["rejected"]);
```

**Guidelines:**

- MUST use `z.enum()` in place of the deprecated `z.nativeEnum()`.
- MUST model a field with a known closed set as an enum rather than a string, so an unexpected member fails at the boundary.
- SHOULD derive a narrower set with `.exclude()` or `.extract()` rather than restating the members.
- SHOULD reuse `.enum` for the runtime value list rather than maintaining a parallel array beside the schema.

## Project-Specific and Pattern Formats

`z.stringFormat()` registers a project's own named format, so a bespoke constraint carries a name in errors and in generated JSON Schema instead of appearing as an anonymous regex failure.

`z.templateLiteral()` expresses a pattern TypeScript itself can describe as a template literal type — a CSS length, a prefixed identifier — so the runtime check and the static type agree rather than the type widening to `string`.

**Guidelines:**

- MUST give a repeated bespoke pattern a name through `z.stringFormat()` rather than duplicating a `.regex()` call across schemas.
- SHOULD use `z.templateLiteral()` when the value's shape is expressible as a template literal type, so inference is narrower than `string`.
- SHOULD keep a bespoke pattern anchored and bounded; see [security-posture.md](./security-posture.md) for the failure mode when it is neither.
