import "./layers.css";
import "./globals.css";
import "./variables.css";

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, Suspense } from "react";
import { AnalyticsConsentProvider } from "@/components/analytics-consent-provider";
import { fontVariablesClassName } from "@/fonts";
import { getStoredAnalyticsConsent } from "@/helpers/analytics-consent-request";
import { themeColorDark, themeColorLight } from "@/helpers/brand-colors";
import { getActiveLocale, htmlLangByLocale } from "@/helpers/i18n";
import { getWebsite } from "@/repositories/get-website";
import { isClerkAvailable, sha, urlOrigin, vercelEnvironment } from "@/runtime";
import { AnalyticsConsentBanner } from "./_components/analytics-consent-banner";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import { PageViewTracking } from "./_components/page-view-tracking";

export async function generateMetadata(): Promise<Metadata> {
	const website = await getWebsite({ locale: await getActiveLocale() });

	return {
		metadataBase: new URL(urlOrigin),
		title: website
			? {
					template: `%s | ${website.name}`,
					default: website.name,
				}
			: undefined,
		referrer: "origin-when-cross-origin",
		category: "technology",
		robots: {
			index: true,
			follow: true,
			noimageindex: false,
		},
		other: {
			"btn-sha": sha,
			"btn-env": vercelEnvironment,
			"btn-url": urlOrigin,
		},
	};
}

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: themeColorLight },
		{ media: "(prefers-color-scheme: dark)", color: themeColorDark },
	],
};

export default function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	// resolving the negotiated locale for `<html lang>` is request-time work.
	// rendering the document from inside a Suspense boundary lets Cache
	// Components stream it as dynamic content instead of treating the cookie
	// read as blocking the whole route.
	//
	// no fallback: a fallback here would have to be a second <html> shell, and
	// there is nothing to show before the document's own shell exists.
	return (
		<Suspense>
			<Document>{children}</Document>
		</Suspense>
	);
}

async function Document({
	children,
}: Readonly<{ children: ReactNode }>): Promise<ReactNode> {
	// both reads are request-time cookie reads, and this component already sits
	// behind the Suspense boundary that makes those dynamic.
	const [locale, analyticsConsent] = await Promise.all([
		getActiveLocale(),
		getStoredAnalyticsConsent(),
	]);

	return (
		<html lang={htmlLangByLocale[locale]}>
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

/**
 * Wraps the app in Clerk's provider only when Clerk is configured. Without it
 * (local dev without setup, CI, forked-PR previews) the tree renders unchanged
 * and the comment composer degrades to a disabled state.
 */
function AuthProvider({
	children,
}: Readonly<{ children: ReactNode }>): ReactNode {
	if (!isClerkAvailable) {
		return children;
	}

	return <ClerkProvider>{children}</ClerkProvider>;
}
