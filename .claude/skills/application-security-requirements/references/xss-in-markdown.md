# XSS in Markdown Rendering

Apply these rules to verify the markdown pipeline does not allow CMS-authored content to inject script or break out of React's output encoding. The markdown renderer is the principal instance of this surface in the project; the same rules apply to any pipeline that turns authored content into markup.

## Pipeline Configuration to Watch

The pipeline in `app/(app)/_/helpers/markdown.ts` includes a few dangerous knobs. Watch for changes to them:

- `remarkParse` configured with `allowDangerousProtocol: true` — `javascript:` URLs are not stripped at the parse step. This is only safe because React's JSX encoding stops them from executing in `<a href="…">`, which relies on the rendered components using React's normal attribute handling.
- A custom `unknownHandler` that reports to Sentry rather than throwing (a silently-permissive fallback can let unexpected node types through).
- `rehypeReact` consumes the HAST and produces JSX through `react/jsx-runtime`, relying on React's automatic encoding.

**Guidelines:**

- MUST review markdown-pipeline changes against the current dangerous-protocol handling, unknown-handler handling, and `rehypeReact` encoding guarantees.

## What the Reviewer MUST Flag

Raw-HTML sinks bypass the one defense the rendering layer provides — React's automatic output encoding — so a single use undoes the safety of the entire pipeline.

**Guidelines:**

- MUST flag a Critical when a new component added to `defaultComponents` in `app/(app)/_/components/markdown.tsx` uses `dangerouslySetInnerHTML` for any prop derived from the markdown content.
- MUST flag a Critical when a new custom MDAST directive's HAST handler emits an `element` with `properties` that include event handlers (`onClick`, `onError`, etc.). Currently the only directive is `webembed`, whose handler in `markdown.ts` only forwards `node.attributes` (`href`, `title`) — those are safe scalar strings. A new directive that copies arbitrary attributes is unsafe.
- MUST flag a Critical when a new HAST element is rendered through `String.raw`, manual string concatenation, or any non-React path that bypasses JSX encoding.
- MUST flag a Major when `allowDangerousProtocol: true` stays enabled but its compensating control is weakened or removed — with the dangerous-protocol setting on, there MUST be either a hand-rolled URL allowlist or a rendering path proven to neutralize dangerous protocols (currently React's attribute encoding). Legitimate markdown content needs `mailto:` and `tel:` links, so the safe path is an allowlist, not a blanket allow.

## `webembed` and Future Directives

Every custom directive hand-generates markup outside the pipeline's normal path, so it re-assumes responsibility for encoding guarantees the pipeline otherwise provides for free.

**Guidelines:**

- MUST flag a Critical when a new directive's React component renders unescaped HTML from any `node.attributes` or `node.children` value.
- MUST flag a Critical when a new directive accepts user-controlled HTML in an attribute and assigns it to `style={…}`, `srcSet`, or `dangerouslySetInnerHTML`.
- MUST flag a Major when a directive emits an `<a>` tag without `rel="noopener noreferrer"` and `target="_blank"` for external URLs — see the existing `<a>` in `app/(app)/_/components/webembed/loaded.tsx` for the correct pattern.

## Image Sources

The `images.remotePatterns` allowlist is the only gate between authored URLs and the image pipeline, so a render path that skips it makes user-controlled input the entire boundary. The `unoptimized` flag on Next's `<Image>` skips that check entirely.

- The existing `WebEmbedLoaded` does pass an external `embedMetadata.imageUrl` to `<Image unoptimized />` — that is a pre-existing risk the reviewer should be aware of, not flag again unless the diff worsens it (e.g., removes the `metascraper` filter, lifts the `unoptimized` image to a `priority`-loaded position, etc.).

**Guidelines:**

- MUST flag a Critical when a new component renders `<Image src={userControlled} unoptimized />` with `userControlled` originating from CMS markdown without an allowlist check. `unoptimized` bypasses Next's `images.remotePatterns` validation, which is the only host gate.

## React-Specific Pitfalls

React's auto-encoding is contextual — the same string is inert as text content but live as a URL or attribute — so proof of safety in one sink proves nothing about another.

**Guidelines:**

- MUST flag a Critical when JSX uses a key derived from CMS content and that key is the only barrier between two list items (e.g., `<li key={post.slug}>`). React itself encodes the key, but if the same value is also rendered as `<a href={post.slug}>` without URL-canonicalization, both flow to the DOM.
- MUST flag a Major when a new component spreads CMS-controlled `…attributes` directly onto a DOM element without filtering to a known-safe attribute allowlist.

## Bypass Paths

A constrained input format is itself a security control: every capability the format cannot express is an attack the pipeline never has to defend against.

**Guidelines:**

- MUST flag a Critical when any new code calls `unified().use(…).process(rawHtml)` with HTML — the project uses markdown only. A divergence to HTML widens the attack surface to anything `rehype` accepts.
- MUST flag a Critical when a new module loads markdown from the filesystem or arbitrary HTTP at runtime — the project rule per [markdown-processing-guidelines › content-source](../../markdown-processing-guidelines/references/content-source.md) is that all content comes from Payload.
