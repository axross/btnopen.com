# The Validation Boundary

Apply this reference when deciding where a parse belongs in a system, what this capability owns against neighbouring ones, how the static types either side of a parse are produced, and whether a schema is the right tool at all.

Verified against `zod@4.4.3` — <https://zod.dev/basics>.

## What This Capability Owns

Four capabilities meet at a validation boundary, and confusing them produces either duplicated rules or a gap nobody covers.

| Question                                                                 | Owner                                       |
| ------------------------------------------------------------------------ | ------------------------------------------- |
| Is this input untrusted, and must it be checked at all?                  | An application-security capability          |
| Where does the handler, action, or query function live?                  | The framework capability for that framework |
| How does a component receive and render the result?                      | A component-development capability          |
| What shape is enforced, how, what type it yields, what error it produces | **This capability**                         |

The practical consequence: this reference never argues that untrusted input should be validated — it assumes that decision is made — and never specifies where a route file goes. It specifies what happens at the line where unknown data becomes typed.

**Guidelines:**

- MUST treat the decision that an input is untrusted as already made elsewhere; this capability specifies the schema and the parse, not the risk assessment.
- MUST NOT restate a framework's file-placement or handler-signature rules here; state only what goes inside the handler.
- SHOULD name the owning capability when a task reaches one of the questions above, rather than extending this one to cover it.

## The One-Parse Boundary

A system has a small number of places where data it did not produce becomes data it uses: an HTTP response body, a form submission, a stored value read back, a database row, a model completion, an environment variable, a message off a queue, a deep-link parameter. Each is a boundary. The discipline is that **unknown data becomes typed exactly once, at the boundary it enters**, and everything inward of that line is trusted.

That single rule is what makes the rest tractable. If the parse is at the boundary, the type system carries the guarantee inward for free and no interior function needs a defensive check. If the parse is scattered — a little validation here, a cast there — nothing downstream can be trusted, and the checks multiply without ever adding up to a guarantee.

The failure to watch for is not a missing parse but a **displaced** one: a `fetch` result cast to a type and parsed three layers later, by which point the untyped value has already been logged, cached, and passed to two other functions.

**Guidelines:**

- MUST place the parse at the boundary the data enters, not at the point it is first read.
- MUST NOT re-parse a value that a boundary already parsed; a second parse of trusted data is cost with no guarantee attached.
- MUST NOT cast an unparsed value into the shape a schema would have produced; a cast asserts what a parse establishes.
- SHOULD keep the boundary's schema and its parse call in the same module, so a change to the shape and the check that enforces it cannot drift apart.
- SHOULD treat a value that crosses back out — a request body being sent, a document being written — as its own boundary with its own schema, not as an unchecked mirror of the inbound one.

## Typing Either Side of the Parse

Two type rules follow from the boundary rule, and both are frequently violated in the same file.

**Upstream of the parse, the type is `unknown`.** Not `any`, which disables checking and lets the untyped value flow anywhere; not an optimistic interface, which is a claim nobody verified. `unknown` forces the parse to happen before anything else can.

**Downstream, the type is derived from the schema.** `z.infer<typeof Schema>` produces it. A hand-written `interface` maintained alongside a schema is two sources of truth that agree only until someone edits one of them, and TypeScript will not report the divergence — the schema still parses, the interface still compiles, and the two describe different shapes.

**Example:**

```ts
export const BlogPost = z.object({
  slug: z.string(),
  publishedAt: z.iso.datetime(),
});

export type BlogPost = z.infer<typeof BlogPost>;

export async function getBlogPost(slug: string): Promise<BlogPost> {
  const response = await fetch(`/api/posts/${slug}`);
  const body: unknown = await response.json();

  return BlogPost.parse(body);
}
```

**Guidelines:**

- MUST type an unparsed value as `unknown`, never `any` and never an asserted interface.
- MUST derive the downstream type from the schema with `z.infer` (or `z.input`/`z.output` where they differ), never hand-write a type the schema is separately expected to match.
- MUST NOT annotate a schema's own declaration with a hand-written type; the schema is the source and the type is the derivative, not the reverse.
- SHOULD export the schema and its inferred type under the same name from the same module, so a consumer importing one has the other.

## When a Schema Is the Wrong Tool

Reaching for a schema is not free — it costs construction, a parse, a deep clone of the result, and a maintenance surface. Several situations look like validation and are not:

- **Data the code just produced.** A value constructed three lines above has no untrusted origin. Parsing it validates the compiler, not the input.
- **A value already parsed upstream.** Covered above: it is cost without guarantee.
- **A hot loop revalidating unchanged data.** If the array was parsed on arrival, parsing each element again during rendering adds work proportional to the render count.
- **An internal function boundary.** TypeScript already checks these. A schema here is a runtime assertion that the compiler is broken.
- **A shape check that a discriminated field already establishes.** If the union narrowed, the branch's type is known.

What remains — genuinely external data — is where a schema earns its cost.

**Guidelines:**

- MUST NOT parse a value whose provenance is internal and whose type the compiler already checked.
- MUST NOT place a schema parse inside a render path or a per-item loop over data parsed at its boundary.
- SHOULD delete a parse that cannot name the untrusted source it guards, rather than keeping it as reassurance.

## Zod Alongside Another Validator

A project may legitimately run two validation libraries — most often when one library models the domain and another handles a format the first is awkward at, such as a deeply nested XML document projected into objects. That is a real trade, not an error, but it has costs worth naming: two error shapes to surface, two sets of idioms for a reader to hold, and two dependencies to keep current.

Where the two meet, the boundary between them is itself a boundary: the second library's output is untrusted input to the first unless its own parse guarantees the shape.

**Guidelines:**

- MUST justify a second validation library by a concrete capability the first lacks, not by familiarity or local preference.
- MUST convert at one place when two libraries coexist, so the rest of the codebase sees one error shape and one set of types.
- SHOULD prefer a shared interface (see [interop-and-library-code.md](./interop-and-library-code.md)) over an adapter written per call site when a tool must accept either library's schemas.
