import { PayloadLocale } from "@/repositories/payload-types";
import { defaultLocale, locales } from "./config";

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
