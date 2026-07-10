import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { localeCookieName, negotiateLocale } from "./i18n";

/**
 * next-intl request configuration for the App Router "without i18n routing"
 * setup: the active locale is negotiated per request from the locale cookie
 * and the `Accept-Language` header rather than a URL segment.
 */
// biome-ignore lint/style/noDefaultExport: next-intl's plugin loads this module's default export
export default getRequestConfig(async () => {
	const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

	const locale = negotiateLocale({
		cookieValue: cookieStore.get(localeCookieName)?.value,
		acceptLanguage: headerStore.get("accept-language"),
	});

	return {
		locale,
		messages: (await import(`../translations/${locale}.json`)).default,
	};
});
