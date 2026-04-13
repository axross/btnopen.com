# CSS and Styling

## CSS Modules

- MUST use CSS Modules for all component-scoped styles.
- MUST name the CSS Module file to match its component file (e.g., `blog-post-header.tsx` → `blog-post-header.module.css`).
- MUST import the CSS Module as `css`.

Example:

```tsx
import css from "./blog-post-header.module.css";
```

## CSS Layers

- All component styles MUST be placed inside the `@layer components` layer.
- MUST NOT write component styles outside of a CSS layer.

Example:

```css
@layer components {
  @scope (.blogPostHeader) {
    :where(:scope) {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
    }
  }

  .title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
  }
}
```

## CSS Variables

- MUST use CSS variables (defined in `variables.css`) for all theme-related values: colors, spacing, radii, font sizes, etc.
- MUST NOT use hard-coded color values or spacing values in component CSS.

## Class Name Merging

- MUST pass `className` as a prop to the component so the parent can customize styles.
- MUST use the `clsx` utility when merging the component's own CSS Module class with an external `className` prop passed in by the parent.

Example:

```tsx
import { clsx } from "clsx";
import css from "./snippet.module.css";

export function Snippet({
  className,
  children,
}: ComponentProps<"pre">): JSX.Element {
  return (
    <div className={clsx(css.snippet, className)}>
      <pre className={css.viewer}>{children}</pre>
    </div>
  );
}
```

## Root Element Styling

- MUST NOT define the following styles on the root element of a component:
  - `position`
  - `margin`
  - `width` except for the full width (e.g. `width: 100%`, `width: 100dvw`, or `width: stretch`)
  - `height` except for the full height (e.g. `height: 100%`, `height: 100dvh`, or `height: stretch`)
- Instead, set those styles at the parent component and pass the `className` prop to the component.
