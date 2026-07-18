#!/usr/bin/env node
/**
 * Prune every blob under a given prefix from a Vercel Blob store.
 *
 * Used by the preview-deploy teardown job to delete a closed pull request's
 * uploaded media, which lives under a `pr-<n>/` prefix in the dedicated preview
 * store (see `.github/workflows/preview-deploy.yaml` and
 * `.claude/skills/development-guidelines/references/preview-deployments.md`).
 *
 * Deliberately dependency-light: it imports only `@vercel/blob` so the teardown
 * job can run it from a throwaway directory with a standalone install, never
 * touching the repository's own lockfile.
 *
 * Usage:
 *   BLOB_PAYLOAD_READ_WRITE_TOKEN=<token> node prune-preview-blobs.mjs "pr-42/"
 *
 * Exits 0 on success (including "nothing to delete"); exits 1 on any error or
 * missing input, so a failed prune fails the teardown step loudly.
 */

import { del, list } from "@vercel/blob";

const prefix = process.argv[2];
const token = process.env.BLOB_PAYLOAD_READ_WRITE_TOKEN;

if (!prefix) {
	console.error("Usage: node prune-preview-blobs.mjs <prefix>");
	process.exit(1);
}

if (!token) {
	console.error(
		"BLOB_PAYLOAD_READ_WRITE_TOKEN is required to prune the preview store.",
	);
	process.exit(1);
}

try {
	let cursor;
	let deleted = 0;

	do {
		// Cursor pagination is inherently sequential — each page needs the
		// previous page's cursor — so these awaits cannot be parallelized.
		// biome-ignore lint/performance/noAwaitInLoops: sequential cursor paging
		const { blobs, cursor: nextCursor } = await list({
			prefix,
			cursor,
			token,
			limit: 1000,
		});

		if (blobs.length > 0) {
			// biome-ignore lint/performance/noAwaitInLoops: delete this page before fetching the next
			await del(
				blobs.map((blob) => blob.url),
				{ token },
			);
			deleted += blobs.length;
		}

		cursor = nextCursor;
	} while (cursor);

	console.log(`Pruned ${deleted} blob(s) under "${prefix}".`);
} catch (error) {
	console.error(`Failed to prune blobs under "${prefix}":`, error);
	process.exit(1);
}
