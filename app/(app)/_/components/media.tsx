import { cacheLife } from "next/cache";
import Image from "next/image";
import type { ComponentProps, JSX } from "react";
import { resolveMediaId } from "@/helpers/media-src";
import { getMedia } from "@/repositories/get-media";
import { rootLogger } from "@/shared/logger";
import type { PayloadLocale } from "@/shared/payload-types";

const logger = rootLogger.child({ module: "🖼️" });

export async function Media({
	src,
	alt,
	className,
	locale,
	...props
}: Omit<
	ComponentProps<"img">,
	// next/image owns these: the intrinsic dimensions come from the media record
	// resolved below, and `ref` / `srcSet` / `loading` are not part of its props.
	"ref" | "width" | "height" | "srcSet" | "loading"
> & {
	// the request's negotiated locale, injected by the markdown component map
	// (see `markdown.tsx`) rather than authored into the image. it selects the
	// localized `alt` on the media document, and is destructured out of `props`
	// so it never reaches the rendered <img>.
	locale: PayloadLocale;
}): Promise<JSX.Element | null> {
	"use cache";

	cacheLife("hours");

	if (typeof src === "string") {
		const id = resolveMediaId(src);

		if (id) {
			const file = await getMedia({ id, locale });

			if (file?.mimeType?.startsWith("image/")) {
				const optimizations =
					file.width !== null && file.height !== null
						? { width: file.width, height: file.height }
						: { unoptimized: true };

				return (
					<Image
						{...props}
						src={src}
						alt={alt ?? file.alt ?? ""}
						loading="lazy"
						className={className}
						{...optimizations}
					/>
				);
			}
		}
	}

	// covers both an src that is not a media upload and one whose media document
	// no longer resolves to an image; `getMedia` logs the missing document itself.
	logger.warn({ src }, "<Media> rendered null due to unresolvable src.");

	return null;
}
