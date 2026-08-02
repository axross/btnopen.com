import { captureException } from "@sentry/nextjs";
import { clsx } from "clsx";
import { format } from "date-fns";
import type { HTMLAttributes, JSX } from "react";
import { dateFnsLocaleByLocale } from "@/helpers/i18n";
import { getTweet } from "@/repositories/get-tweet";
import type { TweetSegment } from "@/repositories/tweet";
import type { PayloadLocale } from "@/shared/payload-types";
import css from "./loaded.module.css";

export async function TweetEmbedLoaded({
	href,
	// the locale arrives as a prop rather than from `getActiveLocale()`: this
	// component renders inside `<Markdown>`'s cache scope, where reading the
	// request's cookies is not allowed.
	locale,
	className,
	...props
	// an unresolvable tweet degrades to a plain <a>, so this component roots either
	// a <blockquote> or an <a> and types its pass-through against `HTMLElement`
	// rather than committing to one of them.
}: Omit<HTMLAttributes<HTMLElement>, "children"> & {
	href: string;
	locale: PayloadLocale;
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
				{...props}
			>
				{href}
			</a>
		);
	}

	return (
		<blockquote
			cite={tweet.url}
			className={clsx(css.tweet, className)}
			{...props}
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
						{format(new Date(tweet.createdAt), "PPP", {
							locale: dateFnsLocaleByLocale[locale],
						})}
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
