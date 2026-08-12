// biome-ignore-start lint/correctness/noNodejsModules: this is running on nodejs runtime
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// biome-ignore-end lint/correctness/noNodejsModules: this is running on nodejs runtime
import { captureException } from "@sentry/nextjs";
import { get as getBlob } from "@vercel/blob";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import type { ImageResponseOptions, NextRequest } from "next/server";
import sharp from "sharp";
import { Logo } from "@/components/logo";
import {
	postThumbnailBackgroundColor,
	postThumbnailCoverTintColor,
	postThumbnailLogoColor,
	thumbnailForegroundColor,
} from "@/helpers/brand-colors";
import { defaultLocale } from "@/helpers/i18n";
import { canReadPostDraft } from "@/helpers/post-draft-access";
import { resolvePostReadMode } from "@/helpers/post-read-mode";
import { thumbnailHeight, thumbnailWidth } from "@/helpers/thumbnail";
import { getBlogPost } from "@/repositories/get-blog-post";
import { urlOrigin, vercelBlobPrefix, vercelBlobToken } from "@/runtime";
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "👽" });
// fileURLToPath, not `new URL(import.meta.url).pathname`: this route lives
// under the `[slug]` dynamic segment, and a file URL percent-encodes those
// brackets. Reading the raw pathname resolves the font below to a
// `%5Bslug%5D` directory that does not exist on disk, which fails the render
// with ENOENT and returns a blank image.
const selfDirname = dirname(fileURLToPath(import.meta.url));

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
			if (vercelBlobToken) {
				backgroundImageBuffer = await retrieveImageFromVercelBlob(
					thumbnailImage.filename,
				);
			} else {
				backgroundImageBuffer = await retrieveImageViaAPI(thumbnailImage.url);
			}
		} catch (error) {
			captureException(error);

			notFound();
		}
	}

	return new ImageResponse(
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: 32,
				gap: 32,
				overflow: "hidden",
				// dark base so the light title stays legible when there is no
				// cover image behind it (the background photo covers it otherwise).
				backgroundColor: postThumbnailBackgroundColor,
			}}
		>
			{thumbnailImage && backgroundImageBuffer ? (
				// biome-ignore lint/a11y/useAltText: this is just within the image generation. alt will be omitted in the rendered result.
				// biome-ignore lint/performance/noImgElement: this is just within the image generation. Next <Image> dosen't fit in the image generation.
				<img
					src={toDataUrl(await manipulateImage(backgroundImageBuffer))}
					width={thumbnailImage.width}
					height={thumbnailImage.height}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						objectFit: "cover",
						filter: "brightness(0.125)",
					}}
				/>
			) : null}

			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: 96,
					paddingTop: 64,
					rowGap: 64,
				}}
			>
				<Logo
					style={{
						width: 298.2,
						height: 60.25,
						color: postThumbnailLogoColor,
					}}
				/>

				<div
					style={{
						display: "block",
						color: thumbnailForegroundColor,
						textShadow: `0 0 4px ${postThumbnailBackgroundColor}`,
						fontSize: 72,
						fontFamily: "IBM Plex Sans JP",
						fontWeight: 700,
						lineHeight: 1.5,
						textAlign: "center",
						lineClamp: 3,
					}}
				>
					{blogPost.title}
				</div>
			</div>
		</div>,
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

type FontOptions = NonNullable<ImageResponseOptions["fonts"]>[number];

async function loadFonts(): Promise<FontOptions[]> {
	logger.info("Started loading fonts.");

	const fontFilePath = resolve(
		selfDirname,
		"./_assets/ibm-plex-sans-jp-700.ttf",
	);
	const fontBuffer = await readFile(fontFilePath);

	logger.info("Finished loading fonts.");

	return [
		{
			name: "IBM Plex Sans JP",
			data: fontBuffer,
			style: "normal",
			weight: 700,
		},
	];
}

/**
 * Reads a stored cover image out of Vercel Blob, resolving the filename under
 * the deployment's blob namespace.
 *
 * @throws if no Blob token is configured (the caller must pick the API path
 * instead), if no blob exists at the resolved pathname, or if the blob is found
 * but carries no readable stream.
 */
async function retrieveImageFromVercelBlob(
	filename: string,
): Promise<ArrayBuffer> {
	if (!vercelBlobToken) {
		throw new Error(
			"retrieveImageFromVercelBlob() was called but Vercel Blob token is null.",
		);
	}

	// files are stored under the deployment's blob namespace (`pr-<n>/` on
	// preview deployments); the stored filename alone misses them there.
	const pathname = vercelBlobPrefix
		? `${vercelBlobPrefix}/${filename}`
		: filename;

	logger.info({ pathname }, "Started fetching image from Vercel Blob.");

	const blobResult = await getBlob(pathname, {
		access: "public",
		token: vercelBlobToken,
	});

	if (!blobResult) {
		throw new Error(`Blob (pathname: "${pathname}") was not found.`);
	}

	if (!blobResult.stream) {
		throw new Error(
			`Blob (pathname: "${pathname}") was found but no stream was provided.`,
		);
	}

	const imageBuffer = new ArrayBuffer(blobResult.blob.size);
	const view = new Uint8Array(imageBuffer);
	let offset = 0;

	await blobResult.stream.pipeTo(
		new WritableStream({
			write: (chunk) => {
				view.set(chunk, offset);

				offset += chunk.length;
			},
		}),
	);

	logger.info(
		{
			pathname,
			contentLength: blobResult.blob.size,
			bufferLength: offset,
			firstBytes: formatBytes(view),
		},
		"Completed fetching image from Vercel Blob.",
	);

	return imageBuffer;
}

/**
 * Reads a stored cover image back through this deployment's own media API.
 *
 * @throws if the stored pathname resolves to an origin other than this
 * deployment's, which would turn the render into an outbound fetch of a foreign
 * host.
 */
async function retrieveImageViaAPI(pathname: string): Promise<ArrayBuffer> {
	logger.info({ pathname }, "Started fetching image via API.");

	const url = new URL(pathname, urlOrigin);

	// `pathname` comes from the stored media document, so an absolute value
	// would resolve away from this deployment and turn the render into an
	// outbound fetch of someone else's host. only serve our own media.
	if (url.origin !== new URL(urlOrigin).origin) {
		throw new Error(
			`Refused to fetch a thumbnail image from a foreign origin (${url.origin}).`,
		);
	}

	const imageResponse = await fetch(url);

	const imageBuffer = await imageResponse.arrayBuffer();

	logger.info(
		{
			url,
			bufferLength: imageBuffer.byteLength,
			firstBytes: formatBytes(new Uint8Array(imageBuffer)),
		},
		"Finished fetching image via API.",
	);

	return imageBuffer;
}

const BLUR_RADIUS = 6;

async function manipulateImage(image: ArrayBuffer): Promise<ArrayBuffer> {
	logger.info("Started manipulating image.");

	const manipulated = await sharp(image)
		.tint(postThumbnailCoverTintColor)
		.blur(BLUR_RADIUS)
		.jpeg({ quality: 90 })
		.toBuffer();

	const arrayBuffer = manipulated.buffer.slice(
		manipulated.byteOffset,
		manipulated.byteOffset + manipulated.byteLength,
	) as ArrayBuffer;

	logger.info(
		{
			bufferLength: arrayBuffer.byteLength,
			firstBytes: formatBytes(new Uint8Array(arrayBuffer)),
		},
		"Finished manipulating image.",
	);

	return arrayBuffer;
}

const FIRST_BYTES_LENGTH = 12;
const HEX = 16;

function formatBytes(bytes: Uint8Array): string {
	const firstBytes = [...bytes.subarray(0, FIRST_BYTES_LENGTH)];
	const formattedBytes = firstBytes.map(
		(b) => `0x${b.toString(HEX).padStart(2, "0")}`,
	);

	return `[${formattedBytes.join(", ")}]`;
}

function toDataUrl(image: ArrayBuffer): string {
	const base64 = Buffer.from(image).toString("base64");

	return `data:image/jpeg;base64,${base64}`;
}
