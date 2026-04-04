"use client";

import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import {
	LoadingPlaceholderRect,
	LoadingPlaceholderText,
} from "@/components/loading-placeholder";
import css from "./loading.module.css";

export function WebEmbedLoading({
	className,
	...props
}: Omit<ComponentProps<"a">, "children">): JSX.Element {
	return (
		<a className={clsx(css.webembedLoading, className)} {...props}>
			<LoadingPlaceholderRect className={css.image} />

			<div className={css.title}>
				<LoadingPlaceholderText
					sampleText="Lorem Ipsum - Labore Sit Eiusmod | Tempor Qui"
					maxLines={1}
				/>
			</div>

			<div className={css.description}>
				<LoadingPlaceholderText
					sampleText="Lorem ipsum dolor sit amet consectetur adipisicing elit"
					maxLines={2}
				/>
			</div>

			<div className={css.url}>
				<LoadingPlaceholderText
					sampleText="https://www.example.com"
					maxLines={1}
				/>
			</div>
		</a>
	);
}
