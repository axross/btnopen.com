"use server";

import {
	convertLexicalToMarkdown,
	editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import { cacheLife } from "next/cache";
import { getPayload } from "payload";
import type z from "zod";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";
import { editor } from "@/payload/editor";
import { PayloadWebsite } from "./payload-types";

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

export async function getWebsite({
	draft = false,
}: {
	draft?: boolean;
} = {}): Promise<Website | null> {
	"use cache";

	cacheLife("hours");

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
		locale: "ja-JP",
		draft,
	});

	const websiteParseResult = Website.safeParse(doc);

	if (websiteParseResult.success) {
		const website = websiteParseResult.data;

		website.creator.bioMarkdown = convertLexicalToMarkdown({
			data: website.creator.bio,
			editorConfig: await editorConfigFactory.fromEditor({
				config: await config,
				editor,
			}),
		});

		logger.info("Successfully fetched the website record.");

		return website;
	}

	logger.info(
		"Failed to fetch the website record. You need to set up the website in the admin dashboard.",
	);

	return null;
}
