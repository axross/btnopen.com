# Metadata And Taxonomy

Metadata helps readers decide whether to open a post and helps the site present content consistently. Titles, briefs, tags, cover images, slugs, publication dates, and status changes are editorial choices first and CMS mutations second.

Apply metadata changes through the project's Payload CMS MCP skill only when the current MCP tool list exposes a suitable mutation capability.

**Guidelines:**

- MUST keep titles specific enough to distinguish the post from neighboring posts.
- MUST keep briefs descriptive, concrete, and aligned with the actual body.
- MUST make metadata reflect both the author's concrete context and the reader's practical reason to open the post when both are present.
- MUST NOT write a brief that promises content the post does not contain.
- MUST NOT use clickbait, exaggerated certainty, or "ultimate guide" phrasing unless the body truly earns that claim.
- MUST preserve existing slugs, publication dates, and publish status unless the user explicitly asks to change them.
- MUST use existing tags when possible; do not invent taxonomy silently.
- MUST keep localized title and brief changes scoped to the requested locale.
- SHOULD prefer a title that names the actual topic or decision over a generic category label.
- SHOULD keep briefs to one compact summary suitable for cards, metadata, and social previews.
- SHOULD put high-information nouns early in titles when it reads naturally.

## Titles And Briefs

Experience-led posts should not hide the concrete topic behind only a personal milestone. Technical posts should not hide the author's practical perspective behind only a generic API or framework name.

**Guidelines:**

- MUST align the title, brief, and body around the same promise.
- MUST avoid titles that could apply to many unrelated posts.
- MUST match the title's register to the body's register: polite announcements for audience-facing milestones (「〜をリリースしました」), plain form only for diary-register life logs (「〜に着いた」), per the title evidence in [author-style-corpus.md](./author-style-corpus.md).
- SHOULD prefer verb-ended sentence titles over abstract noun phrases when the corpus shape calls for it: announcements (「〜しました」), directives for pitfall notes (「〜では型を明示しよう」), and questions for essays (「〜とは何なのか」).
- SHOULD combine the personal trigger with the reader outcome for career, life, and retrospective posts.
- SHOULD combine the technology name with the decision, pitfall, or trade-off for technical posts.
- SHOULD make briefs answer "what will I learn or be able to judge after reading this?"
- MAY join two genuinely covered topics in one title with `/` (「Denoの始め方 / LeetCodeの解答数が100を超えました」), but only when the post truly serves both.

## Tags

Tags are navigation and classification aids. They should describe the durable topic, not every tool mentioned once in passing.

**Guidelines:**

- MUST inspect existing tags before recommending tag changes when MCP access is available.
- MUST preserve existing tags unless the user asks to replace or narrow them.
- MUST NOT create or recommend a new tag when an existing tag already covers the topic well.
- SHOULD use two to five focused tags for ordinary posts.
- SHOULD avoid one-off tags for incidental examples, URLs, or code identifiers.

## Cover Images And Media Metadata

Cover images set reader expectation before the body. Body media supports an explanation inside the article.

**Guidelines:**

- MUST distinguish cover image metadata from body media.
- MUST keep cover image choices aligned with the post topic and not merely decorative.
- SHOULD leave cover image metadata unchanged for text-only refinements unless the current image conflicts with the revised topic.
- SHOULD mention when a desired media or cover-image update is blocked by missing MCP upload or update capability.
