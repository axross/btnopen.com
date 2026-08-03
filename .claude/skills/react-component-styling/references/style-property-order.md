# Style Property Order

Apply this reference when writing or reviewing the order of declarations inside a style block, and the order of styles composed into one element.

Unlike the other references here, this one rests on no external standard: no specification says what order declarations go in, and the choice is a project convention. It is stated as a rule anyway, because the value of an ordering convention comes entirely from every file following the same one.

Order is a readability contract, not decoration. A reader scanning an unfamiliar block should be able to find the box model without reading the colours, and should be able to tell a base value from a state override by position alone. Alphabetical order fails both tests — it interleaves `alignItems`, `backgroundColor`, and `borderRadius` into a list with no shape — so the convention is **semantic grouping**: properties in the order the browser or layout engine conceptually resolves them, outermost concern first.

## Group Order Within a Block

Write declarations in this order, skipping any group the block does not use. The same order applies to a CSS rule and to a mobile-native style object.

1. **Positioning** — `position`, `inset-*`, `z-index`
2. **Layout container** — `display`, `container`, `grid-template-*`, `flex-direction`, `flex-wrap`, `align-items`, `justify-content`, `place-*`, `gap` / `row-gap` / `column-gap`
3. **Placement in the parent** — `grid-area`, `grid-column`, `align-self`, `justify-self`, `flex`, `order`
4. **Size** — `inline-size` / `width`, `block-size` / `height`, `min-*`, `max-*`, `aspect-ratio`
5. **Spacing** — `margin-*`, `padding-*`
6. **Background and colour** — `background-*`, `color`
7. **Border and shape** — `border-*`, `border-radius`
8. **Typography** — `font-*`, `line-height`, `letter-spacing`, `text-*`, `white-space`, `word-break`, `tab-size`
9. **Overflow and clipping** — `overflow`, `clip-path`, line-clamp properties
10. **Visual effects** — `opacity`, `filter`, `transform`, `mix-blend-mode`
11. **Motion** — `transition`, `animation`
12. **Interaction and reset** — `cursor`, `user-select`, `pointer-events`, `outline`
13. **Custom properties** — every `--*` declaration
14. **Nested conditional at-rules** — `@container`, `@media`, `@supports`
15. **Nested state and pseudo-selector blocks** — `&:hover`, `&:focus-visible`, `&:disabled`, `&[data-*]`

**Example:**

```css
.card {
  display: flex;
  container: card / inline-size;
  flex-direction: column;
  row-gap: var(--space-16);
  inline-size: stretch;
  padding-block-end: var(--space-16);
  background-color: var(--color-component-accent-rest);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-md) var(--ease-standard);
  outline: none;

  --variant: "compact";

  @container (width > 30rem) {
    --variant: "wide";
  }

  &:focus-visible {
    outline: var(--color-border-accent-interactive) solid var(--border-base);
    outline-offset: var(--border-base);
  }
}
```

**Guidelines:**

- MUST group declarations semantically in the order above, and MUST NOT order them alphabetically.
- MUST place every custom-property declaration after the regular declarations in the same block, so the block's own values read first and its exported context reads last.
- MUST place nested conditional at-rules after all declarations, and nested state and pseudo-selector blocks after those.
- MAY nest a state block inside a conditional at-rule when the state exists only in that tier — a hover fill that applies only at the wide tier belongs inside the wide branch, not beside it.
- MUST keep one style block's ordering consistent with its neighbours in the same file; a file where two blocks disagree is worse than either convention applied uniformly.
- MUST apply the same order to mobile-native style objects, where the keys are the platform's equivalents (`flexDirection`, `paddingHorizontal`, `backgroundColor`).

## Order of Composed Styles

When several styles apply to one element, the array order **is** the precedence order — later wins. Ordering it consistently makes the precedence readable without tracing every entry.

Write them outermost-to-innermost: the invariant base, then the variant axes from structural to cosmetic, then compound cases, then transient state, then anything animated, and finally the consumer's own style.

**Example:**

```tsx
<Pressable
  style={[
    styles.root,
    size === "sm" && styles.sizeSm,
    size === "md" && styles.sizeMd,
    variant === "solid" && intent === "neutral" && styles.solidNeutral,
    variant === "solid" && intent === "destructive" && styles.solidDestructive,
    disabled && styles.disabled,
    pressed && styles.pressed,
    animatedStyle,
    style,
  ]}
/>
```

**Guidelines:**

- MUST compose in this order: base → size/shape variant → tone/intent variant → compound variant → transient state → animated style → consumer style.
- MUST keep the consumer's style last, with nothing after it, so a caller's override always wins.
- MUST place an animated style after every static style it may override and before the consumer's, so animation cannot fight the base and the caller still outranks both.
- MUST NOT interleave the axes — all size entries together, all tone entries together — so a reader can see at a glance which axes exist.
- SHOULD prefer the platform's declarative variant mechanism over a long conditional array when the axes are a closed set (see the Unistyles reference); the ordering rule then applies to whatever remains in the array.
