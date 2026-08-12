export interface PageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		draft?: "true";
		preview?: "true";
		agentic?: "true";
		/**
		 * This post's share token, carried by a draft link handed to a signed-out
		 * reviewer. An opaque value, compared rather than interpreted — the gate
		 * matches it against the stored value in constant time and never parses it.
		 *
		 * Typed with the array Next.js actually delivers for a repeated parameter,
		 * rather than the single string a well-formed share link carries, because
		 * this is the one search parameter here whose value flows onward instead of
		 * being compared against a literal. `page.tsx` normalizes it at the route
		 * boundary; the sibling flags stay narrow because `=== "true"` is total
		 * against anything Next.js can hand them.
		 */
		token?: string | string[];
	}>;
}
