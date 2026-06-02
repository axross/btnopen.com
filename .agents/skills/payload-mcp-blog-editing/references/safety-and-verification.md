# Safety And Verification

MCP blog editing changes content in the live CMS. The safest workflow is read, plan, mutate one small piece, re-read, and verify. This is especially important for published posts because `draft: false` edits the published/main document.

**Guidelines:**

- MUST identify whether the user wants the published/main document or the latest draft before mutating.
- MUST use `draft: false` for published/main-document edits and `draft: true` only when the user explicitly asks for draft editing.
- MUST set `locale` explicitly.
- SHOULD keep one mutation per tool call for easier rollback reasoning.

## Preflight Checklist

Preflight prevents editing the wrong post or wrong locale. It also confirms that the API key has the necessary tool permissions.

**Checklist:**

1. Call `tools/list`.
2. Find the target post by slug or ID.
3. Confirm `slug`, `id`, `_status`, `locale`, and `updatedAt`.
4. Read the fields that will be changed.
5. Find relationship targets such as tags, media, or cover images.

**Guidelines:**

- MUST complete the checklist before the first mutation.
- MUST stop if `findBlogPosts` returns zero or multiple plausible targets.
- MUST stop if required mutation tools are absent.
- SHOULD capture the original relevant subtree or metadata in the working notes before mutating.

## Post-Mutation Verification

A successful tool response is not enough. Re-read the document to verify final persisted state and to catch index-shift mistakes.

**Verification examples:**

> For a paragraph insertion, re-read `body`, locate the new paragraph, and confirm surrounding nodes stayed in the expected order.

> For a tag update, re-read `tags` with enough depth to confirm the expected tag slugs.

**Guidelines:**

- MUST re-read the mutated post after every body edit or metadata update.
- MUST verify both the intended change and the absence of obvious adjacent damage.
- SHOULD verify media references by checking `type`, `relationTo`, `value`, and caption fields.
- SHOULD verify title, brief, status, slug, tags, cover image, and published date after metadata updates.

## Destructive Or Broad Edits

Deletion, large replacement, slug changes, publish-state changes, and multi-node refactors are higher risk than insertion or small refinement.

**Guidelines:**

- MUST ask for confirmation before broad deletes, large rewrites, slug changes, or status changes unless the user already gave explicit instruction.
- MUST delete from later sibling indexes to earlier sibling indexes when removing multiple siblings.
- MUST re-read after each destructive operation when later operations depend on locations.
- SHOULD prefer replacement of small subtrees over deleting and rebuilding long ranges.
- SHOULD report exactly what was deleted or replaced in the final answer.

## Error Handling

The custom body tools return textual `Error:` responses for invalid locations, empty bodies, or invalid media references. Treat those as failed mutations.

**Common errors:**

> `Error: -1 is only valid as the final append location index.`

> `Error: Blog post body upload nodes must use relationTo='media' and an existing media ID as value.`

**Guidelines:**

- MUST inspect tool response content for `Error:` before proceeding.
- MUST NOT perform follow-up mutations based on a failed mutation.
- SHOULD re-read the post after an error if there is any chance a previous step changed the tree.
- SHOULD explain invalid location paths using the current body tree, not only the error text.

## Reporting

The final response should make it clear what changed and what could not be done through the available MCP tools.

**Guidelines:**

- MUST summarize changed post slug, target locale, and draft/published target.
- MUST list body node insertions, deletions, or replacements in human terms.
- MUST list metadata changes separately from body changes.
- MUST report blocked requests with the missing MCP tool or permission.
- SHOULD mention verification reads performed after mutation.
