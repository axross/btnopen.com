import "server-only";

import {
	convertLexicalToMarkdown,
	editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import type z from "zod";
import { config } from "@/payload/config";
import { editor } from "@/payload/editor";
import { rootLogger } from "@/shared/logger";
import { type PayloadLocale, PayloadWebsite } from "@/shared/payload-types";

const logger = rootLogger.child({ module: "📥" });

const Website = PayloadWebsite.transform((website) => ({
	name: website.name,
	description: website.description,
	keywords: website.keywords?.map((entry) => entry.keyword) ?? [],
	creator: {
		...website.creator,
		bioMarkdown: "",
	},
}));

export type Website = z.infer<typeof Website>;

// the `website` global declares no `versions`, so Payload never looks for a
// draft version of it (`findOne` consults one only when drafts are enabled for
// the global). it therefore takes no `draft` parameter — passing one would
// suggest a draft view that does not exist.
export async function getWebsite({
	locale,
}: {
	locale: PayloadLocale;
}): Promise<Website | null> {
	"use cache";

	cacheLife("hours");
	// locale-independent tag so a single revalidateTag busts every locale's
	// cached website entry.
	cacheTag("website");

	logger.info("Started fetching website record.");

	const payload = await getPayload({ config });
	const doc = await payload.findGlobal({
		slug: "website",
		select: {
			name: true,
			description: true,
			keywords: true,
			creator: {
				name: true,
				avatarImage: true,
				bio: true,
			},
		},
		depth: 4,
		locale,
	});

	const websiteParseResult = Website.safeParse(doc);

	if (websiteParseResult.success) {
		const website = websiteParseResult.data;

		if (website.creator.bio) {
			website.creator.bioMarkdown = convertLexicalToMarkdown({
				data: website.creator.bio,
				editorConfig: await editorConfigFactory.fromEditor({
					config: await config,
					editor,
				}),
			});
		}

		logger.info("Successfully fetched the website record.");

		return website;
	}

	logger.info(
		"Failed to fetch the website record. You need to set up the website in the admin dashboard.",
	);

	return null;
}
