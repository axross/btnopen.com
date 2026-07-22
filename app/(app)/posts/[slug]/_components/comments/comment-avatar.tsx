import { clsx } from "clsx";
import Image from "next/image";
import type { JSX } from "react";
import css from "./comment-avatar.module.css";

/**
 * A commenter/author avatar in the post comments UI: the uploaded image graded
 * into the brand hue (the site author's own image kept true-color), or an
 * uppercase-initial fallback on the accent fill. This component owns only the
 * avatar's appearance; the parent sizes each element via `className` (the image)
 * and `fallbackClassName` (the fallback), which the comment list and composer
 * size differently.
 */
export function CommentAvatar({
	src,
	alt,
	isAuthor = false,
	fallback,
	className,
	fallbackClassName,
}: {
	src?: string | null;
	alt: string;
	isAuthor?: boolean;
	fallback?: string;
	className?: string;
	fallbackClassName?: string;
}): JSX.Element {
	if (src) {
		return (
			<Image
				className={clsx(css.avatar, isAuthor && css.authorAvatar, className)}
				src={src}
				alt={alt}
				width={40}
				height={40}
			/>
		);
	}

	return (
		<span
			className={clsx(css.avatarFallback, fallbackClassName)}
			aria-hidden="true"
		>
			{fallback}
		</span>
	);
}
