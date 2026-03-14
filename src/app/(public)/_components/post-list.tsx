import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { type ComponentProps, type JSX, ViewTransition } from "react";
import { getPosts } from "../_fetcher/get-posts";
import css from "./post-list.module.css";

export async function PostList({
	className,
	children,
	...props
}: ComponentProps<"ul">): Promise<JSX.Element> {
	"use cache";

	const posts = await getPosts();

	return (
		<ul className={clsx(css.postList, className)} {...props}>
			{posts.map((post) => (
				<Link href={`/posts/${post.slug}`} className={css.link} key={post.slug}>
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
	console.log({
		slug,
		title,
		brief,
		thumbnailImageUrl,
		thumbnailImageWidth,
		thumbnailImageHeight,
		publishedAt,
		className,
		...props,
	});

	return (
		<li className={clsx(css.postListItem, className)} {...props}>
			<ViewTransition name={`post-${slug}-image`}>
				<Image
					src={thumbnailImageUrl}
					alt={title}
					width={thumbnailImageWidth}
					height={thumbnailImageHeight}
					className={css.image}
				/>
			</ViewTransition>

			<ViewTransition name={`post-${slug}-timestamp`}>
				<div className={css.timestamp}>
					{formatDistanceToNow(publishedAt, { addSuffix: true })}
				</div>
			</ViewTransition>

			<ViewTransition name={`post-${slug}-title`}>
				<div className={css.title}>{title}</div>
			</ViewTransition>

			<ViewTransition name={`post-${slug}-content`}>
				<div className={css.brief}>{brief}</div>
			</ViewTransition>
		</li>
	);
}
