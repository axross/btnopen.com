import { clsx } from "clsx";
import Image from "next/image";
import { getPayload } from "payload";
import type { ComponentProps, JSX } from "react";
import { rootLogger } from "@/logger";
import config from "@/payload-config";
import css from "./snippet.module.css";

const logger = rootLogger.child({ module: "🖼️" });

const mediaSrcRegex =
	/^\/api\/media\/file\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[0-9a-z_-]+$/;

export async function Media({
	src,
	alt,
	className,
}: ComponentProps<"img">): Promise<JSX.Element | null> {
	if (typeof src === "string") {
		const match = src.match(mediaSrcRegex);

		if (match) {
			const id = match[1];
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
						className={clsx(css.media, className)}
						{...optimizations}
					/>
				);
			}
		}
	}

	logger.warn({ src }, "<Media> rendered null due to invalid src.");

	return null;
}
