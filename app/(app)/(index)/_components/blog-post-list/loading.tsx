import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import {
	LoadingPlaceholderRect,
	LoadingPlaceholderText,
} from "@/components/loading-placeholder";
import css from "./loading.module.css";

export async function BlogPostListLoading({
	className,
	children,
	...props
}: ComponentProps<"ul">): Promise<JSX.Element> {
	return (
		<ul className={clsx(css.blogPostListLoading, className)} {...props}>
			<BlogPostListLoadingItem data-testid="blog-post" />

			<BlogPostListLoadingItem
				titleSample="Consectetur adipiscing elit quisque faucibus ex sapien vitae"
				briefSample="Amet consectetur adipiscing elit quisque faucibus ex sapien. Quisque faucibus ex sapien vitae pellentesque sem placerat. Vitae pellentesque sem placerat in id cursus mi."
				timestampSample="about 4 months ago"
				data-testid="blog-post"
			/>

			<BlogPostListLoadingItem
				titleSample="Ex sapien vitae pellentesque sem placerat in id"
				briefSample="Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos."
				timestampSample="about 1 year ago"
				data-testid="blog-post"
			/>
		</ul>
	);
}

function BlogPostListLoadingItem({
	titleSample,
	briefSample,
	timestampSample,
	className,
	...props
}: ComponentProps<"li"> & {
	titleSample?: string;
	briefSample?: string;
	timestampSample?: string;
}): JSX.Element {
	return (
		<li className={clsx(css.blogPostListLoadingItem, className)} {...props}>
			<LoadingPlaceholderRect className={css.image} />

			<div className={css.timestamp} data-testid="timestamp">
				<LoadingPlaceholderText
					sampleText={timestampSample || "about 2 weeks ago"}
					maxLines={1}
				/>
			</div>

			<div className={css.title} data-testid="title">
				<LoadingPlaceholderText
					sampleText={
						titleSample ||
						"Lorem ipsum dolor sit amet consectetur adipiscing elit"
					}
					maxLines={1}
				/>
			</div>

			<div className={css.brief} data-testid="brief">
				<LoadingPlaceholderText
					sampleText={
						briefSample ||
						"Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor."
					}
					maxLines={2}
				/>
			</div>
		</li>
	);
}
