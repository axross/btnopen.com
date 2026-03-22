import { createOnigurumaEngine, type HighlighterCore } from "shiki";
import { createCssVariablesTheme, createHighlighterCore } from "shiki/core";

const cssVariablesTheme = createCssVariablesTheme({
	name: "css-variables",
	variablePrefix: "--snippet-",
	variableDefaults: {},
	fontStyle: true,
});

let singletonHighlighter: HighlighterCore | null = null;

export async function getSingletonHighlighter(): Promise<HighlighterCore> {
	if (singletonHighlighter === null) {
		singletonHighlighter = await createHighlighterCore({
			themes: [cssVariablesTheme],
			langs: [
				import("@shikijs/langs/css"),
				import("@shikijs/langs/dart"),
				import("@shikijs/langs/html"),
				import("@shikijs/langs/javascript"),
				import("@shikijs/langs/jsx"),
				import("@shikijs/langs/rust"),
				import("@shikijs/langs/typescript"),
				import("@shikijs/langs/xml"),
			],
			engine: createOnigurumaEngine(() => import("shiki/wasm")),
		});
	}

	return singletonHighlighter;
}
