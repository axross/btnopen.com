# Server Components and Caching

Server Components and Caching is a project prohibition: do not convert `Markdown` or `renderMarkdown` to client components — the entire markdown pipeline runs server-side.

- `renderMarkdown` and `Markdown` both open with `import "server-only"`, which fences them to the server without exposing them. `"use server"` would do the opposite — it turns every export into a client-invocable endpoint, which a read-only rendering module must never be.
- The `Markdown` component uses `"use cache"` with `cacheLife("hours")`.

**Guidelines:**

- MUST NOT convert `Markdown` or `renderMarkdown` to client components — the entire markdown pipeline runs server-side.
- MUST fence server-side markdown modules with `import "server-only"`, never with `"use server"`; the two directives are opposites, and `"use server"` alongside `"use cache"` would let a cached public endpoint serve one caller's data to another.
- SHOULD preserve the `"use cache"` directive on the `Markdown` component.
