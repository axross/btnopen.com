# Security Posture

Apply this reference when a schema stands between untrusted input and the rest of a system — deciding what unknown-key handling protects, what a parse does not establish, and which schema shapes let a caller consume unbounded work.

Verified against `zod@4.4.3` — <https://zod.dev/api>. Which inputs are untrusted at all is owned by an application-security capability; this reference covers what the schema layer does about them.

## Unknown-Key Handling Is a Real Protection

`z.object()` strips keys the schema does not model (see [objects-and-collections.md](./objects-and-collections.md)), and that default does security work: a field an attacker adds to a request body does not survive the parse, so it cannot reach a database write, a spread into an update, or a template.

The corollary is what `z.looseObject()` and the deprecated `.passthrough()` give back. They preserve every unmodelled key, and the classic consequence is mass assignment — a submitted `isAdmin` or `role` field flowing through a permissive parse into a record update that was written to spread the parsed object.

`.catchall()` is the middle position and is usually the right one when extra keys are genuinely expected: they are preserved _and_ validated, rather than admitted unchecked.

**Guidelines:**

- MUST use `z.object()` rather than `z.looseObject()` for any payload from an untrusted source.
- MUST NOT spread a permissively parsed object into a database write or an update payload; select the fields explicitly.
- MUST state, at the schema, what the preserved keys are for whenever `z.looseObject()` or `.catchall()` is used on untrusted input.
- SHOULD use `z.strictObject()` where an unexpected key is a signal worth failing on rather than silently dropping.

## What a Parse Does Not Do

A successful parse establishes that a value has a shape. It is routinely mistaken for establishing more, and it establishes none of the following:

| A parse does not                           | Which still needs                                |
| ------------------------------------------ | ------------------------------------------------ |
| Escape or sanitize HTML                    | Contextual output encoding at the render site    |
| Make a string safe to interpolate into SQL | Parameterized queries                            |
| Make a URL safe to fetch                   | A protocol and hostname policy at the fetch site |
| Make a path safe to read                   | Path resolution and a containment check          |
| Establish authorization                    | An access check against the caller's identity    |
| Confirm the value is true                  | Whatever verifies the claim                      |

`z.email()` confirms a string is shaped like an email address; it does not confirm the address exists or belongs to the submitter. `z.url()` confirms parseability, and admits schemes that are not safe to follow.

The failure this produces is a boundary where "we validate the input" is treated as the whole answer, and the downstream encoding, parameterization, or authorization was never written.

**Guidelines:**

- MUST NOT treat a successful parse as sanitization, encoding, or authorization.
- MUST use `z.httpUrl()` rather than `z.url()` for a URL that will be fetched or rendered as a link, and apply a hostname policy at the fetch site regardless.
- SHOULD name the downstream control a schema does not replace when a schema is added at a boundary, so the gap is visible rather than assumed closed.

## Constrain Before Checking

An expensive check running on unbounded attacker-controlled input is a denial-of-service primitive. Two forms recur:

- **A regular expression with catastrophic backtracking.** Nested quantifiers or alternation on a long input can take exponential time. A bounded `.max()` before the `.regex()` caps the exposure whatever the pattern does; an anchored, non-backtracking pattern removes it.
- **An expensive refinement.** A refinement doing real work — a normalization pass, a parse of its own — runs on whatever length the input has.

The ordering matters: checks run in sequence, so a `.max()` placed before the expensive check is what bounds it. Placed after, it never runs.

**Guidelines:**

- MUST bound a string with `.max()` before a `.regex()` or an expensive refinement, and place the bound first in the chain.
- MUST anchor a bespoke pattern and avoid nested quantifiers on untrusted input.
- SHOULD prefer a built-in format function to a hand-written pattern (see [primitives-and-formats.md](./primitives-and-formats.md)), which is both correct and already bounded.

## Shapes That Consume Unbounded Work

Three schema shapes let a caller decide how much work the parse does:

- **An unbounded array.** `z.array(Item)` with no `.max()` parses as many items as the payload contains, and each item's parse is real work.
- **Deep nesting.** A deeply nested payload costs a traversal proportional to its depth, and a recursive schema has no inherent depth limit.
- **A recursive schema over external input.** The combination of the two: a self-referential structure whose depth the caller chooses.

Separately, and not a schema property at all: a **cyclical object graph** causes an infinite loop whatever the schema (see [objects-and-collections.md](./objects-and-collections.md)). A parse is not a defence against it, and a value that may be cyclical must not be parsed.

An overall request-body size limit at the transport layer bounds all of these at once and belongs there rather than in the schema. The schema's bounds are the second layer.

**Guidelines:**

- MUST bound every array from an untrusted source with `.max()`.
- MUST bound the depth of a recursive schema parsing external input.
- MUST NOT parse a value that may contain a reference cycle.
- SHOULD rely on a transport-level body-size limit as the primary bound, and treat the schema's bounds as defence in depth.

## What Travels With an Error

A validation failure describes untrusted input, and everything it carries travels wherever the error travels — into an error tracker, into a log aggregator, and often into a client response.

Three sources put the input itself into that path: the `reportInput` option, an `input` field on an issue added by `ctx.addIssue()`, and a message assembled by interpolating the value. At a login, payment, or profile boundary that is a credential, a card number, or personal data (see [errors.md](./errors.md) and [parsing.md](./parsing.md)).

The field **name** and the issue **path** are what a caller needs to correct the input, and neither is sensitive.

**Guidelines:**

- MUST NOT enable `reportInput`, interpolate the failing value into a message, or attach it to an issue at a boundary handling credentials, payment details, or personal data.
- MUST return a generic failure to the client and keep detailed issues server-side at such a boundary.
- SHOULD identify a failure by field name and path rather than by value.

## The Response Side

A schema on the way in constrains nothing on the way out. A private field — an email address, an internal status, an authorization token, a soft-deleted record's contents — reaches the caller unless something on the response path removes it.

The construct is a response schema, which strips by default, or — where the document's shape varies too much for one to validate — a sanitizing codec, per [codecs.md](./codecs.md). Either way it must be an **allowlist**: a denylist of fields not to expose fails open the moment the store gains a field nobody updated it for.

**Guidelines:**

- MUST apply a response-side schema or sanitizer to any payload leaving the system with fields the caller should not see.
- MUST allowlist the fields that may leave rather than denylisting the ones that may not.
- SHOULD derive the response schema from the domain schema with `.pick()` (see [schema-modules.md](./schema-modules.md)), so a new field is excluded by default rather than included by default.
