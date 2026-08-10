/**
 * The visitor's decision about analytics. The absence of a decision is a third
 * state — `null` everywhere below — and is the only one the consent banner
 * renders for; once a decision exists, either value silences the banner.
 */
export type AnalyticsConsent = "granted" | "denied";

export const analyticsConsentCookieName = "btn-analytics-consent";

// one year in seconds (365 days), matching the locale cookie. both record an
// explicit visitor choice, so neither should expire sooner than the other.
const cookieMaxAgeSeconds = 31_536_000;

const analyticsConsentValues = new Set<string>([
	"granted",
	"denied",
] satisfies AnalyticsConsent[]);

/**
 * Narrows a stored cookie value to a decision, treating an absent, empty, or
 * unrecognized value as no decision rather than as a refusal — a visitor whose
 * cookie was truncated has not declined, they have not been asked.
 */
export function parseAnalyticsConsent(
	value: string | undefined | null,
): AnalyticsConsent | null {
	return value !== undefined &&
		value !== null &&
		analyticsConsentValues.has(value)
		? (value as AnalyticsConsent)
		: null;
}

/**
 * Reads the decision out of a `document.cookie`-shaped string. The browser
 * gives the client no way to read one cookie by name, so the pair list is
 * scanned here rather than in the component that needs the answer.
 */
export function readAnalyticsConsentCookie(
	cookieString: string,
): AnalyticsConsent | null {
	for (const pair of cookieString.split(";")) {
		const separatorIndex = pair.indexOf("=");

		if (separatorIndex === -1) {
			continue;
		}

		if (pair.slice(0, separatorIndex).trim() !== analyticsConsentCookieName) {
			continue;
		}

		return parseAnalyticsConsent(
			decodeURIComponent(pair.slice(separatorIndex + 1).trim()),
		);
	}

	return null;
}

/**
 * Persists the decision in the browser, so the next server render already knows
 * it and the banner never flashes in after hydration.
 *
 * Written from the client rather than through a server action because the same
 * decision has to reach the analytics module in this tick — a round trip would
 * make "granting starts collection without a reload" a lie.
 */
export function persistAnalyticsConsent(consent: AnalyticsConsent): void {
	const attributes = [
		`${analyticsConsentCookieName}=${consent}`,
		"Path=/",
		`Max-Age=${cookieMaxAgeSeconds}`,
		"SameSite=Lax",
	];

	// browsers drop a `Secure` cookie over plain http, which is how local dev
	// serves the site, so it is set only where the page is already secure — the
	// same trade-off the comment CSRF cookie makes.
	if (window.location.protocol === "https:") {
		attributes.push("Secure");
	}

	// biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API the rule points at is secure-context only, so it is absent over the plain http local development is served on; this is the one write that works in both
	document.cookie = attributes.join("; ");
}
