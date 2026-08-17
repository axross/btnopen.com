import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { JSX, ReactNode } from "react";
import { AnalyticsConsentControl } from "./_components/analytics-consent-control";
import css from "./page.module.css";
import type { PageProps } from "./page-props";

const repositoryUrl = "https://github.com/axross/btnopen.com";
const mixpanelUrl = "https://mixpanel.com";
const sentryUrl = "https://sentry.io";
const clerkUrl = "https://clerk.com";

async function PrivacyPage(_props: PageProps): Promise<JSX.Element> {
	const t = await getTranslations("privacy");

	return (
		<div className={css.privacyPage} data-testid="page">
			<main className={css.main}>
				<h1 className={css.pageHeading}>{t("heading")}</h1>

				{/* the two paragraphs are one lede, so they sit at a section's internal
				    spacing rather than at the gap `.main` puts between sections. */}
				<div className={css.lede}>
					<p>{t.rich("lede", { source: externalLink(repositoryUrl) })}</p>

					<p>{t("lede-bases")}</p>
				</div>

				<Section heading={t("analytics-heading")}>
					<ul className={css.list}>
						<li>{t("analytics-item-page")}</li>
						<li>{t("analytics-item-links")}</li>
						<li>{t("analytics-item-params")}</li>
					</ul>

					<p>
						{t.rich("analytics-body", { mixpanel: externalLink(mixpanelUrl) })}
					</p>
					<p>{t("analytics-gate")}</p>
				</Section>

				<Section heading={t("diagnostics-heading")}>
					<p>
						{t.rich("diagnostics-body", { sentry: externalLink(sentryUrl) })}
					</p>

					<ul className={css.list}>
						<li>{t("diagnostics-item-identity")}</li>
						<li>{t("diagnostics-item-headers")}</li>
						<li>{t("diagnostics-item-params")}</li>
						<li>{t("diagnostics-item-variables")}</li>
					</ul>

					<p>{t("diagnostics-excluded")}</p>
					<p>{t("diagnostics-replay")}</p>
				</Section>

				<Section heading={t("comments-heading")}>
					<p>{t.rich("comments-body", { clerk: externalLink(clerkUrl) })}</p>
				</Section>

				<Section heading={t("cookies-heading")}>
					<p>{t("cookies-body")}</p>
				</Section>

				<Section heading={t("control-heading")}>
					<p>{t("control-body")}</p>

					<AnalyticsConsentControl
						className={css.consentControl}
						data-testid="analytics-consent-control"
					/>
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

// one renderer for every anchor the copy names, so the external-link attributes
// live at a single place rather than once per rich-text tag: a new tab, with no
// access back to the opener and no referrer.
function externalLink(href: string): (chunks: ReactNode) => JSX.Element {
	return (chunks) => (
		<a
			className={css.link}
			href={href}
			target="_blank"
			rel="noopener noreferrer"
		>
			{chunks}
		</a>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("privacy");

	return {
		title: t("heading"),
		// not the lede: it carries rich-text tags, and a meta description takes a
		// plain string. the bases line states the same thing without them.
		description: t("lede-bases"),
		// a privacy notice is worth indexing — it is the answer to "what does this
		// site collect" for anyone who asks a search engine instead of the site.
		robots: { index: true, follow: true },
	};
}

export default PrivacyPage;
