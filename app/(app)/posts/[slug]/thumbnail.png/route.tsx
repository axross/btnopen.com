import { captureException } from "@sentry/nextjs";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { defaultLocale } from "@/helpers/i18n";
import { canReadPostDraft } from "@/helpers/post-draft-access";
import { resolvePostReadMode } from "@/helpers/post-read-mode";
import { thumbnailHeight, thumbnailWidth } from "@/helpers/thumbnail";
import { getBlogPost } from "@/repositories/get-blog-post";
import {
	manipulateImage,
	retrieveCoverImage,
	toDataUrl,
} from "./_/helpers/cover-image";
import { loadFonts } from "./_/helpers/fonts";
import { PostThumbnailCard } from "./_components/post-thumbnail-card";

export const maxDuration = 60;

// this is an equivalent endpoint of opengraph-image.ts. the reason why i don't
// use opengraph-image.ts is that its url isn't consistent because of a hash
// suffix automatically added on build.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
	const { slug } = await params;
	// read at the route boundary and forwarded as an opaque string: the gate
	// inside `getBlogPost` compares it, and nothing here interprets it. An absent
	// parameter reads as `undefined`, which the gate rejects.
	const shareToken = request.nextUrl.searchParams.get("token") ?? undefined;
	// the Open Graph image lives at a single, locale-independent URL, so it is
	// always rendered in the default locale.
	const [blogPost, fonts, isDraftPermitted] = await Promise.all([
		// `draft: true` is the request, never the answer — an unauthorized caller
		// is downgraded to the published post by the gate inside `getBlogPost`.
		getBlogPost({ slug, draft: true, locale: defaultLocale, shareToken }),
		loadFonts(),
		// the same gate `getBlogPost` consults, asked again for this response's own
		// robots signal. it is `cache()`-wrapped on `(slug, shareToken)`, so the two
		// callers share one answer rather than reading the token twice.
		canReadPostDraft(slug, shareToken),
	]);
	// this route always requests the draft, so the gate's answer is the whole of
	// whether the render resolved as one.
	const readMode = resolvePostReadMode({
		requested: true,
		permitted: isDraftPermitted,
	});

	if (!blogPost) {
		notFound();
	}

	// autosaved drafts can lack a cover image; fall back to the logo + title
	// composition without the blurred background photo instead of failing.
	const thumbnailImage = blogPost.thumbnailImage;
	let backgroundImageBuffer: ArrayBuffer | null = null;
	if (thumbnailImage) {
		try {
			backgroundImageBuffer = await retrieveCoverImage(thumbnailImage);
		} catch (error) {
			captureException(error);

			notFound();
		}
	}

	return new ImageResponse(
		<PostThumbnailCard
			title={blogPost.title}
			// manipulation deliberately stays outside the `try` above: a `sharp`
			// failure is a 500, not the 404 an unreadable cover image answers with.
			backgroundImage={
				thumbnailImage && backgroundImageBuffer
					? {
							src: toDataUrl(await manipulateImage(backgroundImageBuffer)),
							width: thumbnailImage.width,
							height: thumbnailImage.height,
						}
					: undefined
			}
		/>,
		{
			width: thumbnailWidth,
			height: thumbnailHeight,
			fonts,
			// the page opts every `?draft=true` render out of indexing, but the
			// token-bearing image URL that page advertises is a separate response
			// with nothing telling a crawler the same — and that URL *is* the secret.
			// spread only on the draft branch, so a published thumbnail's response
			// stays byte-identical to what it was; `@vercel/og` merges this over its
			// own `content-type` and `cache-control` rather than replacing them.
			...(readMode === "draft" ? { headers: draftThumbnailHeaders } : {}),
		},
	);
}

/**
 * Robots signal on a thumbnail that resolved as a draft. `noindex` without
 * `nofollow`, because an image response has no links to follow — the page that
 * advertises it carries both.
 */
const draftThumbnailHeaders = { "X-Robots-Tag": "noindex" };
