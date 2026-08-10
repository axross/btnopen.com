import clsx from "clsx";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ComponentProps, ReactNode } from "react";
import css from "./footer.module.css";

/**
 * The end of every page, and the permanent home of the privacy link — the
 * consent banner disappears after one decision, so the link has to live
 * somewhere that does not.
 */
export async function Footer({
	className,
	...props
}: ComponentProps<"footer">): Promise<ReactNode> {
	const t = await getTranslations("footer");

	return (
		<footer className={clsx(css.footer, className)} {...props}>
			<div className={css.row}>
				<small className={css.copyright}>{t("copyright")}</small>

				<Link href="/privacy" className={css.link}>
					{t("privacy")}
				</Link>
			</div>
		</footer>
	);
}
