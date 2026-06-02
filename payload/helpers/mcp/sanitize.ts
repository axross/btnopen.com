import z from "zod";
import {
	PayloadBlogPost,
	PayloadTag,
	PayloadUpload,
	PayloadUser,
	PayloadWebsite,
} from "@/repositories/payload-types";

const PayloadDocumentId = z.union([z.number(), z.string()]);
const PayloadDocumentStatus = z.enum(["draft", "published"]).nullable();
const PayloadRelationFallback = z.union([
	PayloadDocumentId,
	z.null(),
	z.undefined(),
]);

const McpPayloadUploadRecord = PayloadUpload.partial()
	.extend({
		id: PayloadDocumentId.optional(),
	})
	.catchall(z.unknown());

const McpSanitizedUploadRecord = PayloadUpload.partial().extend({
	id: PayloadDocumentId.optional(),
});

const McpPayloadUploadInput = z.union([
	McpPayloadUploadRecord,
	PayloadRelationFallback,
]);

const McpSanitizedUploadOutput = z.union([
	McpSanitizedUploadRecord,
	PayloadRelationFallback,
]);

export const McpSanitizedUpload = z.codec(
	McpPayloadUploadInput,
	McpSanitizedUploadOutput,
	{
		decode: (upload) => {
			if (typeof upload !== "object" || upload === null) {
				return upload;
			}

			return {
				id: upload.id,
				filename: upload.filename,
				url: upload.url,
				mimeType: upload.mimeType,
				width: upload.width,
				height: upload.height,
				sizes: upload.sizes,
			};
		},
		encode: (upload) => upload,
	},
);

const McpPayloadUserRecord = PayloadUser.partial()
	.extend({
		id: PayloadDocumentId.optional(),
		avatarImage: McpPayloadUploadInput.optional(),
	})
	.catchall(z.unknown());

const McpSanitizedUserRecord = PayloadUser.pick({
	name: true,
})
	.partial()
	.extend({
		id: PayloadDocumentId.optional(),
		avatarImage: McpSanitizedUploadOutput.optional(),
	});

const McpPayloadUserInput = z.union([
	McpPayloadUserRecord,
	PayloadRelationFallback,
]);

const McpSanitizedUserOutput = z.union([
	McpSanitizedUserRecord,
	PayloadRelationFallback,
]);

export const McpSanitizedUser = z.codec(
	McpPayloadUserInput,
	McpSanitizedUserOutput,
	{
		decode: (user) => {
			if (typeof user !== "object" || user === null) {
				return user;
			}

			return {
				id: user.id,
				name: user.name,
				avatarImage: z.decode(McpSanitizedUpload, user.avatarImage),
			};
		},
		encode: (user) => {
			if (typeof user !== "object" || user === null) {
				return user;
			}

			return {
				id: user.id,
				name: user.name,
				avatarImage: z.encode(McpSanitizedUpload, user.avatarImage),
			};
		},
	},
);

const McpPayloadTagRecord = PayloadTag.partial()
	.extend({
		id: PayloadDocumentId.optional(),
	})
	.catchall(z.unknown());

const McpSanitizedTagRecord = PayloadTag.partial().extend({
	id: PayloadDocumentId.optional(),
});

const McpPayloadTagInput = z.union([
	McpPayloadTagRecord,
	PayloadRelationFallback,
]);

const McpSanitizedTagOutput = z.union([
	McpSanitizedTagRecord,
	PayloadRelationFallback,
]);

export const McpSanitizedTag = z.codec(
	McpPayloadTagInput,
	McpSanitizedTagOutput,
	{
		decode: (tag) => {
			if (typeof tag !== "object" || tag === null) {
				return tag;
			}

			return {
				id: tag.id,
				slug: tag.slug,
				name: tag.name,
			};
		},
		encode: (tag) => tag,
	},
);

const McpPayloadWebsiteInput = PayloadWebsite.partial()
	.extend({
		creator: McpPayloadUserInput.optional(),
	})
	.catchall(z.unknown());

const McpSanitizedWebsiteOutput = PayloadWebsite.pick({
	name: true,
	description: true,
	keywords: true,
})
	.partial()
	.extend({
		creator: McpSanitizedUserOutput.optional(),
	});

export const McpSanitizedWebsite = z.codec(
	McpPayloadWebsiteInput,
	McpSanitizedWebsiteOutput,
	{
		decode: (website) => ({
			name: website.name,
			description: website.description,
			keywords: website.keywords,
			creator: z.decode(McpSanitizedUser, website.creator),
		}),
		encode: (website) => ({
			name: website.name,
			description: website.description,
			keywords: website.keywords,
			creator: z.encode(McpSanitizedUser, website.creator),
		}),
	},
);

const McpPayloadBlogPostInput = PayloadBlogPost.partial()
	.extend({
		id: PayloadDocumentId.optional(),
		_status: PayloadDocumentStatus.optional(),
		tags: z.array(McpPayloadTagInput).nullable().optional(),
		coverImage: McpPayloadUploadInput.optional(),
		author: McpPayloadUserInput.optional(),
	})
	.catchall(z.unknown());

const McpSanitizedBlogPostOutput = PayloadBlogPost.pick({
	slug: true,
	title: true,
	brief: true,
	body: true,
	publishedAt: true,
	createdAt: true,
	updatedAt: true,
})
	.partial()
	.extend({
		id: PayloadDocumentId.optional(),
		status: PayloadDocumentStatus.optional(),
		tags: z.array(McpSanitizedTagOutput).optional(),
		coverImage: McpSanitizedUploadOutput.optional(),
		author: McpSanitizedUserOutput.optional(),
	});

type McpSanitizedBlogPostValue = z.output<typeof McpSanitizedBlogPost>;
type McpSanitizedTagValue = z.output<typeof McpSanitizedTag>;
type McpSanitizedUploadValue = z.output<typeof McpSanitizedUpload>;

export const McpSanitizedBlogPost = z.codec(
	McpPayloadBlogPostInput,
	McpSanitizedBlogPostOutput,
	{
		decode: (blogPost) => ({
			id: blogPost.id,
			slug: blogPost.slug,
			title: blogPost.title,
			brief: blogPost.brief,
			body: blogPost.body,
			status: blogPost._status,
			publishedAt: blogPost.publishedAt,
			createdAt: blogPost.createdAt,
			updatedAt: blogPost.updatedAt,
			tags: Array.isArray(blogPost.tags)
				? blogPost.tags.map((tag) => z.decode(McpSanitizedTag, tag))
				: undefined,
			coverImage: z.decode(McpSanitizedUpload, blogPost.coverImage),
			author: z.decode(McpSanitizedUser, blogPost.author),
		}),
		encode: (blogPost) => ({
			id: blogPost.id,
			slug: blogPost.slug,
			title: blogPost.title,
			brief: blogPost.brief,
			body: blogPost.body,
			_status: blogPost.status,
			publishedAt: blogPost.publishedAt,
			createdAt: blogPost.createdAt,
			updatedAt: blogPost.updatedAt,
			tags: Array.isArray(blogPost.tags)
				? blogPost.tags.map((tag) => z.encode(McpSanitizedTag, tag))
				: undefined,
			coverImage: z.encode(McpSanitizedUpload, blogPost.coverImage),
			author: z.encode(McpSanitizedUser, blogPost.author),
		}),
	},
);

const McpCollectionResultMetadataInput = z
	.object({
		totalDocs: z.unknown().optional(),
		limit: z.unknown().optional(),
		page: z.unknown().optional(),
		totalPages: z.unknown().optional(),
	})
	.catchall(z.unknown());

const McpCollectionResultMetadataOutput = z.object({
	totalDocs: z.unknown().optional(),
	limit: z.unknown().optional(),
	page: z.unknown().optional(),
	totalPages: z.unknown().optional(),
});

const McpBlogPostCollectionResultInput =
	McpCollectionResultMetadataInput.extend({
		docs: z.array(McpPayloadBlogPostInput),
	});

const McpBlogPostCollectionResultOutput =
	McpCollectionResultMetadataOutput.extend({
		docs: z.array(McpSanitizedBlogPostOutput),
	});

export const McpBlogPostResponse = z.codec(
	z.union([McpBlogPostCollectionResultInput, McpPayloadBlogPostInput]),
	z.union([McpBlogPostCollectionResultOutput, McpSanitizedBlogPostOutput]),
	{
		decode: (value) => {
			if ("docs" in value && Array.isArray(value.docs)) {
				return {
					totalDocs: value.totalDocs,
					limit: value.limit,
					page: value.page,
					totalPages: value.totalPages,
					docs: value.docs.map((doc) => z.decode(McpSanitizedBlogPost, doc)),
				};
			}

			return z.decode(McpSanitizedBlogPost, value);
		},
		encode: (value) => {
			if ("docs" in value && Array.isArray(value.docs)) {
				return {
					totalDocs: value.totalDocs,
					limit: value.limit,
					page: value.page,
					totalPages: value.totalPages,
					docs: value.docs.map((doc) => z.encode(McpSanitizedBlogPost, doc)),
				};
			}

			return z.encode(McpSanitizedBlogPost, value as McpSanitizedBlogPostValue);
		},
	},
);

const McpTagCollectionResultInput = McpCollectionResultMetadataInput.extend({
	docs: z.array(McpPayloadTagInput),
});

const McpTagCollectionResultOutput = McpCollectionResultMetadataOutput.extend({
	docs: z.array(McpSanitizedTagOutput),
});

export const McpTagResponse = z.codec(
	z.union([McpTagCollectionResultInput, McpPayloadTagInput]),
	z.union([McpTagCollectionResultOutput, McpSanitizedTagOutput]),
	{
		decode: (value) => {
			if (
				typeof value === "object" &&
				value !== null &&
				"docs" in value &&
				Array.isArray(value.docs)
			) {
				return {
					totalDocs: value.totalDocs,
					limit: value.limit,
					page: value.page,
					totalPages: value.totalPages,
					docs: value.docs.map((doc) => z.decode(McpSanitizedTag, doc)),
				};
			}

			return z.decode(McpSanitizedTag, value);
		},
		encode: (value) => {
			if (
				typeof value === "object" &&
				value !== null &&
				"docs" in value &&
				Array.isArray(value.docs)
			) {
				const docs = value.docs as McpSanitizedTagValue[];

				return {
					totalDocs: value.totalDocs,
					limit: value.limit,
					page: value.page,
					totalPages: value.totalPages,
					docs: docs.map((doc) => z.encode(McpSanitizedTag, doc)),
				};
			}

			return z.encode(McpSanitizedTag, value as McpSanitizedTagValue);
		},
	},
);

const McpUploadCollectionResultInput = McpCollectionResultMetadataInput.extend({
	docs: z.array(McpPayloadUploadInput),
});

const McpUploadCollectionResultOutput =
	McpCollectionResultMetadataOutput.extend({
		docs: z.array(McpSanitizedUploadOutput),
	});

export const McpUploadResponse = z.codec(
	z.union([McpUploadCollectionResultInput, McpPayloadUploadInput]),
	z.union([McpUploadCollectionResultOutput, McpSanitizedUploadOutput]),
	{
		decode: (value) => {
			if (
				typeof value === "object" &&
				value !== null &&
				"docs" in value &&
				Array.isArray(value.docs)
			) {
				return {
					totalDocs: value.totalDocs,
					limit: value.limit,
					page: value.page,
					totalPages: value.totalPages,
					docs: value.docs.map((doc) => z.decode(McpSanitizedUpload, doc)),
				};
			}

			return z.decode(McpSanitizedUpload, value);
		},
		encode: (value) => {
			if (
				typeof value === "object" &&
				value !== null &&
				"docs" in value &&
				Array.isArray(value.docs)
			) {
				const docs = value.docs as McpSanitizedUploadValue[];

				return {
					totalDocs: value.totalDocs,
					limit: value.limit,
					page: value.page,
					totalPages: value.totalPages,
					docs: docs.map((doc) => z.encode(McpSanitizedUpload, doc)),
				};
			}

			return z.encode(McpSanitizedUpload, value as McpSanitizedUploadValue);
		},
	},
);
