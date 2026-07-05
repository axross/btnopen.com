---
name: payload-cms-mcp
description: Apply this skill whenever using the btnopen Payload MCP server to inspect or mutate existing CMS content, especially when the user asks to update, edit, rewrite, refine, or translate an existing blog post even without mentioning MCP. Treat seed files as fixtures unless explicitly requested. Covers tools/list discovery, findBlogPosts, body mutations, media, tags, metadata, draft/published targeting, locale handling, and verification.
---

# Payload CMS MCP

Use this skill when an agent needs to inspect or mutate existing btnopen CMS content through the Payload MCP server. The MCP server exposes safe discovery tools for blog posts, tags, cover images, media, and website profile data, plus custom body-node mutation tools for controlled edits to raw Payload Lexical editor state.

In this project, existing blog-post edit requests are CMS content operations through Payload MCP, even when the user names a post title or slug without mentioning MCP. Seed markdown files are fixtures for initial database seeding, not the update path for existing Payload documents.

This skill is about operating the MCP server. For changing the MCP implementation itself, follow [Development Guidelines](../development-guidelines/SKILL.md) and the relevant code-review skills.

**Guidelines:**

- MUST ask the user for an MCP API key when Payload MCP access is required and no key or callable MCP connector is available.
- MUST validate the active MCP API key by calling `tools/list` before any other MCP tool use.
- MUST call `tools/list` first and use only tools actually returned for the current API key.
- MUST treat requests to update, edit, rewrite, refine, or translate an existing blog post as CMS content edits through Payload MCP.
- MUST inspect the target blog post before editing; do not rely on memory of the body tree or metadata.
- MUST treat `draft: false` as the default published/main-document target and set `draft: true` only when the user explicitly wants the latest draft.
- MUST set `locale` intentionally; use `ja-JP` by default unless the user asks for another locale.
- MUST NOT use locale fallback for body mutations; mutate only the exact requested locale.
- MUST NOT edit seed markdown files as a substitute for updating an existing Payload document unless the user explicitly asks for seed fixture changes.
- MUST preserve existing fields and Lexical nodes unless the user requested a removal or replacement.
- MUST verify the post after every mutation by re-reading the affected fields through MCP.
- MUST consult [Blog Post Authoring Guidelines](../blog-post-authoring-guidelines/SKILL.md) when a CMS mutation changes prose, title, brief, tags, structure, tone, grammar, or editorial quality.

## Existing Post Edit Routing

See [existing-post-edit-routing.md](./references/existing-post-edit-routing.md) for:

- interpreting user requests to update, edit, rewrite, refine, or translate existing blog posts
- choosing Payload MCP over seed fixture edits for existing CMS content
- using seed markdown files only as references or explicit fixture targets

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
