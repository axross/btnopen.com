# Existing Post Edit Routing

Existing Post Edit Routing resolves the project convention that caused ambiguity: a request to update, edit, rewrite, refine, or translate an existing blog post is a CMS-content operation, not a seed-fixture edit.

Seed markdown files such as `payload/helpers/seed/blog-post.md` describe initial fixture content used when the local seed process creates missing records. They are useful references for reconstructing an example post, but they do not update an already-existing Payload document.

For editorial decisions about what the replacement prose should say, consult [Blog Post Authoring Guidelines](../../blog-post-authoring-guidelines/SKILL.md). This skill owns the mechanics of locating, mutating, and verifying Payload CMS content through MCP.

**Guidelines:**

- MUST interpret "update", "edit", "rewrite", "refine", "revise", "translate", or "fix" an existing blog post as a Payload MCP content edit when the target is a title, slug, ID, or known CMS post.
- MUST use `findBlogPosts` to locate the target post before deciding body or metadata mutations.
- MUST NOT edit seed markdown files as a substitute for updating an existing Payload document.
- MUST treat seed markdown files as references only, unless the user explicitly asks to change seed fixtures or local initial data.
- MUST report missing MCP tools or permissions instead of silently falling back to filesystem edits.
- SHOULD use the open editor file as context only when it clarifies the user's intent; it does not override the CMS-editing default for existing posts.
