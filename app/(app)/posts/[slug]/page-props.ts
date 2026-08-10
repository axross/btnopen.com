export interface PageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		draft?: "true";
		preview?: "true";
		agentic?: "true";
		/**
		 * This post's share token, carried by a draft link handed to a signed-out
		 * reviewer. Typed as an opaque string because it is compared rather than
		 * interpreted — the gate matches it against the stored value in constant
		 * time and never parses it.
		 */
		token?: string;
	}>;
}
