import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
	COMMENT_CSRF_COOKIE,
	createCommentCsrfToken,
} from "@/helpers/comment-csrf";
import { isSameSiteRequest } from "@/helpers/request-origin";
import { isLocalhost } from "@/runtime";

/**
 * Issues a double-submit CSRF token for the comment composer: it returns the
 * token in the body and pins the same value in a SameSite=Strict, HttpOnly
 * cookie. The composer echoes the returned token in a header when it submits,
 * and `POST /posts/[slug]/comments` accepts the write only when the header and
 * cookie match — so a cross-site page (which can read neither) cannot forge a
 * valid pair. The token is not slug-specific; the slug segment only keeps the
 * endpoint co-located with the comment routes it protects.
 */
export async function GET(request: NextRequest): Promise<Response> {
	// Do not hand a token to a cross-site caller; pairs with the same check on
	// the POST handler.
	if (!isSameSiteRequest(request)) {
		return Response.json({ error: "Cross-site request." }, { status: 403 });
	}

	const token = createCommentCsrfToken();

	(await cookies()).set(COMMENT_CSRF_COOKIE, token, {
		httpOnly: true,
		sameSite: "strict",
		// Secure cookies are dropped by browsers over plain http (local dev), so
		// only mark it Secure off localhost.
		secure: !isLocalhost,
		path: "/",
		maxAge: 60 * 60,
	});

	return Response.json({ token });
}
