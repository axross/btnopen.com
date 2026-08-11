import "server-only";

import { getPayload } from "payload";
import { cache } from "react";
import { config } from "@/payload/config";
import { canReadDrafts } from "./draft-access";
import { defaultLocale } from "./i18n";
import { matchesShareToken } from "./share-token-match";

/**
 * Resolves whether the current request may read **this post's** draft.
 *
 * {@link canReadDrafts} answers the same question post-agnostically and stays
 * the primary control — it alone still answers for the index list, the agentic
 * view, and the live-preview refresh action. This narrower decision exists
 * because a share token grants one post and no other, which a post-agnostic
 * boolean cannot express.
 *
 * The two checks are ordered by cost. The session check runs first: it is
 * `cache()`-wrapped, so one lookup already serves the whole request, and a
 * signed-in author never pays for the token read. The token half is
 * {@link matchesPostShareToken}, which runs only for a request the session
 * denied, and it reads the latest version, so a rotation takes effect on the
 * next request in every draft state.
 *
 * React's `cache()` keys this on `(slug, shareToken)` — positionally, because
 * that is how `cache()` compares arguments — so the page, the body, and the
 * thumbnail of one render share a single answer. Both arguments are supplied on
 * every call, so the arity never varies and the key never splits.
 *
 * Like {@link canReadDrafts}, this reads dynamic request state; call it only
 * once a draft has actually been requested, never on the published path.
 */
export const canReadPostDraft = cache(
	async (slug: string, shareToken: string | undefined): Promise<boolean> => {
		if (await canReadDrafts()) {
			return true;
		}

		return await matchesPostShareToken(slug, shareToken);
	},
);

/**
 * Resolves whether the request carried **this post's own** current token,
 * ignoring the session entirely.
 *
 * This is the narrower half of {@link canReadPostDraft}, and it exists because
 * one caller needs the token's answer rather than the draft read's. The post
 * page advertises a token-bearing `og:image` URL so an unfurl of a shared link
 * can render the draft's card, and keying that on "this render resolved as a
 * draft" would write *any* supplied token into the page for a signed-in author
 * — including another post's, on a URL this post's thumbnail gate rejects
 * anyway. Keying it here means the page only ever echoes back a credential that
 * is already this post's.
 *
 * Short-circuits on an absent or empty token before touching the database, so a
 * request that carries none costs nothing. `cache()`-wrapped on the same
 * `(slug, shareToken)` pair as {@link canReadPostDraft}, and the lookup beneath
 * both is cached on the slug alone, so one render performs one read however
 * many of these two it calls.
 */
export const matchesPostShareToken = cache(
	async (slug: string, shareToken: string | undefined): Promise<boolean> => {
		if (!shareToken) {
			return false;
		}

		return matchesShareToken({
			supplied: shareToken,
			stored: await findShareToken(slug),
		});
	},
);

/**
 * Reads one post's stored share token. The value never leaves this module —
 * both exports above return a boolean, and nothing logs the token.
 *
 * The read deliberately bypasses the field's own `access.read`, which requires
 * `req.user`: this is the local API, whose `overrideAccess` defaults to `true`,
 * and the whole point of this lookup is to answer for a request that has no
 * session. The field rule exists to keep `/api/blog-posts` from handing the
 * token to an anonymous caller, not to stop the gate from comparing against it.
 * The bypass is named here rather than left implicit because it is
 * security-relevant and invisible at the call — the same reason
 * `payload/helpers/share-token.ts` spells out its own `overrideAccess: true`.
 */
const findShareToken = cache(async (slug: string): Promise<null | string> => {
	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "blog-posts",
		select: {
			shareToken: true,
		},
		depth: 0,
		where: {
			slug: {
				equals: slug,
			},
		},
		// `shareToken` is not localized, so every locale answers with the same
		// value; pinning the default keeps the locale out of this lookup entirely.
		locale: defaultLocale,
		limit: 1,
		// the latest version rather than the published document, so a token rotated
		// while a draft version exists is the one this compares against.
		draft: true,
	});

	return result.docs[0]?.shareToken ?? null;
});
