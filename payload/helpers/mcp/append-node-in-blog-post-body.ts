import type { PayloadRequest } from "payload";
import z from "zod";
import {
	bodyMutationSelect,
	cloneBlogPostBody,
	findBlogPostBySlug,
	formatLocation,
	getChildrenAtLocation,
	updateBlogPostBody,
	validateRichTextReferences,
} from "./blog-post-body";
import { BlogPostBodyMutationParametersBase } from "./blog-post-body-mutation-types";
import { getErrorMessage } from "./errors";
import { mcpLogger } from "./logger";
import type { McpTextResponse, McpTool } from "./mcp-types";
import { McpSanitizedBlogPost } from "./sanitize";

const LexicalNode = z
	.object({
		type: z.string().min(1).describe("Serialized Lexical node type."),
	})
	.catchall(z.unknown())
	.describe(
		"Serialized Payload Lexical node JSON to insert. Use upload nodes with relationTo='media' and value set to an existing media ID; do not pass Markdown.",
	);

const AppendNodeInBlogPostBodyParameters = z.object({
	...BlogPostBodyMutationParametersBase,
	node: LexicalNode,
});

export const appendNodeInBlogPostBodyTool = {
	name: "appendNodeInBlogPostBody",
	description:
		"Insert one serialized Payload Lexical node into a blog post body at the requested nested children-array location.",
	parameters: AppendNodeInBlogPostBodyParameters.shape as never,
	handler: async (
		args: Record<string, unknown>,
		req: PayloadRequest,
	): Promise<McpTextResponse> => {
		const parsedArgs = AppendNodeInBlogPostBodyParameters.safeParse(args);

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
			"Started appending node in blog post body through MCP.",
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

			if (params.location.slice(0, -1).includes(-1)) {
				throw new Error("-1 is only valid as the final append location index.");
			}

			const parentLocation = params.location.slice(0, -1);
			const children = getChildrenAtLocation(body, parentLocation);
			const index = leafIndex === -1 ? 0 : leafIndex;

			if (index < 0 || index > children.length) {
				throw new Error(
					`Append location ${formatLocation(params.location)} is out of range for ${children.length} children.`,
				);
			}

			children.splice(index, 0, structuredClone(params.node));

			await validateRichTextReferences(req, body);

			const blogPost = await updateBlogPostBody(req, existingBlogPost, body, {
				draft: params.draft,
				locale: params.locale,
			});

			mcpLogger.info(
				{ duration: performance.now() - startedAt, slug: blogPost.slug },
				"Completed appending node in blog post body through MCP.",
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
								insertedAt: [...parentLocation, index],
								message: "Inserted the node in the blog post body.",
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
				"Failed appending node in blog post body through MCP.",
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
