import { ScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps, JSX } from "react";

export function Table({
	className,
	wrapperClassName,
	scrollAreaClassName,
	scrollbarClassName,
	scrollbarThumbClassName,
	children,
	...props
}: ComponentProps<"table"> & {
	wrapperClassName?: string;
	scrollAreaClassName?: string;
	scrollbarClassName?: string;
	scrollbarThumbClassName?: string;
}): JSX.Element {
	return (
		<div className={wrapperClassName} data-testid="table">
			<ScrollArea.Root>
				{/* the viewport MUST be keyboard-focusable so users can scroll an
				    overflowing table with arrow keys (see GFM table a11y spec §7);
				    Base UI manages `tabindex` on it — `0` while the table overflows,
				    `-1` while it fits and there is nothing to scroll */}
				<ScrollArea.Viewport
					className={scrollAreaClassName}
					data-testid="table-scroll-area"
				>
					<table className={className} {...props}>
						{children}
					</table>
				</ScrollArea.Viewport>

				{/* unmounts while the table has no horizontal overflow */}
				<ScrollArea.Scrollbar
					orientation="horizontal"
					className={scrollbarClassName}
					data-testid="table-scrollbar"
				>
					<ScrollArea.Thumb className={scrollbarThumbClassName} />
				</ScrollArea.Scrollbar>
			</ScrollArea.Root>
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
