import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import {
	LoadingPlaceholderRect,
	LoadingPlaceholderText,
} from "@/components/loading-placeholder";
import css from "./loading.module.css";

export function BlogPostHeaderLoading({
	className,
	children,
	...props
}: ComponentProps<"header">): JSX.Element {
	return (
		<header className={clsx(css.blogPostHeaderLoading, className)} {...props}>
			<LoadingPlaceholderRect
				className={css.coverImage}
				data-testid="cover-image"
			/>

			<div className={css.timestamp} data-testid="timestamp">
				<LoadingPlaceholderText sampleText="April 12, 2026" maxLines={1} />
			</div>

			<h1 className={css.title} data-testid="title">
				<LoadingPlaceholderText
					sampleText="Lorem ipsum dolor sit amet"
					maxLines={2}
				/>
			</h1>

			<div className={css.author} data-testid="author">
				<LoadingPlaceholderRect className={css.authorImage} />

				<div className={css.authorName} data-testid="name">
					<LoadingPlaceholderText sampleText="Author Name" maxLines={1} />
				</div>
			</div>

			<ul className={css.tags} data-testid="tags">
				<li className={css.tag}>
					<LoadingPlaceholderText sampleText="Tag Name" maxLines={1} />
				</li>

				<li className={css.tag}>
					<LoadingPlaceholderText sampleText="Another Tag" maxLines={1} />
				</li>
			</ul>
		</header>
	);
}
