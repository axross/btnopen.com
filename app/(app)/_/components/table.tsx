import type { ComponentProps, JSX } from "react";

export function Table({
	className,
	wrapperClassName,
	scrollAreaClassName,
	children,
	...props
}: ComponentProps<"table"> & {
	wrapperClassName?: string;
	scrollAreaClassName?: string;
}): JSX.Element {
	return (
		<div className={wrapperClassName} data-testid="table">
			<div
				className={scrollAreaClassName}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: the scroll area MUST be keyboard-focusable so users can scroll an overflowing table with arrow keys (see GFM table a11y spec §7)
				tabIndex={0}
				data-testid="table-scroll-area"
			>
				<table className={className} {...props}>
					{children}
				</table>
			</div>
		</div>
	);
}

export function TableHeaderCell({
	children,
	...props
}: ComponentProps<"th">): JSX.Element {
	return (
		<th scope="col" {...props}>
			{children}
		</th>
	);
}
