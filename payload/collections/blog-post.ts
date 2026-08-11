import type { CollectionConfig } from "payload";
import {
	BLOG_POST_SLUG_VALIDATION_MESSAGE,
	BlogPostSlug,
} from "@/shared/blog-post-slug";
import { logger } from "../helpers/logger";
import { shouldInvalidatePostCaches } from "../helpers/post-cache-invalidation";
import { urlOrigin } from "../helpers/runtime";
import { assignShareToken } from "../helpers/share-token";
import { rotateShareTokenEndpoint } from "../helpers/share-token-endpoint";

export const blogPostCollection: CollectionConfig = {
	slug: "blog-posts",
	access: {
		// public REST reads see published posts only; drafts stay behind the filter.
		// the site's own render path uses the local API (which bypasses this) and
		// gates drafts itself, so this rule guards `/api/blog-posts` alone.
		read: ({ req }) => {
			if (req.user) {
				return true;
			}

			return { _status: { equals: "published" } };
		},
		// writes stay authenticated-only, matching Payload's default. The MCP write
		// path runs with `overrideAccess: false` and the API key's user, so a key
		// saved without one is denied here rather than writing anonymously.
		create: ({ req }) => Boolean(req.user),
		update: ({ req }) => Boolean(req.user),
		delete: ({ req }) => Boolean(req.user),
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			localized: true,
		},
		{
			name: "slug",
			type: "text",
			required: true,
			unique: true,
			// the slug reaches `revalidatePath()` and a cache tag through
			// `posts/[slug]/caches`, which rejects anything failing this same
			// schema — validating here keeps the CMS from minting a slug whose
			// publish would then silently skip cache invalidation.
			validate: (value: unknown) => {
				// a custom `validate` replaces Payload's built-in text validation, so
				// the `required` check lives here too; the schema rejects an empty or
				// missing value. Draft and autosave writes skip validation entirely
				// (the collection does not opt into draft validation), so this gates
				// publishing rather than every keystroke.
				if (!BlogPostSlug.safeParse(value).success) {
					return BLOG_POST_SLUG_VALIDATION_MESSAGE;
				}

				return true;
			},
		},
		{
			type: "tabs",
			tabs: [
				{
					label: "Body",
					fields: [
						{
							name: "body",
							type: "richText",
							required: true,
							localized: true,
						},
					],
				},
				{
					label: "Metadata",
					fields: [
						{
							name: "brief",
							type: "textarea",
							required: true,
							localized: true,
						},
						{
							name: "coverImage",
							type: "upload",
							relationTo: "cover-images",
							required: true,
						},
						{
							name: "tags",
							type: "relationship",
							relationTo: "tags",
							hasMany: true,
						},
						{
							name: "author",
							type: "relationship",
							relationTo: "users",
							required: true,
						},
						{
							name: "publishedAt",
							type: "date",
							admin: {
								date: {
									pickerAppearance: "dayOnly",
									displayFormat: "yyyy/MM/dd",
								},
							},
						},
						{
							name: "isCommentsEnabled",
							type: "checkbox",
							defaultValue: true,
							admin: {
								description:
									"Show the reader comments section at the bottom of this post.",
							},
						},
						{
							name: "shareToken",
							type: "text",
							// this repository's first field-level access rule, and it closes
							// the field to everyone rather than opening it — the inverse of
							// the case docs/conventions/payload.md covers, where a field-level
							// rule returns `true` on an otherwise-gated collection. The token
							// is a bearer credential for unpublished content, so `read`
							// requires a session, and `create` and `update` deny everyone so
							// no value a REST or MCP caller sends is ever honoured — the two
							// surfaces there are, since `payload/config.ts` disables GraphQL.
							// `assignShareToken` below owns the stored value instead; opening
							// the field to an author would only add a way to weaken it.
							access: {
								read: ({ req }) => Boolean(req.user),
								create: () => false,
								update: () => false,
							},
							label: "Draft share link",
							admin: {
								readOnly: true,
								description:
									"Secret that lets a signed-out reviewer read this post's draft. Minted on the server and replaced only by rotating it.",
								components: {
									// biome-ignore lint/style/useNamingConvention: follow the API of Payload field admin components
									Field: "/payload/components/share-link-field#ShareLinkField",
								},
							},
						},
					],
				},
				{
					label: "Agentic",
					fields: [
						{
							name: "outline",
							type: "textarea",
							admin: {
								description:
									"Authoring outline for the agent-driven authoring loop. A single Markdown bullet-point list — only list items and inline elements are permitted; no paragraphs or other block types.",
							},
						},
						{
							name: "authoringNotes",
							type: "textarea",
							admin: {
								description:
									"Free-form Markdown notes that human and AI agents leave while authoring. Never reflected in the published blog post body.",
							},
						},
					],
				},
			],
		},
	],
	versions: {
		drafts: {
			autosave: {
				showSaveDraftButton: true,
			},
		},
	},
	trash: true,
	endpoints: [rotateShareTokenEndpoint],
	hooks: {
		beforeChange: [assignShareToken],
		beforeDelete: [
			async ({ req, id }) => {
				// comments hold a required (NOT NULL) foreign key to their post, so
				// permanently deleting a post must remove its comments first —
				// otherwise the FK's ON DELETE set null would violate that NOT NULL
				// column and block the deletion. Comments have no trash, so this is a
				// hard delete. Fires only on permanent delete, not on trashing.
				//
				// the post (and its cached comment threads) is going away entirely, so
				// each cascaded comment's own cache-bust is redundant — signal the
				// comment hook to skip it rather than fan out one round-trip per row.
				req.context.skipCommentCacheBust = true;

				await req.payload.delete({
					collection: "comments",
					where: { blogPost: { equals: id } },
					req,
				});
			},
		],
		afterOperation: [
			async ({ operation, args, req, result }) => {
				// the seed creates posts during `onInit`, when no HTTP server is
				// reachable; it sets this context flag so the published create does not
				// fire a doomed cache-bust fetch (mirrors the comment collection's
				// `skipCommentCacheBust`). Kept content-agnostic — no slug special-case.
				if (req.context?.skipBlogPostCacheBust) {
					return;
				}

				const draft = "draft" in args ? args.draft : undefined;

				// draft and autosave writes never change publicly cached output, so
				// skip the cache-busting round-trips entirely; only publish, unpublish,
				// and delete affect the published pages.
				if (!shouldInvalidatePostCaches({ operation, draft })) {
					return;
				}

				let docs: { slug?: string | null }[] = [];

				if (Array.isArray(result.docs)) {
					docs = result.docs;
				} else {
					docs = [result];
				}

				// a cache-invalidation miss must never fail the content write, so the
				// fetches are guarded and reported to Sentry instead of thrown.
				try {
					logger.info(
						{ operation },
						"Started requesting to clear all blog post caches.",
					);

					await fetch(`${urlOrigin}/posts/caches`, {
						method: "DELETE",
					});

					logger.info(
						{ operation },
						"Finished requesting to clear all blog post caches.",
					);

					await Promise.all(
						docs.map(async (doc) => {
							if (doc.slug) {
								logger.info(
									{ operation, slug: doc.slug },
									"Started requesting to clear blog post cache.",
								);

								await fetch(`${urlOrigin}/posts/${doc.slug}/caches`, {
									method: "DELETE",
								});

								logger.info(
									{ operation, slug: doc.slug },
									"Finished requesting to clear blog post cache.",
								);
							}
						}),
					);
				} catch (error) {
					// dynamic import keeps `@sentry/nextjs` out of this module's static
					// graph, which the Payload CLI loads directly (outside Next's bundler,
					// where the package's named exports do not resolve).
					const { captureException } = await import("@sentry/nextjs");
					captureException(error);
				}
			},
		],
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "slug", "brief", "createdAt", "updatedAt"],
		livePreview: {
			url: ({ data }) =>
				`${urlOrigin}/posts/${data.slug}?preview=true&draft=true`,
		},
	},
};
