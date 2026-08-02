import { type ComponentProps, type JSX, Suspense } from "react";
import { BlogPostAgenticViewLoaded } from "./blog-post-agentic-view/loaded";
import { BlogPostAgenticViewLoading } from "./blog-post-agentic-view/loading";

export function BlogPostAgenticView({
	slug,
	draft,
	className,
	"data-testid": dataTestId,
	...props
}: Omit<ComponentProps<"article">, "children"> & {
	slug: Promise<string>;
	draft: Promise<boolean>;
	"data-testid"?: string;
}): JSX.Element {
	return (
		<Suspense
			fallback={
				<BlogPostAgenticViewLoading
					className={className}
					data-testid={dataTestId ? `${dataTestId}-loading` : undefined}
					{...props}
				/>
			}
		>
			<BlogPostAgenticViewLoaded
				slug={slug}
				draft={draft}
				className={className}
				data-testid={dataTestId}
				{...props}
			/>
		</Suspense>
	);
}
