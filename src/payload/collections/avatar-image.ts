import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { createWebpImageSize, getStaticDir } from "../helpers/image";

export const avatarImageCollection: CollectionConfig = {
	slug: "avatar-images",
	upload: {
		staticDir: getStaticDir("avatar-images"),
		mimeTypes: ["image/*"],
		imageSizes: [createWebpImageSize({ width: 256 })],
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
