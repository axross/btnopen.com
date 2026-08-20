# Styling Props

Apply this reference when a component accepts a `className`, a `style`, or whatever styling prop the host project's mechanism uses.

> **Twin section.** Two things in this reference are deliberately restated from a React component styling capability's style-composition reference, so this skill stands alone where that one is not installed: the **three obligations** below — accept, never drop, merge last — and the **override-versus-variant** split at the end. Both copies are maintained; a change to either belongs in the other, and a difference in what they **require** is a defect in whichever was edited alone, not a distinction to preserve. Where that capability is installed it governs, naming the project's concrete tooling; this copy names mechanisms generically to stay portable, and is the shorter of the two by design.
>
> Everything else here has no twin and is this skill's own: how the props spread interacts with the styling prop, which composition helper a project uses, and how the style prop is typed are props-contract concerns, not style-ownership ones.

## The Contract

A component owns **what it looks like**; its consumer owns **where it sits and how big it is**. The styling prop is how the consumer exercises that half of the split, so it is not optional decoration — a component that renders a styled root and refuses the prop cannot be placed in a second layout without a fight.

Three obligations, and all three are load-bearing:

1. **Accept it.** Every component rendering a styled root takes the styling prop.
2. **Never drop it.** Destructuring the prop and then failing to apply it breaks every caller silently — the type checker sees a prop that was consumed, and the layout is simply wrong at runtime.
3. **Merge it last.** The consumer's value comes after the component's own, so it wins without an escalating specificity contest.

**Guidelines:**

- MUST accept the host platform's styling prop on every component that renders a styled root element.
- MUST apply the accepted value; a destructured styling prop that never reaches an element is a defect even though it type-checks.
- MUST merge the consumer's value **last**, after the component's own styles and after any variant or state styles.
- MUST NOT let the props spread overwrite the styling prop — destructure it out explicitly and merge it (see [props.md](./props.md)).
- MUST keep the component's own root selector at zero specificity on web — the platform equivalent on native — so a single incoming value is enough to override it.

## Composing Class Names on Web

Class names compose by concatenation, filtered for falsy values. Which helper does it is a property of the host project's styling mechanism, not a choice this skill makes: a CSS Modules project concatenates, a utility-class project needs a conflict-aware merge so a later utility beats an earlier one in the same property group.

**Example — CSS Modules:**

```tsx
import { clsx } from "clsx";
import css from "./job-list-item.module.css";

export function JobListItem({
  className,
  ...props
}: ComponentProps<"li">): JSX.Element {
  return <li className={clsx(css.item, className)} {...props} />;
}
```

**Guidelines:**

- MUST use the host project's existing class-composition helper rather than string concatenation or template literals, so falsy values drop out predictably.
- MUST pass the consumer's `className` as the final argument to that helper.
- MUST use a conflict-aware merge helper when the host project styles with utility classes, since plain concatenation leaves both conflicting utilities in the list and lets source order decide the winner.
- MUST import a CSS Module under a consistent local name. Which modules a component may import at all — one per component, never another's — is owned by the project's React component styling practices.
- MUST determine the mechanism from the project itself — its dependencies, its existing components, its build configuration — rather than assuming one.

## Merging Styles on Mobile Native

Native styles compose as an **array**, evaluated left to right, with the consumer's value last. When a style-runtime library is in use, the array form is not a stylistic preference — it is the only form that preserves the binding the runtime updates through.

**Example:**

```tsx
export function Card({
  style,
  ...props
}: ComponentPropsWithRef<typeof View>): JSX.Element {
  return <View style={[styles.card, style]} {...props} />;
}
```

**Guidelines:**

- MUST merge native styles with array syntax, placing the consumer's `style` last.
- MUST NOT spread style objects together or flatten them into a single object when a style-runtime library is in use; both destroy the binding it updates through, and the style silently stops reacting to theme and runtime changes.
- MUST place variant and state styles between the base style and the consumer's value, so the consumer still wins.
- MUST accept the platform's style-prop type for the root element rather than narrowing it to a plain object type, so a caller may pass an array or a resolved registry value.
- SHOULD apply the same array-merge contract to a pressable's function form (`style={({ pressed }) => [ … ]}`), keeping the consumer's value last inside the returned array.

## Override or Variant

An override is legitimate when the difference is **contextual** — where the component sits, how much room it gets. It is illegitimate when it changes what the component **is**, because the next caller then has to copy the override to get the same thing.

**Guidelines:**

- MUST express a contextual difference — position, margin, size, grid placement — as a consumer style passed through the styling prop.
- MUST express an identity difference — a filled versus an outlined button, a destructive versus a neutral action — as a variant prop on the component, never as a consumer override of its colours.
- MUST NOT reach into another component's internals to restyle it; route the change through a prop, a value on its root, or a shared token.
- SHOULD promote a repeated override into a variant once a second caller needs it identically.
