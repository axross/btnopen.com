import type { Endpoint } from "payload";
import { logger } from "./logger";
import { rotateShareToken } from "./share-token";

/**
 * Rotates one blog post's share token, and is where the rotation path's
 * authorization lives.
 *
 * {@link rotateShareToken} writes through Payload's local API, which runs with
 * `overrideAccess: true` — the collection's `update` rule never runs for it, so
 * the helper authorizes nothing of its own. This endpoint is the only check
 * standing between an HTTP caller and a replaced token, which is why it refuses
 * a request carrying no `req.user` rather than assuming one is there: as
 * `payload/helpers/mcp/api-key-fields.ts` records, a request can reach this
 * realm with no identity at all.
 *
 * Payload mounts it at `POST /api/blog-posts/:id/rotate-share-token`. It
 * returns the replacement token, because the admin control shows the new link
 * immediately rather than waiting for a reload; nothing logs the value.
 */
export const rotateShareTokenEndpoint: Endpoint = {
	method: "post",
	path: "/:id/rotate-share-token",
	handler: async (req) => {
		if (!req.user) {
			return Response.json(
				{ error: "Sign in to rotate a share token." },
				{ status: 401 },
			);
		}

		const id = req.routeParams?.id;

		// `path-to-regexp` always hands back a string for a matched segment, but the
		// type it is declared with is `unknown`; rejecting anything else keeps a
		// non-identifier out of the update rather than letting Payload fail on it.
		if (typeof id !== "string" || id.length === 0) {
			return Response.json({ error: "Invalid blog post id." }, { status: 400 });
		}

		logger.info({ id }, "Started rotating a blog post share token.");

		const shareToken = await rotateShareToken({
			id,
			payload: req.payload,
			req,
		});

		logger.info({ id }, "Finished rotating a blog post share token.");

		return Response.json({ shareToken });
	},
};
