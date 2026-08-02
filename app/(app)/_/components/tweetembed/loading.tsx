import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import { LoadingPlaceholderText } from "@/components/loading-placeholder";
import css from "./loading.module.css";

export function TweetEmbedLoading({
	className,
	...props
}: ComponentProps<"div">): JSX.Element {
	return (
		<div className={clsx(css.tweet, className)} {...props}>
			<div className={css.body}>
				<LoadingPlaceholderText
					sampleText="Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt"
					maxLines={2}
				/>
			</div>

			<div className={css.cite}>
				{/* the sample tracks the loaded cite line, whose date is `date-fns`
				    `PPP` in the active locale, so the skeleton and the content it
				    replaces stay the same width */}
				<LoadingPlaceholderText
					sampleText="Lorem Ipsum @loremipsum · July 15th, 2026"
					maxLines={1}
				/>
			</div>
		</div>
	);
}
