# Schema Modules

Apply this reference when deciding where a schema lives, what to call it, how to build a variant of it, how to give a primitive a nominal type, and where schema construction happens.

Verified against `zod@4.4.3` — <https://zod.dev/api>.

## Where a Schema Lives, and What It Is Called

A schema belongs in the module that owns the boundary it guards. A repository's response schema lives with the repository; a form's schema lives with the form; a store's document schema lives with the converter that reads it. Splitting a schema away from its parse produces two files that must be edited together and a reader who cannot tell which shape is enforced where.

Two naming conventions are both defensible and both in wide use:

| Convention                                | Reads as                              | Cost                                                          |
| ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| `export const User` + `export type User`  | The schema and the type share a name  | Requires the declaration-merging idiom to be understood       |
| `export const zUser` + `export type User` | The prefix marks a schema at a glance | Two names for one concept; the prefix leaks into every import |

The same-name form works because a `const` and a `type` occupy different declaration spaces, so `User.parse(x)` and `const u: User` both resolve. It reads well and keeps imports short. The prefix form is more obvious at the call site and easier to grep for.

What is not defensible is using both in one repository, which is where the surveyed real-world codebases most often end up.

**Guidelines:**

- MUST co-locate a schema with the boundary it guards, not in a project-wide schema directory disconnected from its parse.
- MUST use one naming convention throughout a repository; establish which one from the existing code before adding a schema.
- MUST export the inferred type alongside the schema, so no consumer re-derives it.
- SHOULD name a schema for the concept it models, not for the library — `User`, not `UserValidator` or `UserSchemaDefinition`.
- SHOULD keep a wire-shaped schema and the domain model it produces distinguishable by name when both are exported from one module.

## Shared Primitive Schemas

A repository accumulates the same constraints in a dozen places: an identifier that must be a UUID, a timestamp that must be non-negative, a string that must be non-empty after trimming, a URL. Declaring each inline means the constraint drifts — one call site trims, another does not — and no single place states what the project means by "an identifier".

A shared module of primitive schemas fixes both. Every other schema is then built from that vocabulary, and a change to what the project means by a non-empty string happens once.

**Example:**

```ts
export const EntityId = z.uuid();
export type EntityId = z.infer<typeof EntityId>;

export const NonEmptyString = z.string().trim().min(1);
export type NonEmptyString = z.infer<typeof NonEmptyString>;
```

**Guidelines:**

- MUST define a constraint that appears in more than one schema once, in a shared primitives module, and compose from it.
- MUST NOT re-declare a shared primitive inline "just for this one field"; that is how the two definitions diverge.
- SHOULD keep the shared module free of domain concepts — it holds `EntityId` and `Url`, not `UserId` and `OrderTotal`, unless those carry constraints of their own.

## Branded Types

`.brand<"Name">()` attaches a phantom type so a `UserId` is no longer assignable from any arbitrary string. It is a **static-only** construct: the parsed value is unchanged at runtime, and the brand exists purely to make the compiler reject a mix-up that structural typing would otherwise allow.

Because the brand is unforgeable in ordinary code, the parse becomes the only way to mint one — which is the point, and also the cost.

Since 4.2 the brand takes a direction as its second parameter: `"out"` (the default) brands the output type, `"in"` brands the input type, and `"inout"` brands both. The direction matters for a schema whose input and output differ — a codec or a transform — where branding only the output leaves the input side assignable from anything.

**Example:**

```ts
export const Timestamp = z.number().nonnegative().brand<"Timestamp">();
export type Timestamp = z.infer<typeof Timestamp>;

const t: Timestamp = Timestamp.parse(Date.now());
const wrong: Timestamp = 0; // rejected: 0 is not branded
```

**Guidelines:**

- MUST declare a brand once in the shared primitives module, so one nominal type exists per concept rather than one per import site.
- MUST obtain a branded value through a parse; a cast to the branded type defeats the entire mechanism.
- MUST choose the brand direction deliberately on a schema whose input and output differ, rather than accepting the output-only default by omission.
- MUST NOT rely on a brand for a runtime guarantee — it has no runtime representation and survives no serialization boundary.
- SHOULD brand an identifier type that is structurally interchangeable with another and semantically is not; leave a genuinely free-form string unbranded.
- SHOULD accept that fixtures and test data must go through the schema, and budget for it (see [testing-schemas.md](./testing-schemas.md)).

## Deriving a Variant Instead of Restating One

A create input, an update patch, a public projection, and a stored row are usually the same shape minus or plus a few fields. Restating each as its own `z.object` produces four definitions that drift. Deriving them keeps one source.

| Operation                       | Produces                                              |
| ------------------------------- | ----------------------------------------------------- |
| `.shape.field`                  | One field's schema, for reuse elsewhere               |
| `.extend({ … })`                | The schema plus additional or overridden fields       |
| `.safeExtend({ … })`            | The same, refusing an extension that would be unsound |
| `.pick({ … })` / `.omit({ … })` | A narrower shape                                      |
| `.partial()` / `.required()`    | Optionality flipped across the shape                  |
| `.keyof()`                      | An enum of the schema's keys                          |

`.merge()` is deprecated in favour of `.extend(other.shape)`. As of 4.4 it also **throws** when the receiving schema carries refinements, which turns a previously silent unsoundness into a loud failure — worth knowing, because a codebase that used `.merge()` freely may start failing on a patch upgrade.

**Example:**

```ts
export const GameSession = z.object({
  id: EntityId,
  name: NonEmptyString,
  startedAt: z.iso.datetime(),
});

export const GameSessionCreateInput = GameSession.omit({
  id: true,
  startedAt: true,
});
```

**Guidelines:**

- MUST derive a variant schema from its base rather than restating the shared fields.
- MUST use `.extend(other.shape)` in place of `.merge(other)`.
- MUST re-check a derivation against the base when the base gains a field, since `.omit` and `.pick` express intent about a shape that has changed.
- SHOULD reuse a single field's schema through `.shape.field` rather than repeating its constraints in a second object.
- SHOULD prefer `.safeExtend` when overriding an existing key, so an unsound override fails at the definition rather than at a parse.

## Keeping Construction Out of the Hot Path

Building a schema is real work — object construction, closure allocation, check-chain assembly. It is meant to happen once, at module evaluation, and be reused for every parse thereafter. Constructing one inside a component render, a request handler, or a loop repeats that work for no benefit and defeats any internal caching the library does.

The tell is a `z.object(` inside a function body rather than at module scope.

**Guidelines:**

- MUST declare every schema at module scope, not inside a function, component, hook, or loop body.
- MUST NOT rebuild a schema per request or per render; hoist it and close over nothing.
- SHOULD build a schema inside a factory only when it genuinely depends on a runtime value, and memoize the result when that value is stable.
