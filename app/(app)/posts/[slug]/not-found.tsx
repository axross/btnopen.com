import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { JSX } from "react";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
	title: "Not Found | <btn open />",
};

export default async function BlogPostNotFound(): Promise<JSX.Element> {
	const t = await getTranslations("notFound");

	return (
		<NotFoundContent
			heading="post.found === false"
			description={t("postDescription")}
		/>
	);
}
