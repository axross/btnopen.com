import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import {
	LoadingPlaceholderRect,
	LoadingPlaceholderText,
} from "@/components/loading-placeholder";
import css from "./comments-loading.module.css";

/**
 * The skeleton for the post page's comments region: the section heading and
 * two comment rows, each an avatar beside a meta line and a body line. Two
 * rows because most posts have comments, so this is the shape the region
 * usually settles into.
 *
 * `<Comments>` fetches its own threads but is mounted conditionally by the
 * page, so this stands in at the page's boundary rather than as the `loading`
 * half of a triad.
 *
 * The caller supplies `aria-label`, so the region announces itself under the
 * same name the loaded section does. Resolving it here instead would make this
 * an async component, and a `<Suspense>` fallback that suspends hands the wait
 * to the nearest ancestor boundary rather than rendering.
 */
export function CommentsLoading({
	className,
	...props
}: Omit<ComponentProps<"section">, "children">): JSX.Element {
	return (
		<section className={clsx(css.commentsLoading, className)} {...props}>
			<div className={css.head}>
				<LoadingPlaceholderText sampleText="Lorem ipsum" maxLines={1} />
			</div>

			<ol className={css.list} data-testid="list-loading">
				<CommentsLoadingItem />

				<CommentsLoadingItem
					nameSample="Consectetur adipiscing"
					bodySample="Faucibus ex sapien vitae pellentesque sem placerat in id cursus."
				/>
			</ol>
		</section>
	);
}

function CommentsLoadingItem({
	nameSample,
	bodySample,
	className,
	...props
}: ComponentProps<"li"> & {
	nameSample?: string;
	bodySample?: string;
}): JSX.Element {
	return (
		<li
			className={clsx(css.comment, className)}
			data-testid="comment-loading"
			{...props}
		>
			<LoadingPlaceholderRect
				className={css.avatar}
				data-testid="avatar-loading"
			/>

			<div className={css.body}>
				<div className={css.meta}>
					<LoadingPlaceholderText
						sampleText={nameSample || "Lorem ipsum dolor"}
						maxLines={1}
					/>
				</div>

				<div className={css.text}>
					<LoadingPlaceholderText
						sampleText={
							bodySample ||
							"Quisque faucibus ex sapien vitae pellentesque sem placerat in id cursus mi pretium."
						}
						maxLines={2}
					/>
				</div>
			</div>
		</li>
	);
}
