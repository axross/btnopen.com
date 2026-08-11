import type { Payload, PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";
import {
	assignShareToken,
	createShareToken,
	rotateShareToken,
	SHARE_TOKEN_ROTATION_CONTEXT_KEY,
} from "./share-token";

/** 32 CSPRNG bytes rendered base64url without padding. */
const shareTokenLength = 43;

const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

interface HookInput {
	context?: Record<string, unknown>;
	data?: Record<string, unknown>;
	/**
	 * What the latest-version lookup answers with. `undefined` stands for a post
	 * the lookup does not find at all, which is a different case from a post
	 * found holding no token.
	 */
	latest?: { shareToken?: null | string };
	operation?: "create" | "update";
	originalDoc?: { id: number; shareToken?: null | string };
}

function hookArguments({
	context = {},
	data = {},
	latest,
	operation = "update",
	originalDoc,
}: HookInput): {
	args: Parameters<typeof assignShareToken>[0];
	find: ReturnType<typeof vi.fn>;
} {
	const find = vi
		.fn()
		.mockResolvedValue({ docs: latest === undefined ? [] : [latest] });

	return {
		args: {
			data,
			operation,
			originalDoc,
			req: { context, payload: { find } },
		} as unknown as Parameters<typeof assignShareToken>[0],
		find,
	};
}

async function assignedShareToken(input: HookInput): Promise<string> {
	const { args } = hookArguments(input);
	const result = (await assignShareToken(args)) as { shareToken: string };

	return result.shareToken;
}

describe("createShareToken()", () => {
	it("mints a token the length 32 bytes render to in unpadded base64url", () => {
		expect(createShareToken()).toHaveLength(shareTokenLength);
	});

	it("mints a token using only the URL-safe base64 alphabet", () => {
		expect(createShareToken()).toMatch(base64UrlPattern);
	});

	it("mints a different token on every call", () => {
		expect(createShareToken()).not.toBe(createShareToken());
	});
});

describe("assignShareToken()", () => {
	it("mints a token when the document is being created", async () => {
		expect(await assignedShareToken({ operation: "create" })).toMatch(
			base64UrlPattern,
		);
	});

	it("reads nothing when the document is being created", async () => {
		const { args, find } = hookArguments({ operation: "create" });

		await assignShareToken(args);

		expect(find).not.toHaveBeenCalled();
	});

	it("carries the latest version's token forward on an ordinary update", async () => {
		expect(
			await assignedShareToken({
				latest: { shareToken: "stored-token" },
				originalDoc: { id: 1, shareToken: "stored-token" },
			}),
		).toBe("stored-token");
	});

	// the un-rotation row. A bulk `payload.update({ where })` that is not a draft
	// write hands the hook the *collection row* as `originalDoc`, and a rotation
	// writes only a version row — so on a published post `originalDoc` still
	// holds the revoked token. Trusting it would publish the revoked value back
	// over the live one, which is exactly the link the author revoked coming back
	// to life.
	it("keeps the rotated token when originalDoc still holds the revoked one", async () => {
		expect(
			await assignedShareToken({
				latest: { shareToken: "rotated-token" },
				originalDoc: { id: 1, shareToken: "revoked-token" },
			}),
		).toBe("rotated-token");
	});

	it("mints a replacement when the write carries the rotation signal", async () => {
		const assigned = await assignedShareToken({
			context: { [SHARE_TOKEN_ROTATION_CONTEXT_KEY]: true },
			latest: { shareToken: "stored-token" },
			originalDoc: { id: 1, shareToken: "stored-token" },
		});

		expect(assigned).not.toBe("stored-token");
		expect(assigned).toHaveLength(shareTokenLength);
	});

	it("reads nothing when the write carries the rotation signal", async () => {
		const { args, find } = hookArguments({
			context: { [SHARE_TOKEN_ROTATION_CONTEXT_KEY]: true },
			originalDoc: { id: 1, shareToken: "stored-token" },
		});

		await assignShareToken(args);

		expect(find).not.toHaveBeenCalled();
	});

	it("ignores a token the caller supplied and keeps the stored one", async () => {
		expect(
			await assignedShareToken({
				data: { shareToken: "attacker-chosen" },
				latest: { shareToken: "stored-token" },
				originalDoc: { id: 1, shareToken: "stored-token" },
			}),
		).toBe("stored-token");
	});

	it("mints a token when the post has none", async () => {
		expect(
			await assignedShareToken({
				latest: { shareToken: null },
				originalDoc: { id: 1, shareToken: null },
			}),
		).toHaveLength(shareTokenLength);
	});

	// a lookup that finds no post is not a post with no token: minting there
	// would revoke a live link on a write that never asked for it, so the value
	// Payload handed the hook is what it falls back to.
	it("falls back to originalDoc when the lookup finds no post", async () => {
		expect(
			await assignedShareToken({
				originalDoc: { id: 1, shareToken: "stored-token" },
			}),
		).toBe("stored-token");
	});

	it("mints a token when neither the lookup nor originalDoc has one", async () => {
		expect(await assignedShareToken({ originalDoc: { id: 1 } })).toHaveLength(
			shareTokenLength,
		);
	});

	// the shape of the read is the contract: `draft: true` is what makes it the
	// latest version rather than the published row, the id filter is what scopes
	// it to this post, `trash: true` keeps a restore-from-trash from reading as a
	// post with no token, and `req` is what puts it inside the write's own
	// transaction.
	it("reads only this post's share token, from its latest version", async () => {
		const context = {};
		const find = vi
			.fn()
			.mockResolvedValue({ docs: [{ shareToken: "stored-token" }] });
		const payload = { find };

		await assignShareToken({
			data: {},
			operation: "update",
			originalDoc: { id: 1, shareToken: "stored-token" },
			req: { context, payload },
		} as unknown as Parameters<typeof assignShareToken>[0]);

		expect(find).toHaveBeenCalledTimes(1);
		expect(find).toHaveBeenCalledWith({
			collection: "blog-posts",
			depth: 0,
			draft: true,
			limit: 1,
			overrideAccess: true,
			pagination: false,
			req: { context, payload },
			select: { shareToken: true },
			trash: true,
			where: { id: { equals: 1 } },
		});
	});

	it("leaves the rest of the incoming data untouched", async () => {
		const { args } = hookArguments({
			data: { title: "A post" },
			latest: { shareToken: "stored-token" },
			originalDoc: { id: 1, shareToken: "stored-token" },
		});
		const result = (await assignShareToken(args)) as { title: string };

		expect(result.title).toBe("A post");
	});
});

describe("rotateShareToken()", () => {
	function fakePayload(shareToken: null | string): {
		payload: Payload;
		update: ReturnType<typeof vi.fn>;
	} {
		const update = vi.fn().mockResolvedValue({ id: 1, shareToken });

		return { payload: { update } as unknown as Payload, update };
	}

	// `context` is not optional on a real `PayloadRequest` — `createPayloadRequest`
	// seeds it to `{}` and `createLocalReq` replaces it — and `assignShareToken`
	// already reads it unguarded, so the fake carries one too.
	const fakeRequest = {
		context: {},
		user: { id: 7 },
	} as unknown as PayloadRequest;

	// the rule `payload/collections/blog-post.ts` states for every write here: run
	// with the caller's identity and let the collection's own `update` rule
	// decide, rather than compensating with a check at each call site. Field
	// access does not interfere, because it runs in the `beforeValidate` fields
	// pass, before the `beforeChange` hook that mints.
	it("writes as the request's user with the collection's access rule enforced", async () => {
		const { payload, update } = fakePayload("rotated-token");

		await rotateShareToken({ id: 1, payload, req: fakeRequest });

		expect(update).toHaveBeenCalledWith({
			collection: "blog-posts",
			context: { [SHARE_TOKEN_ROTATION_CONTEXT_KEY]: true },
			data: {},
			depth: 0,
			draft: true,
			id: 1,
			overrideAccess: false,
			req: fakeRequest,
		});
	});

	it("returns the replacement the hook minted", async () => {
		const { payload } = fakePayload("rotated-token");

		expect(await rotateShareToken({ id: 1, payload, req: fakeRequest })).toBe(
			"rotated-token",
		);
	});

	it("throws when the write comes back with no token", async () => {
		const { payload } = fakePayload(null);

		await expect(
			rotateShareToken({ id: 1, payload, req: fakeRequest }),
		).rejects.toThrow("Rotating a blog post's share token produced no token.");
	});

	/**
	 * Stands in for `createLocalReq`, which merges the operation's `context` into
	 * the request object it was handed rather than into a copy of it — the
	 * mutation that would otherwise leave the rotation signal set for the rest of
	 * the request.
	 */
	function mutatingPayload(shareToken: null | string): Payload {
		const update = vi.fn(
			({ context, req }: { context: object; req: PayloadRequest }) => {
				req.context = { ...req.context, ...context };

				return Promise.resolve({ id: 1, shareToken });
			},
		);

		return { update } as unknown as Payload;
	}

	it("leaves the rotation signal off the caller's request", async () => {
		const request = {
			context: {},
			user: { id: 7 },
		} as unknown as PayloadRequest;

		await rotateShareToken({
			id: 1,
			payload: mutatingPayload("rotated"),
			req: request,
		});

		expect(request.context[SHARE_TOKEN_ROTATION_CONTEXT_KEY]).not.toBe(true);
	});

	it("leaves the rotation signal off the request even when the write throws", async () => {
		const request = {
			context: {},
			user: { id: 7 },
		} as unknown as PayloadRequest;

		await expect(
			rotateShareToken({ id: 1, payload: mutatingPayload(null), req: request }),
		).rejects.toThrow();

		expect(request.context[SHARE_TOKEN_ROTATION_CONTEXT_KEY]).not.toBe(true);
	});

	it("leaves the caller's other context keys alone", async () => {
		const request = {
			context: { skipBlogPostCacheBust: true },
			user: { id: 7 },
		} as unknown as PayloadRequest;

		await rotateShareToken({
			id: 1,
			payload: mutatingPayload("rotated"),
			req: request,
		});

		expect(request.context.skipBlogPostCacheBust).toBe(true);
	});
});
