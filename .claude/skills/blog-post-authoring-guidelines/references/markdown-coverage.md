# Markdown Coverage

Markdown coverage should be natural. A post can exercise headings, emphasis, lists, links, embeds, images, code blocks, tables, blockquotes, and inline code without becoming a checklist if every element supports one coherent explanation.

When exact support matters, trace the Payload editor configuration and the local rendering pipeline through the project's markdown-processing guidelines before promising syntax coverage.

**Guidelines:**

- MUST verify the actual supported syntax before rewriting a post whose stated goal is coverage.
- MUST include only supported syntax when the post will be rendered by the live markdown pipeline.
- MUST use headings to organize the article, not to exhaust heading levels.
- MUST use emphasis sparingly for contrast, caveats, or terms the reader should notice.
- MUST use inline code for identifiers, commands, filenames, field names, and short literals.
- MUST make links, web embeds, images, code blocks, and tables relevant to the article's topic.
- MUST NOT include unsupported Markdown only because it is common elsewhere.
- SHOULD prefer one realistic scenario that naturally needs many constructs.

## Supported-Syntax Rewrite Pattern

When rewriting a syntax-demo post into a real post, keep a coverage ledger privately while making the public article read naturally.

**Guidelines:**

- SHOULD map each required syntax feature to a real authoring purpose before writing.
- SHOULD combine related features in the same section when that improves flow, such as a comparison table with inline code and links.
- SHOULD use a short final checklist only when a checklist is useful to the reader, not as a hidden syntax audit.
- SHOULD mention renderer limitations only when they affect the reader or authoring workflow.

## Research Boundary

Supported syntax can come from Payload Lexical features, conversion behavior, remark/rehype plugins, and local React component mappings. Do not infer the support matrix from a seed fixture alone.

**Guidelines:**

- MUST inspect local config and rendering plugins when syntax support is part of the task.
- MUST use official Payload CMS documentation as the primary external reference when Payload editor feature behavior is uncertain.
- SHOULD treat seed markdown as an example input, not as the authoritative support matrix.
