"use client";

import clsx from "clsx";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { useAnalyticsConsent } from "@/components/analytics-consent-provider";
import css from "./analytics-consent-banner.module.css";

/**
 * Asks for the analytics decision once, and never again — either answer is a
 * decision, so there is deliberately no dismiss-without-deciding control that
 * would leave a visitor permanently unasked.
 */
export function AnalyticsConsentBanner({
	className,
	...props
}: ComponentProps<"aside">): ReactNode {
	const { consent, decide } = useAnalyticsConsent();
	const t = useTranslations("analytics-consent");

	if (consent !== null) {
		return null;
	}

	return (
		<aside
			className={clsx(css.banner, className)}
			aria-label={t("banner-label")}
			{...props}
		>
			<p className={css.description}>{t("banner-description")}</p>

			<p className={css.note}>
				{t("banner-note")}{" "}
				<Link href="/privacy" className={css.link}>
					{t("banner-link")}
				</Link>
			</p>

			<div className={css.actions}>
				<button
					type="button"
					className={css.deny}
					onClick={() => decide("denied")}
					data-testid="analytics-consent-deny"
				>
					{t("deny")}
				</button>

				<button
					type="button"
					className={css.grant}
					onClick={() => decide("granted")}
					data-testid="analytics-consent-grant"
				>
					{t("grant")}
				</button>
			</div>
		</aside>
	);
}
