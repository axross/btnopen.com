# Props Contract

Apply this reference when declaring a component's props, destructuring them, naming them, or deciding what a caller is allowed to pass.

## Typing the Props

A component's props type starts from the element it actually renders, so every attribute that element accepts passes through without being re-declared. Custom props are intersected onto that base.

**Example:**

```tsx
// web — the root is a <header>
function JobListHeader({
  job,
  className,
  ...props
}: ComponentProps<"header"> & { job: Job }): JSX.Element {
  // …
}

// mobile native — the root is a View
function JobListItem({
  job,
  style,
  ...props
}: ComponentPropsWithoutRef<typeof View> & { job: Job }): JSX.Element {
  // …
}
```

**Guidelines:**

- MUST base the props type on the root rendered element: `ComponentProps<"div">` for an intrinsic web element, `ComponentPropsWithoutRef<typeof Primitive>` for a native primitive, and `ComponentProps<typeof Component>` when the component wraps another component.
- MUST intersect custom props onto that base with `&` rather than re-declaring the element's own attributes.
- MUST declare the component's return type explicitly (`JSX.Element`, `JSX.Element | null`, or `null` for a component that renders nothing).
- MUST `Omit` a base prop before redefining it, rather than shadowing it with an incompatible type.
- SHOULD follow the host project's convention for marking props read-only — per-prop `readonly`, a `Readonly<>` wrapper, or neither — and its linter settings where they decide the question. There is no default; consistency within the project is the requirement.

## One-Level Destructuring and the Props Spread

Destructure props **exactly one level deep**. Name the props the component reads, and collect everything else into `...props`. Never destructure into a nested prop's fields — doing so silently drops the rest of that object and hides the component's real contract from its type.

The rest object is then **spread onto the root element**, which is what makes an unanticipated attribute — a test hook, an accessibility attribute, an event handler, a framework-injected prop — reach the DOM or native node without the component enumerating it.

**Example:**

```tsx
function JobListItem({
  job,
  className,
  ...props
}: ComponentProps<"li"> & { job: Job }): JSX.Element {
  return (
    <li className={clsx(css.item, className)} {...props}>
      {job.title}
    </li>
  );
}
```

**Guidelines:**

- MUST destructure props exactly one level deep; never destructure a nested object prop's fields in the parameter list.
- MUST collect undeclared props into a rest object and spread it onto the component's root element.
- MUST, when the literal root is a provider, a context wrapper, or a higher-order component that renders no node of its own, spread the rest onto the meaningful root — the element that actually lands in the tree.
- MUST NOT drop the rest object. A component that destructures props and never spreads them silently breaks every caller that passes an attribute it did not anticipate, and the type system will not catch it.
- MAY destructure a prop the component must deliberately **not** forward — typically `children` when the component places it itself — so it is excluded from the spread; do this only when forwarding it would be wrong.

### Spread Order and Override Capability

The spread's position decides who wins. Spreading **last** lets a consumer override anything the component set, which is the point of accepting the rest object at all.

The styling prop is the deliberate exception: it is destructured out and merged explicitly, because a blind override would discard the component's own appearance instead of extending it (see [styling-props.md](./styling-props.md)).

**Guidelines:**

- MUST place the props spread after the attributes the component sets itself, so a consumer can override them.
- MUST destructure the styling prop out of the rest object and merge it explicitly rather than letting the spread overwrite the component's own styles.
- MUST, when a prop must not be overridable — an invariant the component depends on for correctness — set it after the spread and state why in a comment, rather than leaving the ordering to look accidental.
- SHOULD keep a caller-supplied test hook overridable; a component that hard-codes its own hook after the spread cannot be reused in two places a test must tell apart.

## Naming

One file often holds several handlers, and a screen with three `onPress` callbacks in scope tells a reader nothing about which control fired which. Naming the **prop** for the event it reports and the **local handler** for its subject and event keeps the two legible side by side, and makes the wiring between them visible at the call site rather than inferred from position.

**Guidelines:**

- MUST name a handler prop for the event it reports, in `on<Event>` form (`onPress`, `onChange`, `onEndReached`).
- MUST name a local handler for its subject and event, in `on<Subject><Event>` form (`onSubmitButtonPress`, `onJobListRefresh`, `onSearchFieldChange`), so a file with several handlers reads unambiguously.
- SHOULD NOT name local handlers `handleX`; reserve that shape for a library API that dictates it.
- MUST alias a prop on receipt when the local name should differ from the published one — capitalizing a component-typed prop (`icon: Icon`) so it renders as an element, or disambiguating a value from its wrapper.
- SHOULD name a prop for what it _is_ to the consumer, not for how the component uses it internally.

## Whole-Model Props

Pass the **whole model**. A component that takes `job` rather than `jobId`, `jobTitle`, `jobSalary`, and `jobPostedAt` does not need a new prop and a new call-site edit every time it renders one more field, and its type stays anchored to the domain model instead of drifting into a parallel copy of it.

**Guidelines:**

- MUST accept the domain model as a single prop rather than spreading its fields into separate scalar props.
- MUST type that prop with the project's model type, so a change to the model surfaces at the component.
- SHOULD derive presentational values — a formatted date, a truncated label, a computed initial — inside the component or in a helper it calls, rather than requiring the caller to pre-format them.
- MAY accept a scalar instead when the component genuinely takes a primitive value with no model behind it, such as a progress ratio or a count.

## Variants as Closed Unions

A closed string union names the states a component actually supports and makes an unsupported combination unrepresentable. Boolean props multiply: three booleans describe eight states, most of which the component never handles.

**Example:**

```tsx
type ButtonProps = {
  variant: "solid" | "translucent";
  intent: "neutral" | "danger";
  size: "sm" | "md";
};
```

**Guidelines:**

- MUST express a component's mutually exclusive appearance or behavior states as a closed string union prop.
- MUST NOT introduce a boolean prop that is really one arm of a variant (`isPrimary`, `isDanger`, `isLarge`).
- MAY use a boolean for a genuinely independent, two-state fact — a list row's `first` or `last` position, a `disabled` flag — where no third state can exist.
- SHOULD give a variant prop a default only when one variant is genuinely the common case; otherwise require it, so a caller states its intent.

## Controlled and Uncontrolled Values

A component that owns a value should support both modes from one implementation: the caller either supplies `value` and reacts to `onChange`, or omits it and lets the component hold the state, seeded by `defaultValue`.

Detect the controlled mode by testing against `undefined` specifically. A nullish test (`value ?? stateValue`) treats `null` as absent — but `null` is a legitimate controlled value meaning "cleared", so a caller that clears a selection would silently hand control back to the component's own state mid-flight.

**Example:**

```tsx
const [stateValue, setStateValue] = useState(defaultValue ?? []);
const isControlled = value !== undefined;
const resolvedValue = isControlled ? value : stateValue;
```

**Guidelines:**

- MUST decide the mode by testing the controlled prop against `undefined`, not by a truthy or nullish test, so a legitimate `null` or empty value does not fall back to internal state.
- MUST call the change handler in both modes, so a controlled caller and an uncontrolled observer behave identically.
- MUST NOT switch a component between controlled and uncontrolled across renders; treat the presence of the controlled prop on first render as fixed.
- SHOULD name the uncontrolled seed `defaultValue` and the controlled prop `value`, matching the platform's own form primitives.

## Data Attributes on Web

`data-*` attributes carry structured facts on an element without inventing a class or a wrapper. Three uses recur, and they are distinct:

| Use             | Shape                        | Consumed by                               |
| --------------- | ---------------------------- | ----------------------------------------- |
| Test hook       | `data-testid="job-list"`     | the test runner's locator                 |
| Variant carrier | `data-banner-type="warning"` | the stylesheet, via an attribute selector |
| Entity selector | `data-slug="hiring-2026"`    | a test narrowing to one item in a list    |

A third-party component that publishes its own state attributes (`data-highlighted`, `data-popup-open`) is styled through those attributes rather than by wrapping it or overriding its internals.

**Guidelines:**

- MUST use a `data-*` attribute rather than a class when the value is a fact about the element, not a style hook.
- SHOULD drive a component's own variant styling from a `data-*` attribute when the variant must also be visible to a test or to a descendant selector; otherwise a class is sufficient.
- MUST add a stable, non-sensitive identifier — a slug, an opaque id — as a `data-*` attribute on a repeated list element when a test needs to address one specific item, rather than relying on its index.
- MUST style a third-party component through the state attributes it publishes, not by reaching into its markup.
- MUST NOT put user-identifying or otherwise sensitive values in a `data-*` attribute; it is readable by anything running on the page. What counts as sensitive is owned by the project's data-exposure and privacy practices.

Mobile native has no `data-*` equivalent — its test hook is the platform's own test-identifier prop, and its state is expressed through props and accessibility attributes. See [testability.md](./testability.md).

## Refs

A ref is how a caller reaches the node a component renders — to focus it, measure it, scroll it, or drive it imperatively. A component that swallows the ref forces its caller to wrap it in an extra element purely to get a handle, which changes the layout to work around a missing prop.

**Guidelines:**

- MUST let `ref` reach the root element on React 19 and later, where it is an ordinary prop: leave it in the rest object and let the spread carry it, or destructure it and pass it explicitly.
- MUST use the host project's existing ref mechanism when it targets an earlier React version, and match its convention for setting a display name.
- SHOULD forward a ref whenever the component wraps a focusable, measurable, or imperatively controlled element, so a caller is not forced to add a wrapper node to reach it.
