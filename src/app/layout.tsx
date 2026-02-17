import "./layers.css";
import "./globals.css";
import "./variables.css";

import type { Metadata, Viewport } from "next";
import { cacheLife } from "next/cache";
import {
	IBM_Plex_Sans,
	IBM_Plex_Sans_JP,
	JetBrains_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { hashnodePublicationHost } from "@/config";
import { execute, graphql } from "@/services/graphql";
import { Header } from "./header";

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

// const ibmPlexSansJp = localFont({
// 	variable: "--font-ibm-plex-sans-jp",
// 	src: [
// 		{
// 			weight: "400",
// 			style: "normal",
// 			path: "../../public/fonts/ibm-plex-sans-jp-regular.otf",
// 		},
// 	],
// 	display: "block",
// 	adjustFontFallback: false,
// });

const jetBrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin", "latin-ext"],
	weight: "variable",
	display: "block",
});

// const jetBrainsMono = localFont({
// 	variable: "--font-jetbrains-mono",
// 	src: [
// 		{
// 			weight: "400",
// 			style: "normal",
// 			path: "../../public/fonts/jetbrains-mono-regular.woff2",
// 		},
// 		{
// 			weight: "400",
// 			style: "italic",
// 			path: "../../public/fonts/jetbrains-mono-italic.woff2",
// 		},
// 		{
// 			weight: "700",
// 			style: "normal",
// 			path: "../../public/fonts/jetbrains-mono-bold.woff2",
// 		},
// 		{
// 			weight: "700",
// 			style: "italic",
// 			path: "../../public/fonts/jetbrains-mono-bold-italic.woff2",
// 		},
// 	],
// 	display: "block",
// 	adjustFontFallback: false,
// });

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
			</body>
		</html>
	);
}

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

async function getPublication() {
	const result = await execute(
		graphql(`
			query GetPublication(
				$host: String!
			) {
				publication(host: $host) {
					title
					url
				}
			}  
		`),
		{ host: hashnodePublicationHost },
	);

	if (result.data?.publication) {
		return result.data.publication;
	}

	throw new Error(result.errors?.map((error) => error.message).join(", "));
}
