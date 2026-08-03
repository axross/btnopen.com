import type { CollectionConfig } from "payload";
import { v7 as uuidV7 } from "uuid";
import { getStaticDir, webpFormatOptions } from "../helpers/image";
import { createUploadFilenameHook } from "../helpers/upload-filename";

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
		// public: avatar images are served as static assets, so the files themselves
		// are already reachable by URL. Writes stay authenticated-admin-only.
		read: () => true,
		create: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
		delete: ({ req }) => Boolean(req.user),
	},
	hooks: {
		beforeOperation: [createUploadFilenameHook("avatar image")],
	},
	admin: {
		useAsTitle: "filename",
		defaultColumns: ["filename", "createdAt"],
	},
};
