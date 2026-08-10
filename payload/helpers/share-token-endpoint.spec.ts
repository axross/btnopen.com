import type { Payload, PayloadRequest, TypedUser } from "payload";
import { describe, expect, it, vi } from "vitest";
import { logger } from "./logger";
import { SHARE_TOKEN_ROTATION_CONTEXT_KEY } from "./share-token";
import { rotateShareTokenEndpoint } from "./share-token-endpoint";

logger.level = "silent";

const okStatus = 200;
const badRequestStatus = 400;
const unauthorizedStatus = 401;

interface RequestInput {
	id?: unknown;
	update?: Payload["update"];
	user?: null | TypedUser;
}

function request(input: RequestInput): PayloadRequest {
	// read through `in` rather than a default parameter, so a case can pass an
	// explicitly absent id without the default putting one back.
	const id = "id" in input ? input.id : "7";

	return {
		payload: {
			update:
				input.update ??
				vi.fn().mockResolvedValue({ id: 7, shareToken: "rotated-token" }),
		},
		routeParams: { collection: "blog-posts", id },
		user: input.user ?? null,
	} as unknown as PayloadRequest;
}

async function respond(input: RequestInput): Promise<{
	body: Record<string, unknown>;
	status: number;
}> {
	const response = await rotateShareTokenEndpoint.handler(request(input));

	return { body: await response.json(), status: response.status };
}

const signedInUser = { id: 1 } as unknown as TypedUser;

describe("rotateShareTokenEndpoint", () => {
	it("is mounted as a POST under the collection's own id", () => {
		expect(rotateShareTokenEndpoint.method).toBe("post");
		expect(rotateShareTokenEndpoint.path).toBe("/:id/rotate-share-token");
	});

	it("refuses the rotation when the request carries no user", async () => {
		const update = vi.fn();

		const { status } = await respond({ update, user: null });

		expect(status).toBe(unauthorizedStatus);
		expect(update).not.toHaveBeenCalled();
	});

	it("refuses the rotation when the route carries no usable id", async () => {
		const update = vi.fn();

		const { status } = await respond({
			id: undefined,
			update,
			user: signedInUser,
		});

		expect(status).toBe(badRequestStatus);
		expect(update).not.toHaveBeenCalled();
	});

	it("returns the replacement token when a signed-in user rotates", async () => {
		const { body, status } = await respond({ user: signedInUser });

		expect(status).toBe(okStatus);
		expect(body).toEqual({ shareToken: "rotated-token" });
	});

	it("rotates through the shared helper rather than minting a token itself", async () => {
		const update = vi
			.fn()
			.mockResolvedValue({ id: 7, shareToken: "rotated-token" });

		await respond({ update, user: signedInUser });

		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "blog-posts",
				context: { [SHARE_TOKEN_ROTATION_CONTEXT_KEY]: true },
				// a draft write, so rotating never publishes pending content.
				draft: true,
				id: "7",
			}),
		);
	});
});
