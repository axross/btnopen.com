import { type ComponentProps, type JSX, Suspense } from "react";
import { BlogPostListLoaded } from "./blog-post-list/loaded";
import { BlogPostListLoading } from "./blog-post-list/loading";

export async function BlogPostList({
	draft,
	className,
	children,
	...props
}: ComponentProps<"ul"> & { draft?: Promise<boolean> }): Promise<JSX.Element> {
	return (
		<Suspense
			fallback={<BlogPostListLoading className={className} {...props} />}
		>
			<BlogPostListLoaded draft={draft} className={className} {...props} />
		</Suspense>
	);
}
