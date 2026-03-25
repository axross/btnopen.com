// biome-ignore-start lint/correctness/noNodejsModules: payload seed needs path module
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
// biome-ignore-end lint/correctness/noNodejsModules: payload seed needs path module
import {
	convertMarkdownToLexical,
	editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import type { Payload, SanitizedConfig } from "payload";
import { NIL as uuidNIL, v5 as uuidV5 } from "uuid";
import { rootLogger } from "@/logger";
import type {
	AvatarImage,
	BlogPost,
	CoverImage,
	Media,
	Tag,
	User,
} from "../types";
import { editor } from "./editor";

const logger = rootLogger.child({ module: "🚢" });

const selfDirname = dirname(new URL(import.meta.url).pathname);

export async function seed({
	payload,
	config,
	testUserEmail,
	testUserPassword,
}: {
	payload: Payload;
	config: Promise<SanitizedConfig>;
	testUserEmail: string;
	testUserPassword: string;
}) {
	logger.info("Started seeding process.");

	const testUser = await seedExampleUser({
		payload,
		config,
		testUserEmail,
		testUserPassword,
	});

	await seedWebsite({ payload, creator: testUser });

	const tag = await seedExampleTag({ payload });

	await seedExampleBlogPost({ payload, config, author: testUser, tag });

	logger.info("Completed seeding process.");
}

async function seedExampleUser({
	payload,
	config,
	testUserEmail,
	testUserPassword,
}: {
	payload: Payload;
	config: Promise<SanitizedConfig>;
	testUserEmail: string;
	testUserPassword: string;
}): Promise<User> {
	const users = await payload.find({
		collection: "users",
		where: {
			email: {
				equals: testUserEmail,
			},
		},
		limit: 1,
	});
	let testUser: User | null = users.docs[0] ?? null;

	if (testUser === null) {
		const avatarImages = await payload.find({
			collection: "avatar-images",
			where: {
				filename: {
					equals: `${uuidV5(testUserEmail, uuidNIL)}.webp`,
				},
			},
		});
		let avatarImage: AvatarImage | null = avatarImages.docs[0] ?? null;

		if (avatarImage === null) {
			logger.info(
				"The avatar image for the test user does not exist. Started seeding the avatar image.",
			);

			avatarImage = await payload.create({
				collection: "avatar-images",
				data: {
					id: uuidV5(testUserEmail, uuidNIL),
					filename: `${uuidV5(testUserEmail, uuidNIL)}.webp`,
				},
				filePath: resolve(selfDirname, "./seed/avatar-image.webp"),
			});

			logger.info(
				{
					id: avatarImage.id,
					filename: avatarImage.filename,
				},
				"Completed seeding the avatar image for the test user.",
			);
		}

		logger.info("The test user does not exist. Started seeding a test user.");

		const bio = convertMarkdownToLexical({
			editorConfig: await editorConfigFactory.fromEditor({
				config: await config,
				editor,
			}),
			markdown: await readFile(resolve(selfDirname, "./seed/bio.md"), "utf-8"),
		});

		testUser = await payload.create({
			collection: "users",
			data: {
				email: testUserEmail,
				password: testUserPassword,
				name: "John Doe",
				avatarImage: avatarImage.id,
				bio,
			},
		});

		logger.info(
			{
				id: testUser.id,
				email: testUserEmail,
			},
			"Completed seeding the test user.",
		);
	}

	return testUser;
}

async function seedWebsite({
	payload,
	creator,
}: {
	payload: Payload;
	creator: User;
}) {
	let website = await payload.findGlobal({ slug: "website" });

	if (typeof website.updatedAt !== "string") {
		logger.info("The website isn't initialized. Started seeding the website.");

		website = await payload.updateGlobal({
			slug: "website",
			data: {
				name: "<btn open />",
				description: "This is the website description.",
				keywords: [{ keyword: "axross" }, { keyword: "Kohei Asai" }],
				creator,
			},
		});

		logger.info({ id: website.id }, "Completed seeding the website.");
	}
}

async function seedExampleTag({ payload }: { payload: Payload }) {
	const tags = await payload.find({
		collection: "tags",
		where: {
			slug: {
				equals: "example",
			},
		},
	});
	let tag: Tag | null = tags.docs[0] ?? null;

	if (tag === null) {
		logger.info("The example tag does not exist. Started seeding the tag.");

		tag = await payload.create({
			collection: "tags",
			data: {
				slug: "example",
				name: "Example",
			},
		});

		logger.info(
			{
				id: tag.id,
				slug: tag.slug,
			},
			"Completed seeding the example tag.",
		);
	}

	return tag;
}

async function seedExampleBlogPost({
	payload,
	config,
	author,
	tag,
}: {
	payload: Payload;
	config: Promise<SanitizedConfig>;
	author: User;
	tag: Tag;
}) {
	const blogPosts = await payload.find({
		collection: "blog-posts",
		where: {
			slug: {
				equals: "markdown-example",
			},
		},
		limit: 1,
	});
	let exampleBlogPost: BlogPost | null = blogPosts.docs[0] ?? null;

	if (exampleBlogPost === null) {
		const coverImages = await payload.find({
			collection: "cover-images",
			where: {
				filename: {
					equals: `${uuidV5("markdown-example", uuidNIL)}.webp`,
				},
			},
		});
		let coverImage: CoverImage | null = coverImages.docs[0] ?? null;

		if (coverImage === null) {
			logger.info(
				"The cover image for the example blog post does not exist. Started seeding the cover image.",
			);

			coverImage = await payload.create({
				collection: "cover-images",
				data: {
					id: uuidV5("markdown-example", uuidNIL),
					filename: `${uuidV5("markdown-example", uuidNIL)}.webp`,
				},
				filePath: resolve(selfDirname, "./seed/cover-image.webp"),
			});

			logger.info(
				{
					id: coverImage.id,
					filename: coverImage.filename,
				},
				"Completed seeding the cover image for the example blog post.",
			);
		}

		const mediaId = "019d1223-94d4-754c-8f57-47337be15c9e";
		const medias = await payload.find({
			collection: "media",
			where: {
				filename: {
					equals: `${mediaId}.webp`,
				},
			},
		});
		let mediaForExampleBlogPost: Media | null = medias.docs[0] ?? null;

		if (mediaForExampleBlogPost === null) {
			logger.info(
				"The media for the example blog post does not exist. Started seeding the media.",
			);

			mediaForExampleBlogPost = await payload.create({
				collection: "media",
				data: {
					id: mediaId,
					filename: `${mediaId}.webp`,
				},
				filePath: resolve(selfDirname, "./seed/media.webp"),
			});

			logger.info(
				{
					id: mediaForExampleBlogPost.id,
					filename: mediaForExampleBlogPost.filename,
				},
				"Completed seeding the media for the example blog post.",
			);
		}

		logger.info(
			"The example blog post does not exist. Started seeding the example blog post.",
		);

		const body = convertMarkdownToLexical({
			editorConfig: await editorConfigFactory.fromEditor({
				config: await config,
				editor,
			}),
			markdown: await readFile(
				resolve(selfDirname, "./seed/blog-post.md"),
				"utf-8",
			),
		});

		exampleBlogPost = await payload.create({
			collection: "blog-posts",
			data: {
				title: "Markdown Example",
				slug: "markdown-example",
				coverImage,
				brief: "This is an example of a blog post written in Markdown.",
				tags: [tag],
				body,
				author,
				publishedAt: "2026-03-22T17:00:00Z",
			},
			draft: true,
		});

		logger.info(
			{
				id: exampleBlogPost.id,
				slug: exampleBlogPost.slug,
			},
			"Completed seeding the example blog post.",
		);
	}
}
