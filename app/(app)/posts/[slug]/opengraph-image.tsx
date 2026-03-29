import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { captureException } from "@sentry/nextjs";
import { get as getBlob } from "@vercel/blob";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import type { ImageResponseOptions } from "next/server";
import { resolveUrlOrigin } from "@/helpers/request";
import { rootLogger } from "@/logger";
import { getPost } from "@/repositories/get-post";
import { vercelBlobToken } from "@/runtime";
import type { PageProps } from "./page-props";

const logger = rootLogger.child({ module: "👽" });
const selfDirname = dirname(new URL(import.meta.url).pathname);

export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: Pick<PageProps, "params">) {
	const { slug } = await params;
	const [post, fonts] = await Promise.all([
		getPost({ slug, draft: true }),
		loadFonts(),
	]);

	if (!post) {
		notFound();
	}

	let imageBuffer: ArrayBuffer;
	try {
		if (vercelBlobToken) {
			imageBuffer = await retrieveImageBufferFromVercelBlob(
				post.thumbnailImage.filename,
			);
		} else {
			imageBuffer = await retrieveImageBufferViaAPI(
				post.thumbnailImage.filename,
			);
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
				paddingBottom: 8,
				gap: 32,
			}}
		>
			{/** biome-ignore lint/a11y/useAltText: this is just within the image generation. alt will be omitted in the rendered result. */}
			{/** biome-ignore lint/performance/noImgElement: this is just within the image generation. Next <Image> dosen't fit in the image generation. */}
			<img
				src={imageBuffer as never}
				width={post.thumbnailImage.width}
				height={post.thumbnailImage.height}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					objectFit: "cover",
					filter: "sepia(1) saturate(1.5) hue-rotate(215deg) brightness(0.333)",
				}}
			/>

			<div
				style={{
					display: "flex",
					flex: 1,
					alignItems: "center",
					paddingTop: 40,
					paddingBottom: 40,
					paddingLeft: 64,
					paddingRight: 64,
					backgroundColor: "#eedfff",
					borderRadius: 32,
				}}
			>
				<div
					style={{
						display: "block",
						color: "#7f00d0",
						fontSize: 80,
						fontFamily: "IBM Plex Sans JP",
						fontWeight: 700,
						lineHeight: 1.5,
						textAlign: "center",
						lineClamp: 3,
					}}
				>
					{post.title}
				</div>
			</div>

			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 59.64 12.05"
				role="img"
				aria-label="btnopen.com"
				style={{ width: 298.2, height: 60.25, color: "#eedfff" }}
			>
				<g fill="currentColor">
					<path d="M50.56 9.511V7.216l2.841-2.86V2.527h1.26v2.285l-2.84 2.86v1.84h-1.26Z" />
					<path d="M54.661 9.518V8.354h2.412l1.608-1.596V5.3l-1.607-1.608H54.66V2.526h2.844l2.136 2.136v2.72l-2.136 2.135h-2.844ZM4.98 9.511V8.347H2.568L.96 6.751V5.293l1.608-1.608H4.98V2.52H2.136L0 4.657v2.718l2.136 2.136H4.98ZM17.069 9.518V3.002h1.176l.072.072v.948h.072l1.08-1.08h1.8l1.08 1.08v5.496h-1.32v-4.98l-.384-.396h-.78l-1.476 1.476v3.9h-1.32ZM13.347 1.262h1.32v1.74h1.872v1.2h-1.872v3.72l.396.396h1.476v1.2h-2.112l-1.08-1.08V4.202h-1.224v-1.2h1.224v-1.74ZM6.503 9.518v-9h1.32V3.95h.072l1.008-1.008h1.8l1.08 1.08v4.476l-1.08 1.08h-1.8l-1.068-1.08H7.75v.948l-.072.072H6.503Zm1.32-2.616 1.476 1.476h.78l.384-.396V4.538l-.384-.396h-.78L7.823 5.618v1.284ZM43.785 9.518V3.002h1.176l.072.072v.948h.072l1.08-1.08h1.8l1.08 1.08v5.496h-1.32v-4.98l-.384-.396h-.78l-1.476 1.476v3.9h-1.32ZM37.644 8.498V4.022l1.08-1.08h3.072l1.08 1.08v2.712h-3.912v1.248l.396.396h1.968l.768-.768.888.888-1.08 1.08h-3.18l-1.08-1.08Zm1.32-2.844h2.628V4.538l-.396-.396H39.36l-.396.396v1.116ZM31.496 11.978V3.002h1.176l.072.072v.948h.084l1.068-1.08h1.8l1.08 1.08v4.476l-1.08 1.08h-1.8L32.888 8.57h-.072v3.408h-1.32Zm1.32-5.076 1.476 1.476h.78l.384-.396V4.538l-.384-.396h-.78l-1.476 1.476v1.284ZM26.342 9.578l-1.08-1.08V4.022l1.08-1.08h3.12l1.08 1.08v4.476l-1.08 1.08h-3.12Zm.636-1.2h1.86l.384-.396V4.538l-.384-.396h-1.86l-.396.396v3.444l.396.396Z" />
				</g>
			</svg>
		</div>,
		{
			...size,
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

async function retrieveImageBufferFromVercelBlob(
	filename: string,
): Promise<ArrayBuffer> {
	if (!vercelBlobToken) {
		throw new Error(
			"retrieveImageBufferFromVercelBlob() was called but Vercel Blob token is null.",
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
			firstBytes: `[${[...view.subarray(0, 12)]
				.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
				.join(", ")}]`,
		},
		"Completed fetching image from Vercel Blob.",
	);

	return imageBuffer;
}

async function retrieveImageBufferViaAPI(
	pathname: string,
): Promise<ArrayBuffer> {
	logger.info({ pathname }, "Started fetching image via API.");

	const urlOrigin = await resolveUrlOrigin();
	const url = new URL(pathname, urlOrigin);

	const imageResponse = await fetch(url);

	const imageBuffer = await imageResponse.arrayBuffer();

	logger.info({ url }, "Finished fetching image via API.");

	return imageBuffer;
}
