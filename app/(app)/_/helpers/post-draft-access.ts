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
 * signed-in author never pays for the token read. The token read runs only for
 * a request that was denied by the session **and** carried a non-empty token,
 * and it reads the latest version, so a rotation takes effect on the next
 * request in every draft state.
 *
 * React's `cache()` keys this on `(slug, shareToken)` — positionally, because
 * that is how `cache()` compares arguments — so the page, the body, and the
 * thumbnail of one render share a single lookup. Both arguments are supplied on
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
 * {@link canReadPostDraft} returns a boolean, and nothing logs the token.
 */
async function findShareToken(slug: string): Promise<null | string> {
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
}
