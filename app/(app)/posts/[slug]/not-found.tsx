import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { NotFoundContent } from "@/components/not-found-content";

// the root layout's `%s | <site name>` template appends the wordmark from the
// CMS, so this is the bare state and not the whole title — spelling the suffix
// out here rendered it twice.
export const metadata: Metadata = {
	title: "Not Found",
};

export default async function BlogPostNotFound(): Promise<JSX.Element> {
	const t = await getTranslations("not-found");

	return (
		<NotFoundContent
			heading="post.found === false"
			description={t("post-description")}
		/>
	);
}
