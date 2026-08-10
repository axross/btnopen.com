import "./layers.css";
import "./globals.css";
import "./variables.css";

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, Suspense } from "react";
import { fontVariablesClassName } from "@/fonts";
import { themeColorDark, themeColorLight } from "@/helpers/brand-colors";
import { getActiveLocale, htmlLangByLocale } from "@/helpers/i18n";
import { getWebsite } from "@/repositories/get-website";
import { isClerkAvailable, sha, urlOrigin, vercelEnvironment } from "@/runtime";
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
	return (
		<Suspense>
			<Document>{children}</Document>
		</Suspense>
	);
}

async function Document({
	children,
}: Readonly<{ children: ReactNode }>): Promise<ReactNode> {
	const locale = await getActiveLocale();

	return (
		<html lang={htmlLangByLocale[locale]}>
			<body className={fontVariablesClassName}>
				<AuthProvider>
					<NextIntlClientProvider>
						<Header />

						{children}

						{/* no fallback: the page-view tracker is a side-effect-only
						    client component that returns null, so it has no visible
						    output a skeleton could stand in for. */}
						<Suspense>
							<PageViewTracking />
						</Suspense>
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
