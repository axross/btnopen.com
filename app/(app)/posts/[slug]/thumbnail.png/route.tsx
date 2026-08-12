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

// an equivalent endpoint of opengraph-image.ts, which is not used because a hash
// suffix added on build makes its URL inconsistent.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
	const { slug } = await params;
	const shareToken = request.nextUrl.searchParams.get("token") ?? undefined;
	const [blogPost, fonts, isDraftPermitted] = await Promise.all([
		getBlogPost({ slug, draft: true, locale: defaultLocale, shareToken }),
		loadFonts(),
		canReadPostDraft(slug, shareToken),
	]);
	const readMode = resolvePostReadMode({
		requested: true,
		permitted: isDraftPermitted,
	});

	if (!blogPost) {
		notFound();
	}

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
			// spread only on the draft branch, so a published thumbnail's response
			// stays byte-identical; `@vercel/og` merges this over its own headers.
			...(readMode === "draft" ? { headers: draftThumbnailHeaders } : {}),
		},
	);
}

const draftThumbnailHeaders = { "X-Robots-Tag": "noindex" };
