import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./snippet.module.css";

export function Snippet({
	className,
	children,
	...props
}: ComponentProps<"div">): JSX.Element {
	return (
		<div className={clsx(css.snippet, className)} {...props}>
			<pre className={css.viewer}>{children}</pre>
		</div>
	);
}
