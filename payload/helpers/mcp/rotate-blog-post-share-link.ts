import type { PayloadRequest } from "payload";
import { rotateShareToken } from "../share-token";
import { mcpLogger } from "./logger";
import type { McpTextResponse, McpTool } from "./mcp-types";
import {
	BlogPostShareLinkParameters,
	buildShareLink,
	findBlogPostShareToken,
	hasSignedInUser,
	mcpErrorResponse,
	mcpTextResponse,
	unauthenticatedShareLinkResponse,
} from "./share-link";

export const rotateBlogPostShareLinkTool = {
	name: "rotateBlogPostShareLink",
	description:
		"Rotate one blog post's draft share secret and return the replacement link. Every link handed out under the previous secret stops working immediately; this is the only way to revoke a share link, and it cannot be undone.",
	parameters: BlogPostShareLinkParameters.shape as never,
	handler: async (
		args: Record<string, unknown>,
		req: PayloadRequest,
	): Promise<McpTextResponse> => {
		if (!hasSignedInUser(req)) {
			return unauthenticatedShareLinkResponse;
		}

		const parsedArgs = BlogPostShareLinkParameters.safeParse(args);

		if (!parsedArgs.success) {
			return mcpErrorResponse(
				parsedArgs.error.issues
					.map(
						(issue) =>
							`${issue.path.join(".") || "arguments"}: ${issue.message}`,
					)
					.join("\n"),
			);
		}

		const { slug } = parsedArgs.data;

		mcpLogger.info({ slug }, "Started rotating a blog post share link.");

		const blogPost = await findBlogPostShareToken(req, slug);

		if (!blogPost) {
			return mcpErrorResponse(`No blog post exists for slug "${slug}".`);
		}

		// mints nothing here: the shared helper carries the rotation signal, and
		// the collection's `beforeChange` hook stays the only minting site.
		const shareToken = await rotateShareToken({
			id: blogPost.id,
			payload: req.payload,
			req,
		});

		mcpLogger.info({ slug }, "Finished rotating a blog post share link.");

		return mcpTextResponse({
			slug: blogPost.slug,
			shareLink: buildShareLink(blogPost.slug, shareToken),
			message:
				"Rotated the share link. Every link shared under the previous secret has stopped working.",
		});
	},
} satisfies McpTool;
