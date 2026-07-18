// The Payload Vercel Blob storage plugin serves uploads at
// `/api/media/file/<filename>` and, when the deployment sets a blob namespace
// (`BLOB_PAYLOAD_PREFIX`, `pr-<n>` on preview deployments), appends
// `?prefix=<namespace>` to the document URL. Both forms must resolve to the
// media document id; anything else is not a media src.
const mediaSrcRegex =
	/^\/api\/media\/file\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[0-9a-z_-]+(?:\?prefix=[a-zA-Z0-9/_-]*)?$/;

/**
 * Extracts the media document id from a media upload src, accepting both the
 * flat production form (`/api/media/file/<uuid>.<ext>`) and the preview form
 * carrying the blob-namespace query (`…?prefix=pr-<n>`). Returns `null` for
 * any other src, including other query strings.
 */
export function resolveMediaId(src: string): string | null {
	const match = src.match(mediaSrcRegex);

	return match?.[1] ?? null;
}
