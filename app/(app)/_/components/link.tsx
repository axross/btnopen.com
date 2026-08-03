import NextLink from "next/link";
import type { ComponentProps, JSX } from "react";
import { classifyLinkHref } from "@/helpers/link-href";

/**
 * Renders a link authored into markdown body content. An internal destination
 * routes through Next's link primitive so navigation stays client-side; an
 * external one opens in a tab isolated from this page; `mailto:` / `tel:` get
 * neither, because they hand off to another app instead of opening a browsing
 * context.
 *
 * A destination the pipeline refused (see `rehypeAllowedLinkProtocols` in
 * `helpers/markdown.ts`, which strips the `href` rather than the element)
 * arrives here without one and renders as inert text, so the author's words
 * survive even when their link does not. The same guard runs here rather than
 * only in the pipeline so this component is safe on its own terms.
 *
 * Body links carry no `rel="nofollow"`: unlike the reader-submitted links in
 * the comments subsystem, a post body is author-written.
 */
export function Link({ href, ...props }: ComponentProps<"a">): JSX.Element {
	if (href === undefined) {
		return <a {...props} />;
	}

	const kind = classifyLinkHref(href);

	if (kind === "blocked") {
		return <a {...props} />;
	}

	if (kind === "internal") {
		return <NextLink href={href} {...props} />;
	}

	if (kind === "contact") {
		return <a href={href} {...props} />;
	}

	return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}
