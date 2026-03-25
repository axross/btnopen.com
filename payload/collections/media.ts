import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { getStaticDir, webpFormatOptions } from "../helpers/image";

export const mediaCollection: CollectionConfig = {
	slug: "media",
	upload: {
		staticDir: getStaticDir("media"),
		formatOptions: webpFormatOptions,
		resizeOptions: {
			fit: "cover",
			withoutEnlargement: true,
			width: 2560,
			height: 1600,
		},
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
		{
			name: "alt",
			type: "text",
			localized: true,
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
		defaultColumns: ["filename", "alt", "createdAt"],
	},
};
