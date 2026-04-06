import { type ComponentProps, type JSX, Suspense } from "react";
import { BlogPostListLoaded } from "./blog-post-list/loaded";
import { BlogPostListLoading } from "./blog-post-list/loading";

export async function BlogPostList({
	draft,
	className,
	"data-testid": dataTestId,
	children,
	...props
}: ComponentProps<"ul"> & {
	draft?: Promise<boolean>;
	"data-testid"?: string;
}): Promise<JSX.Element> {
	return (
		<Suspense
			fallback={
				<BlogPostListLoading
					className={className}
					data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
					{...props}
				/>
			}
		>
			<BlogPostListLoaded
				draft={draft}
				className={className}
				data-testid={dataTestId}
				{...props}
			/>
		</Suspense>
	);
}
