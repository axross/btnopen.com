import { type ComponentProps, type JSX, Suspense } from "react";
import type { BlogPostDetail } from "@/repositories/get-blog-post";
import { BlogPostHeaderLoaded } from "./blog-post-header/loaded";
import { BlogPostHeaderLoading } from "./blog-post-header/loading";

export function BlogPostHeader({
	blogPost,
	className,
	"data-testid": dataTestId,
	...props
}: ComponentProps<"header"> & {
	blogPost: Promise<BlogPostDetail | null>;
	"data-testid"?: string;
}): JSX.Element {
	return (
		<Suspense
			fallback={
				<BlogPostHeaderLoading
					className={className}
					data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
					{...props}
				/>
			}
		>
			<BlogPostHeaderLoaded
				blogPost={blogPost}
				className={className}
				data-testid={dataTestId}
				{...props}
			/>
		</Suspense>
	);
}
