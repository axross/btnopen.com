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

// built per call rather than at module scope so the Lexical→markdown
// conversion runs inside the transform: `convertLexicalToMarkdown` needs a
// resolved editor config, which only an async caller can supply. the object
// `safeParse` returns is therefore already complete, and nothing mutates it
// afterwards.
function createWebsiteSchema(
	editorConfig: Parameters<typeof convertLexicalToMarkdown>[0]["editorConfig"],
) {
	return PayloadWebsite.transform((website) => ({
		name: website.name,
		description: website.description,
		keywords: website.keywords?.map((entry) => entry.keyword) ?? [],
		creator: {
			name: website.creator.name,
			avatarImage: website.creator.avatarImage,
			// the raw Lexical `bio` is editor state, not view data, so it is
			// converted here and left off the exported type — no consumer reads it.
			bioMarkdown: website.creator.bio
				? convertLexicalToMarkdown({
						data: website.creator.bio,
						editorConfig,
					})
				: "",
		},
	}));
}

export type Website = z.infer<ReturnType<typeof createWebsiteSchema>>;

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
	const [doc, editorConfig] = await Promise.all([
		payload.findGlobal({
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
			// level 1 resolves the `creator` relationship, level 2 the avatar upload
			// inside it (at level 1 `avatarImage` is a bare id, which the schema
			// rejects). level 3 is one level of margin for uploads embedded in the
			// localized `bio` rich text, which this repository's fixture content
			// cannot exercise.
			depth: 3,
			locale,
		}),
		editorConfigFactory.fromEditor({ config: await config, editor }),
	]);

	const websiteParseResult = createWebsiteSchema(editorConfig).safeParse(doc);

	if (websiteParseResult.success) {
		logger.info("Successfully fetched the website record.");

		return websiteParseResult.data;
	}

	logger.info(
		"Failed to fetch the website record. You need to set up the website in the admin dashboard.",
	);

	return null;
}
