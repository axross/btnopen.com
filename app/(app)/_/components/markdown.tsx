"use server";

import clsx from "clsx";
import { cacheLife } from "next/cache";
import { createElement, type ElementType, Fragment, memo } from "react";
import jsxRuntime from "react/jsx-runtime";
import type { Options as RehypeReactOptions } from "rehype-react";
import { Banner } from "@/components/banner";
import { Embed } from "@/components/embed";
import { Media } from "@/components/media";
import { Snippet } from "@/components/snippet";
import { Table, TableHeaderCell } from "@/components/table";
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
	table: Table,
	// type-only sentinel: the markdown pipeline never emits a <tableWrapper> element.
	// this entry exists so `classNames.tableWrapper` is type-checked via `keyof typeof defaultComponents`;
	// the actual wrapper <div> is rendered inside the `Table` component (see `table.tsx`).
	tableWrapper: "div",
	// type-only sentinel: the markdown pipeline never emits a <tableScrollArea> element.
	// this entry exists so `classNames.tableScrollArea` is type-checked via `keyof typeof defaultComponents`;
	// the actual scroll-area <div> is rendered inside the `Table` component (see `table.tsx`).
	tableScrollArea: "div",
	// type-only sentinels: the markdown pipeline never emits <tableScrollbar> /
	// <tableScrollbarThumb> elements. these entries exist so the corresponding
	// `classNames` keys are type-checked via `keyof typeof defaultComponents`;
	// the actual scrollbar and thumb are rendered inside the `Table` component
	// (see `table.tsx`).
	tableScrollbar: "div",
	tableScrollbarThumb: "div",
	thead: "thead",
	tbody: "tbody",
	tr: "tr",
	th: TableHeaderCell,
	td: "td",
	img: Media,
	pre: Snippet,
	embed: Embed,
	banner: Banner,
} satisfies Record<string, ElementType>;

const fallbackClassNames = {};

export async function Markdown({
	markdown,
	classNames = fallbackClassNames,
}: {
	markdown: string;
	classNames?: Partial<Record<keyof typeof defaultComponents, string>>;
}) {
	"use cache";

	cacheLife("hours");

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
				// the <Table> component renders a non-scrolling outer wrapper <div>,
				// an inner scroll area, a <table>, and a scrollbar with a thumb.
				// it receives dedicated class names for those parts via the
				// `tableWrapper` / `tableScrollArea` / `tableScrollbar` /
				// `tableScrollbarThumb` sentinel keys in the classNames map.
				...(name === "table"
					? {
							wrapperClassName: classNames.tableWrapper,
							scrollAreaClassName: classNames.tableScrollArea,
							scrollbarClassName: classNames.tableScrollbar,
							scrollbarThumbClassName: classNames.tableScrollbarThumb,
						}
					: {}),
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
