# Body Editing

Blog post `body` is raw Payload Lexical editor state. The root node itself is not addressed in mutation paths; locations address nested `children` arrays under `body.root.children` and then under each node's own `children`.

**Mental model:**

```text
body.root.children                       => target children array for location []
body.root.children[0]                    => node at location [0]
body.root.children[0].children           => target children array for location [0]
body.root.children[0].children[1]        => node at location [0, 1]
insert at index 1 under the first child of the first root node => location [0, 0, 1]
```

**Guidelines:**

- MUST inspect `body.root.children` before choosing a location.
- MUST treat each non-leaf location segment as an index into the current `children` array, then descend into that node's `children`.
- MUST NOT address `root` itself in the location array.
- SHOULD use block-level locations when the requested change is paragraph, heading, list, quote, code, or media level.

## Read Before Mutating

Use `findBlogPosts` to fetch the post and body. Keep the read focused, but include enough metadata to verify that the correct document and locale were selected. Use `depth: 0` when the returned body may become part of a mutation payload; populated reads are for inspection only because Payload can expand rich-text relationship nodes into objects that are invalid for editor-state writes.

**Example:**

```json
{
  "name": "findBlogPosts",
  "arguments": {
    "locale": "ja-JP",
    "draft": false,
    "limit": 1,
    "depth": 0,
    "select": "{\"id\":true,\"slug\":true,\"title\":true,\"body\":true,\"_status\":true,\"updatedAt\":true}",
    "where": "{\"slug\":{\"equals\":\"my-post\"}}"
  }
}
```

**Guidelines:**

- MUST confirm the returned `slug`, `status`, `locale` intent, and relevant body subtree before mutating.
- MUST use `depth: 0` for any body read that will be cloned, transformed, or reused as an update payload.
- MUST NOT reuse a `depth: 1` or deeper body response as a write payload without first normalizing rich-text relationship values.
- MUST NOT use `fallbackLocale` when reading or mutating `body`; copying from another locale needs an explicit separate workflow.
- MUST preserve node fields that are not part of the requested change, especially `version`, `format`, `direction`, `indent`, and relationship fields.
- SHOULD copy the shape of nearby existing nodes when constructing a replacement node.
- SHOULD re-read the body after each mutation when a later location depends on the changed tree.

## Normalize Rich Text Relationships

Payload can populate relationship-like rich-text nodes on read, but the Lexical editor state stored back to Payload must keep relationship values as document IDs. This matters most for `upload` nodes: the admin editor throws when `value` is a populated media object instead of a string or number ID.

**Invalid populated node:**

```json
{
  "type": "upload",
  "relationTo": "media",
  "value": { "id": "019d1223-94d4-754c-8f57-47337be15c9e", "filename": "example.webp" }
}
```

**Valid write node:**

```json
{
  "type": "upload",
  "relationTo": "media",
  "value": "019d1223-94d4-754c-8f57-47337be15c9e"
}
```

**Guidelines:**

- MUST recursively inspect rich-text relationship nodes before using a full body as an update payload.
- MUST normalize populated `upload.value` objects to their `id` before writing `body`.
- MUST assert every upload node uses `relationTo: "media"` and a string or number `value` before mutation.
- MUST NOT treat `upload.value.id || upload.value` as validation proof because it hides invalid populated objects.
- SHOULD verify media IDs with `findMedia` or the custom body mutation tools before inserting or restoring upload nodes.

## Append Semantics

`appendNodeInBlogPostBody` inserts one serialized Lexical node into a `children` array. The final location value is the insertion index; it may equal the current `children.length` to insert at the end. A final `-1` means insert at the beginning of the target `children` array.

**Examples:**

```json
{
  "name": "appendNodeInBlogPostBody",
  "arguments": {
    "slug": "my-post",
    "locale": "ja-JP",
    "draft": false,
    "location": [1],
    "node": {
      "type": "paragraph",
      "version": 1,
      "format": "",
      "indent": 0,
      "direction": "ltr",
      "textFormat": 0,
      "textStyle": "",
      "children": [
        {
          "type": "text",
          "version": 1,
          "text": "Inserted paragraph.",
          "detail": 0,
          "format": 0,
          "mode": "normal",
          "style": ""
        }
      ]
    }
  }
}
```

**Guidelines:**

- MUST include `slug`, `location`, and a serialized Lexical `node`.
- MUST use final `-1` only when inserting at the beginning of the target `children` array.
- MUST NOT use `-1` in any non-final location segment.
- MUST NOT pass Markdown as `node`; pass serialized Lexical node JSON.
- SHOULD insert before deleting when replacing content so the original remains recoverable if insertion fails.

## Delete Semantics

`deleteNodeInBlogPostBody` removes one existing node. The entire location array identifies the node to delete; negative indexes are invalid.

**Example:**

```json
{
  "name": "deleteNodeInBlogPostBody",
  "arguments": {
    "slug": "my-post",
    "locale": "ja-JP",
    "draft": false,
    "location": [2]
  }
}
```

**Guidelines:**

- MUST use only non-negative integer indexes for delete locations.
- MUST verify the target node immediately before deleting it.
- SHOULD make one deletion per tool call unless the user explicitly asked for a broad cleanup.
- SHOULD delete from later sibling indexes to earlier sibling indexes when deleting multiple nodes from the same `children` array.

## Replacement And Refinement Workflow

The server has insert and delete body-node operations, not an in-place update operation. Replacement is a two-step structural edit.

**Safe block replacement sequence:**

1. Read the body and identify the old node at location `[i]`.
2. Insert the replacement node at `[i]`.
3. Re-read or use the returned result to confirm the replacement exists.
4. Delete the old node, now shifted to `[i + 1]`.
5. Re-read the body and verify the final content.

**Guidelines:**

- MUST use the insert-then-delete sequence for replacements when possible.
- MUST adjust sibling indexes after insertions or deletions.
- SHOULD prefer replacing whole paragraph/list/code/upload blocks over editing deep inline text nodes unless the user requested a narrow inline edit.
- SHOULD keep refinements local: replace only the paragraph, heading, list item, or subtree that changed.
- MUST NOT rewrite the entire body when a smaller subtree replacement satisfies the request.

## Full Body Replacement

Full body replacement is a metadata-style update to the `body` field, not a custom body-node mutation. It is only possible when `tools/list` exposes a generic blog-post update tool such as `updateBlogPosts`. Generic collection updates can bypass the custom body-node validators, so they need explicit rich-text invariant checks before and after the write.

**Guidelines:**

- MUST NOT attempt full body replacement unless `updateBlogPosts` or another body-capable update tool is listed.
- MUST treat `updateBlogPosts` as a generic collection update that does not prove rich-text relationship nodes are valid.
- MUST run the [Normalize Rich Text Relationships](#normalize-rich-text-relationships) checks before submitting a full replacement.
- MUST preserve all existing media/upload nodes and relationship references unless the user explicitly asks to remove them.
- MUST validate the full replacement by checking the outgoing body and the persisted body for representative beginning, middle, end, and media nodes.
- MUST verify every persisted upload node has `type: "upload"`, `relationTo: "media"`, and `typeof value` equal to `string` or `number`.
- SHOULD prefer targeted append/delete replacement over full body replacement for ordinary refinement.
- SHOULD ask for confirmation before full body replacement on a published post.

## Markdown-to-Lexical Full Body Write

When a whole `body` is drafted as Markdown, convert it in one pass instead of hand-authoring the Lexical node tree, which is slow and easy to get wrong. The conversion must reuse the exact path the seeder uses in `payload/helpers/seed.ts` — `convertMarkdownToLexical` fed an editor config built from the project `config` and `editor` — so the produced editor state matches what Payload itself would persist for the same Markdown. Run the conversion as a session-local one-off script, never as committed tooling.

**Procedure:**

1. Draft the body as Markdown in a scratch file, using only code-fence languages the editor registers (listed below); any other fence language yields an invalid `code` block.
2. Convert with the seed-identical call inside a script executed through `npx payload run <script>.ts`:

   ```ts
   import {
   	convertMarkdownToLexical,
   	editorConfigFactory,
   } from "@payloadcms/richtext-lexical";
   import { config } from "@/payload/config";
   import { editor } from "@/payload/editor";

   const body = convertMarkdownToLexical({
   	editorConfig: await editorConfigFactory.fromEditor({
   		config: await config,
   		editor,
   	}),
   	markdown,
   });
   ```

3. Inspect the converter output before writing: top-level node count and types, `code` block languages, and link count. Run the [Normalize Rich Text Relationships](#normalize-rich-text-relationships) check for populated `upload`/`relationship` values.
4. Write once with `updateBlogPosts`, choosing `draft` and `locale` intentionally and narrowing `select` to keep the response small, per [Full Body Replacement](#full-body-replacement).
5. Verify by re-reading `body` through MCP at `depth: 0` and deep-comparing it against the converter output with key-order-insensitive canonicalization; a byte-identical match is achievable and is stronger than spot-checking beginning/middle/end nodes.
6. Delete the one-off script.

**Editor-supported code-fence languages** (the `CodeBlock` feature in `payload/helpers/editor.ts`): `plaintext`, `js`, `ts`, `tsx`, `jsx`, `html`, `css`.

**Guidelines:**

- MUST build the editor state with `convertMarkdownToLexical` and an `editorConfigFactory.fromEditor` config from the project `config` and `editor`, matching `payload/helpers/seed.ts`, so a documented body is identical to a seeded one.
- MUST restrict Markdown code fences to the languages `payload/helpers/editor.ts` registers, and fix any other fence language in the source before converting.
- MUST run the conversion as a session-local `npx payload run` script and delete it afterward; never commit conversion tooling.
- MUST apply the [Full Body Replacement](#full-body-replacement) and [Normalize Rich Text Relationships](#normalize-rich-text-relationships) guardrails to the converter output before the single `updateBlogPosts` write, rather than restating those invariants here.
- MUST verify the persisted body by canonical, key-order-insensitive deep comparison against the converter output, not by spot-checking representative nodes alone.
- SHOULD set `draft` and `locale` explicitly on the write to target the intended document and translation.
- SHOULD narrow the `updateBlogPosts` `select` to `body` and identifying fields so the write and verification responses stay small.

## Lexical Node Construction

Payload Lexical nodes carry structural fields that affect rendering and editor compatibility. Use existing nodes as templates, and keep new nodes simple unless the target format requires more.

**Common node examples:**

```json
{
  "type": "heading",
  "version": 1,
  "tag": "h2",
  "format": "",
  "indent": 0,
  "direction": "ltr",
  "children": [{ "type": "text", "version": 1, "text": "Heading", "detail": 0, "format": 0, "mode": "normal", "style": "" }]
}
```

```json
{
  "type": "paragraph",
  "version": 1,
  "format": "",
  "indent": 0,
  "direction": "ltr",
  "textFormat": 0,
  "textStyle": "",
  "children": [{ "type": "text", "version": 1, "text": "Paragraph text.", "detail": 0, "format": 0, "mode": "normal", "style": "" }]
}
```

**Guidelines:**

- MUST include `type` on every inserted node.
- SHOULD include the same structural fields used by neighboring nodes of the same type.
- SHOULD keep text node `format`, `detail`, `mode`, and `style` consistent with nearby text unless the user requests formatting.
- MUST NOT invent unsupported Lexical node types; copy a known shape from the existing body or ask for implementation support.
