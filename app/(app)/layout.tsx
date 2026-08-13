import "./layers.css";
import "./globals.css";
import "./variables.css";

import type { Metadata, Viewport } from "next";
import { type ReactNode, Suspense } from "react";
import { themeColorDark, themeColorLight } from "@/helpers/brand-colors";
import { getActiveLocale } from "@/helpers/i18n";
import { getWebsite } from "@/repositories/get-website";
import { sha, urlOrigin, vercelEnvironment } from "@/runtime";
import { Document } from "./_components/document";

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
