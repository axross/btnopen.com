# Pipeline Integrity

- MUST keep the pipeline as a single `unified()` chain in `app/(app)/_/helpers/markdown.ts`.
- MUST NOT split the pipeline across multiple files or call intermediate `.run()` / `.parse()` steps outside `renderMarkdown`.
- MUST maintain the plugin ordering: remark plugins first (parse → directives → GFM → embeds), then `remarkRehype` bridge, then rehype plugins, then `rehypeReact` last.
- MUST NOT add remark plugins after `remarkRehype` or rehype plugins before it.
