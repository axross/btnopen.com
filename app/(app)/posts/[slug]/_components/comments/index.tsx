import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { dateFnsLocaleByLocale, getActiveLocale } from "@/helpers/i18n";
import {
	type BlogPostComment,
	getBlogPostComments,
} from "@/repositories/get-blog-post-comments";
import type { PayloadLocale } from "@/repositories/payload-types";
import { isClerkEnabled } from "@/runtime";
import { CommentComposer } from "./comment-composer";
import css from "./comments.module.css";

/**
 * The reader comments section rendered at the bottom of a post: a muted
 * heading, the composer (or a disabled placeholder when Clerk is not
 * configured), and the approved comment threads with the author's one-level
 * replies.
 */
export async function Comments({
	slug,
}: {
	slug: string;
}): Promise<JSX.Element> {
	const [locale, t] = await Promise.all([
		getActiveLocale(),
		getTranslations("comments"),
	]);
	const { count, threads } = await getBlogPostComments({ slug, locale });

	return (
		<section
			className={css.comments}
			aria-label={t("heading")}
			data-testid="comments"
		>
			<div className={css.head}>
				<h2 className={css.heading}>{t("heading")}</h2>
				<span className={css.count}>{`(${count})`}</span>
			</div>

			{isClerkEnabled ? (
				<CommentComposer slug={slug} />
			) : (
				<p className={css.hint} data-testid="composer">
					{t("unavailable")}
				</p>
			)}

			{threads.length === 0 ? (
				<p className={css.empty}>{t("empty")}</p>
			) : (
				<ol className={css.list} data-testid="list">
					{threads.map((thread) => (
						<li key={thread.id}>
							{thread.comment ? (
								<CommentItem
									comment={thread.comment}
									locale={locale}
									authorLabel={t("author")}
								/>
							) : (
								<p className={css.tombstone} data-testid="removed">
									{t("removed")}
								</p>
							)}

							{thread.replies.length > 0 ? (
								<ol className={css.replies} data-testid="replies">
									{thread.replies.map((reply) => (
										<li key={reply.id}>
											<CommentItem
												comment={reply}
												locale={locale}
												authorLabel={t("author")}
												isReply
											/>
										</li>
									))}
								</ol>
							) : null}
						</li>
					))}
				</ol>
			)}
		</section>
	);
}

function CommentItem({
	comment,
	locale,
	authorLabel,
	isReply = false,
}: {
	comment: BlogPostComment;
	locale: PayloadLocale;
	authorLabel: string;
	isReply?: boolean;
}): JSX.Element {
	const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
		addSuffix: true,
		locale: dateFnsLocaleByLocale[locale],
	});

	return (
		<article
			className={clsx(css.comment, isReply && css.reply)}
			data-testid="comment"
		>
			{comment.authorAvatarUrl ? (
				<Image
					className={css.avatar}
					src={comment.authorAvatarUrl}
					alt={comment.authorName}
					width={40}
					height={40}
				/>
			) : (
				<span className={css.avatarFallback} aria-hidden="true">
					{comment.authorName.slice(0, 1)}
				</span>
			)}

			<div className={css.body}>
				<div className={css.meta}>
					<span className={css.name}>{comment.authorName}</span>

					{comment.authorGithubUsername ? (
						<a
							className={css.handle}
							href={`https://github.com/${comment.authorGithubUsername}`}
							target="_blank"
							rel="nofollow noopener noreferrer ugc"
						>
							{`@${comment.authorGithubUsername}`}
						</a>
					) : null}

					{comment.isAuthor ? (
						<span className={css.badge} data-testid="author-badge">
							{authorLabel}
						</span>
					) : null}

					<time className={css.time} dateTime={comment.createdAt}>
						{relativeTime}
					</time>
				</div>

				<p className={css.text}>{comment.body}</p>
			</div>
		</article>
	);
}
