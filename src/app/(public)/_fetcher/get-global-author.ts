import config from "@payload-config";
import { getPayload } from "payload";
import { rootLogger } from "@/logger";

const logger = rootLogger.child({}, { msgPrefix: "📥 " });

interface GlobalAuthor {
	name: string;
	avatarImage: {
		url: string;
		width: number;
		height: number;
	};
	bioMarkdown: string;
}

export async function getGlobalAuthor(): Promise<GlobalAuthor> {
	"use cache";

	logger.debug("Started fetching global author.");

	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: "users",
		limit: 1,
		depth: 2,
		select: {
			name: true,
			avatarImage: true,
			bioMarkdown: true,
		},
	});
	const firstDoc = result.docs[0];

	if (
		firstDoc.name &&
		firstDoc.avatarImage &&
		typeof firstDoc.avatarImage !== "number" &&
		firstDoc.avatarImage.sizes?.["256w"]?.url &&
		firstDoc.avatarImage.sizes?.["256w"]?.width &&
		firstDoc.avatarImage.sizes?.["256w"]?.height &&
		firstDoc.bioMarkdown
	) {
		logger.debug("Finished fetching global author.");

		return {
			name: firstDoc.name,
			avatarImage: {
				url: firstDoc.avatarImage.sizes["256w"].url,
				width: firstDoc.avatarImage.sizes["256w"].width,
				height: firstDoc.avatarImage.sizes["256w"].height,
			},
			bioMarkdown: firstDoc.bioMarkdown,
		};
	}

	throw new Error(
		"Failed to resolve global author because some fields are missing.",
	);
}
