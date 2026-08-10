import type { PayloadRequest, TypedUser } from "payload";
import { describe, expect, it, vi } from "vitest";
import { getBlogPostShareLinkTool } from "./get-blog-post-share-link";
import { mcpLogger } from "./logger";

mcpLogger.level = "silent";

const signedInUser = { id: 1 } as unknown as TypedUser;

interface RequestInput {
	docs?: unknown[];
	find?: ReturnType<typeof vi.fn>;
	user?: null | TypedUser;
}

function request({
	docs = [{ id: 1, slug: "hello-world", shareToken: "stored-token" }],
	find,
	user = signedInUser,
}: RequestInput): PayloadRequest {
	return {
		payload: { find: find ?? vi.fn().mockResolvedValue({ docs }) },
		user,
	} as unknown as PayloadRequest;
}

async function respondText(
	input: RequestInput,
	args: Record<string, unknown> = { slug: "hello-world" },
): Promise<string> {
	const response = await getBlogPostShareLinkTool.handler(args, request(input));

	return response.content[0]?.text ?? "";
}

describe("getBlogPostShareLinkTool()", () => {
	it("refuses the read when the request carries no user", async () => {
		const find = vi.fn();

		const text = await respondText({ find, user: null });

		expect(text).toContain("Error:");
		expect(find).not.toHaveBeenCalled();
	});

	it("returns the post's preview URL with its secret appended", async () => {
		const text = await respondText({});

		expect(JSON.parse(text)).toMatchObject({
			shareLink: expect.stringContaining(
				"/posts/hello-world?draft=true&token=stored-token",
			),
			slug: "hello-world",
		});
	});

	it("reads the latest version, so a token rotated on a draft is the one served", async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [{ id: 1, slug: "hello-world", shareToken: "stored-token" }],
		});

		await respondText({ find });

		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "blog-posts",
				draft: true,
				overrideAccess: false,
			}),
		);
	});

	it("reports an error when no post exists for the slug", async () => {
		expect(await respondText({ docs: [] })).toContain("Error:");
	});

	it("reports an error when the post carries no token yet", async () => {
		expect(
			await respondText({ docs: [{ id: 1, slug: "hello-world" }] }),
		).toContain("Error:");
	});

	it("reports an error when the arguments carry no slug", async () => {
		expect(await respondText({}, {})).toContain("Error:");
	});
});
