import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { type ComponentProps, type JSX, ViewTransition } from "react";
import { getPosts } from "@/repositories/get-posts";
import css from "./post-list.module.css";

export async function PostList({
	draft = false,
	className,
	children,
	...props
}: ComponentProps<"ul"> & { draft?: boolean }): Promise<JSX.Element> {
	const posts = await getPosts({ draft });

	return (
		<ul className={clsx(css.postList, className)} {...props}>
			{posts.map((post) => (
				<Link
					href={{
						pathname: `/posts/${post.slug}`,
						search: draft ? "draft=true" : undefined,
					}}
					className={css.link}
					key={post.slug}
					data-testid="blog-post"
					data-slug={post.slug}
				>
					<PostListItem
						slug={post.slug}
						title={post.title}
						brief={post.brief}
						thumbnailImageUrl={post.thumbnailImage.url}
						thumbnailImageWidth={post.thumbnailImage.width}
						thumbnailImageHeight={post.thumbnailImage.height}
						publishedAt={post.publishedAt}
					/>
				</Link>
			))}
		</ul>
	);
}

function PostListItem({
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
		<li className={clsx(css.postListItem, className)} {...props}>
			<ViewTransition name={`post-${slug}-image`}>
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

			<ViewTransition name={`post-${slug}-timestamp`}>
				<div className={css.timestamp} data-testid="timestamp">
					{formatDistanceToNow(publishedAt, { addSuffix: true })}
				</div>
			</ViewTransition>

			<ViewTransition name={`post-${slug}-title`}>
				<div className={css.title} data-testid="title">
					{title}
				</div>
			</ViewTransition>

			<ViewTransition name={`post-${slug}-content`}>
				<div className={css.brief} data-testid="brief">
					{brief}
				</div>
			</ViewTransition>
		</li>
	);
}
