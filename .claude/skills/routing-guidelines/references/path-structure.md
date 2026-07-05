# Path Structure

Route paths should make the addressed resource obvious from the URL. Dynamic segments should name the resource identifier they represent, and optional inputs should stay in search params instead of creating extra path branches.

**Guidelines:**

- MUST use Next.js App Router-based routing.
- SHOULD repeat the resource type and resource identifier in path structures, such as `posts/[id]` instead of `[id]` and `posts/[id]/comments/[id]` instead of `[id]/[id]`.
- SHOULD use lowercased, kebab-cased path elements.
- SHOULD use search params for optional inputs such as pagination, filtering, sorting, language, and draft/preview status.
- SHOULD use semantic dynamic segment names that describe the resource identifier, such as `posts/[slug]` rather than `posts/[id]` when the identifier is a slug.
