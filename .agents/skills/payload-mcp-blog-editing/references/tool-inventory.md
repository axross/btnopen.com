# Tool Inventory

The MCP server is permission-scoped by API key. A tool documented here may still be unavailable in a given session if the key does not grant it. Start every session by listing tools and adapting the workflow to the returned names.

**Example:**

```json
{
  "method": "tools/list",
  "params": {}
}
```

**Guidelines:**

- MUST call `tools/list` before planning mutations.
- MUST treat absent tools as unavailable instead of guessing alternate names.
- MUST use exact tool names from `tools/list`; casing matters.
- SHOULD keep a note of whether the key has body mutation tools, generic collection update tools, or only find tools.

## Current Expected Tools

The current btnopen MCP configuration exposes find tools for public/editorial collections and two custom body mutation tools. The exact set can still vary by API-key permissions.

| Tool | Purpose |
| --- | --- |
| `findBlogPosts` | Find blog posts; use `select` to retrieve only needed fields, including `body` when planning body edits. |
| `findTags` | Find existing tags by slug or name before metadata updates. |
| `findCoverImages` | Find existing cover image uploads for the `coverImage` metadata field. |
| `findMedia` | Find existing media uploads for Payload Lexical upload nodes. |
| `findWebsite` | Read the public website profile global. |
| `appendNodeInBlogPostBody` | Insert one serialized Lexical node into a blog post body. |
| `deleteNodeInBlogPostBody` | Delete one serialized Lexical node from a blog post body. |

**Guidelines:**

- MUST use `findBlogPosts` before `appendNodeInBlogPostBody` or `deleteNodeInBlogPostBody`.
- MUST request `body` explicitly in `findBlogPosts` when planning a body edit.
- MUST use `findMedia` before adding an upload node.
- MUST use `findCoverImages` before changing `coverImage` if an update tool is available.
- MUST use `findTags` before changing `tags` if an update tool is available.

## Common Absent Tools

The server is currently configured to avoid broad write tools by default. Some workflows are possible only if future configuration or a different API key exposes generic update/create tools.

**Examples of tools that may be absent:**

> `createBlogPosts`, `updateBlogPosts`, `deleteBlogPosts`, `createMedia`, `updateMedia`, `createTags`, `updateTags`

**Guidelines:**

- MUST NOT claim metadata or asset upload edits are complete unless the needed write tool was present and succeeded.
- MUST NOT use the body mutation tools to simulate metadata updates.
- SHOULD explain the missing capability and the exact tool or server change needed when the user asks for an unsupported mutation.
- MAY continue with a body-only edit when metadata or upload mutation is unavailable and the user agrees to split the task.

## Payload MCP Argument Conventions

Payload MCP collection tools commonly pass complex query options as JSON strings. This matters for `where` and `select`.

**Example:**

```json
{
  "name": "findBlogPosts",
  "arguments": {
    "locale": "ja-JP",
    "draft": false,
    "limit": 1,
    "select": "{\"id\":true,\"slug\":true,\"title\":true,\"brief\":true,\"body\":true,\"_status\":true,\"tags\":true,\"coverImage\":true,\"publishedAt\":true}",
    "where": "{\"slug\":{\"equals\":\"example-slug\"}}"
  }
}
```

**Guidelines:**

- MUST encode `where` as a JSON string when using collection find/update tools.
- MUST encode `select` as a JSON string when using collection find/update tools.
- SHOULD select the smallest useful field set before body edits to reduce accidental exposure and context size.
- SHOULD use `depth: 0` for raw IDs and `depth: 1` or `depth: 2` only when populated relationship details are needed.
