import { ScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps, JSX } from "react";

export function Table({
	className,
	tableClassName,
	scrollAreaClassName,
	scrollbarClassName,
	scrollbarThumbClassName,
	children,
	...props
}: ComponentProps<"div"> & {
	tableClassName?: string;
	scrollAreaClassName?: string;
	scrollbarClassName?: string;
	scrollbarThumbClassName?: string;
}): JSX.Element {
	// `className` and `...props` address the wrapper this component actually
	// roots, so a caller-supplied `data-testid` labels the same element the
	// hard-coded one does; the inner <table>'s own class arrives separately on
	// `tableClassName`.
	return (
		<div className={className} data-testid="table" {...props}>
			<ScrollArea.Root>
				{/* the viewport MUST be keyboard-focusable so users can scroll an
				    overflowing table with arrow keys (see GFM table a11y spec §7);
				    Base UI manages `tabindex` on it — `0` while the table overflows,
				    `-1` while it fits and there is nothing to scroll */}
				<ScrollArea.Viewport
					className={scrollAreaClassName}
					data-testid="table-scroll-area"
				>
					<table className={tableClassName}>{children}</table>
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
