# Server Components and Caching

- `renderMarkdown` and `Markdown` are both marked `"use server"`.
- The `Markdown` component uses `"use cache"` with `cacheLife("hours")`.
- MUST NOT convert `Markdown` or `renderMarkdown` to client components — the entire markdown pipeline runs server-side.
- SHOULD preserve the `"use cache"` directive on the `Markdown` component.
