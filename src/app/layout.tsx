import "./_misc/layers.css";
import "./_misc/globals.css";
import "./_misc/variables.css";

import type { Metadata, Viewport } from "next";
import { cacheLife } from "next/cache";
import {
	IBM_Plex_Sans,
	IBM_Plex_Sans_JP,
	JetBrains_Mono,
} from "next/font/google";
import { type ReactNode, Suspense } from "react";
import { Header } from "./_components/header";
import { PageViewTracking } from "./_components/page-view-tracking";
import { getPublication } from "./_fetcher/get-publication";

const ibmPlexSans = IBM_Plex_Sans({
	variable: "--font-ibm-plex-sans",
	subsets: ["latin", "latin-ext"],
	weight: "variable",
	display: "block",
});

const ibmPlexSansJp = IBM_Plex_Sans_JP({
	variable: "--font-ibm-plex-sans-jp",
	weight: ["400", "700"],
	display: "block",
});

const jetBrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin", "latin-ext"],
	weight: "variable",
	display: "block",
});

export async function generateMetadata(): Promise<Metadata> {
	"use cache";

	cacheLife("days");

	const publication = await getPublication();

	return {
		title: {
			template: `%s | ${publication.title}`,
			default: publication.title,
		},
		referrer: "origin-when-cross-origin",
		category: "technology",
		robots: {
			index: true,
			follow: true,
			noimageindex: false,
		},
	};
}

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#eedfff" },
		{ media: "(prefers-color-scheme: dark)", color: "#1c1025" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<body
				className={`${ibmPlexSans.variable} ${ibmPlexSansJp.variable} ${jetBrainsMono.variable}`}
			>
				<Header />

				{children}

				<Suspense>
					<PageViewTracking />
				</Suspense>
			</body>
		</html>
	);
}
