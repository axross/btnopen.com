---
name: react-component-styling
description: The ability to style a React component — the implementation mechanics of a styled surface, on web (CSS Modules) and mobile native (Unistyles). Covers style composition (self-contained vs consumer-owned properties, override contracts, one module per component); semantic design tokens (a 13-step colour ramp behind Radix-worded role names, composite text roles, px-keyed spacing, radius/border-width/duration scales, token snapping); wide-gamut colour with an sRGB fallback; fluid `clamp()` sizing and container-driven responsiveness; adaptive styling (`prefers-reduced-motion`, pointer- and hover-conditional rules, pointer-sized touch targets, print, RTL); style property order; global styles and cascade layers; and the two platform adapters (`@layer`/`@scope`/container queries, and Unistyles variants/mini runtime/safe areas). Ships a validator.
when_to_use: Use whenever writing, reviewing, or refactoring the styles of a React component on web or mobile native — a CSS Module, a Unistyles `StyleSheet.create`, a theme or token file, or global styles. Triggers include "styling", "CSS", "theme", "design token", "dark mode", "container query", "media query", "breakpoint", "responsive", "touch target", "hover on mobile", "safe area", "style prop", "className", "property order", "colour gamut", "P3", "reduced motion", or a surface that looks wrong at some width, pointer type, or colour scheme. For design rationale — hierarchy, contrast targets, motion taste — use a high-fidelity UI design capability instead.
user-invocable: false
---

# React Component Styling

Use this capability whenever you write, review, or refactor the styles of a React component — a CSS Module, a Unistyles stylesheet, a theme file, or the global styles beneath them. It owns **implementation mechanics**: which properties belong to a component and which belong to its consumer, what shape the design tokens take and how they are consumed, how a surface adapts to viewport, container, pointer type, colour gamut and motion preference, and in what order the properties are written.

It does **not** own design rationale. Visual hierarchy, contrast targets, what a colour means, how much motion is tasteful, whether a state reads as interactive — those belong to a high-fidelity UI design capability. Where a rule here has a design counterpart, this skill states the mechanic and points at that capability rather than restating its reasoning.

This skill is self-contained and prescribes token **shapes**, never token **values**. The palette, the ramp, the type scale, and the spacing steps are the host project's; bind every value to the project's semantic tokens, and where a needed role is missing, add the token rather than inlining a literal.

**Platform adapters.** Two references are conditional, not universal:

- Apply the **CSS Modules** rules to a pre-existing component that already uses CSS Modules, and to a new component only when CSS Modules is the project's primary styling mechanism.
- Apply the **Unistyles** rules to a pre-existing component that already uses Unistyles, and to a new component only when Unistyles is the project's primary styling mechanism. Unistyles guidance here is scoped to mobile native.

Everything outside those two references is platform-neutral and applies either way.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

## Style Composition

See [style-composition.md](./references/style-composition.md) for:

- separating the properties a component owns from the ones its consumer owns, and the root-element properties a component never sets
- accepting and merging an incoming `className` or `style`, and the array-merge contract Unistyles requires
- deciding when a consumer overrides a child's styles rather than the child growing a prop
- pairing one style module per component, and sharing a component instead of sharing a stylesheet
- sizing a child from its parent, and the "appearance here, size there" split

## Design Tokens and Theming

See [theming.md](./references/theming.md) for:

- the token families a project declares, and the shape of each
- composite named text roles, and why family, size, leading, and weight travel together
- px-keyed spacing steps, the named radius and border-width tiers, and the hairline step
- duration and role-named easing tokens
- snapping a value to the nearest step, and the closed list of literals that stay legal
- reading a token outside a stylesheet — icon colour and size, navigator options, animated values

## Colour and Gamut

See [color-and-gamut.md](./references/color-and-gamut.md) for:

- the 13-step ramp as an internal primitive tier, and the semantic role names components actually consume
- the step-to-role table, the colour schemes a project declares, and the alpha ramp
- picking a step by role rather than by how it looks in one scheme, and what a per-scheme override signals
- preferring a wide-gamut colour format with an sRGB fallback, and which of `@supports` and `@media (color-gamut:)` answers which question
- the colour-space reality on mobile native, and what it means for parity with web

## Fluid and Responsive Sizing

See [fluid-and-responsive.md](./references/fluid-and-responsive.md) for:

- fluid scalar tokens built with `clamp()`, and which tokens stay fixed
- choosing between viewport units and container units, and why root-level tokens force the viewport
- tiering a surface against its own container rather than the viewport, and propagating the tier to descendants
- declaring breakpoints, and what belongs at a breakpoint versus in proportional sizing
- measuring a parent on mobile native and feeding the measurement into a style

## Adaptive Styling

See [adaptive-styling.md](./references/adaptive-styling.md) for:

- which conditions belong in a media query and which belong elsewhere
- honouring a reduced-motion preference on both platforms
- gating hover styles on the primary pointer, and why that gate differs from the one used for sizing
- sizing an interactive target from the pointer type, on both axes, and expanding a hit area without moving the visual
- print styles, and writing direction-agnostic styles for right-to-left layouts

## Style Property Order

See [style-property-order.md](./references/style-property-order.md) for:

- the property group order inside a single style block
- where custom properties, nested at-rules, and pseudo-selector blocks sit
- the order of composed styles — base, variant, state, animated, consumer

## Global Styles

See [global-styles.md](./references/global-styles.md) for:

- what belongs in global styles and what does not
- weakening global styles so a component can override them without a specificity fight
- cascade-layer order on web
- the colour-scheme declaration, scrollbar, and selection styling
- the mobile-native equivalents of a global stylesheet

## CSS Modules (web)

See [css-modules.md](./references/css-modules.md) for:

- the module skeleton — cascade layer, scope, and the zero-specificity scope root
- keyframes placement and animation naming
- propagating style context to descendants through custom properties
- size-based styling with container queries and container-relative units
- styling a third-party component through its state attributes, and the one narrow case for `!important`
- scroll-driven animation, modern units, and logical properties

## Unistyles (mobile native)

See [unistyles.md](./references/unistyles.md) for:

- the stylesheet signature, theme configuration, and adaptive themes
- safe-area-aware styling with the mini runtime
- choosing between variants and dynamic functions
- parent-size-aware styling from a measured layout
- reading the theme outside a stylesheet
- platform-forked style files, and the navigation-cloning caveat that silently drops styles

## Verifying a Styling Change

A styling change is verified by looking at the surface under every condition the rules above make conditional — not by the type-checker, which sees none of them. Reviewing one rendering proves one branch.

**Guidelines:**

- MUST check both colour schemes for any change that touches colour; a surface legible in one and not the other is a defect, not a polish item.
- MUST check both pointer classes for any change to an interactive surface — a coarse-pointer rendering for target size, a fine-pointer rendering for hover.
- MUST check the reduced-motion branch whenever an animation or transition is added or changed.
- MUST check the width range a fluid or container-tiered surface spans, at minimum the two ends and one point either side of each breakpoint.
- SHOULD check a wide-gamut display and an sRGB display when a colour is authored outside the sRGB gamut.
- SHOULD check a right-to-left rendering when a change adds directional properties.
- MUST report which of these checks were run and which were skipped, rather than presenting the change as fully verified.

## Validator

[scripts/check-component-styles.mjs](./scripts/check-component-styles.mjs) is a dependency-light Node validator (standard library only) for the subset of rules that are decidable from a file. Run it over a project's component styles:

```bash
node scripts/check-component-styles.mjs src
node scripts/check-component-styles.mjs app --token-source=design-system/
```

It takes files or directories (walking a directory for `*.module.css`, `*.ts`, and `*.tsx`), skips the project's token sources, reports each violation as `file:line`, and exits `0` when everything passes, `1` on any violation or unreadable path, and `2` on a bad invocation.

**What it checks:** raw colour, spacing, and duration literals where a token belongs; a CSS Module missing its cascade layer, its scope, or the zero-specificity scope root; and a component importing another component's style module.

**What it does not check:** every judgment the skill actually turns on — whether the chosen role is the right one, whether a hover gate uses the correct pointer feature, whether a target meets its size on both axes, whether a per-scheme override was warranted. A passing run is a floor, not a conformance claim, and never substitutes for the review.

**Guidelines:**

- MUST fix every reported violation rather than suppressing it; the checks cover only unambiguous rules.
- MUST NOT treat a passing run as evidence the change is correct — run the checks in [Verifying a Styling Change](#verifying-a-styling-change) as well.
