"use server";

import clsx from "clsx";
import { createElement, type ElementType, Fragment, memo } from "react";
import jsxRuntime from "react/jsx-runtime";
import type { Options as RehypeReactOptions } from "rehype-react";
import { Media } from "@/components/media";
import { Snippet } from "@/components/snippet";
import { WebEmbed } from "@/components/webembed";
import { renderMarkdown } from "@/helpers/markdown";

const defaultComponents = {
	a: "a",
	h1: "h1",
	h2: "h2",
	h3: "h3",
	h4: "h4",
	h5: "h5",
	h6: "h6",
	p: "p",
	ul: "ul",
	ol: "ol",
	li: "li",
	blockquote: "blockquote",
	hr: "hr",
	code: "code",
	strong: "strong",
	em: "em",
	del: "del",
	img: Media,
	pre: Snippet,
	webembed: WebEmbed,
} satisfies Record<string, ElementType>;

const fallbackClassNames = {};

export async function Markdown({
	markdown,
	classNames = fallbackClassNames,
}: {
	markdown: string;
	classNames?: Partial<Record<keyof typeof defaultComponents, string>>;
}) {
	// "use cache";

	// cacheLife("hours");

	const components: Record<string, ElementType> = {};

	for (const [key, value] of Object.entries(defaultComponents)) {
		const name = key as keyof typeof defaultComponents;
		const component = value as ElementType;

		components[key] = memo(({ className, ...props }) =>
			createElement(component, {
				...props,
				className: classNames[name]
					? clsx(classNames[name], className)
					: className,
			}),
		);
	}

	const markdownElement = await renderMarkdown({
		markdown,
		rehypeReactOptions: await getRehypeReactOptions({ components }),
	});

	return <>{markdownElement}</>;
}

async function getRehypeReactOptions({
	components,
}: {
	components: RehypeReactOptions["components"];
}): Promise<RehypeReactOptions> {
	const options: RehypeReactOptions = {
		jsx: jsxRuntime.jsx,
		jsxs: jsxRuntime.jsxs,
		// biome-ignore lint/style/useNamingConvention: follow the API of rehypeReact
		Fragment,
		components,
	};

	// biome-ignore lint/style/noProcessEnv: this is to check if the app is running in development environment
	if (process.env.NODE_ENV === "development") {
		const jsxDevRuntime = await import("react/jsx-dev-runtime");

		options.jsxDEV = jsxDevRuntime.jsxDEV;
	}

	return options;
}
