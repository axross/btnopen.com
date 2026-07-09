import type { PayloadLocale } from "@/repositories/payload-types";

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
