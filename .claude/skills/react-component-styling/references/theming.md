# Design Tokens and Theming

Apply this reference when declaring a project's design tokens, when choosing which token a style should use, and when a value you want has no token yet. Colour is large enough to have its own reference — see [color-and-gamut.md](./color-and-gamut.md) for ramps, role names, schemes, and gamut. Everything else lives here.

The primitive-versus-semantic tier split below follows the [W3C Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/) and [Material Design 3's design tokens](https://m3.material.io/foundations/design-tokens/overview).

Tokens exist so a visual decision is made once and consumed everywhere. That only holds if components consume the **semantic** tier — a name that says what the value is for — rather than the raw scale beneath it. A component that reaches past the semantic name to a primitive, or inlines the literal it would have resolved to, is the leak that breaks the next theme change.

## Token Families

A project declares these families. Values are the project's; the shapes are not negotiable, because a component written against one shape does not survive a project that chose another.

| Family       | Shape                                              | Notes                                              |
| ------------ | -------------------------------------------------- | -------------------------------------------------- |
| Colour       | Named semantic roles × scheme, over a 13-step ramp | See [color-and-gamut.md](./color-and-gamut.md)     |
| Typography   | Composite named text roles                         | Family + size + line height + weight, bundled      |
| Spacing      | Numeric steps keyed to their base px               | `--space-16`, `theme.space.x16`                    |
| Radius       | Named tier                                         | `xs` / `sm` / `md` / `lg` / `full`                 |
| Border width | Named tier including a hairline step               | `hairline` / `base` / `thick`                      |
| Duration     | Named scale                                        | `sm` … `2xl`, by magnitude never by milliseconds   |
| Easing       | Role-named curves                                  | `standard` / `enter` / `exit`, never `ease-in-out` |

**Guidelines:**

- MUST declare every family a project uses, even where one has a single member; a lone easing token still gets a role name so a second one can join it later.
- MUST NOT fold one family into another. Radius is not spacing, and a border width is not a spacing step, even when the numbers coincide today — the moment one moves, every borrowed use moves with it.
- MUST name a token for its role, never for its appearance or its value. `--duration-md` and `ease.standard` survive a retune; `--duration-200ms` and `ease-in-out` become lies.
- MUST keep the light and dark mappings structurally identical — the same names present in both — so no surface can reference a token that exists in only one scheme.

## Composite Text Roles

Family, size, line height, and weight are not independent choices: a heading family at a caption size is a mistake no caller should be able to make by accident. Bundling them into one named role removes the combination from the caller's hands, and on mobile native it is the only shape that works — there is no cascade, so the four values have to arrive together.

**Example — the shape on mobile native:**

```ts
const typography = {
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  body: {
    fontFamily: fonts.paragraph,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  caption: {
    fontFamily: fonts.paragraph,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  code: {
    fontFamily: fonts.monospace,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
} as const;
```

```tsx
const styles = StyleSheet.create((theme) => ({
  title: { ...theme.typography.title, color: theme.colors.text.neutral.high },
}));
```

**Example — the same roles on web, as a custom-property quad:**

```css
.title {
  font-family: var(--text-title-family);
  font-size: var(--text-title-size);
  line-height: var(--text-title-leading);
  font-weight: var(--text-title-weight);
}
```

**Guidelines:**

- MUST declare typography as named text roles that bundle family, size, line height, and weight, and MUST apply a role whole rather than picking values out of it.
- MUST NOT inline a numeric `fontSize` or `font-size` in a component. Every size a project uses is a text role; a size with no role is a missing token, not an exception.
- MUST pair a font family with its feature settings wherever the project declares them, since setting one without the other produces glyph mismatches between surfaces.
- SHOULD name roles for their content (`title`, `body`, `label`, `caption`, `code`), not their size (`lg`, `sm`), so a retune does not rename them.
- MAY add a role rather than stretch an existing one when a surface genuinely needs a new pairing — a new role is a design decision, but it is a cheaper one than a one-off literal.

## Spacing, Radius, and Border Width

Spacing steps carry their base pixel value in the name, because that number is the anchor a reader needs — it is the small-screen floor of a fluid token (see [fluid-and-responsive.md](./fluid-and-responsive.md)) and the thing a design hand-off is specified in. Radius and border width take named tiers instead, because their steps are role-shaped: a chip, a card, and a pill differ in kind, not in amount.

**Example:**

```css
--space-4: 0.25rem;
--space-8: clamp(0.5rem, 0.4643rem + 0.1786vi, 0.625rem);
--space-16: clamp(1rem, 0.9286rem + 0.3571vi, 1.25rem);

--radius-sm: 0.375rem;
--radius-md: 0.625rem;
--radius-full: 100vw;

--border-hairline: 0.0625rem;
--border-base: 0.125rem;
```

```ts
const space = {
  x4: 4,
  x8: 8,
  x12: 12,
  x16: 16,
  x24: 24,
  x32: 32,
  x48: 48,
} as const;
const borderWidth = {
  hairline: StyleSheet.hairlineWidth,
  base: 1,
  thick: 2,
} as const;
```

**Guidelines:**

- MUST key spacing steps to their base pixel value on both platforms — `--space-16` on web, `theme.space.x16` on native.
- MUST declare radius as a named tier and MUST NOT resolve a radius through the spacing scale, even where a step happens to match.
- MUST declare border widths as their own named tier, with a `hairline` step that resolves to the platform's thinnest renderable line (`StyleSheet.hairlineWidth` on native, a sub-pixel length on web).
- MUST NOT make a hairline, a border width, or a focus-ring dimension fluid; sub-pixel interpolation degrades border rendering and breaks a focus-ring specification.
- SHOULD assign each radius step a role in the project's design system (chip, card, pill) so a surface picks by role rather than by eye.

## Duration and Easing

Motion tokens follow the same role-naming rule as everything else. An easing token named for its curve (`ease-in-out`) is a value pretending to be a name: retuning the curve either renames the token or makes it false.

**Guidelines:**

- MUST draw every transition and animation duration from the duration scale, and every curve from a role-named easing token.
- MUST NOT inline a curve keyword or a `cubic-bezier()` literal in a component, and MUST NOT name an easing token after the curve it currently holds.
- MAY use a literal duration for a deliberately non-interactive cadence — a multi-second atmospheric reveal that does not belong on the interaction scale — and SHOULD promote it to a token once a third surface uses it.
- SHOULD keep the interaction tier small; a project needs far fewer durations than it thinks, and each extra one is a chance for two surfaces to disagree.

## Snapping to the Scale

A scale only constrains if values land on it. An off-scale value looks harmless in isolation and is exactly how a scale erodes — so the rule is to snap to the nearest step, and to treat "no step fits" as a signal about the scale rather than a licence to inline.

**Guidelines:**

- MUST resolve every colour, spacing, radius, border-width, duration, easing, and typography value through a token.
- MUST snap to the nearest step rather than inlining an off-scale value, and MUST raise a missing step as a design decision rather than resolving it locally.
- MUST NOT introduce a component-local constant that terminates in an off-scale colour, length, or duration. A component-scoped custom property or constant is legitimate when every branch of it resolves either to a project token or to one of the literals listed below — a filter multiplier toggled per state is fine; a hard-coded hex or padding is not.
- MUST keep off-token literals to this complete list:
  - **Fixed element dimensions** — an icon's drawn size, an avatar's diameter, a fixed line box, an `aspect-ratio`. These are geometry, not scale spacing.
  - **Ratios and multipliers** — an opacity, a `flex` value, a `z-index`, a `scale()` factor.
  - **Full-fill and intrinsic keywords** — `100%`, `stretch`, `auto`, `max-content`.
  - **Values inside the theme file itself**, which is where the scales are defined.
- MUST NOT extend that list locally. A font size is not on it (every size is a text role), and neither is a hairline (it is a border-width step).

## Reading a Token Outside a Stylesheet

Some consumers of a token are not stylesheets: an icon component takes colour and size as props, a navigator takes them as options, an animation interpolates between them. These still resolve through tokens.

**Example — an icon on mobile native:**

```tsx
const { theme } = useUnistyles();

return <ChevronRight color={theme.colors.text.neutral.low} size={22} />;
```

**Guidelines:**

- MUST resolve a token through the theme object when a value is passed as a prop or an option on mobile native, rather than importing the raw palette module.
- MUST make a web SVG track its surrounding text colour with `currentColor` rather than taking a colour prop, unless the icon is deliberately independent of its context.
- MUST accept an icon as a component prop when a component lets its caller choose one, rather than a glyph-name string, so the caller keeps type safety and the component keeps control of colour and size.
- MUST source icons from the project's single icon set; a second set is a design decision, not a component-level one.
- SHOULD keep token reads out of render bodies where the platform offers a stylesheet-level equivalent — a value read in JS does not participate in the stylesheet's own update path.
