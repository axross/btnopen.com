import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { JSX, ReactNode } from "react";
import { AnalyticsConsentControl } from "./_components/analytics-consent-control";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

async function PrivacyPage(_props: PageProps): Promise<JSX.Element> {
	const t = await getTranslations("privacy");

	return (
		<div className={css.privacyPage} data-testid="page">
			<main className={css.main}>
				<h1 className={css.pageHeading}>{t("heading")}</h1>

				<p className={css.lede}>{t("lede")}</p>

				<Section heading={t("analytics-heading")}>
					<p>{t("analytics-body")}</p>
					<p>{t("analytics-params")}</p>
				</Section>

				<Section heading={t("diagnostics-heading")}>
					<p>{t("diagnostics-body")}</p>
					<p>{t("diagnostics-replay")}</p>
				</Section>

				<Section heading={t("comments-heading")}>
					<p>{t("comments-body")}</p>
				</Section>

				<Section heading={t("cookies-heading")}>
					<p>{t("cookies-body")}</p>
				</Section>

				<Section heading={t("control-heading")}>
					<p>{t("control-body")}</p>

					<AnalyticsConsentControl data-testid="analytics-consent-control" />
				</Section>
			</main>
		</div>
	);
}

function Section({
	heading,
	children,
}: {
	heading: string;
	children: ReactNode;
}): JSX.Element {
	return (
		<section className={css.section}>
			<h2 className={css.sectionHeading}>{heading}</h2>

			{children}
		</section>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("privacy");

	return {
		title: t("heading"),
		description: t("lede"),
		// a privacy notice is worth indexing — it is the answer to "what does this
		// site collect" for anyone who asks a search engine instead of the site.
		robots: { index: true, follow: true },
	};
}

export default PrivacyPage;
