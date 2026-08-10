import type { PayloadRequest, TypedUser } from "payload";
import { describe, expect, it, vi } from "vitest";
import { SHARE_TOKEN_ROTATION_CONTEXT_KEY } from "../share-token";
import { mcpLogger } from "./logger";
import { rotateBlogPostShareLinkTool } from "./rotate-blog-post-share-link";

mcpLogger.level = "silent";

const signedInUser = { id: 1 } as unknown as TypedUser;

interface RequestInput {
	docs?: unknown[];
	update?: ReturnType<typeof vi.fn>;
	user?: null | TypedUser;
}

function request({
	docs = [{ id: 1, slug: "hello-world", shareToken: "stored-token" }],
	update,
	user = signedInUser,
}: RequestInput): PayloadRequest {
	return {
		payload: {
			find: vi.fn().mockResolvedValue({ docs }),
			update:
				update ??
				vi.fn().mockResolvedValue({ id: 1, shareToken: "rotated-token" }),
		},
		user,
	} as unknown as PayloadRequest;
}

async function respondText(
	input: RequestInput,
	args: Record<string, unknown> = { slug: "hello-world" },
): Promise<string> {
	const response = await rotateBlogPostShareLinkTool.handler(
		args,
		request(input),
	);

	return response.content[0]?.text ?? "";
}

describe("rotateBlogPostShareLinkTool()", () => {
	it("refuses the rotation when the request carries no user", async () => {
		const update = vi.fn();

		const text = await respondText({ update, user: null });

		expect(text).toContain("Error:");
		expect(update).not.toHaveBeenCalled();
	});

	it("returns the replacement link when a signed-in caller rotates", async () => {
		expect(JSON.parse(await respondText({}))).toMatchObject({
			shareLink: expect.stringContaining(
				"/posts/hello-world?draft=true&token=rotated-token",
			),
			slug: "hello-world",
		});
	});

	it("rotates through the shared helper rather than minting a token itself", async () => {
		const update = vi
			.fn()
			.mockResolvedValue({ id: 1, shareToken: "rotated-token" });

		await respondText({ update });

		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "blog-posts",
				context: { [SHARE_TOKEN_ROTATION_CONTEXT_KEY]: true },
				// a draft write, so rotating never publishes pending content.
				draft: true,
				id: 1,
			}),
		);
	});

	it("reports an error when no post exists for the slug", async () => {
		const update = vi.fn();

		expect(await respondText({ docs: [], update })).toContain("Error:");
		expect(update).not.toHaveBeenCalled();
	});
});
