"use client";

import { Switch } from "@base-ui/react/switch";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { useAnalyticsConsent } from "@/components/analytics-consent-provider";
import css from "./analytics-consent-control.module.css";

/**
 * The permanent home of the analytics decision. The banner asks once and then
 * disappears, so this is the only place a visitor can change their mind — and
 * the only place that shows what the current answer is.
 */
export function AnalyticsConsentControl({
	className,
	...props
}: ComponentProps<"div">): ReactNode {
	const { consent, decide } = useAnalyticsConsent();
	const t = useTranslations("privacy");

	return (
		<div className={clsx(css.control, className)} {...props}>
			{/* the whole row is the switch, rather than a label beside one: it names
			    itself through its own text content, and it makes the target the row
			    height instead of the track's. */}
			<Switch.Root
				checked={consent === "granted"}
				onCheckedChange={(checked) => decide(checked ? "granted" : "denied")}
				className={css.field}
				data-testid="analytics-consent-switch"
			>
				<span className={css.label}>{t("control-label")}</span>

				<span className={css.track} aria-hidden="true">
					<Switch.Thumb className={css.thumb} />
				</span>
			</Switch.Root>

			{/* three states, not two: an undecided visitor collects nothing, which
			    is what the switch shows, but saying they declined would put words
			    in their mouth. */}
			<p className={css.state} data-testid="analytics-consent-state">
				{consent === null ? t("control-undecided") : null}
				{consent === "granted" ? t("control-granted") : null}
				{consent === "denied" ? t("control-denied") : null}
			</p>
		</div>
	);
}
