import { captureException } from "@sentry/nextjs";
import type { ComponentProps, JSX } from "react";
import { Suspense } from "react";
import { WebEmbedLoaded } from "./webembed/loaded";
import { WebEmbedLoading } from "./webembed/loading";

/**
 * Renders an `embed` markdown leaf directive, dispatching on its `type`
 * attribute. The "webpage" type renders the web-embed card; an unknown type
 * degrades to a plain external link and a missing/invalid URL renders nothing,
 * both reported to Sentry so authoring faults surface without breaking the
 * post.
 */
export function Embed({
	url,
	type = "webpage",
	title,
	options: _options,
	className,
	...props
}: Omit<ComponentProps<"a">, "href" | "type"> & {
	url?: string;
	type?: string;
	options?: string;
}): JSX.Element | null {
	if (typeof url !== "string" || !URL.canParse(url)) {
		captureException(
			new Error(`Rendered an embed without a valid url (type: ${type}).`),
		);

		return null;
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
				{...props}
			>
				{url}
			</a>
		);
	}

	return (
		<Suspense fallback={<WebEmbedLoading className={className} {...props} />}>
			<WebEmbedLoaded
				href={url}
				title={title}
				className={className}
				{...props}
			/>
		</Suspense>
	);
}
