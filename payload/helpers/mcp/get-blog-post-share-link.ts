import type { PayloadRequest } from "payload";
import { mcpLogger } from "./logger";
import type { McpTextResponse, McpTool } from "./mcp-types";
import {
	BlogPostShareLinkParameters,
	buildShareLink,
	findBlogPostShareToken,
	unauthenticatedShareLinkResponse,
} from "./share-link";
import {
	hasSignedInUser,
	mcpErrorResponse,
	mcpInvalidArgumentsResponse,
	mcpTextResponse,
} from "./tool-handler";

export const getBlogPostShareLinkTool = {
	name: "getBlogPostShareLink",
	description:
		"Return the draft share link for one blog post: its preview URL with the post's current share secret appended. Anyone holding the link can read the draft without signing in.",
	parameters: BlogPostShareLinkParameters.shape as never,
	handler: async (
		args: Record<string, unknown>,
		req: PayloadRequest,
	): Promise<McpTextResponse> => {
		if (!hasSignedInUser(req)) {
			return unauthenticatedShareLinkResponse();
		}

		const parsedArgs = BlogPostShareLinkParameters.safeParse(args);

		if (!parsedArgs.success) {
			return mcpInvalidArgumentsResponse(parsedArgs.error);
		}

		const { slug } = parsedArgs.data;

		mcpLogger.info({ slug }, "Started reading a blog post share link.");

		const blogPost = await findBlogPostShareToken(req, slug);

		if (!blogPost) {
			return mcpErrorResponse(`No blog post exists for slug "${slug}".`);
		}

		if (!blogPost.shareToken) {
			return mcpErrorResponse(
				`Blog post "${slug}" has no share token yet. Save the post once to mint one.`,
			);
		}

		mcpLogger.info({ slug }, "Finished reading a blog post share link.");

		return mcpTextResponse({
			slug: blogPost.slug,
			shareLink: buildShareLink(blogPost.slug, blogPost.shareToken),
			message:
				"Anyone holding this link can read the draft. It never expires; rotate it to revoke every copy at once.",
		});
	},
} satisfies McpTool;
