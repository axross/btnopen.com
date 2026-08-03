# Content Safety

Apply these rules whenever changing the pipeline, a mapped component, or a directive — while writing the change, and while reviewing one. The pipeline turns CMS-authored content into markup, so it is this project's principal untrusted-content surface. The general injection and output-encoding discipline belongs to the application security capability; what follows is how this pipeline's specific defenses are arranged and what would undo them.

## Defenses Currently in Force

The pipeline in `app/(app)/_/helpers/markdown.ts` carries a few knobs whose safety depends on a compensating control elsewhere. Changing one without the other is how this surface breaks.

| Setting | Why it is safe today |
| --- | --- |
| `remarkParse` with `allowDangerousProtocol: true` | `javascript:` URLs survive the parse step, and are stopped only by React's JSX attribute encoding in `<a href="…">` — which holds because every rendered component uses React's normal attribute handling |
| A custom `unknownHandler` that reports to Sentry rather than throwing | Permissive by design, so an unexpected node type degrades instead of crashing — which also means it will not stop one |
| `rehypeReact` consuming HAST through `react/jsx-runtime` | React's automatic encoding is the pipeline's single output-encoding guarantee |

**Guidelines:**

- MUST re-check a pipeline change against all three: the dangerous-protocol handling, the unknown-handler behavior, and the `rehypeReact` encoding guarantee.
- MUST keep a compensating control in place while `allowDangerousProtocol: true` is enabled — either a hand-rolled URL allowlist or a rendering path proven to neutralize dangerous protocols (today, React's attribute encoding). Legitimate content needs `mailto:` and `tel:` links, so the safe form is an allowlist, not a blanket allow.

## Raw-HTML Sinks

Raw-HTML sinks bypass the one defense the rendering layer provides, so a single use undoes the safety of the entire pipeline.

**Guidelines:**

- MUST NOT use `dangerouslySetInnerHTML` in a component added to `defaultComponents` in `app/(app)/_/components/markdown.tsx` for any prop derived from markdown content.
- MUST NOT render a HAST element through `String.raw`, manual string concatenation, or any other non-React path that bypasses JSX encoding.
- MUST NOT spread CMS-controlled `…attributes` onto a DOM element without filtering to a known-safe attribute allowlist.
- MUST canonicalize a CMS-derived value used both as a React key and as a URL (`<li key={post.slug}>` alongside `<a href={post.slug}>`). React's encoding is contextual: the same string is inert as text content and live as a URL.

## Directives

Every custom directive hand-generates markup outside the pipeline's normal path, so it re-assumes encoding responsibilities the pipeline otherwise provides for free.

**Guidelines:**

- MUST NOT emit an `element` whose `properties` include event handlers (`onClick`, `onError`, …) from a directive's HAST handler. The only directive today is `embed`, whose handler forwards just `node.attributes` (`url`, `type`, `title`, `options`) as safe scalar strings, and whose `Embed` component never spreads `options` into the DOM. A directive copying arbitrary attributes is unsafe.
- MUST NOT render unescaped HTML from a `node.attributes` or `node.children` value in a directive's React component, and MUST NOT assign a user-controlled attribute to `style={…}`, `srcSet`, or `dangerouslySetInnerHTML`.
- MUST emit `rel="noopener noreferrer"` with `target="_blank"` on an `<a>` a directive generates for an external URL; `app/(app)/_/components/webembed/loaded.tsx` is the reference pattern.

## Image Sources

The `images.remotePatterns` allowlist is the only gate between an authored URL and the image pipeline, and Next's `unoptimized` flag skips that check entirely — making user-controlled input the whole boundary.

**Guidelines:**

- MUST NOT render `<Image src={userControlled} unoptimized />` where the source originates from CMS markdown without an allowlist check.
- SHOULD treat `WebEmbedLoaded` passing an external `embedMetadata.imageUrl` to `<Image unoptimized />` as a known, accepted risk rather than a fresh finding — but not worsen it, such as by removing the `metascraper` filter or lifting the unoptimized image to a `priority`-loaded position.

## Bypass Paths

A constrained input format is itself a security control: every capability the format cannot express is an attack the pipeline never has to defend against.

**Guidelines:**

- MUST NOT call `unified().use(…).process(rawHtml)` with HTML. This project processes markdown only; diverging to HTML widens the attack surface to everything `rehype` accepts.
- MUST NOT load markdown from the filesystem or arbitrary HTTP at runtime — all content comes from Payload, per [content-source.md](./content-source.md).
