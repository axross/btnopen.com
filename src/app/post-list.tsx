import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { type ComponentProps, ViewTransition } from "react";
import css from "./post-list.module.css";

export function PostList({
	className,
	children,
	...props
}: ComponentProps<"ul">) {
	return (
		<ul className={clsx(css.postList, className)} {...props}>
			{children}
		</ul>
	);
}

export function PostListItem({
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
}) {
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
