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

### Currently Unmapped Elements

The following elements produced by the pipeline are not in `defaultComponents` and render as unstyled native HTML:

- Table elements: `table`, `thead`, `tbody`, `tr`, `th`, `td`

If custom styling is needed for these elements, they MUST be added to `defaultComponents` (can map to the tag string itself, e.g., `table: "table"`) AND a corresponding `classNames` entry MUST be added in the consuming component.
