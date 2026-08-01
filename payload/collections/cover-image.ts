import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { getStaticDir, webpFormatOptions } from "../helpers/image";
import { createUploadFilenameHook } from "../helpers/upload-filename";

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
		imageSizes: [
			{
				name: "og",
				width: 1200,
				height: 630,
				fit: "cover",
				position: "center",
				withoutEnlargement: false,
				formatOptions: {
					format: "jpeg",
					options: {
						quality: 90,
						smartSubsample: true,
						smartDeblock: true,
						effort: 4,
					},
				},
				generateImageName: ({ originalName, sizeName, extension }) =>
					`${originalName}-${sizeName}.${extension}`,
			},
		],
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
		// public: cover images are served as static assets, so the files themselves
		// are already reachable by URL. Writes stay authenticated-admin-only.
		read: () => true,
		create: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
		delete: ({ req }) => Boolean(req.user),
	},
	hooks: {
		beforeOperation: [createUploadFilenameHook("cover image")],
	},
	admin: {
		useAsTitle: "filename",
		defaultColumns: ["filename", "createdAt"],
	},
};
