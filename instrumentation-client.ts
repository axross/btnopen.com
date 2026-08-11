import {
	captureRouterTransitionStart,
	init as initializeSentry,
	replayIntegration,
} from "@sentry/nextjs";
import {
	hasShareToken,
	redactShareTokenInEvent,
} from "@/helpers/share-token-scrubbing";
import { sentryDsn, sha, vercelEnvironment } from "@/runtime";

// whether this document has ever been at a URL carrying a post's share token.
// sticky rather than a look at the current URL, because an error-linked replay
// uploads the buffered minute *before* the error: a reviewer who followed a
// share link and then navigated on within the same document still has the token
// in that recording, while `location.search` no longer shows it.
//
// three moments write it, and each covers a case the others miss: the entry URL
// at module scope, for a document that loaded on a share link; every client
// navigation, for one that reached a share link and left it again without ever
// reloading; and the error itself, for one that arrived by a route neither of
// those saw.
let hasVisitedShareLink = hasShareToken(window.location.search);

/**
 * Whether an error-linked replay may be uploaded from this document.
 *
 * A replay records the URL through a path no `beforeSend` sees, so the
 * redaction that keeps the token out of an event cannot reach a replay; not
 * uploading it is the only control there is. The accepted cost is that a
 * reviewer's error on a shared link produces no replay — the right trade for a
 * bearer credential, and the one this change deliberately makes.
 */
function mayUploadErrorReplay(): boolean {
	hasVisitedShareLink ||= hasShareToken(window.location.search);

	return !hasVisitedShareLink;
}

if (sentryDsn) {
	initializeSentry({
		dsn: sentryDsn,
		// the same commit SHA next.config.ts hands the build plugin, so an event
		// and its uploaded source maps can never file under different releases.
		release: sha,
		environment: vercelEnvironment,
		integrations: [
			replayIntegration({ beforeErrorSampling: mayUploadErrorReplay }),
		],
		// every event leaves with a post's share token redacted out of it, through
		// `beforeSend` for an error and `beforeSendTransaction` for a transaction,
		// which carries the URL just as an error does. what the redaction reaches
		// is `share-token-scrubbing.ts`'s to state rather than this file's: it
		// walks the whole event rather than a list of fields, so there is no
		// covered set named here that could fall behind it.
		beforeSend: redactShareTokenInEvent,
		beforeSendTransaction: redactShareTokenInEvent,
		// a personal blog's traffic fits inside the free quota whole, so nothing is
		// gained by sampling and a sampled trace is missing precisely when a slow
		// page is being chased.
		tracesSampleRate: 1,
		// ordinary sessions are not recorded. a session is only worth a recording
		// once it has failed, and replaying the ones that did not buys diagnostics
		// nobody reads at the cost of capturing every visitor's reading.
		replaysSessionSampleRate: 0,
		// error-linked replay stays at full rate — see observability.md, which pins
		// this floor at exactly 1.0.
		replaysOnErrorSampleRate: 1.0,
		// diagnostic context is allowed, user content is not. every category is set
		// explicitly: once `dataCollection` is present, an omitted category falls back
		// to the SDK's all-on default rather than to the narrow posture the replaced
		// `sendDefaultPii` boolean suggests. keep this block identical across
		// sentry.server.config.ts, sentry.edge.config.ts, and instrumentation-client.ts.
		dataCollection: {
			// diagnostics — what makes an issue answerable.
			userInfo: true,
			// the SDK filters sensitive keys (authorization, cookie, token, …) regardless.
			httpHeaders: { request: true, response: true },
			// left on, and deliberately not the control that keeps a post's share
			// token out of an event. The SDK attaches the full request URL
			// unconditionally and consults this flag only for the separate
			// `query_string` field, and the allow/deny forms its type permits are
			// applied to query parameters in no installed package (verified against
			// @sentry/core 10.69). Turning it off would therefore drop the routing
			// state that makes an issue answerable and keep the token; the
			// `beforeSend` / `beforeSendTransaction` redaction in this file is what
			// actually removes it, from this field and from everywhere else in the event.
			urlQueryParams: true,
			stackFrameVariables: true,
			frameContextLines: 5,
			// content — comment submissions, /api/mcp payloads, and post rows stay out.
			cookies: false,
			httpBodies: [],
			databaseQueryData: false,
			// no AI integration exists here; set so adding one cannot silently ship prompts.
			genAI: { inputs: false, outputs: false },
			// a GraphQL document has its literal values redacted at collection time,
			// variables do not.
			graphQL: { document: true, variables: false },
		},
	});
}

// Mixpanel is deliberately absent from this file. it is initialized from
// `app/(app)/_/helpers/analytics.ts`, behind the visitor's consent, and loaded
// by a dynamic import there — so a visitor who has not consented never
// downloads the SDK, let alone runs it. Sentry stays here and stays ungated:
// error reporting is the diagnostic basis this site runs on, and it records no
// ordinary session.

/**
 * Next.js's client-navigation hook, which Sentry uses to open a navigation
 * span — and which this file also uses to keep {@link mayUploadErrorReplay}
 * honest.
 *
 * The destination is the only moment a share link is observable when the
 * navigation is client-side: `window.location` has not moved yet, and by the
 * time an error fires the reviewer may have navigated on again, leaving the
 * token-bearing page in the replay buffer but nowhere in the current URL.
 *
 * Nothing here may throw — a failure in instrumentation must not break the
 * navigation it exists to observe — so a non-string `href` is skipped rather
 * than handed to the matcher.
 */
export function onRouterTransitionStart(
	href: string,
	navigationType: string,
): void {
	if (typeof href === "string") {
		hasVisitedShareLink ||= hasShareToken(href);
	}

	captureRouterTransitionStart(href, navigationType);
}
