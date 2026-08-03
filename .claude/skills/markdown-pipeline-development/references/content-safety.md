# Content Safety

Apply these rules whenever changing the pipeline, a mapped component, or a directive — while writing the change, and while reviewing one. The pipeline turns CMS-authored content into markup, so it is this project's principal untrusted-content surface. The general injection and output-encoding discipline belongs to the application security capability; what follows is how this pipeline's specific defenses are arranged and what would undo them.

## Defenses Currently in Force

Nothing between the markdown parser and React inspects a URL on its own. These are the controls that do, and what each one's failure would cost.

| Control | What it stops, and what it depends on |
| --- | --- |
| `rehypeAllowedLinkProtocols`, the last plugin before `rehypeReact` | Drops the `href` of any `<a>` whose destination `classifyLinkHref` (`app/(app)/_/helpers/link-href.ts`) rules `blocked` — every scheme outside `http`, `https`, `mailto`, and `tel`. The element and its text survive, so authored prose is never erased. |
| The same `classifyLinkHref` call inside the `Link` component (`app/(app)/_/components/link.tsx`) | The check repeated where the attribute is produced, so an anchor stays safe even if the pipeline plugin is removed or the `a` mapping changes. It also decides `next/link` versus an isolated external anchor. |
| `Embed`'s `isHttpUrl` gate (`app/(app)/_/components/embed.tsx`) | `remarkEmbeds` rewrites a lone-link paragraph into an `embed` directive, which bypasses the anchor path entirely; `Embed` renders `null` for anything that is not `http(s)`. |
| A custom `unknownHandler` that reports to Sentry rather than throwing | Permissive by design, so an unexpected node type degrades instead of crashing — which also means it will not stop one. |
| `rehypeReact` consuming HAST through `react/jsx-runtime` | React's automatic encoding is the pipeline's output-encoding guarantee for text and attribute values. It is **not** a URL defense: React refuses a `javascript:` href as an internal precaution, and nothing else — `data:` passes. |

Two things this pipeline does **not** do, recorded so neither is mistaken for a defense:

- **`remark-rehype` does not sanitize URLs, and there is no sanitizing to switch on.** `mdast-util-to-hast`'s link handler sets `href: normalizeUri(node.url)` and never reads the scheme; the allowlisting `sanitizeUri(url, protocol)` in the same package is not called. `remark-parse` accepts no `allowDangerousProtocol` option either — a line passing one was inert and has been removed. A dangerous protocol reaches HAST intact, which is the gap the two `classifyLinkHref` calls close.
- **The CMS is not a filter.** Payload's Lexical link field rejects only empty values and values containing a space, so a `javascript:` destination is storable through the admin and the MCP server alike.

**Guidelines:**

- MUST keep a URL-protocol allowlist between authored content and any rendered `href`. React's `javascript:` guard is another library's internal, covers one scheme, and MUST NOT be treated as the control.
- MUST re-check a pipeline change against all of them: the link-protocol allowlist, the `Embed` http(s) gate, the unknown-handler behavior, and the `rehypeReact` encoding guarantee.
- MUST extend `classifyLinkHref` itself — never one of its call sites — when a new scheme becomes legitimate, so the pipeline plugin and the `Link` component cannot drift apart.

## Body Links

Every link in a post body renders through the `Link` component mapped to `a` in `defaultComponents`. It is the only anchor on the site whose destination is authored rather than coded.

**Guidelines:**

- MUST render an external destination with `target="_blank"` and `rel="noopener noreferrer"`, and an internal one through `next/link` with neither.
- MUST treat a protocol-relative destination (`//host/path`) as external. It carries no scheme, so a naive scheme check calls it internal and hands an off-site navigation to the internal-link primitive.
- MUST NOT give `mailto:` or `tel:` a `target` or `rel`; they hand off to another app rather than opening a browsing context.
- MUST NOT add `rel="nofollow"` to a body link. A post body is author-written — `nofollow ugc` belongs to the reader-submitted links in `comments.tsx`.
- MUST keep the element when its destination is refused, dropping only the `href`, so the author's link text still renders.

A same-origin **absolute** destination (`https://www.btnopen.com/posts/x`) is deliberately treated as external. Resolving it to internal would mean comparing against `urlOrigin` from `runtime.ts`, whose value is the branch host on a preview deployment — so one authored link would behave differently on preview and on production. The cost of the current rule is an unnecessary new tab, not a safety gap.

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
