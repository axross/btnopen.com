import z from "zod";
import { isRecord } from "./records";

/**
 * MCP response sanitization strips non-public fields from Payload documents
 * before they leave the MCP server. The sanitizers allowlist KEYS and pass
 * values through untouched: live Payload shapes vary too much to validate —
 * `locale: "all"` reads replace localized leaf values with per-locale objects,
 * draft versions carry empty or partial values, and relations arrive as ids,
 * records, or null depending on `depth`. Validating content here made every
 * list and all-locale read fail and surface as an empty `{}` response, so the
 * codecs are total: they never throw on any input.
 */

function pickKeys(
	record: Record<string, unknown>,
	keys: readonly string[],
): Record<string, unknown> {
	const picked: Record<string, unknown> = {};

	for (const key of keys) {
		if (key in record) {
			picked[key] = record[key];
		}
	}

	return picked;
}

const publicUploadKeys = [
	"id",
	"filename",
	"url",
	"mimeType",
	"width",
	"height",
	"sizes",
] as const;

function sanitizeUpload(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	return pickKeys(value, publicUploadKeys);
}

const publicUserKeys = ["id", "name", "bio", "avatarImage"] as const;

function sanitizeUser(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	const picked = pickKeys(value, publicUserKeys);

	if ("avatarImage" in picked) {
		picked.avatarImage = sanitizeUpload(picked.avatarImage);
	}

	return picked;
}

const publicTagKeys = ["id", "slug", "name"] as const;

function sanitizeTag(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	return pickKeys(value, publicTagKeys);
}

const publicWebsiteKeys = [
	"name",
	"description",
	"keywords",
	"creator",
] as const;

function sanitizeWebsite(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	const picked = pickKeys(value, publicWebsiteKeys);

	if ("creator" in picked) {
		picked.creator = sanitizeUser(picked.creator);
	}

	return picked;
}

const publicBlogPostKeys = [
	"id",
	"slug",
	"title",
	"brief",
	"outline",
	"authoringNotes",
	"body",
	"publishedAt",
	"createdAt",
	"updatedAt",
	"tags",
	"coverImage",
	"author",
] as const;

function sanitizeBlogPost(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	const picked = pickKeys(value, publicBlogPostKeys);

	// expose the version status under the public `status` name.
	if ("_status" in value) {
		picked.status = value._status;
	}

	if (Array.isArray(picked.tags)) {
		picked.tags = picked.tags.map((tag) => sanitizeTag(tag));
	}

	if ("coverImage" in picked) {
		picked.coverImage = sanitizeUpload(picked.coverImage);
	}

	if ("author" in picked) {
		picked.author = sanitizeUser(picked.author);
	}

	return picked;
}

function desanitizeBlogPost(value: unknown): unknown {
	if (!isRecord(value)) {
		return value;
	}

	const encoded = pickKeys(value, publicBlogPostKeys);

	// restore the Payload-internal `_status` name on the way back in.
	if ("status" in value) {
		encoded._status = value.status;
	}

	if (Array.isArray(encoded.tags)) {
		encoded.tags = encoded.tags.map((tag) => sanitizeTag(tag));
	}

	if ("coverImage" in encoded) {
		encoded.coverImage = sanitizeUpload(encoded.coverImage);
	}

	if ("author" in encoded) {
		encoded.author = sanitizeUser(encoded.author);
	}

	return encoded;
}

const collectionMetadataKeys = [
	"totalDocs",
	"limit",
	"page",
	"totalPages",
] as const;

/**
 * Applies a document sanitizer to either a single document or a paginated
 * collection result. Collection results are detected structurally by their
 * `docs` array so the distinction never depends on how strictly the documents
 * themselves parse.
 */
function sanitizeCollectionOrDocument(
	value: unknown,
	sanitizeDocument: (doc: unknown) => unknown,
): unknown {
	if (isRecord(value) && Array.isArray(value.docs)) {
		return {
			...pickKeys(value, collectionMetadataKeys),
			docs: value.docs.map((doc) => sanitizeDocument(doc)),
		};
	}

	return sanitizeDocument(value);
}

/**
 * Sanitizes an upload document (or passes a relation id / null through). Keeps
 * only the public file metadata keys.
 */
export const McpSanitizedUpload = z.codec(z.unknown(), z.unknown(), {
	decode: sanitizeUpload,
	encode: sanitizeUpload,
});

/**
 * Sanitizes a user document (or passes a relation id / null through). Keeps
 * `id`, `name`, the public `bio` rich text, and the recursively sanitized
 * `avatarImage`; private fields such as `email` never pass.
 */
export const McpSanitizedUser = z.codec(z.unknown(), z.unknown(), {
	decode: sanitizeUser,
	encode: sanitizeUser,
});

/**
 * Sanitizes a tag document (or passes a relation id / null through). Keeps
 * `id`, `slug`, and `name`.
 */
export const McpSanitizedTag = z.codec(z.unknown(), z.unknown(), {
	decode: sanitizeTag,
	encode: sanitizeTag,
});

/**
 * Sanitizes the website global, including the recursively sanitized `creator`
 * user (with its public `bio`).
 */
export const McpSanitizedWebsite = z.codec(z.unknown(), z.unknown(), {
	decode: sanitizeWebsite,
	encode: sanitizeWebsite,
});

/**
 * Sanitizes a blog post document (or passes a relation id / null through),
 * renaming the version `_status` to the public `status` on decode and back on
 * encode, and recursively sanitizing `tags`, `coverImage`, and `author`.
 */
export const McpSanitizedBlogPost = z.codec(z.unknown(), z.unknown(), {
	decode: sanitizeBlogPost,
	encode: desanitizeBlogPost,
});

/**
 * Sanitizes a blog-posts find response: a paginated collection result (kept
 * pagination metadata plus sanitized `docs`) or a single document.
 */
export const McpBlogPostResponse = z.codec(z.unknown(), z.unknown(), {
	decode: (value) => sanitizeCollectionOrDocument(value, sanitizeBlogPost),
	encode: (value) => sanitizeCollectionOrDocument(value, desanitizeBlogPost),
});

/**
 * Sanitizes a tags find response: a paginated collection result or a single
 * document.
 */
export const McpTagResponse = z.codec(z.unknown(), z.unknown(), {
	decode: (value) => sanitizeCollectionOrDocument(value, sanitizeTag),
	encode: (value) => sanitizeCollectionOrDocument(value, sanitizeTag),
});

/**
 * Sanitizes an uploads find response: a paginated collection result or a
 * single document.
 */
export const McpUploadResponse = z.codec(z.unknown(), z.unknown(), {
	decode: (value) => sanitizeCollectionOrDocument(value, sanitizeUpload),
	encode: (value) => sanitizeCollectionOrDocument(value, sanitizeUpload),
});
