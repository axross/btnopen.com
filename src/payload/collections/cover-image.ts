import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { createWebpImageSize, getStaticDir } from "../helpers/image";

export const coverImageCollection: CollectionConfig = {
	slug: "cover-images",
	upload: {
		staticDir: getStaticDir("cover-images"),
		mimeTypes: ["image/*"],
		imageSizes: [createWebpImageSize({ name: "og", width: 1200, height: 630 })],
	},
	fields: [],
	hooks: {
		beforeOperation: [
			({ req, operation }) => {
				if ((operation === "create" || operation === "update") && req.file) {
					const parts = req.file.name.split(".");
					const extention = parts.at(-1);

					req.file.name = `${uuidV7()}.${extention}`;
				}
			},
		],
	},
};
