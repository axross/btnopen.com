import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { dateFnsLocaleByLocale, getActiveLocale } from "@/helpers/i18n";
import {
	type BlogPostComment,
	getBlogPostComments,
} from "@/repositories/get-blog-post-comments";
import type { PayloadLocale } from "@/repositories/payload-types";
import { isClerkAvailable } from "@/runtime";
import { CommentAvatar } from "./comment-avatar";
import { CommentComposer } from "./comment-composer";
import css from "./comments.module.css";
import { LeaveAReviewIllustration } from "./leave-a-review";

/**
 * The reader comments section rendered at the bottom of a post: a muted
 * heading, the composer (only when Clerk is configured), and the approved
 * comment threads with the author's one-level replies.
 *
 * The whole section is omitted when there is nothing to show and nothing can
 * be posted — no visible comments and Clerk unavailable — so an unconfigured
 * deployment renders no dead comment UI. Existing approved comments still
 * render read-only when Clerk is unavailable, only the composer drops out.
 *
 * On a draft/preview view the composer also drops out: the comment write path
 * only accepts published posts, so a composer there could never succeed. The
 * section itself still renders so the preview shows how it looks.
 */
export async function Comments({
	slug,
	draft,
}: {
	slug: string;
	draft: boolean;
}): Promise<JSX.Element | null> {
	const [locale, t] = await Promise.all([
		getActiveLocale(),
		getTranslations("comments"),
	]);
	const { count, threads } = await getBlogPostComments({ slug, locale });

	if (!isClerkAvailable && count === 0) {
		return null;
	}

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

			{isClerkAvailable && !draft ? <CommentComposer slug={slug} /> : null}

			{threads.length === 0 ? (
				<div className={css.empty} data-testid="empty">
					<LeaveAReviewIllustration className={css.emptyIllustration} />

					<div className={css.emptyCopy}>
						<p className={css.emptyExpression}>{"comments.length === 0"}</p>
						<p className={css.emptyInvite}>{t("empty-invite")}</p>
					</div>
				</div>
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
			<CommentAvatar
				src={comment.authorAvatarUrl}
				alt={comment.authorName}
				isAuthor={comment.isAuthor}
				fallback={comment.authorName.slice(0, 1)}
				className={css.avatar}
				data-testid="avatar"
			/>

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
