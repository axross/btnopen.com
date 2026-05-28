# CSS and Styling

## CSS Modules

CSS Modules sets the required project default: use CSS Modules for all component-scoped styles.

**Guidelines:**

- MUST use CSS Modules for all component-scoped styles.
- MUST name the CSS Module file to match its component file (e.g., `blog-post-header.tsx` → `blog-post-header.module.css`).
- MUST import the CSS Module as `css`.
- MUST NOT import the CSS module of any other components.

**Example:**

```tsx
import css from "./blog-post-header.module.css";
```

## CSS Variables

CSS Variables sets the required project default: use CSS variables (defined in `variables.css`) for all theme-related values: colors, spacing, radii, font sizes, etc.

**Guidelines:**

- MUST use CSS variables (defined in `variables.css`) for all theme-related values: colors, spacing, radii, font sizes, etc.
- MUST NOT use hard-coded color values or spacing values in component CSS.

## Style Encapsulation

### CSS Layers

CSS layer placement keeps component styles in the project component cascade instead of leaking into global or reset layers.

**Example:**

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

**Guidelines:**

- MUST place all component styles inside the `@layer components` layer.
- MUST NOT write component styles outside of a CSS layer.

### Style Isolation

Style Isolation is a project prohibition: do not define the following styles on the root element of a component:

**Guidelines:**

- MUST NOT define the following styles on the root element of a component:
  - `position`
  - `margin`
  - `width` except for the full width (e.g. `width: 100%`, `width: 100dvw`, or `width: stretch`)
  - `height` except for the full height (e.g. `height: 100%`, `height: 100dvh`, or `height: stretch`)

- MUST set those styles at the parent component and pass them via the `className` prop.
- MUST define other styles within the component's CSS Module.

### Class Name Merging

**Example:**

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

**Guidelines:**

- MUST pass `className` as a prop to the component so the parent can customize styles.
- MUST use the `clsx` utility when merging the component's own CSS Module class with an external `className` prop passed in by the parent.
