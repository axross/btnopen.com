/**
 * The per-post share token: the bearer credential that lets a signed-out
 * reviewer read one blog post's draft.
 *
 * The token is minted on the server and nowhere else. Field-level access on
 * `shareToken` discards whatever a REST, GraphQL, or MCP caller sends, and
 * {@link assignShareToken} — a collection `beforeChange` hook, which Payload
 * runs after that field access — has the last word on the stored value. That is
 * what makes "generated from a CSPRNG" a property of the system rather than of
 * each caller.
 *
 * There is no expiry, so rotation is the whole revocation model and
 * {@link rotateShareToken} is the only way to perform it.
 */

import type {
	CollectionBeforeChangeHook,
	Payload,
	PayloadRequest,
	TypeWithID,
} from "payload";

/**
 * Bytes of CSPRNG output behind each token — 256 bits, far past guessable and
 * still short enough to paste into a chat window.
 */
const shareTokenByteLength = 32;

/**
 * `req.context` key a write carries to ask {@link assignShareToken} for a
 * replacement token instead of the stored one. Only {@link rotateShareToken}
 * sets it, so an ordinary write can never change the value.
 */
export const SHARE_TOKEN_ROTATION_CONTEXT_KEY = "rotateBlogPostShareToken";

/** As much of a blog post as the share-token hook reads. */
interface BlogPostShareToken extends TypeWithID {
	shareToken?: null | string;
}

/**
 * Mints a fresh token: 32 bytes from the runtime CSPRNG rendered as base64url
 * with no padding, so the value travels in a query string without escaping.
 */
export function createShareToken(): string {
	return Buffer.from(
		crypto.getRandomValues(new Uint8Array(shareTokenByteLength)),
	).toString("base64url");
}

/**
 * Owns `shareToken` end to end as the collection's single minting site: mints
 * on create, mints a replacement when the write carries the rotation signal,
 * and otherwise carries the stored value forward — minting one when the stored
 * document has none, so a row that predates the field heals itself on its next
 * write.
 *
 * The stored value is read from `originalDoc`, never from `data`. Field access
 * has already dropped a `shareToken` that arrived over REST, GraphQL, or MCP,
 * but a local-API write runs with `overrideAccess: true` and would keep one —
 * ignoring `data` closes that path too. The token is never logged.
 */
export const assignShareToken: CollectionBeforeChangeHook<
	BlogPostShareToken
> = ({ data, originalDoc, req }) => {
	const stored = originalDoc?.shareToken ?? "";
	const rotating = req.context[SHARE_TOKEN_ROTATION_CONTEXT_KEY] === true;

	return {
		...data,
		shareToken: rotating || stored === "" ? createShareToken() : stored,
	};
};

/**
 * Rotates one post's share token and returns the replacement, invalidating
 * every link handed out under the previous one.
 *
 * The update carries {@link SHARE_TOKEN_ROTATION_CONTEXT_KEY}, which is what
 * makes {@link assignShareToken} mint rather than carry the stored value
 * forward; this helper mints nothing itself, so the hook stays the only place a
 * token is created. The write is a draft write, so rotating never publishes
 * pending content.
 *
 * It runs with `overrideAccess: false` and the request's user, matching the MCP
 * write path and the rule `payload/collections/blog-post.ts` states, so the
 * collection's own `update` rule is what authorizes a rotation. Both callers
 * check `req.user` before reaching here and would deny the same request, but
 * enforcing it once in the collection is what keeps a future tightening of that
 * rule from silently not applying to this path. `req` is required for the same
 * reason: with access enforced, a call without one is a denial rather than a
 * default.
 *
 * Minting is unaffected by that, because field write access runs earlier than
 * the hook that mints. Payload's update pipeline is `beforeValidate` fields —
 * where `field.access[operation]` is evaluated and a denied value deleted from
 * the incoming data — then `beforeValidate` collection, then `beforeChange`
 * collection, which is where {@link assignShareToken} writes. Verified against
 * the installed `payload`, in `dist/fields/hooks/beforeValidate/promise.js` and
 * the ordering `dist/collections/operations/utilities/update.js` documents.
 */
export async function rotateShareToken({
	id,
	payload,
	req,
}: {
	id: number | string;
	payload: Payload;
	req: PayloadRequest;
}): Promise<string> {
	const updated = await payload.update({
		collection: "blog-posts",
		context: { [SHARE_TOKEN_ROTATION_CONTEXT_KEY]: true },
		data: {},
		depth: 0,
		draft: true,
		id,
		overrideAccess: false,
		req,
	});

	if (!updated.shareToken) {
		throw new Error("Rotating a blog post's share token produced no token.");
	}

	return updated.shareToken;
}
