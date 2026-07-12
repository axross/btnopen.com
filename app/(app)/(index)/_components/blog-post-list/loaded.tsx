import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { type ComponentProps, type JSX, ViewTransition } from "react";
import { dateFnsLocaleByLocale, getActiveLocale } from "@/helpers/i18n";
import { getBlogPosts } from "@/repositories/get-blog-posts";
import css from "./loaded.module.css";

export async function BlogPostListLoaded({
	draft,
	className,
	children,
	...props
}: ComponentProps<"ul"> & {
	draft?: Promise<boolean>;
}): Promise<JSX.Element> {
	const [locale, isDraft] = await Promise.all([getActiveLocale(), draft]);
	const blogPosts = await getBlogPosts({ draft: isDraft, locale });
	const dateFnsLocale = dateFnsLocaleByLocale[locale];

	return (
		<ul className={clsx(css.blogPostListLoaded, className)} {...props}>
			{blogPosts.map((blogPost) => (
				<li className={css.item} key={blogPost.slug}>
					<Link
						href={{
							pathname: `/posts/${blogPost.slug}`,
							search: isDraft ? "draft=true" : undefined,
						}}
						className={css.link}
						data-testid="blog-post"
						data-slug={blogPost.slug}
					>
						<BlogPostListItem
							slug={blogPost.slug}
							title={blogPost.title}
							brief={blogPost.brief}
							thumbnailImage={blogPost.thumbnailImage}
							publishedLabel={formatDistanceToNow(blogPost.publishedAt, {
								addSuffix: true,
								locale: dateFnsLocale,
							})}
						/>
					</Link>
				</li>
			))}
		</ul>
	);
}

function BlogPostListItem({
	slug,
	title,
	brief,
	thumbnailImage,
	publishedLabel,
	className,
	...props
}: ComponentProps<"div"> & {
	slug: string;
	title: string;
	brief: string;
	thumbnailImage: { url: string; width: number; height: number } | null;
	publishedLabel: string;
}): JSX.Element {
	return (
		<div className={clsx(css.blogPostListItem, className)} {...props}>
			{/* autosaved drafts can lack a cover image; omit the thumbnail rather
			    than render a broken image in the draft preview list */}
			{thumbnailImage ? (
				<ViewTransition name={`blog-post-${slug}-image`}>
					<Image
						src={thumbnailImage.url}
						alt={title}
						width={thumbnailImage.width}
						height={thumbnailImage.height}
						loading="eager"
						className={css.image}
						data-testid="thumbnail-image"
					/>
				</ViewTransition>
			) : null}

			<ViewTransition name={`blog-post-${slug}-timestamp`}>
				<div className={css.timestamp} data-testid="timestamp">
					{publishedLabel}
				</div>
			</ViewTransition>

			<ViewTransition name={`blog-post-${slug}-title`}>
				<div className={css.title} data-testid="title">
					{title}
				</div>
			</ViewTransition>

			<div className={css.brief} data-testid="brief">
				{brief}
			</div>
		</div>
	);
}
