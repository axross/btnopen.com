# Content Source

- Blog post markdown is obtained by calling `getBlogPostMarkdown` which fetches Lexical data from Payload CMS and converts it via `convertLexicalToMarkdown`.
- MUST NOT read markdown from the filesystem at runtime — all blog content comes from Payload CMS.
- MUST NOT modify the Lexical-to-markdown conversion logic without understanding the `@payloadcms/richtext-lexical` API.
