"use client";

import clsx from "clsx";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	type ComponentProps,
	type ReactNode,
	useEffect,
	useState,
} from "react";
import { useAnalyticsConsent } from "@/components/analytics-consent-provider";
import css from "./analytics-consent-banner.module.css";

/** The gap left between the banner and whatever it is floating over. */
const bannerClearancePixels = 32;

/**
 * Asks for the analytics decision once, and never again — either answer is a
 * decision, so there is deliberately no dismiss-without-deciding control that
 * would leave a visitor permanently unasked.
 */
export function AnalyticsConsentBanner(
	props: ComponentProps<"aside">,
): ReactNode {
	const { consent } = useAnalyticsConsent();

	// split so the hooks below run only while the banner is actually mounted,
	// rather than being guarded by an early return they would have to sit above.
	return consent === null ? <PendingAnalyticsConsentBanner {...props} /> : null;
}

function PendingAnalyticsConsentBanner({
	className,
	...props
}: ComponentProps<"aside">): ReactNode {
	const { decide } = useAnalyticsConsent();
	const t = useTranslations("analytics-consent");
	const [banner, setBanner] = useState<HTMLElement | null>(null);

	// the banner floats over the end of the document, where the footer's privacy
	// link lives, so it publishes its own height for the footer to reserve. it is
	// measured rather than assumed because the copy wraps to a different number
	// of lines per locale and per width.
	useEffect(() => {
		if (!banner) {
			return;
		}

		const root = document.documentElement;
		const observer = new ResizeObserver(([entry]) => {
			root.style.setProperty(
				"--analytics-consent-banner-clearance",
				`${entry.contentRect.height + bannerClearancePixels}px`,
			);
		});

		observer.observe(banner);

		return () => {
			observer.disconnect();
			root.style.removeProperty("--analytics-consent-banner-clearance");
		};
	}, [banner]);

	return (
		<aside
			ref={setBanner}
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
