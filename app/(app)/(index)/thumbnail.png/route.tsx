import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { Logo } from "@/components/logo";
import {
	indexThumbnailBackgroundColor,
	thumbnailForegroundColor,
} from "@/helpers/brand-colors";
import { thumbnailHeight, thumbnailWidth } from "@/helpers/thumbnail";

export const maxDuration = 30;

// this is an equivalent endpoint of opengraph-image.ts. the reason why i don't
// use opengraph-image.ts is that its url isn't consistent because of a hash
// suffix automatically added on build.
export async function GET(_: NextRequest): Promise<Response> {
	return new ImageResponse(
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: indexThumbnailBackgroundColor,
				overflow: "hidden",
			}}
		>
			<Logo
				style={{
					width: 596.4,
					height: 120.5,
					color: thumbnailForegroundColor,
				}}
			/>
		</div>,
		{
			width: thumbnailWidth,
			height: thumbnailHeight,
		},
	);
}
