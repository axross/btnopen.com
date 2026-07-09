import { Avatar } from "@base-ui/react/avatar";
import { clsx } from "clsx";
import { format } from "date-fns";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentProps, JSX } from "react";
import { ViewTransition } from "react";
import { dateFnsLocaleByLocale } from "@/i18n/date-locale";
import { getActiveLocale } from "@/i18n/get-active-locale";
import type { BlogPostDetail } from "@/repositories/get-blog-post";
import css from "./loaded.module.css";

// how long the avatar waits before showing the initials fallback. avatars
// normally load well within this window, so the fallback only appears for a
// genuinely failed or very slow image instead of flashing on every visit.
const avatarFallbackDelayMs = 600;

const wordSeparatorRegex = /\s+/;

export async function BlogPostHeaderLoaded({
	blogPost: blogPostPromise,
	className,
	...props
}: ComponentProps<"header"> & {
	blogPost: Promise<BlogPostDetail | null>;
}): Promise<JSX.Element> {
	const [blogPost, locale] = await Promise.all([
		blogPostPromise,
		getActiveLocale(),
	]);

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
					{format(blogPost.publishedAt, "PPP", {
						locale: dateFnsLocaleByLocale[locale],
					})}
				</div>
			</ViewTransition>

			<ViewTransition name={`blog-post-${blogPost.slug}-title`}>
				<h1 className={css.title} data-testid="title">
					{blogPost.title}
				</h1>
			</ViewTransition>

			<div className={css.author} data-testid="author">
				<Avatar.Root className={css.authorAvatar}>
					{/* `src` on <Avatar.Image> drives Base UI's load-status probe;
					    the rendered element stays a next/image so the avatar keeps
					    going through the image optimizer */}
					<Avatar.Image
						src={blogPost.author.avatarImage.url}
						render={
							<Image
								alt={blogPost.author.name}
								src={blogPost.author.avatarImage.url}
								width={blogPost.author.avatarImage.width}
								height={blogPost.author.avatarImage.height}
								className={css.authorImage}
								data-testid="avatar-image"
							/>
						}
					/>

					{/* aria-hidden: the initials are a visual stand-in only; the
					    author's name is announced by the adjacent name element */}
					<Avatar.Fallback
						delay={avatarFallbackDelayMs}
						className={css.authorAvatarFallback}
						aria-hidden="true"
						data-testid="avatar-fallback"
					>
						{getInitials(blogPost.author.name)}
					</Avatar.Fallback>
				</Avatar.Root>

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

/**
 * Derives up to two uppercased initials from a person's name, taking the
 * first grapheme of each of the first two whitespace-separated words.
 */
function getInitials(name: string): string {
	return name
		.split(wordSeparatorRegex)
		.slice(0, 2)
		.map((word) => [...word][0] ?? "")
		.join("")
		.toUpperCase();
}
