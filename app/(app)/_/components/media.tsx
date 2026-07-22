import { cacheLife } from "next/cache";
import Image from "next/image";
import { getPayload } from "payload";
import type { ComponentProps, JSX } from "react";
import { resolveMediaId } from "@/helpers/media-src";
import { rootLogger } from "@/logger";
import { config } from "@/payload/config";

const logger = rootLogger.child({ module: "🖼️" });

export async function Media({
	src,
	alt,
	className,
}: ComponentProps<"img">): Promise<JSX.Element | null> {
	"use cache";

	cacheLife("hours");

	if (typeof src === "string") {
		const id = resolveMediaId(src);

		if (id) {
			const payload = await getPayload({ config });
			const file = await payload.findByID({ collection: "media", id });

			if (file.mimeType?.startsWith("image/")) {
				const optimizations =
					typeof file.width === "number" && typeof file.height === "number"
						? { width: file.width, height: file.height }
						: { unoptimized: true };
				const fileAlt = "alt" in file ? file.alt : null;

				return (
					<Image
						src={src}
						alt={alt ?? fileAlt ?? ""}
						loading="lazy"
						className={className}
						{...optimizations}
					/>
				);
			}
		}
	}

	logger.warn({ src }, "<Media> rendered null due to invalid src.");

	return null;
}
