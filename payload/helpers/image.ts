import type { ImageUploadFormatOptions } from "payload";
import { vercelBlobToken } from "./runtime";

export function getStaticDir(collection: string) {
	if (vercelBlobToken) {
		return collection;
	}

	return `.data/${collection}`;
}

export const webpFormatOptions: ImageUploadFormatOptions = {
	format: "webp",
	options: {
		quality: 90,
		smartSubsample: true,
		smartDeblock: true,
		effort: 4,
	},
};
