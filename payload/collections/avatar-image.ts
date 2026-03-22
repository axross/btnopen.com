import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { getStaticDir, webpFormatOptions } from "../helpers/image";

export const avatarImageCollection: CollectionConfig = {
	slug: "avatar-images",
	upload: {
		staticDir: getStaticDir("avatar-images"),
		mimeTypes: ["image/*"],
		formatOptions: webpFormatOptions,
		resizeOptions: {
			fit: "cover",
			withoutEnlargement: false,
			width: 256,
			height: 256,
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
