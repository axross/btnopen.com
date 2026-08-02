import { cacheLife } from "next/cache";
import Image from "next/image";
import { getPayload } from "payload";
import type { ComponentProps, JSX } from "react";
import { resolveMediaId } from "@/helpers/media-src";
import { config } from "@/payload/config";
import { rootLogger } from "@/shared/logger";

const logger = rootLogger.child({ module: "🖼️" });

export async function Media({
	src,
	alt,
	className,
	...props
}: Omit<
	ComponentProps<"img">,
	// next/image owns these: the intrinsic dimensions come from the media record
	// resolved below, and `ref` / `srcSet` / `loading` are not part of its props.
	"ref" | "width" | "height" | "srcSet" | "loading"
>): Promise<JSX.Element | null> {
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
						{...props}
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
