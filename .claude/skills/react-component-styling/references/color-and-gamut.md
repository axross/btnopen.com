# Colour and Gamut

Apply this reference when declaring a project's colour tokens, when picking a colour for a surface, and when a colour needs to render as richly as the display allows. The rest of the token families live in [theming.md](./theming.md).

Colour is the family where "name by role, not by appearance" earns the most, because the same role has to work in two schemes with inverted lightness. A component that picks a colour by how it looks in one scheme has silently bound itself to that scheme; a component that picks by role adapts to both with no per-surface work.

## The Ramp Is Internal; Roles Are the Surface

A project builds each scheme as a **13-step ramp**, then maps it once onto **semantic role names**. Components consume only the role names. The ramp is an implementation detail of the theme file and never appears in a component.

Steps 1–12 follow the [Radix colour scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale). Step 0 is an addition below step 1: the stronger page background, which is pure white in the light scheme and pure black in the dark one.

| Step | Radix role                                | Semantic name        |
| ---- | ----------------------------------------- | -------------------- |
| 0    | _(addition)_ stronger app/page background | `background.plain`   |
| 1    | App background                            | `background.app`     |
| 2    | Subtle background                         | `background.subtle`  |
| 3    | UI element background                     | `component.rest`     |
| 4    | Hovered UI element background             | `component.hovered`  |
| 5    | Active / selected UI element background   | `component.selected` |
| 6    | Subtle borders and separators             | `border.subtle`      |
| 7    | UI element border and focus rings         | `border.interactive` |
| 8    | Hovered UI element border                 | `border.hovered`     |
| 9    | Solid background                          | `solid.rest`         |
| 10   | Hovered solid background                  | `solid.hovered`      |
| 11   | Low-contrast text                         | `text.low`           |
| 12   | High-contrast text                        | `text.high`          |

Radix guarantees steps 11 and 12 against a step-2 background of the same scale; treat that pairing as the contrast baseline and verify anything else. Contrast targets themselves belong to a high-fidelity UI design capability.

**Example — the token surface:**

```css
color: var(--color-text-neutral-high);
background-color: var(--color-component-accent-rest);
```

```ts
color: theme.colors.text.neutral.high,
backgroundColor: theme.colors.component.accent.rest,
```

**Guidelines:**

- MUST expose colour to components only as semantic role names, in the shape `--color-<tier>-<scheme>-<slot>` on web and `theme.colors.<tier>.<scheme>.<slot>` on mobile native.
- MUST NOT reference a ramp step from a component — no `--accent-3`, no `slate11`, no index into the ramp array. The ramp exists inside the theme file and nowhere else.
- MUST declare all 13 steps for every scheme, in both light and dark, so no role is unreachable. A missing step 4 is what pushes a project into faking hover with opacity.
- MUST write the ramp out as named primitive constants inside the theme file and map them onto roles, rather than pasting resolved values next to a comment naming the step; a comment drifts and nothing catches it.
- SHOULD keep step 0 at pure white and pure black respectively — it is the one step whose job is to be the extreme, and softening it removes the reason it exists.

## Schemes

A scheme is a full 13-step ramp with its own identity. Every project declares at least two; an application that can destroy or reject something declares a third.

**Guidelines:**

- MUST declare a `neutral` scheme (chrome — anything that should not read as branded) and an `accent` scheme (brand — anything that should).
- SHOULD declare a `destructive` scheme in an application whose UI has irreversible or rejecting actions; a content site typically does not need one.
- MUST NOT introduce a second brand scheme or a per-surface hue. Identity is one accent; a surface that wants its own is a design decision, not a component one.
- MUST NOT cross schemes within one interaction. A `component.accent.rest` surface hovers to `component.accent.hovered`, never to a neutral step — a cross-scheme hover reads inconsistently between the two colour schemes.
- MUST add `text.onSolid` per scheme. The Radix scale has no step for text drawn on a solid fill (steps 11–12 are for text on a _background_ step), but a filled button needs one, and guessing white is only right for some hues.

## The Alpha Ramp

Every role also exists in a translucent form, because a colour composited over unknown content — imagery, a scrolling surface, another component — cannot be a flat step. The alpha ramp is a parallel set of the same 13 steps at graded alpha, exposed as a slot suffix so the role name stays recognisable.

**Example:**

```css
background-color: var(--color-solid-accent-rest-alpha);
```

```ts
backgroundColor: theme.colors.solid.accent.restAlpha,
```

**Guidelines:**

- MUST declare a parallel alpha ramp per scheme, exposed as an `…Alpha` slot suffix (`-alpha` in the CSS custom-property form).
- MUST use an alpha role wherever a colour composites over content the theme does not control, rather than a flat step chosen to look right over today's background.
- MUST NOT hand-write an `rgba()` or a slash-alpha literal in a component; that is an off-scale value like any other.
- MAY derive a one-off alpha on web with relative colour syntax when the derivation is genuinely local, provided it derives from a role token and not from a literal.

## Picking by Role, Not by Appearance

The two schemes share a lightness scale that inverts end to end: step 0 is the lightest value in the light scheme and the darkest in the dark one. The consequence is the whole point of the system — a surface that picks the correct role adapts to both schemes with no per-surface work.

**Good Example:**

> A card at rest is "a component background", so it takes `component.<scheme>.rest` and hovers to `component.<scheme>.hovered`. Both schemes render correctly with no override.

**Bad Example:**

> A card takes a light grey because that is what looked right in the light scheme, then needs a dark-scheme override to stop being a light grey on a dark page — and now every future change has to be made twice.

**Guidelines:**

- MUST pick a role by what the surface _is_ — a page background, a component at rest, a border on an interactive element, low-contrast text — never by how a value looks in one scheme.
- MUST treat a per-scheme override that only reassigns a role as evidence the wrong role was picked; fix the role rather than adding the branch.
- MUST move an interaction state along its own tier — `rest` → `hovered` → `selected` — rather than jumping tiers or schemes.
- MUST limit per-scheme overrides to exactly two cases:
  - **Filtered or externally authored imagery**, whose luminance cannot adapt on its own because the source is not part of the palette.
  - **Browser- and OS-level primitives** — the colour-scheme declaration, scrollbar colours, selection colours — which are declared once at the root and never per surface.
- MUST treat any third category as a design smell and re-examine the role choice before adding a branch.

## Wide-Gamut Colour with an sRGB Fallback

Prefer the widest colour format the platform can express, and fall back to sRGB. Two separate mechanisms are involved and conflating them is the usual mistake:

- **`@supports`** answers _does this browser understand this colour syntax?_ It is how a fallback is written.
- **`@media (color-gamut: p3)`** answers _can this display show a wider gamut than sRGB?_ It is how a deliberate enhancement is written — not a fallback.

See [Wide gamut color in CSS with Display-P3](https://webkit.org/blog/10042/wide-gamut-color-in-css-with-display-p3/) for the authoring patterns and [`color-gamut`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut) for what the media feature asserts.

A third fact removes most of the work: `oklch()` and `color(display-p3 …)` are wide-gamut formats that browsers **gamut-map** to the display automatically. A colour authored in `oklch()` already renders as richly as the screen allows, and clamps gracefully on an sRGB screen. You need `@media (color-gamut:)` only when you want a _different_ colour on a wide-gamut display, not merely a better rendering of the same one.

**Example — the cascade fallback, for a literal:**

```css
.mark {
  color: rgb(0 255 0);
  color: color(display-p3 0 1 0);
}
```

**Example — the feature-query fallback, for a token:**

```css
:root {
  --color-solid-accent-rest: rgb(0 200 150);
}

@supports (color: oklch(0% 0 0)) {
  :root {
    --color-solid-accent-rest: oklch(70% 0.16 168);
  }
}
```

**Guidelines:**

- MUST author colour in a wide-gamut format (`oklch()`, or `color(display-p3 …)`) and MUST provide an sRGB fallback for browsers that do not parse it.
- MUST use the feature-query form (`@supports`) when the colour is assigned to a custom property; the cascade form does not work there, because an unparseable value on a custom property is not discarded at parse time the way a real property's is.
- MAY use the cascade form (sRGB declaration followed by the wide-gamut one) when assigning directly to a real property.
- MUST NOT use `@media (color-gamut: p3)` as a fallback mechanism — it describes the display, not the browser, and a browser that cannot parse the colour will fail inside the query just as it would outside it.
- MUST keep every colour in one space within a project. Mixing `oklch()` with `hsl()` or hex produces visible hue shifts wherever the two meet, including across a fallback boundary.
- SHOULD derive a contextual variant with relative colour syntax over a role token rather than adding a top-level token, keeping the channels that are not the point of the derivation intact.

## Colour Space on Mobile Native

Mobile native does not have web's colour plumbing, and the skill does not pretend otherwise. React Native renders sRGB by default; its documented colour formats are hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, `hwb()`, and named colours. Display P3 exists only as an **iOS-level opt-in** that switches the app's default colour space (`RCTSetDefaultColorSpace`, or an equivalent Expo config plugin), with no Android counterpart.

**Guidelines:**

- MUST author mobile-native theme colours in an sRGB format and MUST NOT assume a `color()` function or a gamut media query is available.
- SHOULD treat wide gamut on mobile native as a whole-app, opt-in decision recorded in the project's configuration, never as a per-component choice.
- MUST NOT let a wide-gamut opt-in on one platform silently change token values shared with another; a project that opts in declares the wider values deliberately and re-verifies contrast against them.
- MUST keep the token _shape_ identical across platforms even where the colour space differs, so a rule learned on one platform still applies on the other.
