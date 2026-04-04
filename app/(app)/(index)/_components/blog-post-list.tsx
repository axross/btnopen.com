import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { type ComponentProps, type JSX, ViewTransition } from "react";
import { getBlogPosts } from "@/repositories/get-blog-posts";
import css from "./blog-post-list.module.css";

export async function BlogPostList({
	draft,
	className,
	children,
	...props
}: ComponentProps<"ul"> & { draft?: Promise<boolean> }): Promise<JSX.Element> {
	const isDraft = await draft;
	const blogPosts = await getBlogPosts({ draft: isDraft });

	return (
		<ul className={clsx(css.blogPostList, className)} {...props}>
			{blogPosts.map((blogPost) => (
				<Link
					href={{
						pathname: `/posts/${blogPost.slug}`,
						search: isDraft ? "draft=true" : undefined,
					}}
					className={css.link}
					key={blogPost.slug}
					data-testid="blog-post"
					data-slug={blogPost.slug}
				>
					<BlogPostListItem
						slug={blogPost.slug}
						title={blogPost.title}
						brief={blogPost.brief}
						thumbnailImageUrl={blogPost.thumbnailImage.url}
						thumbnailImageWidth={blogPost.thumbnailImage.width}
						thumbnailImageHeight={blogPost.thumbnailImage.height}
						publishedAt={blogPost.publishedAt}
					/>
				</Link>
			))}
		</ul>
	);
}

function BlogPostListItem({
	slug,
	title,
	brief,
	thumbnailImageUrl,
	thumbnailImageWidth,
	thumbnailImageHeight,
	publishedAt,
	className,
	...props
}: ComponentProps<"li"> & {
	slug: string;
	title: string;
	brief: string;
	thumbnailImageUrl: string;
	thumbnailImageWidth: number;
	thumbnailImageHeight: number;
	publishedAt: string;
}): JSX.Element {
	return (
		<li className={clsx(css.blogPostListItem, className)} {...props}>
			<ViewTransition name={`blog-post-${slug}-image`}>
				<Image
					src={thumbnailImageUrl}
					alt={title}
					width={thumbnailImageWidth}
					height={thumbnailImageHeight}
					loading="eager"
					className={css.image}
					data-testid="thumbnail-image"
				/>
			</ViewTransition>

			<ViewTransition name={`blog-post-${slug}-timestamp`}>
				<div className={css.timestamp} data-testid="timestamp">
					{formatDistanceToNow(publishedAt, { addSuffix: true })}
				</div>
			</ViewTransition>

			<ViewTransition name={`blog-post-${slug}-title`}>
				<div className={css.title} data-testid="title">
					{title}
				</div>
			</ViewTransition>

			<ViewTransition name={`blog-post-${slug}-content`}>
				<div className={css.brief} data-testid="brief">
					{brief}
				</div>
			</ViewTransition>
		</li>
	);
}
