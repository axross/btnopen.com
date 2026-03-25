// biome-ignore lint/correctness/noNodejsModules: payload config needs path module
import { dirname, resolve } from "node:path";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";
import { avatarImageCollection } from "./payload/collections/avatar-image";
import { blogPostCollection } from "./payload/collections/blog-post";
import { coverImageCollection } from "./payload/collections/cover-image";
import { mediaCollection } from "./payload/collections/media";
import { tagCollection } from "./payload/collections/tag";
import { userCollection } from "./payload/collections/user";
import { websiteGlobal } from "./payload/globals/website";
import { editor } from "./payload/helpers/editor";
import { logger } from "./payload/helpers/logger";

// biome-ignore-start lint/style/noProcessEnv: only place accessing env vars in payload realm
const payloadSecret = process.env.PAYLOAD_SECRET ?? "local";
const libsqlUrl = process.env.LIBSQL_PAYLOAD_TURSO_DATABASE_URL;
const libsqlToken = process.env.LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN;
const vercelBlobToken = process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN;
// biome-ignore-end lint/style/noProcessEnv: only place accessing env vars in payload realm

const selfDirname = dirname(new URL(import.meta.url).pathname);

export default buildConfig({
	secret: payloadSecret,
	globals: [websiteGlobal],
	collections: [
		userCollection,
		blogPostCollection,
		tagCollection,
		mediaCollection,
		coverImageCollection,
		avatarImageCollection,
	],
	db: sqliteAdapter({
		client:
			libsqlUrl && libsqlToken
				? { url: libsqlUrl, authToken: libsqlToken }
				: { url: "file:.data/payload.db" },
		migrationDir: resolve(selfDirname, "./payload/migrations"),
		push: false,
	}),
	graphQL: {
		disable: true,
	},
	localization: {
		locales: [
			{
				label: "English (US)",
				code: "en-US",
				fallbackLocale: "ja-JP",
			},
			{
				label: "日本語",
				code: "ja-JP",
			},
		],
		defaultLocale: "ja-JP",
	},
	editor,
	sharp,
	logger,
	admin: {
		livePreview: {
			breakpoints: [
				{
					name: "mobile",
					label: "Phone",
					width: 440,
					height: 956,
				},
				{
					name: "tablet",
					label: "Tablet",
					width: 1024,
					height: 1366,
				},
				{
					name: "desktop",
					label: "Desktop",
					width: 1920,
					height: 1080,
				},
			],
		},
	},
	typescript: {
		outputFile: resolve(selfDirname, "./payload/types.ts"),
	},
	plugins: [
		...(vercelBlobToken
			? [
					vercelBlobStorage({
						enabled: true,
						collections: {
							media: true,
							"avatar-images": true,
							"cover-images": true,
						},
						token: vercelBlobToken,
					}),
				]
			: []),
	],
});
