import { headers } from "next/headers";
import { ImageResponse } from "next/og";

export const alt = "Favicon";

export const size = {
	width: 64,
	height: 64,
};

export const contentType = "image/png";

export default async function Image() {
	const headersList = await headers();
	const preferDarkMode =
		headersList.get("sec-ch-prefers-color-scheme") === "dark";

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				width: "100%",
				height: "100%",
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				role="img"
				aria-label="favicon shape"
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "transparent",
					color: preferDarkMode ? "#E463FF" : "#7F00D0",
				}}
			>
				<path
					d="M9.424 20.418v-2.804h-3.24l-3.872-4.843v-1.513l3.872-4.872h3.24V3.583h-4.28L0 9.727v4.546l5.144 6.145h4.28ZM14.576 20.418v-2.804h3.24l3.872-4.843v-1.513l-3.872-4.872h-3.24V3.583h4.28L24 9.727v4.546l-5.144 6.145h-4.28Z"
					fill="currentColor"
				/>
				<path
					d="M7.057 20.418v-5.535l6.849-6.893V3.582h3.037V9.09l-6.849 6.894v4.434H7.057Z"
					fill="currentColor"
				/>
			</svg>
		</div>,
		{
			...size,
		},
	);
}
