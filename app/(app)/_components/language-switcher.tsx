"use client";

import { Menu } from "@base-ui/react/menu";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type JSX, useTransition } from "react";
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
}: {
	className?: string;
}): JSX.Element {
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
		<Menu.Root>
			<Menu.Trigger
				className={clsx(css.trigger, className)}
				aria-label={t("label")}
				disabled={isPending}
				data-testid="language-switcher"
			>
				<GlobeIcon className={css.triggerIcon} />
			</Menu.Trigger>

			<Menu.Portal>
				<Menu.Positioner sideOffset={8} align="end">
					<Menu.Popup className={css.popup} data-testid="language-menu">
						<Menu.RadioGroup
							value={activeLocale}
							onValueChange={(value) => handleSelect(value as PayloadLocale)}
						>
							{options.map(({ locale, label }) => (
								<Menu.RadioItem
									key={locale}
									value={locale}
									lang={locale}
									className={css.item}
									data-testid="language-option"
									data-locale={locale}
								>
									<span className={css.itemIndicator} aria-hidden="true">
										<Menu.RadioItemIndicator>
											<CheckIcon className={css.checkIcon} />
										</Menu.RadioItemIndicator>
									</span>

									{label}
								</Menu.RadioItem>
							))}
						</Menu.RadioGroup>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}

function GlobeIcon({ className }: { className?: string }): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={className}
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M2 12h20" />
			<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
		</svg>
	);
}

function CheckIcon({ className }: { className?: string }): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={className}
		>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}
