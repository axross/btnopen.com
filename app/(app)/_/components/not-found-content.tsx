import { clsx } from "clsx";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ComponentProps, JSX } from "react";
import css from "./not-found-content.module.css";

export async function NotFoundContent({
	heading,
	description,
	className,
	...props
}: ComponentProps<"main"> & {
	heading: string;
	description: string;
}): Promise<JSX.Element> {
	const t = await getTranslations("not-found");

	return (
		<main
			className={clsx(css.notFoundContent, className)}
			data-testid="not-found"
			{...props}
		>
			<p
				className={css.statusCode}
				aria-hidden="true"
				data-testid="status-code"
			>
				{"404"}
			</p>

			<h1 className={css.heading}>{heading}</h1>

			<p className={css.description}>{description}</p>

			<Link href="/" className={css.homeLink} data-testid="link">
				{t("home-link")}
			</Link>
		</main>
	);
}
