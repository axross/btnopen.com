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
import { getActiveLocale, htmlLangByLocale } from "@/helpers/i18n";
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
	// the document depends on the negotiated locale (a request-time cookie
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
	const t = await getTranslations("not-found");

	return (
		<html lang={htmlLangByLocale[locale]}>
			<body
				className={`${ibmPlexSans.variable} ${ibmPlexSansJp.variable} ${jetBrainsMono.variable}`}
			>
				<NextIntlClientProvider>
					<Header data-testid="header" />

					<NotFoundContent
						heading="page.found === false"
						description={t("page-description")}
					/>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
