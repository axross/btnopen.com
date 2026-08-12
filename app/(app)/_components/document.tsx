import { NextIntlClientProvider } from "next-intl";
import { type ComponentProps, type ReactNode, Suspense } from "react";
import { AnalyticsConsentProvider } from "@/components/analytics-consent-provider";
import { fontVariablesClassName } from "@/fonts";
import { getStoredAnalyticsConsent } from "@/helpers/analytics-consent-request";
import { getActiveLocale, htmlLangByLocale } from "@/helpers/i18n";
import { AnalyticsConsentBanner } from "./analytics-consent-banner";
import { AuthProvider } from "./auth-provider";
import { Footer } from "./footer";
import { Header } from "./header";
import { PageViewTracking } from "./page-view-tracking";

/**
 * The document every route renders inside: the negotiated `<html lang>`, the
 * `<body>` carrying the font variables, and the providers and chrome that wrap
 * a route's own content.
 *
 * It is what makes the root layout request-time work, so `layout.tsx` renders
 * it behind a `<Suspense>` boundary rather than resolving the negotiation
 * itself.
 */
export async function Document({
	children,
	...props
}: Readonly<ComponentProps<"html">>): Promise<ReactNode> {
	// both reads are request-time cookie reads, and this component already sits
	// behind the Suspense boundary that makes those dynamic.
	const [locale, analyticsConsent] = await Promise.all([
		getActiveLocale(),
		getStoredAnalyticsConsent(),
	]);

	return (
		<html lang={htmlLangByLocale[locale]} {...props}>
			<body className={fontVariablesClassName}>
				<AuthProvider>
					<NextIntlClientProvider>
						<AnalyticsConsentProvider initialConsent={analyticsConsent}>
							<Header />

							{children}

							{/* no fallback: the footer is the last thing in the document,
							    so nothing is painted below it that a late arrival could
							    displace. a skeleton here would add a flash of chrome
							    without preventing any layout shift. */}
							<Suspense>
								<Footer data-testid="footer" />
							</Suspense>

							<AnalyticsConsentBanner data-testid="analytics-consent-banner" />

							{/* no fallback: the page-view tracker is a side-effect-only
							    client component that returns null, so it has no visible
							    output a skeleton could stand in for. */}
							<Suspense>
								<PageViewTracking />
							</Suspense>
						</AnalyticsConsentProvider>
					</NextIntlClientProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
