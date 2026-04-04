import clsx from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./loading-placeholder.module.css";

export function LoadingPlaceholderRect({
	className,
	...props
}: ComponentProps<"span">): JSX.Element {
	return (
		<span className={clsx(css.loadingPlaceholderRect, className)} {...props} />
	);
}

export function LoadingPlaceholderText({
	sampleText,
	maxLines,
	className,
	...props
}: ComponentProps<"span"> & {
	sampleText: string;
	maxLines?: number;
}): JSX.Element {
	return (
		<span
			className={clsx(css.loadingPlaceholderText, className)}
			data-max-lines={maxLines}
			{...props}
		>
			{sampleText.split(" ").map((word, index) => (
				<span
					className={css.span}
					data-length={word.length}
					// biome-ignore lint/suspicious/noArrayIndexKey: the text spans won't reorder andindex is only the thing that makes the key unique
					key={`${word}@${index}`}
				/>
			))}
		</span>
	);
}
