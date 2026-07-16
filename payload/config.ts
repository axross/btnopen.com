// biome-ignore lint/correctness/noNodejsModules: payload config needs path module
import { dirname, resolve } from "node:path";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";
import { avatarImageCollection } from "./collections/avatar-image";
import { blogPostCollection } from "./collections/blog-post";
import { coverImageCollection } from "./collections/cover-image";
import { mediaCollection } from "./collections/media";
import { tagCollection } from "./collections/tag";
import { userCollection } from "./collections/user";
import { websiteGlobal } from "./globals/website";
import { editor } from "./helpers/editor";
import { logger } from "./helpers/logger";
import { payloadMcpPlugin } from "./helpers/mcp";
import { seed } from "./helpers/seed";

// biome-ignore-start lint/style/noProcessEnv: only place accessing env vars in payload realm
const payloadSecret = process.env.PAYLOAD_SECRET ?? "local";
const libsqlUrl = process.env.LIBSQL_PAYLOAD_TURSO_DATABASE_URL;
const libsqlToken = process.env.LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN;
const vercelBlobToken = process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN;
const blobPrefix = process.env.BLOB_PAYLOAD_PREFIX ?? "";
const testUserEmail = process.env.PAYLOAD_TEST_USER_EMAIL;
const testUserPassword = process.env.PAYLOAD_TEST_USER_PASSWORD;
// biome-ignore-end lint/style/noProcessEnv: only place accessing env vars in payload realm

const selfDirname = dirname(new URL(import.meta.url).pathname);

export const config = buildConfig({
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
		migrationDir: resolve(selfDirname, "./migrations"),
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
		outputFile: resolve(selfDirname, "./types.ts"),
	},
	plugins: [
		payloadMcpPlugin,
		// Blob storage is active only when a token is present (production and
		// preview); locally, uploads fall back to disk. The plugin is loaded
		// unconditionally with `alwaysInsertFields` so the `prefix` field stays in
		// the schema in every environment, keeping generated migrations
		// deterministic regardless of whether a token is set. `blobPrefix`
		// (`BLOB_PAYLOAD_PREFIX`, empty in production) namespaces every stored file
		// under that path so a preview can isolate its media and delete the whole
		// prefix on teardown.
		vercelBlobStorage({
			enabled: Boolean(vercelBlobToken),
			alwaysInsertFields: true,
			collections: {
				media: { prefix: blobPrefix },
				"avatar-images": { prefix: blobPrefix },
				"cover-images": { prefix: blobPrefix },
			},
			token: vercelBlobToken ?? "",
		}),
	],
	onInit: async (payload) => {
		if (testUserEmail && testUserPassword) {
			await seed({
				payload,
				config,
				testUserEmail,
				testUserPassword,
			});
		}
	},
});
