import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { Logo } from "@/components/logo";
import { getPost } from "./_fetcher/get-post";
import type { PageProps } from "./_misc/page-props";

export const alt = "About Acme";

export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: PageProps) {
	"use cache";

	cacheLife("minutes");

	const [post, ibmPlexSansJpBold] = await Promise.all([
		getPost((await params).slug),
		readFile(join(process.cwd(), "src/assets/fonts/ibm-plex-sans-jp-700.ttf")),
	]);

	if (!post) {
		notFound();
	}

	const backgroundImageUrl = post.bannerImage?.url ?? post.coverImage?.url;

	return new ImageResponse(
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: 32,
				paddingBottom: 8,
				gap: 32,
			}}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					...(backgroundImageUrl
						? {
								backgroundImage: `url(${backgroundImageUrl})`,
								backgroundSize: "cover",
								filter:
									"sepia(1) saturate(1.5) hue-rotate(215deg) brightness(0.333)",
							}
						: { backgroundColor: "#1c1025" }),
				}}
			/>

			<div
				style={{
					display: "flex",
					flex: 1,
					alignItems: "center",
					paddingTop: 40,
					paddingBottom: 40,
					paddingLeft: 64,
					paddingRight: 64,
					backgroundColor: "#eedfff",
					borderRadius: 32,
				}}
			>
				<div
					style={{
						display: "block",
						color: "#7f00d0",
						fontSize: 80,
						fontFamily: "IBM Plex Sans JP",
						fontWeight: 700,
						lineHeight: 1.5,
						textAlign: "center",
						lineClamp: 3,
					}}
				>
					{`${post.title}`}
				</div>
			</div>

			<Logo style={{ width: 298.2, height: 60.25, color: "white" }} />
		</div>,
		{
			...size,
			fonts: [
				{
					name: "IBM Plex Sans JP",
					data: ibmPlexSansJpBold,
					style: "normal",
					weight: 700,
				},
			],
		},
	);
}
