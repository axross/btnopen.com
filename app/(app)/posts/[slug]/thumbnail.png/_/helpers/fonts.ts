import "server-only";

// biome-ignore-start lint/correctness/noNodejsModules: this is running on nodejs runtime
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// biome-ignore-end lint/correctness/noNodejsModules: this is running on nodejs runtime
import type { ImageResponseOptions } from "next/server";
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "👽" });
// fileURLToPath, not `new URL(import.meta.url).pathname`: this module lives
// under the `[slug]` dynamic segment, and a file URL percent-encodes those
// brackets. Reading the raw pathname resolves the font below to a
// `%5Bslug%5D` directory that does not exist on disk, which fails the render
// with ENOENT and returns a blank image.
//
// the two levels the font path climbs are this module's own `_/helpers/`
// nesting: `_assets/` sits at the top of the route segment, beside `route.tsx`.
const selfDirname = dirname(fileURLToPath(import.meta.url));

type FontOptions = NonNullable<ImageResponseOptions["fonts"]>[number];

/**
 * Loads the single font the post thumbnail sets its title in, shaped as the
 * `fonts` option `ImageResponse` takes.
 */
export async function loadFonts(): Promise<FontOptions[]> {
	logger.info("Started loading fonts.");

	const fontFilePath = resolve(
		selfDirname,
		"../../_assets/ibm-plex-sans-jp-700.ttf",
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
