"use client";

import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ComponentProps, type JSX, useTransition } from "react";
import { setLocale } from "@/i18n/set-locale";
import type { PayloadLocale } from "@/repositories/payload-types";
import css from "./language-switcher.module.css";

// endonyms: each locale is labelled in its own language so the option is
// recognizable regardless of the currently active locale.
const options = [
	{ locale: "ja-JP", label: "日本語" },
	{ locale: "en-US", label: "English" },
] as const satisfies readonly { locale: PayloadLocale; label: string }[];

export function LanguageSwitcher({
	className,
	...props
}: ComponentProps<"nav">): JSX.Element {
	const activeLocale = useLocale();
	const t = useTranslations("languageSwitcher");
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	/** Persists the selected locale via a cookie and refreshes the route to re-render in it. */
	function handleSelect(locale: PayloadLocale): void {
		if (locale === activeLocale) {
			return;
		}

		startTransition(async () => {
			await setLocale(locale);
			router.refresh();
		});
	}

	return (
		<nav
			className={clsx(css.languageSwitcher, className)}
			aria-label={t("label")}
			data-testid="language-switcher"
			{...props}
		>
			{options.map(({ locale, label }) => {
				const isActive = locale === activeLocale;

				return (
					<button
						key={locale}
						type="button"
						lang={locale}
						onClick={() => handleSelect(locale)}
						disabled={isPending || isActive}
						aria-current={isActive ? "true" : undefined}
						className={clsx(css.option, isActive && css.optionActive)}
						data-testid="language-option"
						data-locale={locale}
					>
						{label}
					</button>
				);
			})}
		</nav>
	);
}
