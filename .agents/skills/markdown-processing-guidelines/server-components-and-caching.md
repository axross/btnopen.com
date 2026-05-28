# Server Components and Caching

Server Components and Caching is a project prohibition: do not convert `Markdown` or `renderMarkdown` to client components — the entire markdown pipeline runs server-side.

- `renderMarkdown` and `Markdown` are both marked `"use server"`.
- The `Markdown` component uses `"use cache"` with `cacheLife("hours")`.

**Guidelines:**

- MUST NOT convert `Markdown` or `renderMarkdown` to client components — the entire markdown pipeline runs server-side.
- SHOULD preserve the `"use cache"` directive on the `Markdown` component.
