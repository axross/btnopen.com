# React Component Mapping

## How It Works

`app/(app)/_/components/markdown.tsx` maps HTML tag names (and custom directive names) to React components via `defaultComponents`. This map is passed to `rehypeReact` as the `components` option.

Each component in the map is wrapped with `memo` to inject a `className` prop from the optional `classNames` override. Consumers (e.g., `BlogPostContent`) pass a `classNames` record that maps tag names to CSS module class names, allowing per-context styling.

## Required Mappings

- MUST map `img` to the `Media` component, `pre` to the `Snippet` component, and `webembed` to the `WebEmbed` component.
- When adding a new custom component for a tag or directive, MUST add it to `defaultComponents` and MUST ensure the component accepts `className` as a prop so the `classNames` override mechanism works.
- MUST NOT use `dangerouslySetInnerHTML` in any markdown-rendered component.

## Fallback Behavior for Unmapped Tags

Tags that are NOT in `defaultComponents` fall back to rendering as native HTML elements (via `hast-util-to-jsx-runtime`). These unmapped elements:

- Render correctly as semantic HTML.
- Do NOT receive CSS module class names from the `classNames` override mechanism.
- Cannot be targeted by CSS module scoped selectors (e.g., `.thead` in a CSS module won't match a native `<thead>` element since no class is applied).

## Table Family and Type-Only Sentinel Keys

The GFM table family is fully mapped: `table` renders through the `Table` component (an outer non-scrolling `<div>` wrapper around an inner `<div tabIndex={0}>` scroll area around the `<table>`), `th` renders through `TableHeaderCell` (which forces `scope="col"` because GFM syntax only produces column headers), and `thead` / `tbody` / `tr` / `td` map to their native tags so the `classNames` mechanism can inject CSS-module class names. The render-time affordances (scroll viewport, focus ring, scroll-driven edge fades, print-mode overflow) are design concerns covered in the component's own stylesheet; the pipeline-side rule is that these tags MUST remain in `defaultComponents`.

When a mapped component renders more than one nested element and each nested element needs its own independent class name, use the **type-only sentinel key** pattern. This pattern is N-channel by design — add one sentinel per nested element that needs its own class channel (e.g., `Table` declares both `tableWrapper` for the outer wrapper and `tableScrollArea` for the inner scroll area):

- Add an extra key to `defaultComponents` per channel, whose value is the native tag string (e.g., `tableWrapper: "div"`, `tableScrollArea: "div"`). These keys are never emitted as elements — they exist only so `keyof typeof defaultComponents` includes the sentinel names, which makes `classNames.<sentinel>` type-check on the consumer side.
- In the memoization loop that forwards class names, add a narrow special case for the parent tag so every sentinel's class is passed to the component as an extra prop (e.g., when `name === "table"`, forward both `wrapperClassName: classNames.tableWrapper` and `scrollAreaClassName: classNames.tableScrollArea`).
- The receiving component accepts each extra prop and applies it to the relevant nested element.

MUST document each sentinel's purpose with an inline comment on its entry in `defaultComponents` so the next reader does not mistake it for a mapping bug. MUST NOT introduce a sentinel key for a tag that the pipeline actually emits — sentinels are reserved for synthetic class-name channels.
