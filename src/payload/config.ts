import { dirname, resolve } from "node:path";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { sentryPlugin } from "@payloadcms/plugin-sentry";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
// biome-ignore lint/performance/noNamespaceImport: payload sentry plugin needs the whole namespace
import * as Sentry from "@sentry/nextjs";
import { buildConfig } from "payload";
import sharp from "sharp";
import { rootLogger } from "@/logger";
import { avatarImageCollection } from "./collections/avatar-image";
import { blogPostCollection } from "./collections/blog-post";
import { coverImageCollection } from "./collections/cover-image";
import { mediaCollection } from "./collections/media";
import { tagCollection } from "./collections/tag";
import { userCollection } from "./collections/user";

// biome-ignore-start lint/style/noProcessEnv: only place accessing env vars in payload realm
const payloadSecret = process.env.PAYLOAD_SECRET ?? "";
const libsqlUrl = process.env.LIBSQL_PAYLOAD_TURSO_DATABASE_URL;
const libsqlToken = process.env.LIBSQL_PAYLOAD_TURSO_AUTH_TOKEN;
const vercelBlobToken = process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN;
// biome-ignore-end lint/style/noProcessEnv: only place accessing env vars in payload realm

const selfDirname = dirname(new URL(import.meta.url).pathname);

// biome-ignore lint/style/noDefaultExport: payload config must be default export
export default buildConfig({
	secret: payloadSecret,
	collections: [
		userCollection,
		blogPostCollection,
		tagCollection,
		mediaCollection,
		coverImageCollection,
		avatarImageCollection,
	],
	logger: rootLogger.child({}, { msgPrefix: "⛩️  " }),
	db: sqliteAdapter({
		client:
			libsqlUrl && libsqlToken
				? { url: libsqlUrl, authToken: libsqlToken }
				: { url: "file:.data/payload.db" },
	}),
	typescript: {
		outputFile: resolve(selfDirname, "./types.ts"),
	},
	localization: {
		locales: [
			{
				label: "English (US)",
				code: "en-US",
				fallbackLocale: "ja-JP",
			},
			{
				label: "Japanese",
				code: "ja-JP",
			},
		],
		defaultLocale: "ja-JP",
	},
	sharp,
	plugins: [
		// biome-ignore lint/style/useNamingConvention: follows payload plugin api
		sentryPlugin({ Sentry }),
		...(vercelBlobToken
			? [
					vercelBlobStorage({
						enabled: true,
						collections: {
							media: true,
							"cover-images": true,
						},
						clientUploads: true,
						token: vercelBlobToken,
					}),
				]
			: []),
	],
});
