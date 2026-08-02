import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";
import { Logo } from "@/components/logo";
import css from "./header.module.css";
import { LanguageSwitcher } from "./language-switcher";

export function Header({ className, ...props }: ComponentProps<"header">) {
	return (
		<header className={clsx(css.header, className)} {...props}>
			<Link href="/" className={css.link}>
				<Logo className={css.logo} />
			</Link>

			<LanguageSwitcher className={css.switcher} />
		</header>
	);
}
