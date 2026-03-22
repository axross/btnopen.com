import { clsx } from "clsx";
import type { ComponentProps, JSX } from "react";
import css from "./snippet.module.css";

export function Snippet({
	className,
	children,
}: ComponentProps<"pre">): JSX.Element {
	return (
		<div className={clsx(css.snippet, className)}>
			<pre className={css.viewer}>{children}</pre>

			{/* <CopyButton value={code} size="sm" className={css["copy-button"]} /> */}
		</div>
	);
}
