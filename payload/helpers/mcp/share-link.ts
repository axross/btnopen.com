import type { PayloadRequest } from "payload";
import z from "zod";
import { PayloadBlogPost } from "@/shared/payload-types";
import type { BlogPost } from "../../types";
import { urlOrigin } from "../runtime";
import { findBlogPostBySlug } from "./blog-post-body";
import { mcpErrorResponse } from "./tool-handler";

/**
 * What the two share-link tools share: their argument shape, the refusal they
 * both answer an anonymous caller with, the lookup that reads the token, and
 * the link they both return.
 *
 * These are the only MCP tools that may return a `shareToken`. Every other tool
 * answers through `sanitize.ts`, whose allowlist simply omits the field — so
 * the exclusion holds by construction rather than by remembering to strip it.
 */

/** Both tools address a post the way an author does: by its slug. */
export const BlogPostShareLinkParameters = z.object({
	slug: PayloadBlogPost.shape.slug.describe("Current slug of the blog post."),
});

/**
 * Projection for the share-link lookup. `id` is what the rotation writes
 * against; `shareToken` is what the link carries.
 */
const shareTokenSelect = {
	id: true,
	slug: true,
	shareToken: true,
} as const;

/**
 * `shareToken` is not localized, so every locale answers with the same value.
 * Pinning the project default keeps the locale out of this lookup entirely.
 */
const shareTokenLocale = "ja-JP";

/**
 * What both tools answer a request carrying no identity with. A share token is
 * a bearer credential for unpublished content, so neither answers one
 * anonymously — `hasSignedInUser` in `tool-handler.ts` is the check, and this
 * is the refusal.
 */
export const unauthenticatedShareLinkResponse = mcpErrorResponse(
	"This tool requires an API key bound to a user.",
);

/**
 * Reads one post's id and share token.
 *
 * Reads the latest version rather than the published document, so the token it
 * returns is the one the reader-facing gate compares against in every draft
 * state — a token rotated while a draft version exists included.
 */
export async function findBlogPostShareToken(
	req: PayloadRequest,
	slug: string,
): Promise<BlogPost | null> {
	return await findBlogPostBySlug(req, slug, {
		draft: true,
		locale: shareTokenLocale,
		select: shareTokenSelect,
	});
}

/**
 * The post's own preview URL with the secret appended — the same link the
 * admin control hands out, so there is one address to reason about rather than
 * two.
 */
export function buildShareLink(slug: string, shareToken: string): string {
	return `${urlOrigin}/posts/${slug}?draft=true&token=${encodeURIComponent(shareToken)}`;
}
