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
	originalDoc?: { id: number; shareToken?: null | string };
}

function assignedShareToken({
	context = {},
	data = {},
	originalDoc,
}: HookInput): string {
	const result = assignShareToken({
		data,
		originalDoc,
		req: { context } as PayloadRequest,
	} as unknown as Parameters<typeof assignShareToken>[0]) as {
		shareToken: string;
	};

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
	it("mints a token when the document is being created", () => {
		expect(assignedShareToken({})).toMatch(base64UrlPattern);
	});

	it("carries the stored token forward on an ordinary update", () => {
		expect(
			assignedShareToken({
				originalDoc: { id: 1, shareToken: "stored-token" },
			}),
		).toBe("stored-token");
	});

	it("mints a replacement when the write carries the rotation signal", () => {
		const assigned = assignedShareToken({
			context: { [SHARE_TOKEN_ROTATION_CONTEXT_KEY]: true },
			originalDoc: { id: 1, shareToken: "stored-token" },
		});

		expect(assigned).not.toBe("stored-token");
		expect(assigned).toHaveLength(shareTokenLength);
	});

	it("ignores a token the caller supplied and keeps the stored one", () => {
		expect(
			assignedShareToken({
				data: { shareToken: "attacker-chosen" },
				originalDoc: { id: 1, shareToken: "stored-token" },
			}),
		).toBe("stored-token");
	});

	it("mints a token when the stored document has none", () => {
		expect(
			assignedShareToken({ originalDoc: { id: 1, shareToken: null } }),
		).toHaveLength(shareTokenLength);
	});

	it("leaves the rest of the incoming data untouched", () => {
		const result = assignShareToken({
			data: { title: "A post" },
			originalDoc: { id: 1, shareToken: "stored-token" },
			req: { context: {} } as PayloadRequest,
		} as unknown as Parameters<typeof assignShareToken>[0]) as {
			title: string;
		};

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

	const fakeRequest = { user: { id: 7 } } as unknown as PayloadRequest;

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
});
