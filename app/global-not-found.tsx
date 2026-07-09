import "./(app)/layers.css";
import "./(app)/globals.css";
import "./(app)/variables.css";

import type { Metadata } from "next";
import {
	IBM_Plex_Sans,
	IBM_Plex_Sans_JP,
	JetBrains_Mono,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { type JSX, Suspense } from "react";
import { NotFoundContent } from "@/components/not-found-content";
import { htmlLangByLocale } from "@/i18n/config";
import { getActiveLocale } from "@/i18n/get-active-locale";
import { Header } from "./(app)/_components/header";

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

export const metadata: Metadata = {
	title: "Not Found | <btn open />",
};

export default function GlobalNotFound(): JSX.Element {
	// The document depends on the negotiated locale (a request-time cookie
	// read), so it renders inside a Suspense boundary to stay compatible with
	// Cache Components.
	return (
		<Suspense>
			<NotFoundDocument />
		</Suspense>
	);
}

async function NotFoundDocument(): Promise<JSX.Element> {
	const locale = await getActiveLocale();
	const t = await getTranslations("notFound");

	return (
		<html lang={htmlLangByLocale[locale]}>
			<body
				className={`${ibmPlexSans.variable} ${ibmPlexSansJp.variable} ${jetBrainsMono.variable}`}
			>
				<NextIntlClientProvider>
					<Header data-testid="header" />

					<NotFoundContent
						heading="page.found === false"
						description={t("pageDescription")}
					/>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
