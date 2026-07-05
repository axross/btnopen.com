# Editorial Workflow

Editorial work should be planned around the reader-visible outcome first, then applied through the appropriate CMS workflow. This prevents an agent from optimizing for the easiest file edit instead of the correct content source.

For existing posts, use [Payload CMS MCP](../../payload-cms-mcp/SKILL.md) to read the current document, apply mutations, and verify persistence.

**Guidelines:**

- MUST identify whether the user wants a draft, published post, seed fixture, or new proposed text before applying content.
- MUST treat "update" or "edit" for an existing blog post as a Payload CMS content task unless the user explicitly names a seed fixture, local markdown file, or proposal-only output.
- MUST read the current post before rewriting an existing CMS post when MCP access is available.
- MUST separate body changes from metadata changes in the plan.
- MUST keep broad rewrites aligned with the user's stated goal and preserve existing factual claims unless changing them is requested.
- MUST verify the final CMS content after applying authored changes through MCP.
- SHOULD propose a small content plan before a large rewrite when the scope spans multiple sections.
- SHOULD note which authoring choices are inferred when the current corpus does not provide enough style evidence.

## Targeted Edits

Targeted edits include improving a paragraph, replacing a section, tightening a title, or adding one missing explanation.

**Guidelines:**

- SHOULD keep targeted edits local to the requested paragraph, section, or metadata field.
- SHOULD preserve surrounding structure unless the local edit no longer fits.
- SHOULD explain any nearby edits needed to keep transitions coherent.

## Large Rewrites

Large rewrites are appropriate when the current post's structure no longer matches the goal, such as turning a syntax demo into a pragmatic article.

**Guidelines:**

- MUST keep a clear before/after scope for large rewrites.
- MUST identify target reader, article archetype, author evidence, and metadata implications before drafting.
- MUST consult [author-style-corpus.md](./author-style-corpus.md) when the rewrite changes voice, sentence endings, article structure, or the author's level of personal framing.
- MUST preserve existing media, embeds, links, and code when they remain relevant.
- MUST call out removed sections or changed emphasis in the final report.
- SHOULD use Payload MCP replacement workflows only after confirming the available mutation capability and risk level.

## Style Regression Check

After a broad rewrite, review the prose as reader-visible writing, not only as valid Markdown or CMS content. The most common regression is a technically coherent draft that loses the author's sentence endings and experience-led framing.

**Guidelines:**

- MUST check Japanese body prose for `です/ます` dominance before finalizing ordinary btnopen posts.
- MUST compare the draft's first two paragraphs against the corpus trigger pattern: concrete reason, author/project context, and reader value.
- MUST flag drafts that sound like internal implementation notes when the requested output is a public blog post.
- SHOULD sample headings, paragraph endings, and closing paragraphs against [author-style-corpus.md](./author-style-corpus.md) before applying CMS mutations.
- SHOULD explain any intentional departure from the corpus when the user's goal requires a different voice.
