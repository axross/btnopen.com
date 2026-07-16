import { captureException } from "@sentry/nextjs";
import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import { getTweet } from "@/repositories/get-tweet";
import type { TweetSegment } from "@/repositories/tweet";
import css from "./loaded.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", {
	year: "numeric",
	month: "short",
	day: "numeric",
});

export async function TweetEmbedLoaded({
	href,
	className,
	"data-testid": dataTestId,
}: {
	href: string;
	className?: string;
	"data-testid"?: string;
}): Promise<JSX.Element> {
	const tweet = await getTweet({ url: href });

	// a deleted/protected/unresolvable tweet degrades to a plain external link —
	// reported so authoring or upstream faults surface without breaking the post.
	if (tweet === null) {
		captureException(
			new Error("Rendered an x.com embed without a resolvable tweet."),
		);

		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
				data-testid={dataTestId}
			>
				{href}
			</a>
		);
	}

	return (
		<blockquote
			cite={tweet.url}
			className={clsx(css.tweet, className)}
			data-testid={dataTestId}
		>
			<p className={css.body}>
				{tweet.segments.map((segment, index) => renderSegment(segment, index))}
			</p>

			<footer className={css.cite}>
				{/* the em-dash binds to the name so it never orphans onto its own line */}
				<span className={css.name}>{`— ${tweet.authorName}`}</span>
				<span className={css.handle}>{`@${tweet.authorHandle}`}</span>
				<span className={css.separator} aria-hidden="true">
					{"·"}
				</span>
				<time className={css.date} dateTime={tweet.createdAt}>
					{dateFormatter.format(new Date(tweet.createdAt))}
				</time>
				<a
					className={css.view}
					href={tweet.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="View on X"
				>
					<span aria-hidden="true">{"View on "}</span>
					<XLogo className={css.viewIcon} />
				</a>
			</footer>
		</blockquote>
	);
}

function renderSegment(
	segment: TweetSegment,
	index: number,
): JSX.Element | string {
	if (segment.type === "text") {
		return segment.value;
	}

	return (
		<a
			// segments never reorder, so the positional index is a stable key
			key={index}
			href={segment.href}
			target="_blank"
			rel="noopener noreferrer"
			className={css.link}
		>
			{segment.value}
		</a>
	);
}

function XLogo({ className, ...props }: ComponentProps<"svg">): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			className={className}
			{...props}
		>
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}
