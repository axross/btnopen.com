import { enUS, ja, type Locale } from "date-fns/locale";
import { PayloadLocale } from "@/repositories/payload-types";

/**
 * Locales the front end can serve, aligned one-to-one with the Payload
 * localization locales so a single vocabulary flows from the request through
 * the CMS query.
 */
export const locales = [
	"ja-JP",
	"en-US",
] as const satisfies readonly PayloadLocale[];

/**
 * Locale served when the request carries no explicit preference. Matches the
 * Payload `defaultLocale`, keeping the site Japanese-primary.
 */
export const defaultLocale: PayloadLocale = "ja-JP";

/** Name of the cookie holding a visitor's explicit locale choice. */
export const localeCookieName = "NEXT_LOCALE";

/** BCP-47 language tag emitted on the `<html lang>` attribute per locale. */
export const htmlLangByLocale: Record<PayloadLocale, string> = {
	"ja-JP": "ja",
	"en-US": "en",
};

/** Open Graph `og:locale` value per locale. */
export const openGraphLocaleByLocale: Record<PayloadLocale, string> = {
	"ja-JP": "ja_JP",
	"en-US": "en_US",
};

/** date-fns locale used to format dates for each supported app locale. */
export const dateFnsLocaleByLocale: Record<PayloadLocale, Locale> = {
	"ja-JP": ja,
	"en-US": enUS,
};

/**
 * Open Graph `og:locale:alternate` values for a given active locale — every
 * supported locale's OG code except the active one.
 */
export function alternateOpenGraphLocales(
	activeLocale: PayloadLocale,
): string[] {
	return locales
		.filter((locale) => locale !== activeLocale)
		.map((locale) => openGraphLocaleByLocale[locale]);
}

/**
 * Resolves the active locale from an explicit cookie value and the request's
 * `Accept-Language` header.
 *
 * Precedence: a valid cookie value (an explicit visitor choice) wins;
 * otherwise the highest-quality `Accept-Language` entry that maps to a
 * supported locale; otherwise {@link defaultLocale}.
 */
export function negotiateLocale({
	cookieValue,
	acceptLanguage,
}: {
	cookieValue?: string | null;
	acceptLanguage?: string | null;
}): PayloadLocale {
	const fromCookie = PayloadLocale.safeParse(cookieValue);

	if (fromCookie.success) {
		return fromCookie.data;
	}

	return matchAcceptLanguage(acceptLanguage) ?? defaultLocale;
}

/**
 * The locale negotiated for the current request, validated as a
 * {@link PayloadLocale} so it can be passed straight into Payload queries.
 *
 * The request config always resolves to a supported locale, so an unexpected
 * value signals a negotiation/config gap: it is reported to Sentry before
 * falling back to {@link defaultLocale} rather than swallowed silently.
 */
export async function getActiveLocale(): Promise<PayloadLocale> {
	// dynamic imports keep this module's static graph free of `next-intl/server`
	// (which reads request headers) and `@sentry/nextjs`, so the pure helpers
	// above stay importable from unit tests.
	const { getLocale } = await import("next-intl/server");
	const locale = await getLocale();
	const parsed = PayloadLocale.safeParse(locale);

	if (parsed.success) {
		return parsed.data;
	}

	const { captureException } = await import("@sentry/nextjs");
	captureException(
		new Error(
			`Unexpected active locale ${JSON.stringify(locale)}; falling back to "${defaultLocale}".`,
		),
	);

	return defaultLocale;
}

/**
 * Picks the best supported locale for an `Accept-Language` header, matching
 * on the primary language subtag (e.g. `en` matches `en-US`) and honouring
 * quality values.
 */
function matchAcceptLanguage(
	acceptLanguage?: string | null,
): PayloadLocale | null {
	if (!acceptLanguage) {
		return null;
	}

	const ranked = acceptLanguage
		.split(",")
		.map((part) => {
			const [tag, ...parameters] = part.trim().split(";");
			const quality = parameters.find((parameter) =>
				parameter.trim().startsWith("q="),
			);
			const q = quality ? Number.parseFloat(quality.trim().slice(2)) : 1;

			return { tag: tag.trim().toLowerCase(), q: Number.isNaN(q) ? 0 : q };
		})
		.filter((entry) => entry.tag.length > 0 && entry.q > 0)
		.sort((left, right) => right.q - left.q);

	for (const { tag } of ranked) {
		const primary = tag.split("-")[0];
		const match = locales.find(
			(locale) =>
				locale.toLowerCase() === tag ||
				locale.split("-")[0].toLowerCase() === primary,
		);

		if (match) {
			return match;
		}
	}

	return null;
}
