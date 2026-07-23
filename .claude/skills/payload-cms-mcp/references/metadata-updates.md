# Metadata Updates

Blog post metadata includes fields outside the Lexical body: `title`, `brief`, `outline`, `authoringNotes`, `slug`, `tags`, `coverImage`, `publishedAt`, and `_status`. The custom body tools do not update these fields.

Which content belongs in the `outline` versus `authoringNotes` authoring artifacts is specified in the repository README's CMS content model; this file covers only the mutation mechanics.

**Guidelines:**

- MUST separate body edits from metadata edits in the plan.
- MUST use a generic blog-post update tool only if `tools/list` returns one, such as `updateBlogPosts`.
- MUST NOT use `appendNodeInBlogPostBody` or `deleteNodeInBlogPostBody` to represent metadata changes.
- SHOULD read the existing metadata before changing it.

## Current MCP Limitation

The current btnopen MCP configuration exposes `findBlogPosts` but not broad blog-post create/update/delete tools by default. Metadata mutations may therefore be impossible through the current MCP key.

**Guidelines:**

- MUST report "metadata update is not available through the current MCP tool list" when no suitable update tool exists.
- MUST name the missing capability precisely, such as `updateBlogPosts` for blog metadata or `createTags` for new tags.
- SHOULD still provide the exact intended field changes for user review when the mutation is blocked.
- MAY complete body-only work while leaving metadata as a follow-up if the user approves.

## Using A Generic Blog Post Update Tool

If `updateBlogPosts` is available, update metadata by ID or by a narrow `where` clause. Prefer updating by `id` after locating the post.

**Example flow:**

1. `findBlogPosts` by `slug`, selecting `id`, `slug`, `title`, `brief`, `tags`, `coverImage`, `publishedAt`, and `_status`.
2. Use `findTags` or `findCoverImages` for relationship targets.
3. Call `updateBlogPosts` with `id`, changed fields, `locale`, `draft`, and a tight `select`.
4. Re-read the post and verify the changed fields.

**Example update call:**

```json
{
  "name": "updateBlogPosts",
  "arguments": {
    "id": 123,
    "locale": "ja-JP",
    "draft": false,
    "title": "Updated title",
    "brief": "Updated short summary.",
    "select": "{\"id\":true,\"slug\":true,\"title\":true,\"brief\":true,\"_status\":true,\"updatedAt\":true}"
  }
}
```

**Guidelines:**

- MUST prefer `id` over `where` for single-document metadata updates.
- MUST use a `where` clause only when the intended affected document set is explicit and narrow.
- MUST include `draft: false` for published/main-document edits and `draft: true` only for latest-draft edits.
- SHOULD include `select` so the update response contains the fields needed for verification.
- MUST verify the result with a fresh `findBlogPosts` call.

## Tags

Tags are relationship metadata. The blog post should reference existing tag IDs, and the agent should not create new editorial taxonomy without an explicit capability and user intent.

**Example tag lookup:**

```json
{
  "name": "findTags",
  "arguments": {
    "limit": 20,
    "select": "{\"id\":true,\"slug\":true,\"name\":true}",
    "where": "{\"slug\":{\"in\":[\"example\",\"payload\"]}}"
  }
}
```

**Guidelines:**

- MUST resolve requested tag slugs or names with `findTags` before updating `tags`.
- MUST preserve existing tags unless the user asks to replace or remove them.
- MUST report unknown tags instead of inventing IDs or creating tags implicitly.
- SHOULD ask whether to add a missing tag only if `createTags` is available and the taxonomy decision is unclear.

## Slug And Published State

Slug, `publishedAt`, and `_status` changes affect public URLs, caches, SEO metadata, and draft/published visibility. Treat them as high-impact edits.

**Guidelines:**

- MUST confirm user intent before changing `slug`, `publishedAt`, or `_status`.
- MUST verify old and new slug behavior when a slug changes and route verification is available.
- MUST NOT publish a draft or unpublish a post unless the user explicitly requested that state change.
- SHOULD keep `publishedAt` unchanged for body refinements unless the user asks to alter publication date.

## Localized Metadata

`title` and `brief` are localized fields. A metadata update must target the right locale. `outline` and `authoringNotes` are intentionally not localized — they are authoring artifacts shared across locales, so no `locale` targeting applies to them.

**Guidelines:**

- MUST set `locale` explicitly for localized metadata updates.
- MUST use `ja-JP` by default for this site unless the user asks for `en-US`.
- SHOULD inspect both locales when the user asks for translation, fallback behavior, or bilingual consistency.
- MUST NOT assume an edit to `ja-JP` automatically updates `en-US`.
