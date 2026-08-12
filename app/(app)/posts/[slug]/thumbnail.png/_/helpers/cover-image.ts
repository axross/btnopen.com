import { get as getBlob } from "@vercel/blob";
import sharp from "sharp";
import { postThumbnailCoverTintColor } from "@/helpers/brand-colors";
import { urlOrigin, vercelBlobPrefix, vercelBlobToken } from "@/runtime";
import { rootLogger } from "@/shared/logger";
import type { PayloadUploadSize } from "@/shared/payload-types";

const logger = rootLogger.child({ module: "👽" });

/**
 * Reads a post's stored cover image back as bytes, over whichever channel this
 * deployment has: Vercel Blob where a token is configured, and this
 * deployment's own media API otherwise.
 *
 * @throws whatever the channel it picks throws — see the two readers below.
 */
export async function retrieveCoverImage(
	coverImage: PayloadUploadSize,
): Promise<ArrayBuffer> {
	if (vercelBlobToken) {
		return retrieveImageFromVercelBlob(coverImage.filename);
	}

	return retrieveImageViaAPI(coverImage.url);
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

/**
 * Tints, blurs, and re-encodes a retrieved cover image into the backdrop the
 * thumbnail composition sits its logo and title over.
 */
export async function manipulateImage(
	image: ArrayBuffer,
): Promise<ArrayBuffer> {
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

/**
 * Encodes manipulated image bytes as the data URL the thumbnail card's `<img>`
 * takes, since Satori resolves no network source at render time.
 */
export function toDataUrl(image: ArrayBuffer): string {
	const base64 = Buffer.from(image).toString("base64");

	return `data:image/jpeg;base64,${base64}`;
}
