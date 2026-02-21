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
				<Link href={`/posts/${post.slug}`} className={css.post} key={post.slug}>
					<PostListItem
						slug={post.slug}
						title={post.title}
						brief={post.seo?.description ?? post.brief}
						imageUrl={post.coverImage.url}
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
	imageUrl,
	publishedAt,
	className,
	...props
}: ComponentProps<"li"> & {
	slug: string;
	title: string;
	brief: string;
	imageUrl: string;
	publishedAt: string;
}): JSX.Element {
	return (
		<li className={clsx(css.postListItem, className)} {...props}>
			<ViewTransition name={`post-${slug}-image`}>
				<Image
					src={imageUrl}
					alt={title}
					width={1600}
					height={840}
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

			<div className={css.brief}>{brief}</div>
		</li>
	);
}
