import "./(app)/layers.css";
import "./(app)/globals.css";
import "./(app)/variables.css";

import type { Metadata } from "next";
import {
	IBM_Plex_Sans,
	IBM_Plex_Sans_JP,
	JetBrains_Mono,
} from "next/font/google";
import type { JSX } from "react";
import { Header } from "./(app)/_components/header";
import css from "./global-not-found.module.css";

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
	return (
		<html lang="en">
			<body
				className={`${ibmPlexSans.variable} ${ibmPlexSansJp.variable} ${jetBrainsMono.variable}`}
			>
				<Header data-testid="header" />

				<main className={css.notFound} data-testid="not-found">
					<p className={css.statusCode} aria-hidden="true">
						{"404"}
					</p>

					<h1 className={css.heading}>{"page.found === false"}</h1>

					<p className={css.description}>
						{"お探しのページは見つかりませんでした"}
					</p>

					<a href="/" className={css.homeLink} data-testid="link">
						{"Go back home"}
					</a>
				</main>
			</body>
		</html>
	);
}
