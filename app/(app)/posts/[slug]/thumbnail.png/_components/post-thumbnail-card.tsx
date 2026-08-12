import type { ComponentProps, JSX } from "react";
import { Logo } from "@/components/logo";
import {
	postThumbnailBackgroundColor,
	postThumbnailLogoColor,
	thumbnailForegroundColor,
} from "@/helpers/brand-colors";

/**
 * The Open Graph card `thumbnail.png` renders for a post: the logo above the
 * post title, over the post's own blurred cover image where there is one.
 *
 * Synchronous by necessity — Satori cannot render an async component — so the
 * background image arrives already retrieved, manipulated, and encoded as a
 * data URL, alongside the intrinsic dimensions the stored image carries.
 */
export function PostThumbnailCard({
	title,
	backgroundImage,
	...props
}: Omit<ComponentProps<"div">, "children"> & {
	title: string;
	backgroundImage?: {
		src: string;
		width: number;
		height: number;
	};
}): JSX.Element {
	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: 32,
				gap: 32,
				overflow: "hidden",
				// dark base so the light title stays legible when there is no
				// cover image behind it (the background photo covers it otherwise).
				backgroundColor: postThumbnailBackgroundColor,
			}}
			{...props}
		>
			{backgroundImage ? (
				// biome-ignore lint/a11y/useAltText: this is just within the image generation. alt will be omitted in the rendered result.
				// biome-ignore lint/performance/noImgElement: this is just within the image generation. Next <Image> dosen't fit in the image generation.
				<img
					src={backgroundImage.src}
					width={backgroundImage.width}
					height={backgroundImage.height}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						objectFit: "cover",
						filter: "brightness(0.125)",
					}}
				/>
			) : null}

			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: 96,
					paddingTop: 64,
					rowGap: 64,
				}}
			>
				<Logo
					style={{
						width: 298.2,
						height: 60.25,
						color: postThumbnailLogoColor,
					}}
				/>

				<div
					style={{
						display: "block",
						color: thumbnailForegroundColor,
						textShadow: `0 0 4px ${postThumbnailBackgroundColor}`,
						fontSize: 72,
						fontFamily: "IBM Plex Sans JP",
						fontWeight: 700,
						lineHeight: 1.5,
						textAlign: "center",
						lineClamp: 3,
					}}
				>
					{title}
				</div>
			</div>
		</div>
	);
}
