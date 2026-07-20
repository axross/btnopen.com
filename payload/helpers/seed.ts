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
	Comment,
	CoverImage,
	Media,
	Tag,
	User,
} from "../types";
import { editor } from "./editor";

const logger = rootLogger.child({ module: "🚢" });

const selfDirname = dirname(new URL(import.meta.url).pathname);

// The shared placeholder media referenced by both seed posts' bodies via the
// `![media:<id>]()` upload directive. Seeded once and reused so the two posts do
// not each carry their own copy of the same fixture image.
const sharedMediaId = "019d1223-94d4-754c-8f57-47337be15c9e";

/**
 * Describes one seed blog post. Both posts share the create/lookup logic in
 * `seedBlogPost`; only these per-post inputs differ. The body/outline/authoring
 * files are read relative to this module's directory.
 */
interface SeedBlogPostDescriptor {
	slug: string;
	title: string;
	brief: string;
	publishedAt: string;
	/** `true` keeps the post a draft; `false` publishes the canonical document. */
	draft: boolean;
	bodyFile: string;
	outlineFile: string;
	authoringNotesFile: string;
}

/** A seeded reader comment, optionally carrying one level of author replies. */
interface SeedCommentDescriptor {
	body: string;
	status: "approved" | "pending";
	authorName: string;
	authorGithubUsername: string;
	authorProviderId: string;
	/** Author replies rendered under this comment (approved, `authorReply`). */
	replies?: { body: string }[];
}

// The existing example post stays a draft so the draft/preview flows keep a
// fixture; the second post is published so the public site, sitemap, and the
// reader-comments UI render real content (most importantly in per-PR previews).
const draftBlogPost: SeedBlogPostDescriptor = {
	slug: "markdown-example",
	title: "Markdown で記事を書くときに決めていること",
	brief:
		"このブログの Markdown レンダラーで実際に使う記法と、使う・使わないの判断をまとめる。",
	publishedAt: "2026-03-22T17:00:00Z",
	draft: true,
	bodyFile: "./seed/blog-post.md",
	outlineFile: "./seed/outline.md",
	authoringNotesFile: "./seed/authoring-notes.md",
};

const publishedBlogPost: SeedBlogPostDescriptor = {
	slug: "declarative-ui",
	title: "宣言的 UI を実装に落とすときに迷うところ",
	brief:
		"状態から UI を組み立てる設計を、実装で判断が要る場面に絞って整理する。",
	publishedAt: "2026-05-15T17:00:00Z",
	draft: false,
	bodyFile: "./seed/declarative-ui.md",
	outlineFile: "./seed/declarative-ui.outline.md",
	authoringNotesFile: "./seed/declarative-ui.authoring-notes.md",
};

// The draft post keeps the moderation-state example thread (two approved, one
// author reply, and one pending comment that stays invisible until approved).
const draftBlogPostComments: SeedCommentDescriptor[] = [
	{
		body: "とても分かりやすい記事でした。実装の判断材料が整理されていて参考になります！",
		status: "approved",
		authorName: "田中 花子",
		authorGithubUsername: "hanako-tanaka",
		authorProviderId: "seed-hanako-tanaka",
		replies: [
			{ body: "コメントありがとうございます！お役に立てたようで嬉しいです。" },
		],
	},
	{
		body: "コード例が実践的で助かりました。続編も楽しみにしています。",
		status: "approved",
		authorName: "佐藤 健",
		authorGithubUsername: "ken-sato",
		authorProviderId: "seed-ken-sato",
	},
	{
		body: "これは承認待ちのサンプルコメントです。承認されるまで公開されません。",
		status: "pending",
		authorName: "山田 太郎",
		authorGithubUsername: "taro-yamada",
		authorProviderId: "seed-taro-yamada",
	},
];

// The published post carries a small approved thread so the public/preview post
// page renders a real reader-comment section (with a one-level author reply).
const publishedBlogPostComments: SeedCommentDescriptor[] = [
	{
		body: "状態を絞るという整理、腑に落ちました。派生値を状態にしない基準が特に参考になります。",
		status: "approved",
		authorName: "鈴木 みなと",
		authorGithubUsername: "minato-suzuki",
		authorProviderId: "seed-minato-suzuki",
		replies: [
			{
				body: "ありがとうございます！派生値の線引きを最初に決めておくと、後がだいぶ楽になります。",
			},
		],
	},
	{
		body: "命令的な実装との対比表が分かりやすかったです。テストの観点まで並んでいて助かりました。",
		status: "approved",
		authorName: "高橋 遥",
		authorGithubUsername: "haruka-takahashi",
		authorProviderId: "seed-haruka-takahashi",
	},
];

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

	// The inline media is shared by both posts' bodies, so seed it once up front.
	await seedSharedMedia({ payload });

	const draftPost = await seedBlogPost({
		payload,
		config,
		author: testUser,
		tag,
		descriptor: draftBlogPost,
	});
	await seedComments({
		payload,
		blogPost: draftPost,
		comments: draftBlogPostComments,
	});

	const publishedPost = await seedBlogPost({
		payload,
		config,
		author: testUser,
		tag,
		descriptor: publishedBlogPost,
	});
	await seedComments({
		payload,
		blogPost: publishedPost,
		comments: publishedBlogPostComments,
	});

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

async function seedSharedMedia({
	payload,
}: {
	payload: Payload;
}): Promise<Media> {
	// Match on the stable id, not the filename: an upload appends a numeric
	// suffix (`…-1.webp`) when a same-named file already exists, so a
	// filename lookup would miss the row and re-create it — a UNIQUE id clash.
	const medias = await payload.find({
		collection: "media",
		where: {
			id: {
				equals: sharedMediaId,
			},
		},
	});
	let media: Media | null = medias.docs[0] ?? null;

	if (media === null) {
		logger.info("The shared media does not exist. Started seeding the media.");

		media = await payload.create({
			collection: "media",
			data: {
				id: sharedMediaId,
				filename: `${sharedMediaId}.webp`,
				alt: "2560 x 1600 のプレースホルダー画像",
			},
			filePath: resolve(selfDirname, "./seed/media.webp"),
		});

		logger.info(
			{
				id: media.id,
				filename: media.filename,
			},
			"Completed seeding the shared media.",
		);
	}

	return media;
}

async function seedBlogPost({
	payload,
	config,
	author,
	tag,
	descriptor,
}: {
	payload: Payload;
	config: Promise<SanitizedConfig>;
	author: User;
	tag: Tag;
	descriptor: SeedBlogPostDescriptor;
}): Promise<BlogPost> {
	const blogPosts = await payload.find({
		collection: "blog-posts",
		where: {
			slug: {
				equals: descriptor.slug,
			},
		},
		limit: 1,
		// include drafts so the draft post is found on re-seed and not recreated.
		draft: true,
	});
	let blogPost: BlogPost | null = blogPosts.docs[0] ?? null;

	if (blogPost === null) {
		const coverImageId = uuidV5(descriptor.slug, uuidNIL);
		const coverImages = await payload.find({
			collection: "cover-images",
			where: {
				filename: {
					equals: `${coverImageId}.webp`,
				},
			},
		});
		let coverImage: CoverImage | null = coverImages.docs[0] ?? null;

		if (coverImage === null) {
			logger.info(
				{ slug: descriptor.slug },
				"The cover image for the blog post does not exist. Started seeding the cover image.",
			);

			coverImage = await payload.create({
				collection: "cover-images",
				data: {
					id: coverImageId,
					filename: `${coverImageId}.webp`,
				},
				filePath: resolve(selfDirname, "./seed/cover-image.webp"),
			});

			logger.info(
				{
					id: coverImage.id,
					filename: coverImage.filename,
				},
				"Completed seeding the cover image for the blog post.",
			);
		}

		logger.info(
			{ slug: descriptor.slug },
			"The blog post does not exist. Started seeding the blog post.",
		);

		const body = convertMarkdownToLexical({
			editorConfig: await editorConfigFactory.fromEditor({
				config: await config,
				editor,
			}),
			markdown: await readFile(
				resolve(selfDirname, descriptor.bodyFile),
				"utf-8",
			),
		});

		// the outline and authoring notes are plain-text authoring fields, so they
		// hold the raw Markdown verbatim (no Lexical conversion, unlike the body).
		const outline = await readFile(
			resolve(selfDirname, descriptor.outlineFile),
			"utf-8",
		);
		const authoringNotes = await readFile(
			resolve(selfDirname, descriptor.authoringNotesFile),
			"utf-8",
		);

		blogPost = await payload.create({
			collection: "blog-posts",
			data: {
				title: descriptor.title,
				slug: descriptor.slug,
				coverImage,
				brief: descriptor.brief,
				tags: [tag],
				body,
				outline,
				authoringNotes,
				author,
				publishedAt: descriptor.publishedAt,
				// Publish through the status field: the create `draft` option alone
				// leaves `_status` at its 'draft' default, so a published post must set
				// it explicitly (as the e2e `createPublishedBlogPost` helper does). The
				// draft post keeps the default and passes `draft: true` below.
				...(descriptor.draft ? {} : { _status: "published" as const }),
			},
			...(descriptor.draft ? { draft: true } : {}),
			// no HTTP server is reachable during `onInit`, so keep the published
			// create from firing the post cache-bust fetch (see the blog-post
			// collection's afterOperation hook).
			context: { skipBlogPostCacheBust: true },
		});

		logger.info(
			{
				id: blogPost.id,
				slug: blogPost.slug,
			},
			"Completed seeding the blog post.",
		);
	}

	return blogPost;
}

async function seedComments({
	payload,
	blogPost,
	comments,
}: {
	payload: Payload;
	blogPost: BlogPost;
	comments: SeedCommentDescriptor[];
}) {
	const existing = await payload.find({
		collection: "comments",
		where: {
			blogPost: {
				equals: blogPost.id,
			},
		},
		limit: 1,
	});

	if (existing.docs.length > 0) {
		return;
	}

	logger.info(
		{ blogPostId: blogPost.id },
		"The blog post has no comments. Started seeding comments.",
	);

	// No HTTP server is reachable during `onInit`, so every seed-time comment
	// write skips the doomed cache-bust fetch (mirrors the blog-post skip above).
	const seedContext = { skipCommentCacheBust: true };

	for (const comment of comments) {
		// biome-ignore lint/performance/noAwaitInLoops: comments seed sequentially so each author reply can reference its parent's id
		const created: Comment = await payload.create({
			collection: "comments",
			data: {
				blogPost: blogPost.id,
				body: comment.body,
				status: comment.status,
				authorName: comment.authorName,
				authorGithubUsername: comment.authorGithubUsername,
				authorProviderId: comment.authorProviderId,
			},
			context: seedContext,
		});

		for (const reply of comment.replies ?? []) {
			// A one-level author reply — renders with the site author's identity and
			// the Author badge.
			// biome-ignore lint/performance/noAwaitInLoops: replies seed sequentially after their parent comment is created
			await payload.create({
				collection: "comments",
				data: {
					blogPost: blogPost.id,
					parent: created.id,
					authorReply: true,
					body: reply.body,
					status: "approved",
				},
				context: seedContext,
			});
		}
	}

	logger.info({ blogPostId: blogPost.id }, "Completed seeding the comments.");
}
