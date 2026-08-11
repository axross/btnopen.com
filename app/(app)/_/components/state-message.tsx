import { clsx } from "clsx";
import type { ComponentProps, JSX, ReactNode } from "react";
import css from "./state-message.module.css";

/**
 * The shared surface for a data-backed region with nothing to render — an empty
 * collection, or a render that failed. Both states go through this one
 * component so they cannot drift apart in spacing, tone, or hierarchy; the
 * caller supplies the line, and the action element when one is warranted.
 *
 * The composition follows `not-found-content.tsx`, but the surface is
 * deliberately quieter than it: one muted line, no heading, no decorative
 * glyph, and a text-link action rather than a button-shaped one. That is
 * lighter than the project's own visual-identity SHOULD that empty-state
 * headings take the code-syntax voice — @axross chose it over that and over the
 * heavier options while approving #179, so the missing heading is the decision
 * and not an omission. Do not add one back.
 */
export function StateMessage({
	message,
	action,
	className,
	...props
}: Omit<ComponentProps<"div">, "children"> & {
	message: string;
	action?: ReactNode;
}): JSX.Element {
	return (
		<div
			className={clsx(css.stateMessage, className)}
			data-testid="state-message"
			{...props}
		>
			<p className={css.message}>{message}</p>

			{action}
		</div>
	);
}

/**
 * The optional action beside a `<StateMessage>`'s line, styled as a text link
 * because the surface is a quiet aside and a filled control would outweigh the
 * line it belongs to. It stays a real `<button>` all the same: the only action
 * here re-runs a render rather than navigating anywhere.
 */
export function StateMessageAction({
	className,
	...props
}: ComponentProps<"button">): JSX.Element {
	return (
		<button
			type="button"
			className={clsx(css.stateMessageAction, className)}
			data-testid="action"
			{...props}
		/>
	);
}
