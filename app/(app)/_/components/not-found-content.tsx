import { clsx } from "clsx";
import Link from "next/link";
import type { ComponentProps, JSX } from "react";
import css from "./not-found-content.module.css";

export function NotFoundContent({
	heading,
	description,
	className,
	...props
}: ComponentProps<"main"> & {
	heading: string;
	description: string;
}): JSX.Element {
	return (
		<main
			className={clsx(css.notFoundContent, className)}
			data-testid="not-found"
			{...props}
		>
			<p className={css.statusCode} aria-hidden="true">
				{"404"}
			</p>

			<h1 className={css.heading}>{heading}</h1>

			<p className={css.description}>{description}</p>

			<Link href="/" className={css.homeLink} data-testid="link">
				{"Go back home"}
			</Link>
		</main>
	);
}
