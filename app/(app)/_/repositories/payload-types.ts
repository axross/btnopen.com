import z from "zod";

export const PayloadUploadSize = z.object({
	url: z.string().nonempty(),
	filename: z.string().nonempty(),
	mimeType: z.string(),
	width: z.number().nonnegative(),
	height: z.number().nonnegative(),
});

export type PayloadUploadSize = z.infer<typeof PayloadUploadSize>;

export const PayloadUpload = z.object({
	url: z.string().nonempty(),
	filename: z.string().nonempty(),
	mimeType: z.string(),
	width: z.number().nonnegative(),
	height: z.number().nonnegative(),
	sizes: z.optional(z.record(z.string(), PayloadUploadSize)),
});

export type PayloadUpload = z.infer<typeof PayloadUpload>;

export const PayloadUser = z.object({
	name: z.string().nonempty(),
	avatarImage: PayloadUpload,
	bio: z.any(),
});

export type PayloadUser = z.infer<typeof PayloadUser>;

export const PayloadWebsite = z.object({
	name: z.string(),
	description: z.string(),
	keywords: z.nullable(z.array(z.object({ keyword: z.string() }))),
	creator: PayloadUser,
});

export type PayloadWebsite = z.infer<typeof PayloadWebsite>;

export const PayloadTag = z.object({
	slug: z.string().nonempty(),
	name: z.string().nonempty(),
});

export type PayloadTag = z.infer<typeof PayloadTag>;

export const PayloadBlogPost = z.object({
	slug: z.string().nonempty(),
	title: z.string().nonempty(),
	brief: z.string().nonempty(),
	tags: z.array(PayloadTag),
	coverImage: PayloadUpload.extend({
		sizes: z.object({
			og: PayloadUploadSize,
		}),
	}),
	author: PayloadUser,
	publishedAt: z.iso.datetime().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export type PayloadBlogPost = z.infer<typeof PayloadBlogPost>;
