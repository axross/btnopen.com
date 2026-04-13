import { clsx } from "clsx";
import { format } from "date-fns";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentProps, JSX } from "react";
import { ViewTransition } from "react";
import type { BlogPostDetail } from "@/repositories/get-blog-post";
import css from "./loaded.module.css";

export async function BlogPostHeaderLoaded({
	blogPost: blogPostPromise,
	className,
	...props
}: ComponentProps<"header"> & {
	blogPost: Promise<BlogPostDetail | null>;
}): Promise<JSX.Element> {
	const blogPost = await blogPostPromise;

	if (!blogPost) {
		notFound();
	}

	return (
		<header className={clsx(css.blogPostHeaderLoaded, className)} {...props}>
			<ViewTransition name={`blog-post-${blogPost.slug}-image`}>
				<Image
					alt={blogPost.title}
					src={blogPost.thumbnailImage.url}
					width={blogPost.thumbnailImage.width}
					height={blogPost.thumbnailImage.height}
					loading="eager"
					className={css.coverImage}
					data-testid="cover-image"
				/>
			</ViewTransition>

			<ViewTransition name={`blog-post-${blogPost.slug}-timestamp`}>
				<div className={css.timestamp} data-testid="timestamp">
					{format(blogPost.publishedAt, "PPP")}
				</div>
			</ViewTransition>

			<ViewTransition name={`blog-post-${blogPost.slug}-title`}>
				<h1 className={css.title} data-testid="title">
					{blogPost.title}
				</h1>
			</ViewTransition>

			<div className={css.author} data-testid="author">
				<Image
					alt={blogPost.author.name}
					src={blogPost.author.avatarImage.url}
					width={blogPost.author.avatarImage.width}
					height={blogPost.author.avatarImage.height}
					className={css.authorImage}
					data-testid="avatar-image"
				/>

				<span className={css.authorName} data-testid="name">
					{blogPost.author.name}
				</span>
			</div>

			<ul className={css.tags} data-testid="tags">
				{blogPost.tags?.map((tag) => (
					<li className={css.tag} key={tag.slug} data-testid="tag">
						{tag.name}
					</li>
				))}
			</ul>
		</header>
	);
}
