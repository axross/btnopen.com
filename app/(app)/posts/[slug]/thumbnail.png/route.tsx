// biome-ignore-start lint/correctness/noNodejsModules: this is running on nodejs runtime
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
// biome-ignore-end lint/correctness/noNodejsModules: this is running on nodejs runtime
import { captureException } from "@sentry/nextjs";
import { get as getBlob } from "@vercel/blob";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import type { ImageResponseOptions, NextRequest } from "next/server";
import sharp from "sharp";
import { Logo } from "@/components/logo";
import { resolveUrlOrigin } from "@/helpers/request";
import { rootLogger } from "@/logger";
import { getBlogPost } from "@/repositories/get-blog-post";
import { vercelBlobToken } from "@/runtime";

const logger = rootLogger.child({ module: "👽" });
const selfDirname = dirname(new URL(import.meta.url).pathname);

export const maxDuration = 60;

// this is an equivalent endpoint of opengraph-image.ts. the reason why i don't
// use opengraph-image.ts is that its url isn't consistent because of a hash
// suffix automatically added on build.
export async function GET(
	_: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
	const { slug } = await params;
	const [blogPost, fonts] = await Promise.all([
		getBlogPost({ slug, draft: true }),
		loadFonts(),
	]);

	if (!blogPost) {
		notFound();
	}

	let imageBuffer: ArrayBuffer;
	try {
		if (vercelBlobToken) {
			imageBuffer = await retrieveImageFromVercelBlob(
				blogPost.thumbnailImage.filename,
			);
		} else {
			imageBuffer = await retrieveImageViaAPI(blogPost.thumbnailImage.url);
		}
	} catch (error) {
		captureException(error);

		notFound();
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
			}}
		>
			{/** biome-ignore lint/a11y/useAltText: this is just within the image generation. alt will be omitted in the rendered result. */}
			{/** biome-ignore lint/performance/noImgElement: this is just within the image generation. Next <Image> dosen't fit in the image generation. */}
			<img
				src={toDataUrl(await manipulateImage(imageBuffer))}
				width={blogPost.thumbnailImage.width}
				height={blogPost.thumbnailImage.height}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					objectFit: "cover",
					filter: "brightness(0.125)",
				}}
			/>

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
						color: "#cf87ff",
					}}
				/>

				<div
					style={{
						display: "block",
						color: "#ffffff",
						textShadow: "0 0 4px #16002a",
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
			width: 1200,
			height: 630,
			fonts,
		},
	);
}

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

async function retrieveImageFromVercelBlob(
	filename: string,
): Promise<ArrayBuffer> {
	if (!vercelBlobToken) {
		throw new Error(
			"retrieveImageFromVercelBlob() was called but Vercel Blob token is null.",
		);
	}

	logger.info({ filename }, "Started fetching image from Vercel Blob.");

	const blobResult = await getBlob(filename, {
		access: "public",
		token: vercelBlobToken,
	});

	if (!blobResult) {
		throw new Error(`Blob (filename: "${filename}") was not found.`);
	}

	if (!blobResult.stream) {
		throw new Error(
			`Blob (filename: "${filename}") was found but no stream was provided.`,
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
			filename,
			contentLength: blobResult.blob.size,
			bufferLength: offset,
			firstBytes: formatBytes(view),
		},
		"Completed fetching image from Vercel Blob.",
	);

	return imageBuffer;
}

async function retrieveImageViaAPI(pathname: string): Promise<ArrayBuffer> {
	logger.info({ pathname }, "Started fetching image via API.");

	const urlOrigin = await resolveUrlOrigin();
	const url = new URL(pathname, urlOrigin);

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
		.tint("#9070af")
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
