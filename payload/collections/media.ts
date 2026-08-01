import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { getStaticDir, webpFormatOptions } from "../helpers/image";
import { createUploadFilenameHook } from "../helpers/upload-filename";

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
		// public: uploads are served as static assets, so the files themselves are
		// already reachable by URL. Writes stay authenticated-admin-only.
		read: () => true,
		create: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
		delete: ({ req }) => Boolean(req.user),
	},
	hooks: {
		beforeOperation: [createUploadFilenameHook("media")],
	},
	admin: {
		useAsTitle: "filename",
		defaultColumns: ["filename", "alt", "createdAt"],
	},
};
