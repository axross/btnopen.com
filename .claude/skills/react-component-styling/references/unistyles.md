# Unistyles (mobile native)

Apply this reference to a mobile-native component that already uses Unistyles, and to a new one when Unistyles is the project's primary styling mechanism. The platform-neutral rules — composition, tokens, property order, adaptive behaviour — apply either way and are not restated here. This guidance is scoped to mobile native.

## The Stylesheet Signature

A Unistyles stylesheet is a function of the theme and, when it needs device metrics, of the mini runtime. Styles recompute in native code when a dependency changes, without a React re-render — which is why values have to come through this signature rather than be read in the component body.

**Example:**

```tsx
import { StyleSheet } from "react-native-unistyles";

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top,
    backgroundColor: theme.colors.background.neutral.app,
  },
}));
```

**Guidelines:**

- MUST import `StyleSheet` from the Unistyles package, never from React Native, so styles participate in the theming and runtime update path. A lint rule that forbids the React Native import is the cheapest way to keep this true.
- MUST configure themes and breakpoints once at the app entry point, with adaptive themes enabled so the theme follows the OS colour scheme.
- MUST take values from the `theme` argument rather than importing the palette module directly; a direct import bypasses the update path and freezes at the theme that was current when the module loaded.
- MUST NOT read the colour scheme manually in a component; adaptive theming already handles it, and a manual branch produces surfaces that do not follow a scheme change.

## Safe Areas

> **Twin section.** The stylesheet mechanics below are deliberately restated, in shorter form, by an Expo app development capability's safe-areas reference, so that skill stands alone where this one is not installed. This copy owns the topic and governs wherever both are installed, naming the concrete style system where the other names mechanisms generically. Both copies are maintained; a difference in what they **require** is a defect in whichever was edited alone. That skill additionally owns what this one does not: which edges a screen owns once navigators supply their own chrome, edge-to-edge configuration, and the fallback when no style system exposes insets.

The mini runtime carries the safe-area insets, so safe-area handling belongs in the stylesheet rather than in a provider-and-hook wrapper around the component. An inset is a _minimum_ clearance, not a padding value — a device with no notch reports zero, and a surface that uses the raw inset then has no gutter at all.

**Example:**

```tsx
const styles = StyleSheet.create((theme, rt) => ({
  row: {
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingStart: Math.max(rt.insets.left, theme.space.x16),
    paddingEnd: Math.max(rt.insets.right, theme.space.x16),
  },
}));
```

**Guidelines:**

- MUST take safe-area insets from the mini runtime rather than from a separate safe-area context hook when the value is consumed by a style.
- MUST combine a horizontal inset with the surface's own gutter as `Math.max(inset, gutter)`, so a device without an inset still gets the design's spacing.
- MUST apply insets with the direction-agnostic properties (`paddingStart` / `paddingEnd`), not `paddingLeft` / `paddingRight`, so a right-to-left layout mirrors correctly.
- MUST apply an inset at the surface that actually reaches the screen edge; applying it further in leaves a visible gap, and applying it twice down a tree doubles the clearance.
- MUST NOT treat the mini runtime as a source of parent geometry — it exposes screen, insets, status and navigation bars, breakpoint, orientation, pixel ratio, font scale, and content-size category, all device-level ([Mini runtime](https://www.unistyl.es/v3/references/mini-runtime/)). Parent size requires measurement (see below).

## Variants versus Dynamic Functions

Two mechanisms express a style that changes, and they are alternatives rather than a stack. The choice turns on whether the set of values is closed. See [Variants](https://www.unistyl.es/v3/references/variants/), [Compound variants](https://www.unistyl.es/v3/references/compound-variants/), and [Dynamic functions](https://www.unistyl.es/v3/references/dynamic-functions/).

**Variants** declare a named group of options in the stylesheet; the component selects one. They support compound cases, are parsed in native code, and keep the JSX free of conditional style arrays.

```tsx
const styles = StyleSheet.create((theme) => ({
  button: {
    borderRadius: theme.radius.md,
    variants: {
      tone: {
        neutral: { backgroundColor: theme.colors.solid.neutral.rest },
        accent: { backgroundColor: theme.colors.solid.accent.rest },
        default: { backgroundColor: theme.colors.solid.neutral.rest },
      },
      size: {
        sm: { minHeight: 36, paddingHorizontal: theme.space.x12 },
        md: { minHeight: 44, paddingHorizontal: theme.space.x16 },
        default: { minHeight: 44, paddingHorizontal: theme.space.x16 },
      },
    },
    compoundVariants: [
      {
        tone: "accent",
        size: "md",
        styles: { paddingHorizontal: theme.space.x24 },
      },
    ],
  },
}));

styles.useVariants({ tone, size });
```

**Dynamic functions** take arbitrary serializable arguments — a measured width, a caller-supplied length — and return a style.

```tsx
const styles = StyleSheet.create((theme) => ({
  bar: (width: number) => ({
    width,
    backgroundColor: theme.colors.solid.accent.rest,
  }),
}));
```

**Guidelines:**

- MUST express a closed set of options — a variant, an intent, a size, a boolean state — as variants and compound variants, not as a conditional style array or a chain of dynamic-function arguments.
- MUST express an open runtime value — a measured dimension, a caller-supplied number — as a dynamic function.
- MUST NOT expect a single style to be both a dynamic function and a variant declaration; pick one per style.
- MUST call `styles.useVariants(...)` in the component body under the rules of hooks. Variants are ignored entirely when it is never called, which fails silently as "the variant did nothing".
- MUST declare a `default` option in each variant group so a component with no selection still renders a defined style, and MUST pass `false` explicitly for a boolean variant — `false` and "unset" are not the same.
- MUST repeat every option key in each style that declares the same variant group, using an empty object where a style has nothing to add, or the group's type becomes a mismatched union.
- MUST pass only serializable arguments to a dynamic function; they cross into native code.

## Parent-Size Styling

There are no container queries here. A component whose layout depends on its own width measures it and feeds the measurement into a dynamic function — the pattern, including the first-render `null` case, is in [fluid-and-responsive.md](./fluid-and-responsive.md).

**Guidelines:**

- MUST use a measured layout with a dynamic function for parent-size-dependent styling, and MUST NOT substitute a screen breakpoint unless the component always spans the screen.
- SHOULD prefer intrinsic layout to measurement wherever it produces the same result, since measurement costs a render pass.

## Merging Styles

Array syntax is not a stylistic preference here: Unistyles tracks styles through a binding that spreading or flattening destroys, and the result is a style that silently stops updating when the theme or runtime changes. See [Merging styles](https://www.unistyl.es/v3/guides/merging-styles/).

**Guidelines:**

- MUST merge styles with array syntax (`[styles.root, style]`).
- MUST NOT spread a Unistyles style into an object literal, and MUST NOT pass one through `StyleSheet.flatten`.
- MUST accept the consumer's `style` last in the array, and MUST actually apply it — a destructured `style` that is never used is a broken contract the type system will not catch.
- MUST keep a `Pressable`'s render-prop style in the same array form, returning the array from the function rather than merging inside it.

## Reading the Theme Outside a Stylesheet

Some values are consumed as props or options rather than as styles — an icon's colour, a navigator's tint, a tab bar's background.

**Guidelines:**

- MUST read those values from the theme through the Unistyles hook, so they update with the theme like any style.
- MUST NOT import the theme module directly for this; the value would not follow a theme change.
- SHOULD keep such reads to values the platform genuinely accepts only as props or options — anything that can be a style should be one.

## Platform-Forked Style Files

Where a platform's native control differs enough that one component cannot serve both, fork the file by platform extension and keep a shared module as the contract.

**Guidelines:**

- MUST keep a base module that declares the shared props type when forking a component into `.ios` and `.android` files, and MUST derive each fork's props from it so the two cannot drift apart.
- MUST keep both forks styled from the same theme tokens; a fork exists to use a different native control, not to adopt different colours or spacing.
- SHOULD fork only the component that genuinely differs, rather than the whole surface that contains it.

## The Navigation-Cloning Caveat

> **Twin section.** Deliberately restated, in shorter form, by an Expo app development capability's navigation-and-links reference, so that skill stands alone where this one is not installed. This copy owns the topic and governs wherever both are installed. Both copies are maintained; a difference in what they **require** is a defect in whichever was edited alone. That skill frames the same defect around the router's own link primitive, which is where it is met in an Expo app.

A navigation primitive that clones its child to inject press and href props takes over the ref Unistyles applies styles through. Cloning a Unistyles-styled `Pressable` directly therefore **drops its computed style** — often only on a release build, where it appears as a control rendering with no background at all.

**Guidelines:**

- MUST NOT let a navigation primitive clone a Unistyles-styled element directly. Either wrap the styled element in a plain component and let the primitive clone the wrapper, or navigate imperatively from an `onPress` handler.
- MUST record the reason in a comment at the site, since the symptom appears only on a release build and the obvious "simplification" is to undo the workaround.
- SHOULD verify any navigation-wrapped pressable on a release build, not only in development, before treating its styling as done.
