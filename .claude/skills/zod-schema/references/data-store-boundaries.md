# Data Store Boundaries

Apply this reference when modelling a database row, a document-store record, or a CMS payload — including the read and write halves of a converter, partial writes, driver-specific types, and a payload whose shape varies by query.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## The Stored Shape Is Not the Domain Model

A stored record and the object the application works with are two different types, and modelling them as one produces a schema that serves neither well. The stored shape carries the store's concerns — internal status fields, relation identifiers, timestamps in the driver's own type, denormalised columns, naming conventions the API imposed. The domain model carries the application's.

Two schemas and a transform between them keeps each honest:

```ts
const StoredGameSession = z.object({
  name: NonEmptyString,
  startedAt: z.instanceof(Timestamp),
  endedAt: z.instanceof(Timestamp).nullable(),
  creator: z.instanceof(DocumentReference),
});

const GameSession = StoredGameSession.transform((row) => ({
  name: row.name,
  startedAt: row.startedAt.toDate(),
  endedAt: row.endedAt?.toDate() ?? null,
  creatorId: row.creator.id,
}));
```

The transform is where the store's vocabulary stops. Everything inward of it sees the domain type.

**Guidelines:**

- MUST model the stored shape and the domain model as separate schemas when they differ in field names, types, or nullability.
- MUST NOT leak a driver's own types (a timestamp wrapper, a reference object) into the domain model; convert at the boundary.
- SHOULD name the two distinguishably in the same module, so a reader can tell which side of the boundary a type is on.

## The Read and Write Halves Are One Pair

A store boundary is crossed in both directions, which makes it the canonical codec case (see [codecs.md](./codecs.md)). Where a driver offers a converter interface, the read half parses and the write half validates — and the two must agree, since a field renamed on read and not on write produces a record that no longer parses.

Writing them as one unit, whether as a `z.codec()` or as a converter object holding both functions, is what keeps them in step. Two separately maintained functions in different files is how the halves drift.

**Guidelines:**

- MUST write the read and write halves of a store boundary together, so neither can be changed without the other.
- MUST validate on write as well as on read; an unvalidated write puts a record into the store that the read schema will reject.
- SHOULD express the pair as a codec when the driver has no converter interface of its own.
- SHOULD test the round trip explicitly (see [testing-schemas.md](./testing-schemas.md)), since the write direction is not exercised by reading.

## Partial Writes and Create Inputs

Three write shapes are usually distinct, and all three derive from the base schema rather than being restated:

| Shape        | Derived as                             | Why it differs                                       |
| ------------ | -------------------------------------- | ---------------------------------------------------- |
| Full record  | The base schema                        | —                                                    |
| Update patch | `.partial()`                           | Only the supplied fields are written                 |
| Create input | `.omit({ id: true, … }).extend({ … })` | The store assigns some fields; some accept sentinels |

The create case is the one that most often needs `.extend()` as well as `.omit()`: a store that accepts a server-generated timestamp sentinel takes a union of that sentinel and a real value where the base schema takes only the value.

`.partial()` on a write path validates what is present without requiring what is not — which is what a patch means, and which a full-schema parse would reject.

**Guidelines:**

- MUST derive the update and create shapes from the base schema rather than declaring them independently.
- MUST validate a partial write with `.partial()` rather than skipping validation because the shape is incomplete.
- SHOULD model a store's write sentinels explicitly in the create schema, rather than casting around them.

## Driver Types

`z.instanceof(Class)` is the schema for a driver's own class — a timestamp wrapper, a document reference, a decimal, an object id. It is preferable to `z.custom()` with a hand-written predicate, which duplicates what `instanceof` already does.

`z.property(key, schema)` constrains one of the instance's fields, which is how a check narrower than "is an instance of this class" is expressed:

```ts
const HttpsUrl = z
  .instanceof(URL)
  .check(z.property("protocol", z.literal("https:")));
```

Neither has a JSON Schema representation (see [metadata-and-json-schema.md](./metadata-and-json-schema.md)), which is one more reason these belong in the stored-shape schema rather than in a domain model that may be serialized.

**Guidelines:**

- MUST use `z.instanceof()` rather than `z.custom()` with a hand-written predicate for a class instance.
- MUST keep `z.instanceof()` schemas on the stored side of the boundary, since they have no serialized representation.
- SHOULD use `z.property()` to constrain an instance's field rather than adding a refinement that reaches into it.

## Payloads That Vary by Query

A content store's payload shape often depends on the query rather than on the record: relation depth decides whether a relation arrives as an identifier or a populated object, a draft or autosaved version carries fields the published one requires, and a localized read can replace every leaf value with a per-locale object.

Three techniques cover most of it, and the choice matters:

- **Model the union.** A relation that arrives as an id or an object is a union with a transform normalising it to one form. This is the right answer when the variation is small and enumerable.
- **Model the query.** Select specific fields in the query and write a schema for exactly those, rather than one schema every call site must satisfy. A focused schema per read is less coupling, not more.
- **Do not validate.** Where the variation is not enumerable — an all-locale read, an arbitrary editor state — a validating schema fails on legitimate data. A `z.custom()` with a structural guard, or a total codec per [codecs.md](./codecs.md), is honest; a schema that rejects real payloads is not.

The failure mode to avoid is one maximal schema with every field optional, which accepts everything and guarantees nothing while looking like validation.

**Example:**

```ts
const RelationId = z
  .union([
    z.string(),
    z.number(),
    z.object({ id: z.union([z.string(), z.number()]) }),
  ])
  .transform((value) =>
    typeof value === "object" ? String(value.id) : String(value),
  );
```

**Guidelines:**

- MUST write a schema for the fields a given read actually selects, rather than one schema covering every possible read.
- MUST NOT make every field optional to accommodate query variation; that is a schema that validates nothing.
- MUST normalise an enumerable variation — a relation as id-or-object, a nullable that is sometimes absent — with a union and a transform at the boundary.
- SHOULD document, at the schema, which query shape it corresponds to, since that is not recoverable from the schema itself.
- SHOULD tolerate a draft or autosaved record missing a field the published one requires, and add a regression test for it (see [testing-schemas.md](./testing-schemas.md)).

## Generated Schemas

Tools that emit Zod schemas from a database schema or a CMS model remove the drift between the store's definition and the schema — genuinely valuable, and not the whole job. A generated schema describes the **stored** shape, which means everything above still applies: the domain model, the transform, the query-specific narrowing, and any constraint the store cannot express are all still hand-written on top.

A generated schema edited by hand is also a schema that regeneration destroys.

**Guidelines:**

- MUST NOT hand-edit a generated schema; extend or derive from it in a separate module.
- MUST still write the domain model and its transform; a generated schema is the stored shape, not the application's type.
- SHOULD add the constraints the store cannot express — formats, cross-field rules, branded identifiers — by deriving from the generated schema rather than replacing it.
