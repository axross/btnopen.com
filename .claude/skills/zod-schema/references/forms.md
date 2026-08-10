# Forms

Apply this reference when wiring a schema into a form library, typing a form's values, landing a validation error on a specific field, or handling the string-valued inputs a form produces.

Verified against `zod@4.4.3` — <https://zod.dev/ecosystem>. Resolver package behaviour is a lookup against the installed version.

## Wiring the Schema In

Form libraries consume a schema through a resolver. Two exist and both are current:

- **A Zod-specific resolver** — reads the schema directly and surfaces Zod's own issue detail.
- **A Standard Schema resolver** — consumes any library implementing the shared interface (see [interop-and-library-code.md](./interop-and-library-code.md)), at the cost of the library-specific detail.

The Zod-specific resolver is the default choice in a project committed to Zod. The Standard Schema resolver is right where the validation library is deliberately kept swappable, or where a shared form component must accept schemas from more than one library.

Resolver packages have their own compatibility surface — which Zod majors they detect, how they map issues onto fields — and it moves independently of Zod. Check the installed resolver's release notes when a resolver's behaviour disagrees with the schema's.

**Guidelines:**

- MUST check the installed resolver package's Zod compatibility when a schema validates correctly in isolation but not through the form.
- SHOULD use the Zod-specific resolver in a project committed to Zod, and the Standard Schema resolver only where library independence is an actual requirement.

## A Form Has Two Types

A form library needs two distinct types when the schema transforms, and conflating them is the most common typing failure in form code:

| Type                 | Is                                        | Used for                                  |
| -------------------- | ----------------------------------------- | ----------------------------------------- |
| `z.input<typeof S>`  | What the user's fields hold               | Default values, field registration, state |
| `z.output<typeof S>` | What the schema produces after transforms | The submit handler's argument             |

A form's default values are **input**. Typing them with `z.infer` — which is the output type (see [transforms-and-pipes.md](./transforms-and-pipes.md)) — produces a type error the moment the schema gains a transform, or worse, compiles against a coincidentally identical shape and breaks silently later.

**Example:**

```ts
type FeedCreateFormValue = z.input<typeof FeedCreateForm>;
type ValidFeedCreateFormValue = z.output<typeof FeedCreateForm>;

useForm<FeedCreateFormValue, never, ValidFeedCreateFormValue>({
  defaultValues,
  resolver: zodResolver(FeedCreateForm),
});
```

**Guidelines:**

- MUST type a form's values and default values with `z.input`, and the submit handler's argument with `z.output`.
- MUST NOT use `z.infer` for a form's values on a schema that transforms or coerces.
- SHOULD export both types from the module holding the form schema, so no component re-derives them.

## Landing an Error on the Right Field

A cross-field check — password confirmation, a date range, a dependency between two inputs — is a refinement on the object, and its issue attaches to the object unless `path` says otherwise. An error attached to the object has no input to render against, so it either disappears or appears at the top of the form detached from the field the user must fix.

`path: ["confirm"]` fixes it. This is the schema's half of the contract with the form's per-field error display (see [refinements.md](./refinements.md) and [errors.md](./errors.md)).

Where a validator is expressed as a transform rather than a refinement, the same reporting is available through `ctx.addIssue()` followed by `z.NEVER`:

```ts
selectedFeedUrls: z.array(z.url()).transform((value, ctx) => {
  if (value.length === 0) {
    ctx.addIssue({ code: "custom", message: "Select at least one feed." });

    return z.NEVER;
  }

  return value;
});
```

**Guidelines:**

- MUST set `path` on every cross-field refinement in a form schema, naming the field the user should correct.
- MUST return `z.NEVER` after adding an issue inside a transform, rather than returning a value the caller will treat as valid.
- SHOULD prefer a refinement to a transform for a check that produces no new value, since a transform blocks encoding and obscures the type.

## String-Valued Inputs

Every form control produces a string, or nothing. That creates three traps, all covered in detail in [coercion-and-config.md](./coercion-and-config.md) and all specifically common in forms:

- **An untouched numeric field submits `""`**, which `z.coerce.number()` converts to `0` — so a `.min(0)` check passes for a field the user never filled in.
- **A checkbox submits a string or is absent**, never `"false"`, so `z.coerce.boolean()` reads `"false"` as `true` and an absent checkbox as a missing key rather than `false`.
- **A select's value is a string**, even when the underlying domain value is a number or an enum member.

`z.stringbool()` handles the boolean case. The numeric case needs an explicit empty check before conversion, not a coercion.

**Guidelines:**

- MUST handle the empty string explicitly on a numeric form field rather than relying on `z.coerce.number()`.
- MUST use `z.stringbool()` rather than `z.coerce.boolean()` for a checkbox or toggle value.
- MUST model an absent checkbox as absent, not as `false`, and supply the default explicitly.

## Form Schema Versus API Schema

Sometimes they are the same object, and sometimes reusing one for both is a defect.

They coincide when the form collects exactly the API's input, with the same constraints. They diverge when the form has fields the API does not take (a confirmation input, a UI-only toggle), when the API requires fields the form derives, or when the two have different optionality — a draft-saving form accepts a partial shape the API rejects.

Deriving one from the other (see [schema-modules.md](./schema-modules.md)) keeps them related without forcing them to be identical.

Independent of that: **the server revalidates**. A client-side schema is a user-experience feature. It runs in an environment the user controls and provides no guarantee whatsoever to the server, which must parse the submission against its own schema regardless of what the form did.

**Guidelines:**

- MUST revalidate every submission server-side against the server's own schema; a client-side parse is not a security control.
- MUST NOT reuse a form schema as an API schema when the two differ in fields or optionality; derive one from the other instead.
- SHOULD keep the shared fields in one schema and derive both variants from it, so a constraint change reaches both.
