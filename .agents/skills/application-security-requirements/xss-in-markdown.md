# XSS in Markdown Rendering

Apply these rules to verify the markdown pipeline does not allow CMS-authored content to inject script or break out of React's encoding.

## Pipeline Configuration to Watch

The pipeline in `app/(app)/_/helpers/markdown.ts` includes:

- `remarkParse` configured with `allowDangerousProtocol: true` — this means `javascript:` URLs are not stripped at the parse step. React's JSX encoding stops them from executing in `<a href="…">`, but only because the rendered components rely on React's normal attribute handling.
- A custom `unknownHandler` that reports to Sentry rather than throwing.
- `rehypeReact` consumes the HAST and produces JSX through `react/jsx-runtime`.

## What the Reviewer MUST Flag

- MUST flag a Critical when a new component added to `defaultComponents` in `app/(app)/_/components/markdown.tsx` uses `dangerouslySetInnerHTML` for any prop derived from the markdown content.
- MUST flag a Critical when a new custom MDAST directive's HAST handler emits an `element` with `properties` that include event handlers (`onClick`, `onError`, etc.). Currently the only directive is `webembed`, whose handler in `markdown.ts` only forwards `node.attributes` (`href`, `title`) — those are safe scalar strings. A new directive that copies arbitrary attributes is unsafe.
- MUST flag a Critical when a new HAST element is rendered through `String.raw`, manual string concatenation, or any non-React path that bypasses JSX encoding.
- MUST flag a Major when `allowDangerousProtocol: true` is removed without replacing it with a hand-rolled URL allowlist — the project relies on this setting because legitimate markdown content includes `mailto:` and `tel:` links.

## `webembed` and Future Directives

- MUST flag a Critical when a new directive's React component renders unescaped HTML from any `node.attributes` or `node.children` value.
- MUST flag a Critical when a new directive accepts user-controlled HTML in an attribute and assigns it to `style={…}`, `srcSet`, or `dangerouslySetInnerHTML`.
- MUST flag a Major when a directive emits an `<a>` tag without `rel="noopener noreferrer"` and `target="_blank"` for external URLs — see the existing `<a>` in `app/(app)/_/components/webembed/loaded.tsx` for the correct pattern.

## Image Sources

- MUST flag a Critical when a new component renders `<Image src={userControlled} unoptimized />` with `userControlled` originating from CMS markdown without an allowlist check. `unoptimized` bypasses Next's `images.remotePatterns` validation, which is the only host gate.
- The existing `WebEmbedLoaded` does pass an external `embedMetadata.imageUrl` to `<Image unoptimized />` — that is a pre-existing risk the reviewer should be aware of, not flag again unless the diff worsens it (e.g., removes the `metascraper` filter, lifts the `unoptimized` to a `priority`-loaded position, etc.).

## React-Specific Pitfalls

- MUST flag a Critical when JSX uses a key derived from CMS content and that key is the only barrier between two list items (e.g., `<li key={post.slug}>`). React itself encodes the key, but if the same value is also rendered as `<a href={post.slug}>` without URL-canonicalization, both flow to the DOM.
- MUST flag a Major when a new component spreads CMS-controlled `…attributes` directly onto a DOM element without filtering known-safe attribute names.

## Bypass Paths

- MUST flag a Critical when any new code calls `unified().use(…).process(rawHtml)` with HTML — the project uses markdown only. A divergence to HTML widens the attack surface to anything `rehype` accepts.
- MUST flag a Critical when a new module loads markdown from the filesystem at runtime — the project rule per [markdown-processing-guidelines › content-source](../markdown-processing-guidelines/content-source.md) is that all content comes from Payload.
