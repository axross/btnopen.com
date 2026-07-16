"use client";

import { clsx } from "clsx";
import type { JSX } from "react";
import { LoadingPlaceholderText } from "@/components/loading-placeholder";
import css from "./loading.module.css";

export function TweetEmbedLoading({
	className,
	"data-testid": dataTestId,
}: {
	className?: string;
	"data-testid"?: string;
}): JSX.Element {
	return (
		<div className={clsx(css.tweet, className)} data-testid={dataTestId}>
			<div className={css.body}>
				<LoadingPlaceholderText
					sampleText="Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt"
					maxLines={2}
				/>
			</div>

			<div className={css.cite}>
				<LoadingPlaceholderText
					sampleText="Lorem Ipsum @loremipsum · Jul 15, 2026"
					maxLines={1}
				/>
			</div>
		</div>
	);
}
