# Media And Assets

The MCP server distinguishes body media from blog metadata images. Body media uses Payload Lexical `upload` nodes that reference existing `media` documents. Blog cover images use the `coverImage` metadata field and reference existing `cover-images` documents.

**Guidelines:**

- MUST decide whether the image belongs inside `body` or in the blog post `coverImage` field before choosing tools.
- MUST use `findMedia` for body upload nodes.
- MUST use `findCoverImages` for cover image metadata.
- MUST NOT put cover-image IDs into body upload nodes or media IDs into `coverImage`.

## Existing Media In Body

An upload node is valid only when it points at an existing `media` document. The body mutation tool validates upload nodes and rejects nodes whose `relationTo` is not `media` or whose `value` is not an existing media ID.

**Example lookup:**

```json
{
  "name": "findMedia",
  "arguments": {
    "limit": 10,
    "select": "{\"id\":true,\"filename\":true,\"url\":true,\"mimeType\":true,\"width\":true,\"height\":true}",
    "where": "{\"filename\":{\"like\":\"diagram\"}}"
  }
}
```

**Example upload node:**

```json
{
  "type": "upload",
  "version": 3,
  "format": "",
  "relationTo": "media",
  "value": "019d1223-94d4-754c-8f57-47337be15c9e",
  "fields": {
    "caption": "Optional caption text."
  }
}
```

**Guidelines:**

- MUST verify the media document exists before inserting an upload node.
- MUST set `relationTo` to `media` for body upload nodes.
- MUST set `value` to the existing media document ID, not a URL or filename.
- SHOULD include caption fields only when the user asked for a caption or the surrounding body uses captions consistently.
- SHOULD re-read the post body after insertion and confirm the upload node is present at the intended location.

## Cover Images

Cover images are editorial metadata. They are not represented inside the Lexical body, and the custom body mutation tools cannot modify them.

**Example lookup:**

```json
{
  "name": "findCoverImages",
  "arguments": {
    "limit": 10,
    "select": "{\"id\":true,\"filename\":true,\"url\":true,\"mimeType\":true,\"width\":true,\"height\":true}",
    "where": "{\"filename\":{\"like\":\"cover\"}}"
  }
}
```

**Guidelines:**

- MUST use a blog post update tool, when available, to change `coverImage`.
- MUST NOT insert a cover image as a body upload node unless the user explicitly wants the image to appear in article content.
- MUST verify the selected cover image via `findCoverImages` before setting `coverImage`.
- SHOULD preserve the existing `coverImage` when the request is only about body media.

## New Asset Uploads

The current MCP server is find-oriented for assets. It can find existing `media` and `cover-images`, but it may not expose file-upload tools.

**Unsupported request example:**

> "Upload this new screenshot and insert it into the post" when `tools/list` does not include `createMedia` or another upload-capable tool.

**Guidelines:**

- MUST check `tools/list` before promising a new upload.
- MUST NOT fabricate a `media` or `cover-images` document from a URL, local path, or filename.
- MUST NOT base64-embed images into Lexical body nodes.
- SHOULD ask the user to upload the asset through Payload Admin or request a server capability when no upload-capable MCP tool exists.
- MAY insert an upload node after the user provides or uploads an existing media ID and `findMedia` verifies it.

## Media Refinement

Media edits often involve captions, placement, or deleting/replacing upload nodes. These are body-node edits when the media is inside `body`.

**Guidelines:**

- MUST use [body-editing.md](./body-editing.md) replacement semantics when changing an upload node caption or media ID.
- MUST preserve unrelated upload node fields when refining a caption.
- SHOULD place media near the referenced paragraph or heading, not only at the end, unless the user requested that position.
- SHOULD verify surrounding text and media order after insert/delete operations because sibling indexes shift.
