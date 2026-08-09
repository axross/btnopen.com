# Fluid and Responsive Sizing

Apply this reference when a surface has to work across a range of widths — when choosing between a fluid value and a breakpoint, between a viewport unit and a container unit, and when a component's layout depends on how much room it was actually given.

Two axes are at work and they are independent. **Scalar sizing** — type and spacing — should scale continuously, so a design does not stay phone-sized on a large screen and then jump. **Structural tiering** — whether a card is a stack or a two-column grid — should switch discretely, and should switch on the space the component was given rather than on the size of the window. Conflating them produces the familiar failure where a component embedded in a narrow pane lays itself out as though it had the whole screen.

## Fluid Scalar Tokens

Type and spacing steps interpolate against the viewport with `clamp()`, holding a floor below a small-screen width and a ceiling above a large one. The floor is the value the design was authored at; the ceiling is the value it should reach on a large screen.

**Example:**

```css
:root {
  /* clamp(floor, intercept + slope·vi, ceiling), interpolating 320px → 1440px */
  --text-body-size: clamp(1rem, 0.9643rem + 0.1786vi, 1.125rem);
  --space-16: clamp(1rem, 0.9286rem + 0.3571vi, 1.25rem);

  /* Structural values stay fixed. */
  --border-hairline: 0.0625rem;
  --space-4: 0.25rem;
}
```

**Guidelines:**

- MUST make type steps and rhythm spacing steps fluid, and MUST keep the small-screen floor equal to the value the design was authored at, so making a scale fluid never changes the existing small-screen rendering.
- MUST keep these fixed rather than fluid:
  - **Sub-pixel structural values** — hairlines, border widths, focus-ring width and offset. Interpolating them degrades rendering and breaks a focus-ring specification.
  - **Large fixed widths** — a maximum column width, a fixed panel width. These are constraints, not rhythm.
  - **Line-height ratios**, which are already relative to a size that is itself fluid.
- MUST let headings grow faster than body text across the range when the design calls for stronger hierarchy on large screens, by giving them a steeper slope rather than a separate breakpoint.
- SHOULD cap a reading column with a character-relative measure (`80ch` or similar) rather than a fixed length, so the column widens with the fluid font instead of drifting away from it.

## Viewport Units versus Container Units

The rule is: **scalar tokens track the viewport; layout tracks the container.** This is not a preference — it is forced. Root-level tokens are declared on `:root`, which is not a query container, so [container-query units](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries#container_query_length_units) cannot resolve there. Global scalar sizing therefore has to use a viewport unit, and that is correct anyway: type size should follow the device, not the width of whichever pane a component landed in.

**Guidelines:**

- MUST use a logical viewport unit (`vi`, `vb`) rather than a physical one (`vw`, `vh`) in a fluid token, for consistency with the logical properties the styles use.
- MUST NOT attempt a container-query unit in a `:root` token; it does not resolve, and the failure is silent.
- MUST use container-relative units (`cqw`, `cqi`, `cqb`) for a size measured against the component's own container rather than the window.
- MUST use the dynamic viewport units (`dvh`, `dvi`, `svh`, `lvh`) rather than `vh` for full-viewport sizing, so mobile browser chrome does not clip the surface.
- SHOULD prefer `stretch` over a percentage to fill a parent axis, falling back to `100%` where the parent context requires it.

## Container-Driven Tiering

A surface announces its own tier and descendants react to the announcement. Declaring a container on the surface, branching a custom property inside a container query, and reading that property in descendants keeps the breakpoint in one place — so a descendant never has to know which ancestor it is measuring against, and a component embedded in a narrow shell re-tiers against the shell.

**Example:**

```css
:where(:scope) {
  container: card / inline-size;

  --variant: "compact";

  @container (width > 30rem) {
    --variant: "wide";
  }
}

.body {
  @container card style(--variant: "wide") {
    grid-area: body;
  }
}
```

**Guidelines:**

- MUST drive a layout tier from the surface's own container width, never from the viewport. A viewport media query is reserved for genuinely window-level concerns — colour scheme, motion preference, print, pointer type.
- MUST declare the tier as a custom property at the container root and consume it through a style query in descendants, rather than repeating the width condition in every descendant rule.
- MUST name a container when a descendant needs to query a specific ancestor rather than the nearest one; an anonymous query is acceptable only when the nearest container is unambiguous.
- MUST use one comparison form throughout a project — the range form (`width > 30rem`) or the prefix form (`min-width: 30rem`), not both — so a reader can compare breakpoints across files at a glance.
- SHOULD keep the tier property to a small closed set of named values and reuse the same names project-wide, so `"wide"` means the same thing everywhere.

## Breakpoints

A breakpoint is for a change in **kind**. If the only difference across a width range is that things get bigger, the fluid scale already handles it and a breakpoint adds a discontinuity for nothing.

**Guidelines:**

- MUST reserve a breakpoint for a structural change — a stack becoming a grid, a full-bleed element joining the column, an element appearing or disappearing.
- MUST NOT add a breakpoint to change an amount; express that with the fluid scale or with proportional sizing.
- MUST reuse the project's declared breakpoints and MUST NOT introduce a per-surface one; a surface that seems to need its own is usually asking for proportional sizing instead.
- MUST declare breakpoints once in the project's style configuration so the same values are available on both platforms, and MUST NOT leave a declared set unused while surfaces hard-code widths. On mobile native they are a sibling of the themes rather than a field on one — Unistyles takes `breakpoints` and `themes` side by side in `StyleSheet.configure`, so a stylesheet reads them by importing the declared map, not through its `theme` argument.
- SHOULD give each breakpoint a stated meaning ("phone column becomes a reading column") so a new surface can decide which transition its change belongs to.

## Parent-Size Styling on Mobile Native

Mobile native has no container queries. The runtime object a stylesheet receives exposes device-level metrics only — screen, insets, status and navigation bars, breakpoint, orientation, pixel ratio, font scale — and nothing about the parent. A component whose layout depends on the space it was given therefore has to **measure** it and feed the measurement into a style.

**Example:**

```tsx
import { StyleSheet } from "react-native-unistyles";
import { breakpoints } from "~/common/constants/style";

export function Card({
  children,
}: Readonly<{ children: ReactNode }>): JSX.Element {
  const [width, setWidth] = useState<number | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View onLayout={onLayout} style={styles.card(width)}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: (width: number | null) => ({
    // `breakpoints` is the project's own declared map, imported directly —
    // not reached through the `theme` argument, which does not carry it. The
    // mini runtime carries only `rt.breakpoint`, the current breakpoint's name
    // against the *screen*, which is not what this component measures.
    flexDirection: width !== null && width > breakpoints.md ? "row" : "column",
    gap: theme.space.x16,
  }),
}));
```

**Guidelines:**

- MUST measure the parent with `onLayout` and pass the measurement into a dynamic function when a component's layout depends on its own width; the mini runtime cannot answer this.
- MUST render a defined layout before the first measurement arrives — the measurement is `null` on the first pass — rather than rendering nothing or flashing the wrong tier.
- MUST NOT use a screen breakpoint as a proxy for a component's own width; it is only correct for a component that always spans the screen.
- SHOULD prefer intrinsic layout (`flex`, `flexWrap`, `gap`) over measurement wherever it produces the same result, since measurement costs a render pass and a state update.
- SHOULD reserve the mini runtime's screen metrics for genuinely screen-level decisions, the same way a viewport media query is reserved on web.
