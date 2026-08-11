/**
 * The per-post share token: the bearer credential that lets a signed-out
 * reviewer read one blog post's draft.
 *
 * The token is minted on the server and nowhere else. Field-level access on
 * `shareToken` discards whatever a REST or MCP caller sends — the two surfaces
 * there are, since `payload/config.ts` disables GraphQL — and
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
 * and otherwise carries the stored value forward — minting one when the post
 * has none, so a row that predates the field heals itself on its next write.
 *
 * The stored value never comes from `data`. Field access has already dropped a
 * `shareToken` that arrived over REST or MCP, but a local-API write runs with
 * `overrideAccess: true` and would keep one — ignoring `data` closes that path
 * too. The token is never logged.
 *
 * It does not come from `originalDoc` either, and that is the whole reason this
 * hook reads. Payload sources `originalDoc` differently per operation:
 * `updateByID` and `restoreVersion` both take it from
 * `getLatestCollectionVersion`, but a **bulk** `payload.update({ where })` that
 * is not itself a draft write takes it from the collection row instead
 * (`dist/collections/operations/update.js`, the
 * `hasDraftsEnabled(…) && (shouldSaveDraft || isTrashAttempt)` branch). A
 * rotation writes a draft, so on a published post the replacement lives in a
 * version row while the collection row still holds the revoked value — and that
 * bulk path would carry the revoked value forward and publish it, silently
 * un-rotating the token. The admin list view's Edit → "Publish changes" and a
 * `PATCH /api/blog-posts?where[…]` without `draft=true` both take it.
 * {@link findLatestShareToken} therefore resolves the value from the same place
 * the reader-facing gate compares against, so the two can never disagree.
 *
 * The cost is one indexed single-column query per write that carries a token
 * forward — every save and every autosave included. A create and a rotation
 * both mint, so neither pays it.
 */
export const assignShareToken: CollectionBeforeChangeHook<
	BlogPostShareToken
> = async ({ data, operation, originalDoc, req }) => {
	if (
		operation === "create" ||
		req.context[SHARE_TOKEN_ROTATION_CONTEXT_KEY] === true
	) {
		return { ...data, shareToken: createShareToken() };
	}

	// `originalDoc` is the fallback rather than the source: it is correct on
	// every single-document path and is all there is if the lookup answers with
	// nothing at all.
	const stored =
		(await findLatestShareToken(req, originalDoc?.id)) ??
		originalDoc?.shareToken ??
		"";

	return {
		...data,
		shareToken: stored === "" ? createShareToken() : stored,
	};
};

/**
 * Reads one post's current share token from its latest version — the same
 * `draft: true` read `app/(app)/_/helpers/post-draft-access.ts` performs, so
 * what this hook carries forward is by construction what a share link is
 * compared against.
 *
 * Answers `null` rather than an empty string when there is nothing to read, so
 * the caller can tell "this post has no token" (mint one) from "this lookup
 * found no post" (fall back rather than mint, because minting would rotate a
 * live link nobody asked to revoke).
 *
 * Trashed documents are included deliberately: restoring one from trash is an
 * ordinary update, and the default excludes it, which would read as a post with
 * no token.
 */
async function findLatestShareToken(
	req: PayloadRequest,
	id: number | string | undefined,
): Promise<null | string> {
	if (id === undefined) {
		return null;
	}

	const result = await req.payload.find({
		collection: "blog-posts",
		depth: 0,
		draft: true,
		limit: 1,
		// the hook is the last word on this field, so it reads past the field's own
		// access rule rather than depending on who happens to be writing.
		overrideAccess: true,
		pagination: false,
		// shares the write's transaction, so it sees the row as this write does.
		req,
		select: { shareToken: true },
		trash: true,
		where: { id: { equals: id } },
	});

	return result.docs[0]?.shareToken ?? null;
}

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
