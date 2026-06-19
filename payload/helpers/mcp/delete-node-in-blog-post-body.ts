import type { PayloadRequest } from "payload";
import z from "zod";
import {
	bodyMutationSelect,
	cloneBlogPostBody,
	findBlogPostBySlug,
	formatLocation,
	getChildrenAtLocation,
	updateBlogPostBody,
} from "./blog-post-body";
import { BlogPostBodyMutationParametersBase } from "./blog-post-body-mutation-types";
import { getErrorMessage } from "./errors";
import { mcpLogger } from "./logger";
import type { McpTextResponse, McpTool } from "./mcp-types";
import { isRecord } from "./records";
import { McpSanitizedBlogPost } from "./sanitize";

const DeleteNodeInBlogPostBodyParameters = z.object({
	...BlogPostBodyMutationParametersBase,
});

export const deleteNodeInBlogPostBodyTool = {
	name: "deleteNodeInBlogPostBody",
	description:
		"Delete one serialized Payload Lexical node from a blog post body at the requested nested children-array location.",
	parameters: DeleteNodeInBlogPostBodyParameters.shape as never,
	handler: async (
		args: Record<string, unknown>,
		req: PayloadRequest,
	): Promise<McpTextResponse> => {
		const parsedArgs = DeleteNodeInBlogPostBodyParameters.safeParse(args);

		if (!parsedArgs.success) {
			return {
				content: [
					{
						type: "text",
						text: `Error: ${parsedArgs.error.issues
							.map(
								(issue) =>
									`${issue.path.join(".") || "arguments"}: ${issue.message}`,
							)
							.join("\n")}`,
					},
				],
			};
		}

		const params = parsedArgs.data;
		const startedAt = performance.now();

		mcpLogger.info(
			{ draft: params.draft, locale: params.locale, slug: params.slug },
			"Started deleting node in blog post body through MCP.",
		);

		const existingBlogPost = await findBlogPostBySlug(req, params.slug, {
			draft: params.draft,
			locale: params.locale,
			select: bodyMutationSelect,
		});

		if (!existingBlogPost) {
			return {
				content: [
					{
						type: "text",
						text: `Error: No blog post exists for slug "${params.slug}".`,
					},
				],
			};
		}

		try {
			const body = cloneBlogPostBody(existingBlogPost.body);
			const leafIndex = params.location.at(-1);

			if (leafIndex === undefined) {
				throw new Error("Location must include at least one index.");
			}

			if (params.location.some((index) => index < 0)) {
				throw new Error(
					"Delete locations must contain only non-negative indexes.",
				);
			}

			const children = getChildrenAtLocation(
				body,
				params.location.slice(0, -1),
			);

			if (leafIndex >= children.length) {
				throw new Error(
					`Delete location ${formatLocation(params.location)} is out of range for ${children.length} children.`,
				);
			}

			const deletedNodes = children.splice(leafIndex, 1);
			const deletedNode = deletedNodes[0];

			if (!isRecord(deletedNode)) {
				throw new Error(
					`No Lexical node exists at location ${formatLocation(params.location)}.`,
				);
			}

			const blogPost = await updateBlogPostBody(req, existingBlogPost, body, {
				draft: params.draft,
				locale: params.locale,
			});

			mcpLogger.info(
				{ duration: performance.now() - startedAt, slug: blogPost.slug },
				"Completed deleting node in blog post body through MCP.",
			);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								blogPost: z.decode(
									McpSanitizedBlogPost,
									blogPost as unknown as z.input<typeof McpSanitizedBlogPost>,
								),
								deletedNode,
								message: "Deleted the node from the blog post body.",
							},
							null,
							2,
						),
					},
				],
			};
		} catch (error) {
			const errorMessage = getErrorMessage(error);

			mcpLogger.warn(
				{
					duration: performance.now() - startedAt,
					error: errorMessage,
					slug: params.slug,
				},
				"Failed deleting node in blog post body through MCP.",
			);

			return {
				content: [
					{
						type: "text",
						text: `Error: ${errorMessage}`,
					},
				],
			};
		}
	},
} satisfies McpTool;
