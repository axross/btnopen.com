---
name: payload-mcp-blog-editing
description: Apply this skill when using the btnopen Payload MCP server to inspect or edit blog posts. Covers tools/list discovery, findBlogPosts, appendNodeInBlogPostBody, deleteNodeInBlogPostBody, raw Payload Lexical editor-state mutations, published vs draft targeting, locale handling, media/cover image references, and metadata updates such as tags, title, brief, slug, and publishedAt.
---

# Payload MCP Blog Editing

Use this skill when an agent is asked to edit btnopen blog content through the Payload MCP server. The MCP server exposes safe discovery tools for blog posts, tags, cover images, media, and website profile data, plus custom body-node mutation tools for controlled edits to raw Payload Lexical editor state.

This skill is about operating the MCP server. For changing the MCP implementation itself, follow [Development Guidelines](../development-guidelines/SKILL.md) and the relevant code-review skills.

**Guidelines:**

- MUST call `tools/list` first and use only tools actually returned for the current API key.
- MUST inspect the target blog post before editing; do not rely on memory of the body tree or metadata.
- MUST treat `draft: false` as the default published/main-document target and set `draft: true` only when the user explicitly wants the latest draft.
- MUST set `locale` intentionally; use `ja-JP` by default unless the user asks for another locale.
- MUST NOT use locale fallback for body mutations; mutate only the exact requested locale.
- MUST preserve existing fields and Lexical nodes unless the user requested a removal or replacement.
- MUST verify the post after every mutation by re-reading the affected fields through MCP.

## Tool Inventory

See [tool-inventory.md](./references/tool-inventory.md) for:

- discovering the current `tools/list` output before using a new session or permission set
- distinguishing find-only collection tools from the custom body mutation tools
- checking whether create/update/delete, media upload, or tag update tools are currently available

## Body Editing

See [body-editing.md](./references/body-editing.md) for:

- inserting, deleting, replacing, refining, or moving content inside `body`
- interpreting raw Lexical location arrays against nested `children` arrays
- choosing small block-level mutations and verifying each structural change

## Media And Upload Nodes

See [media-and-assets.md](./references/media-and-assets.md) for:

- adding image or media nodes to a Lexical body
- changing captions, selecting cover images, or handling a user-supplied new asset
- distinguishing existing `media` document references from cover-image metadata

## Metadata Updates

See [metadata-updates.md](./references/metadata-updates.md) for:

- changing tags, title, brief, slug, cover image, published date, status, or other non-body fields
- understanding that custom body-node tools do not update metadata fields
- reporting current MCP permission or tool limitations for metadata mutation requests

## Safety And Verification

See [safety-and-verification.md](./references/safety-and-verification.md) for:

- destructive edits, multi-step refactors, published-post changes, and locale-sensitive changes
- verifying that the intended document changed and adjacent content stayed intact
- deciding when large replacements, deletes, slug changes, publish-state changes, or uncertain structures need explicit user confirmation
