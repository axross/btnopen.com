import { clsx } from "clsx";
import Image from "next/image";
import type { JSX } from "react";
import css from "./comment-avatar.module.css";

/**
 * A commenter/author avatar in the post comments UI: the uploaded image graded
 * into the brand hue (the site author's own image kept true-color), or an
 * uppercase-initial fallback on the accent fill. This component owns only the
 * avatar's appearance; the parent sizes both the image and the fallback via a
 * single `className`. `data-testid` labels the image; the fallback derives
 * `${data-testid}-fallback`.
 */
export function CommentAvatar({
	src,
	alt,
	isAuthor = false,
	fallback,
	className,
	"data-testid": dataTestId,
}: {
	src?: string | null;
	alt: string;
	isAuthor?: boolean;
	fallback?: string;
	className?: string;
	"data-testid"?: string;
}): JSX.Element {
	if (src) {
		return (
			<Image
				className={clsx(css.avatar, isAuthor && css.authorAvatar, className)}
				src={src}
				alt={alt}
				width={40}
				height={40}
				data-testid={dataTestId}
			/>
		);
	}

	return (
		<span
			className={clsx(css.avatarFallback, className)}
			aria-hidden="true"
			data-testid={dataTestId ? `${dataTestId}-fallback` : undefined}
		>
			{fallback}
		</span>
	);
}
