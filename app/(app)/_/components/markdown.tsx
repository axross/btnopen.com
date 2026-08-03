import "server-only";

import clsx from "clsx";
import { cacheLife } from "next/cache";
import { createElement, type ElementType, Fragment } from "react";
import jsxRuntime from "react/jsx-runtime";
import type { Options as RehypeReactOptions } from "rehype-react";
import { Banner } from "@/components/banner";
import { Embed } from "@/components/embed";
import { Link } from "@/components/link";
import { Media } from "@/components/media";
import { Snippet } from "@/components/snippet";
import { Table, TableHeaderCell } from "@/components/table";
import { renderMarkdown } from "@/helpers/markdown";
import type { PayloadLocale } from "@/shared/payload-types";

const defaultComponents = {
	a: Link,
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
	locale,
	classNames = fallbackClassNames,
}: {
	markdown: string;
	// this component opens a cache scope, where reading a request-scoped value
	// (the locale cookie, via `getActiveLocale()`) throws. the components it maps
	// to still need the active locale — `<Embed>` formats a tweet card's date in
	// it — so the caller resolves it outside and passes it in. being required
	// rather than defaulted means a new call site has to say where its locale
	// came from instead of silently falling back to the default one.
	locale: PayloadLocale;
	classNames?: Partial<Record<keyof typeof defaultComponents, string>>;
}) {
	"use cache";

	cacheLife("hours");

	const markdownElement = await renderMarkdown({
		markdown,
		rehypeReactOptions: await getRehypeReactOptions({
			components: createComponents({ classNames, locale }),
		}),
	});

	return <>{markdownElement}</>;
}

/**
 * Builds the tag-to-component map `rehypeReact` renders through, wrapping each
 * mapped component so the caller's `classNames` entry reaches it.
 *
 * The wrappers close over `classNames` and `locale`, so the map is built once
 * per `<Markdown>` call rather than once per module. None of them is wrapped in
 * `memo`, and adding it back would do nothing: `<Markdown>` is a Server
 * Component rendering inside a cache scope, its output is an RSC payload, and
 * these wrapper types never reach client reconciliation. The `memo` that used
 * to sit here compared props across component types re-created on every call,
 * which no memoization can ever match.
 */
function createComponents({
	classNames,
	locale,
}: {
	classNames: Partial<Record<keyof typeof defaultComponents, string>>;
	locale: PayloadLocale;
}): Record<string, ElementType> {
	const components: Record<string, ElementType> = {};

	for (const [key, value] of Object.entries(defaultComponents)) {
		const name = key as keyof typeof defaultComponents;
		const component = value as ElementType;

		components[key] = ({ className, ...props }) => {
			const mergedClassName = classNames[name]
				? clsx(classNames[name], className)
				: className;

			return createElement(component, {
				...props,
				className: mergedClassName,
				// the <Table> component renders a non-scrolling outer wrapper <div>,
				// an inner scroll area, a <table>, and a scrollbar with a thumb.
				// it receives dedicated class names for those parts via the
				// `tableWrapper` / `tableScrollArea` / `tableScrollbar` /
				// `tableScrollbarThumb` sentinel keys in the classNames map. the
				// wrapper is the element `<Table>` roots, so it takes `className`
				// and the <table> element's own class travels on `tableClassName`.
				...(name === "table"
					? {
							className: classNames.tableWrapper,
							tableClassName: mergedClassName,
							scrollAreaClassName: classNames.tableScrollArea,
							scrollbarClassName: classNames.tableScrollbar,
							scrollbarThumbClassName: classNames.tableScrollbarThumb,
						}
					: {}),
				// the directive's own attributes reach the component as props (see the
				// `leafDirective` handler in `helpers/markdown.ts`), so this injection
				// comes after the spread: a `::embed{locale="…"}` authored into a post
				// must not override the locale negotiated for the request. `<Media>`
				// takes it for the same reason — it resolves the media document's
				// localized `alt` — and gets it the same way.
				...(name === "embed" || name === "img" ? { locale } : {}),
			});
		};
	}

	return components;
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
