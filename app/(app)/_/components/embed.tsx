import { captureException } from "@sentry/nextjs";
import type { HTMLAttributes, JSX } from "react";
import { Suspense } from "react";
import type { PayloadLocale } from "@/shared/payload-types";
import { TweetEmbedLoaded } from "./tweetembed/loaded";
import { TweetEmbedLoading } from "./tweetembed/loading";
import { WebEmbedLoaded } from "./webembed/loaded";
import { WebEmbedLoading } from "./webembed/loading";

/**
 * Renders an `embed` markdown leaf directive, dispatching on its `type`
 * attribute. The "webpage" type renders the web-embed card and "x.com" renders
 * the first-party tweet card; an unknown type degrades to a plain external link
 * and a missing/invalid URL renders nothing, both reported to Sentry so
 * authoring faults surface without breaking the post.
 */
export function Embed({
	url,
	type = "webpage",
	title,
	// the tweet card formats its date in the active locale, which cannot be
	// resolved here: this component renders inside `<Markdown>`'s cache scope.
	// destructured rather than left in the pass-through so it never reaches a DOM
	// element as an unknown attribute on the branches that do not use it.
	locale,
	options: _options,
	className,
	...props
	// this component forwards its rest props to whichever embed it dispatches to —
	// a plain <a>, the tweet card's <blockquote>, or a skeleton's <div> — so the
	// pass-through is typed against `HTMLElement` rather than any one of them.
	// element-specific props (`ref`, `href`) belong to the branch that renders
	// them, not to this contract.
}: HTMLAttributes<HTMLElement> & {
	url?: string;
	type?: string;
	options?: string;
	locale: PayloadLocale;
}): JSX.Element | null {
	// restrict every rendered href to http(s) so a dangerous protocol (e.g.
	// javascript:) authored into content can never reach an anchor.
	if (typeof url !== "string" || !isHttpUrl(url)) {
		captureException(
			new Error(
				`Rendered an embed without a valid http(s) url (type: ${type}).`,
			),
		);

		return null;
	}

	if (type === "x.com") {
		return (
			<Suspense
				fallback={
					<TweetEmbedLoading
						className={className}
						data-testid="embed-loading"
						{...props}
					/>
				}
			>
				<TweetEmbedLoaded
					href={url}
					locale={locale}
					className={className}
					data-testid="embed"
					{...props}
				/>
			</Suspense>
		);
	}

	if (type !== "webpage") {
		captureException(
			new Error(`Rendered an embed with an unsupported type (type: ${type}).`),
		);

		// keep the reference reachable for readers even when the embed type is
		// unknown to this build.
		return (
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
				data-testid="embed"
				{...props}
			>
				{url}
			</a>
		);
	}

	return (
		<Suspense
			fallback={
				<WebEmbedLoading
					className={className}
					data-testid="embed-loading"
					{...props}
				/>
			}
		>
			<WebEmbedLoaded
				href={url}
				title={title}
				className={className}
				data-testid="embed"
				{...props}
			/>
		</Suspense>
	);
}

function isHttpUrl(value: string): boolean {
	if (!URL.canParse(value)) {
		return false;
	}

	const { protocol } = new URL(value);

	return protocol === "http:" || protocol === "https:";
}
