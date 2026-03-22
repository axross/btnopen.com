import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import {
	createWebpImageSize,
	getStaticDir,
	webpFormatOptions,
} from "../helpers/image";

export const coverImageCollection: CollectionConfig = {
	slug: "cover-images",
	upload: {
		staticDir: getStaticDir("cover-images"),
		mimeTypes: ["image/*"],
		formatOptions: webpFormatOptions,
		resizeOptions: {
			fit: "cover",
			withoutEnlargement: true,
			width: 2560,
			height: 1344,
		},
		imageSizes: [createWebpImageSize({ name: "og", width: 1200, height: 630 })],
	},
	fields: [
		{
			name: "id",
			type: "text",
			defaultValue: () => uuidV7(),
			admin: {
				hidden: true,
			},
		},
	],
	access: {
		read: () => true,
	},
	hooks: {
		beforeOperation: [
			({ req, operation, args }) => {
				if ((operation === "create" || operation === "update") && req.file) {
					const id = args.data.id;

					if (!id) {
						throw new Error("No id is set for the media.");
					}

					const parts = req.file.name.split(".");
					const extention = parts.at(-1);

					req.file.name = `${id}.${extention}`;
				}
			},
		],
	},
	admin: {
		useAsTitle: "filename",
		defaultColumns: ["filename", "createdAt"],
	},
};
