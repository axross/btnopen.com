# React Component Mapping

## How It Works

`app/(app)/_/components/markdown.tsx` maps HTML tag names (and custom directive names) to React components via `defaultComponents`. This map is passed to `rehypeReact` as the `components` option.

Each component in the map is wrapped with `memo` to inject a `className` prop from the optional `classNames` override. Consumers (e.g., `BlogPostContent`) pass a `classNames` record that maps tag names to CSS module class names, allowing per-context styling.

**Guidelines:**

- MUST keep `defaultComponents` as the source of truth for markdown tag and directive component mapping.
- MUST preserve the `classNames` override path when adding mapped markdown components.

## Required Mappings

Required Mappings sets the required project default: map `img` to the `Media` component, `pre` to the `Snippet` component, and `embed` to the `Embed` component.

**Guidelines:**

- MUST map `img` to the `Media` component, `pre` to the `Snippet` component, and `embed` to the `Embed` component.
- MUST add a new tag or directive component to `defaultComponents`.
- MUST make each mapped component accept `className` as a prop so the `classNames` override mechanism works.
- MUST NOT use `dangerouslySetInnerHTML` in any markdown-rendered component.

## Fallback Behavior for Unmapped Tags

Tags that are NOT in `defaultComponents` fall back to rendering as native HTML elements (via `hast-util-to-jsx-runtime`). These unmapped elements:

- Render correctly as semantic HTML.
- Do NOT receive CSS module class names from the `classNames` override mechanism.
- Cannot be targeted by CSS module scoped selectors (e.g., `.thead` in a CSS module won't match a native `<thead>` element since no class is applied).

**Guidelines:**

- MUST account for the fact that unmapped tags lose CSS-module class injection through the `classNames` override mechanism.

## Table Family and Type-Only Sentinel Keys

The GFM table family is fully mapped: `table` renders through the `Table` component (an outer non-scrolling `<div>` wrapper around an inner `<div tabIndex={0}>` scroll area around the `<table>`), `th` renders through `TableHeaderCell` (which forces `scope="col"` because GFM syntax only produces column headers), and `thead` / `tbody` / `tr` / `td` map to their native tags so the `classNames` mechanism can inject CSS-module class names. The render-time affordances (scroll viewport, focus ring, scroll-driven edge fades, print-mode overflow) are design concerns covered in the component's own stylesheet; the pipeline-side rule is that these tags MUST remain in `defaultComponents`.

When a mapped component renders more than one nested element and each nested element needs its own independent class name, use the **type-only sentinel key** pattern. This pattern is N-channel by design — add one sentinel per nested element that needs its own class channel (e.g., `Table` declares both `tableWrapper` for the outer wrapper and `tableScrollArea` for the inner scroll area):

- Add an extra key to `defaultComponents` per channel, whose value is the native tag string (e.g., `tableWrapper: "div"`, `tableScrollArea: "div"`). These keys are never emitted as elements — they exist only so `keyof typeof defaultComponents` includes the sentinel names, which makes `classNames.<sentinel>` type-check on the consumer side.
- In the memoization loop that forwards class names, add a narrow special case for the parent tag so every sentinel's class is passed to the component as an extra prop (e.g., when `name === "table"`, forward both `wrapperClassName: classNames.tableWrapper` and `scrollAreaClassName: classNames.tableScrollArea`).
- The receiving component accepts each extra prop and applies it to the relevant nested element.

Sentinel keys look like real tag mappings, so their entries need inline comments that explain the synthetic class-name channel.

**Guidelines:**

- MUST reserve type-only sentinel keys for synthetic class-name channels and document each sentinel inline in `defaultComponents`.
- MUST NOT introduce a sentinel key for a tag that the pipeline actually emits.
