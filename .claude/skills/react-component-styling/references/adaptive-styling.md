# Adaptive Styling

Apply this reference when a style depends on something about the user or the device rather than on available space — pointer type, hover capability, motion preference, output medium, writing direction. Space-driven adaptation lives in [fluid-and-responsive.md](./fluid-and-responsive.md).

## What Belongs in a Media Query

A media query describes the environment: the window, the input hardware, the user's stated preferences, the output medium. It does not describe how much room a component was given, and using it for layout is what makes a component un-embeddable.

**Guidelines:**

- MUST reserve viewport media queries for genuinely environment-level conditions — colour scheme, motion preference, pointer and hover capability, forced colours, print.
- MUST NOT use a width media query for component layout; use a container query and the tiering pattern instead.
- MUST declare each environment condition once, as high in the tree as it applies, rather than repeating it per surface.

## Reduced Motion

A user who has asked for reduced motion has usually done so because motion makes the interface unusable or unpleasant for them, not because they dislike it. Treat the preference as a hard requirement on any animation you add, and remember that a repeating or infinite animation is the worst case.

**Example — web:**

```css
.placeholder {
  animation: pulse 500ms linear infinite alternate;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}
```

**Example — mobile native:**

```tsx
const reduceMotion = useReducedMotion();

useEffect(() => {
  if (reduceMotion) {
    opacity.value = 0.6;
    return;
  }

  opacity.value = withRepeat(
    withSequence(
      withTiming(1, { duration: PULSE_MS }),
      withTiming(0.4, { duration: PULSE_MS }),
    ),
    -1,
    false,
  );

  return () => cancelAnimation(opacity);
}, [reduceMotion, opacity]);
```

**Guidelines:**

- MUST provide a reduced-motion branch for every animation and every transition a change introduces, on both platforms.
- MUST NOT ship an infinite, looping, or full-surface animation without one — this is the case where the preference matters most.
- MUST settle the reduced-motion branch at the animation's resting state rather than at an arbitrary frame, so a placeholder holds a steady value instead of freezing mid-pulse.
- MUST NOT duplicate an animated surface and guard only one copy; a second copy of the same keyframes with no guard is a defect that reads as an oversight in review.
- SHOULD disable the animation outright rather than shortening it, unless the motion carries meaning the user would otherwise lose.

## Hover, and the Pointer It Depends On

`:hover` on a touch device is sticky: a tap applies the hover style and nothing removes it, so the element stays visually "hovered" until something else is tapped. Gating hover styles fixes it — but which feature to gate on is not obvious, and the intuitive choice is wrong.

Four media features are involved, in two families:

| Feature                    | Describes                         |
| -------------------------- | --------------------------------- |
| `hover`, `pointer`         | The **primary** input mechanism   |
| `any-hover`, `any-pointer` | **Any** available input mechanism |

For hover styles, gate on the **primary** pair. A device whose primary input is touch should not get hover styles even if a mouse is also attached, because the user is mostly touching. And `hover: hover` alone is not enough — a stylus device reports `hover: hover` while still being used by touch, which reintroduces the sticky-hover problem — so pair it with `pointer: fine`.

**Example:**

```css
.card {
  background-color: var(--color-component-accent-rest);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background-color: var(--color-component-accent-hovered);
    }
  }
}
```

**Guidelines:**

- MUST gate every `:hover` rule on `@media (hover: hover) and (pointer: fine)`.
- MUST NOT gate hover on `any-hover`; it is true for a phone with a mouse paired, which is exactly the device that should not get hover styles.
- MUST give every interactive surface an affordance that does not depend on hover — a focus style, a pressed state, a persistent border or underline — since hover is unavailable to a large share of users.
- MUST NOT convey information through a hover-only state; hover may enhance, never inform.
- SHOULD pair a hover style with the equivalent pressed style on mobile native, where hover does not exist at all.

## Interactive Target Size

Target size gates on the **any** family, and this asymmetry with the hover rule is deliberate: a laptop with a touchscreen must still offer touch-sized targets, because the user might reach up and tap at any moment. `any-pointer: coarse` is true whenever _any_ attached input is imprecise, which is exactly the condition under which a small target is a problem.

Both axes have a minimum, and they differ — a control may be a thin bar, but it may not be thin in both directions:

| Primary pointer                        | Long side | Short side |
| -------------------------------------- | --------- | ---------- |
| Coarse (touch, imprecise stylus)       | 44px      | 24px       |
| Fine (mouse, trackpad, precise stylus) | 24px      | 12px       |

The coarse row matches [WCAG 2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) (Level AAA, 44×44) on the long axis and [WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (Level AA, 24×24) on the short one. Note honestly what the fine row means: a 24×12 target is **below** 2.5.8's 24×24 and conforms only through that criterion's spacing exception — the target passes if a 24px-diameter circle centred on it does not intersect a neighbouring target's circle. A fine-pointer control at the short-side minimum therefore has to be spaced, not merely sized.

**Example:**

```css
.control {
  min-inline-size: 24px;
  min-block-size: 12px;

  @media (any-pointer: coarse) {
    min-inline-size: 44px;
    min-block-size: 24px;
  }
}
```

These are the one place a raw length is correct. A target minimum is an accessibility constant fixed by the specification and the input hardware — it is not a rhythm value, so binding it to a spacing step would make an accessibility floor move whenever the design's spacing is retuned.

**Guidelines:**

- MUST gate target sizing on `@media (any-pointer: coarse)`, not on `pointer: coarse`, so a hybrid device gets touch-sized targets.
- MUST meet both the long-side and the short-side minimum for the applicable pointer class; a control that meets only the long side is the common failure.
- MUST space fine-pointer controls that sit at the short-side minimum so no neighbouring target's 24px circle intersects, since the size alone does not satisfy WCAG 2.5.8.
- MUST measure the **hit area**, not the drawn glyph. An icon drawn at 20px inside a 44px target is correct; a 20px target with a 20px icon is not.
- MUST express a target minimum as the literal length the specification states, not as a spacing step; it is an accessibility constant, and routing it through the design scale lets a spacing retune move an accessibility floor.
- SHOULD prefer growing the hit area over growing the visual whenever the design calls for a small control (see below).

## Expanding a Hit Area

A control often needs a larger target than it should visually occupy. Both platforms can grow the target without moving the visual.

**Example — web, padding offset by an equal negative margin:**

```css
.iconButton {
  display: flex;
  padding: var(--space-12);
  margin: calc(var(--space-12) * -1);
  border-radius: var(--radius-md);
}
```

**Example — mobile native, `hitSlop`:**

```tsx
<Pressable hitSlop={12} accessibilityRole="button" onPress={onPress}>
  <ChevronRight color={theme.colors.text.neutral.low} size={20} />
</Pressable>
```

**Guidelines:**

- MUST offset the padding with an exactly equal negative margin on web, so the visual position does not shift as the target grows.
- MUST use `hitSlop` on mobile native rather than padding the visual, so the drawn control keeps its intended size.
- MUST give the expanded area the project's radius tier so a pressed or hovered background reads as part of the design rather than as a rectangle.
- MUST NOT overlap two expanded hit areas; the invisible regions collide long before the visuals do, and the resulting mis-taps are hard to diagnose.

## Print

Print is an output medium a UI is rarely designed for and frequently broken in — a scroll container clips its content to one screenful on paper, and decorative overlays waste ink.

**Guidelines:**

- SHOULD add a print branch for any surface whose content is clipped by a scroll container, releasing the clipping so the full content paints.
- SHOULD hide scroll affordances, edge fades, and decorative overlays in print.
- MUST keep a print branch confined to `@media print` rather than compensating for it in the screen styles.

## Writing Direction

Direction-agnostic styles are free on web — the logical properties do the work — and they are the difference between a layout that mirrors correctly for a right-to-left locale and one that has to be re-authored.

**Guidelines:**

- MUST write direction-agnostic styles on web: `margin-block`/`margin-inline`, `padding-block`/`padding-inline`, `inline-size`/`block-size`, `inset-block-*`/`inset-inline-*`, `border-inline-start`/`border-block-end`.
- MUST use `start`/`end` keywords on `text-align` rather than `left`/`right`.
- MUST NOT mix directional paradigms on one element; a physical and a logical declaration for the same edge is a bug waiting for the first right-to-left render.
- MUST use `paddingStart`/`paddingEnd` and `marginStart`/`marginEnd` on mobile native rather than their `Left`/`Right` counterparts, including where a value comes from a safe-area inset.
- MAY use a physical property where none has a logical equivalent (`transform`, `object-fit`, `aspect-ratio`) or for a graphic with intrinsic orientation.
