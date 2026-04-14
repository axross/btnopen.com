import type { Metadata } from "next";
import type { JSX } from "react";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
	title: "Not Found | <btn open />",
};

export default function BlogPostNotFound(): JSX.Element {
	return (
		<NotFoundContent
			heading="post.found === false"
			description="お探しの投稿は見つかりませんでした"
		/>
	);
}
