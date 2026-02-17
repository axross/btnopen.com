import clsx from "clsx";
import {
	createElement,
	type DetailedHTMLProps,
	Fragment,
	type HTMLAttributes,
	type JSX,
	memo,
} from "react";
import jsxRuntime from "react/jsx-runtime";
import type { Options as RehypeReactOptions } from "rehype-react";
import { renderMarkdown } from "@/services/markdown";

export async function Markdown({
	markdown,
	components,
}: {
	markdown: string;
	components?: RehypeReactOptions["components"];
}) {
	const markdownElement = await renderMarkdown({
		markdown: markdown.replaceAll(/ align="(center|left|right)"/g, ""),
		rehypeReactOptions: await getRehypeReactOptions({ components }),
	});

	return <>{markdownElement}</>;
}

async function getRehypeReactOptions({
	components,
}: {
	components?: RehypeReactOptions["components"];
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

export function createIntrinsicComponent(
	tag: keyof JSX.IntrinsicElements,
	specificClassName?: string,
) {
	return memo(
		({
			className,
			...props
		}: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) =>
			createElement(tag, {
				...props,
				className: clsx(specificClassName, className),
			}),
	);
}
