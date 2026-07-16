import { captureException } from "@sentry/nextjs";
import { clsx } from "clsx";
import type { JSX } from "react";
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
			new Error(
				`Rendered an x.com embed without a resolvable tweet (href: ${href}).`,
			),
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
				{/* the timestamp is the link out to the tweet on X */}
				<a
					className={css.date}
					href={tweet.url}
					target="_blank"
					rel="noopener noreferrer"
				>
					<time dateTime={tweet.createdAt}>
						{dateFormatter.format(new Date(tweet.createdAt))}
					</time>
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
