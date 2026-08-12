import type { ComponentProps, JSX } from "react";
import type { BlogPostDetail } from "@/repositories/get-blog-post";
import { Comments } from "./comments";

/**
 * Renders `<Comments>` only for a post that has them enabled, so the page can
 * mount the section behind one `<Suspense>` without awaiting the post itself
 * to decide whether there is anything to mount.
 */
export async function MaybeComments({
	blogPost,
	slug,
	draft,
	...props
}: Omit<ComponentProps<"section">, "children"> & {
	blogPost: Promise<BlogPostDetail | null>;
	slug: Promise<string>;
	draft: Promise<boolean>;
}): Promise<JSX.Element | null> {
	const [post, resolvedSlug, isDraft] = await Promise.all([
		blogPost,
		slug,
		draft,
	]);

	if (!post?.isCommentsEnabled) {
		return null;
	}

	return <Comments slug={resolvedSlug} draft={isDraft} {...props} />;
}
