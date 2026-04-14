# Custom Plugins

- MUST define custom remark/rehype plugins in `app/(app)/_/helpers/markdown.ts` alongside the pipeline.
- MUST NOT create separate files for small, project-specific plugins.
- SHOULD follow the unified plugin signature: a function that returns a tree transformer `(tree: Root) => void`.
- MUST use `unist-util-visit` (or `unist-util-visit-parents` / `unist-util-visit-children`) for tree traversal — MUST NOT manually walk the tree with recursive functions.
