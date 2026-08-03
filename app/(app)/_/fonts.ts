import {
	IBM_Plex_Sans,
	IBM_Plex_Sans_JP,
	JetBrains_Mono,
} from "next/font/google";

// the document shell exists twice — the root layout and `app/global-not-found.tsx`,
// which Next.js requires to render its own <html>/<body> because it bypasses the
// layout entirely. both need the same three families under the same CSS variable
// names, so the declarations live here rather than being copy-pasted into each.

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

/**
 * The class string every document's `<body>` carries, exposing each family as
 * the CSS variable `variables.css` reads it under.
 */
export const fontVariablesClassName = `${ibmPlexSans.variable} ${ibmPlexSansJp.variable} ${jetBrainsMono.variable}`;
