import { clsx } from "clsx";
import Image from "next/image";
import type { ComponentProps, JSX } from "react";
import { resolveUrlOrigin } from "@/helpers/request";
import { getWebEmbedMetadata } from "@/repositories/get-webembed-metadata";
import css from "./loaded.module.css";

export async function WebEmbedLoaded({
	href,
	title,
	className,
	...props
}: Omit<ComponentProps<"a">, "href"> & {
	href: string;
}): Promise<JSX.Element> {
	const selfUrlOrigin = await resolveUrlOrigin();
	const embedMetadata = await getWebEmbedMetadata({ url: href, selfUrlOrigin });

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={clsx(css.webembedLoaded, className)}
			{...props}
		>
			{embedMetadata.imageUrl === null ? (
				<div className={css.fallbackImage}>
					<FallbackIllustration className={css.fallbackImageIllustration} />
				</div>
			) : (
				<Image
					src={embedMetadata.imageUrl}
					alt={title ?? embedMetadata.title ?? href}
					width={1200}
					height={630}
					unoptimized
					className={css.image}
				/>
			)}

			<span className={css.title}>{title ?? embedMetadata.title ?? href}</span>

			{embedMetadata.description === null ? null : (
				<span className={css.description}>{embedMetadata.description}</span>
			)}

			<span className={css.url}>
				{new URL(embedMetadata.urlSource ?? href).host}
			</span>
		</a>
	);
}

function FallbackIllustration({
	className,
	...props
}: ComponentProps<"svg">): JSX.Element {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 800 553"
			role="img"
			aria-label="Web Page"
			className={clsx(css.fallbackIllustration, className)}
			{...props}
		>
			<path
				className={css.illustrationWindowShadow}
				d="M785.853-.001H13.613A13.747 13.747 0 0 0-.002 13.847v524.66a13.74 13.74 0 0 0 13.613 13.819h772.241a13.742 13.742 0 0 0 13.613-13.819V13.847A13.749 13.749 0 0 0 785.855-.001h-.002Z"
			/>
			<path
				d="M763.031 2.743h-748.6a13.225 13.225 0 0 0-13.2 13.223v501.007a13.218 13.218 0 0 0 13.2 13.2h748.6a13.218 13.218 0 0 0 13.199-13.2V15.967a13.224 13.224 0 0 0-13.194-13.223h-.005Z"
				className={css.illustrationWindowSurface}
			/>
			<path
				className={css.illustrationForegroundRectangle}
				d="M528.628 205.501a4.812 4.812 0 0 0-4.809 4.809v3.847a4.812 4.812 0 0 0 4.809 4.809h111.561a4.81 4.81 0 0 0 4.809-4.809v-3.847a4.812 4.812 0 0 0-4.809-4.809H528.628ZM492.083 401.694H45.84a8.663 8.663 0 0 1-8.656-8.656V110.29a8.665 8.665 0 0 1 8.656-8.656h446.243a8.663 8.663 0 0 1 8.656 8.656v282.748a8.663 8.663 0 0 1-8.656 8.656ZM493.197 495.943H287.392a8.663 8.663 0 0 1-8.656-8.656v-67.32a8.667 8.667 0 0 1 8.656-8.656h205.81a8.663 8.663 0 0 1 8.656 8.656v67.321a8.664 8.664 0 0 1-8.661 8.655ZM734.198 411.311a8.663 8.663 0 0 1 8.656 8.656v67.321a8.663 8.663 0 0 1-8.656 8.656h-205.81a8.663 8.663 0 0 1-8.656-8.656v-67.321a8.663 8.663 0 0 1 8.656-8.656M528.628 236.277a4.82 4.82 0 0 0-3.445 1.384 4.799 4.799 0 0 0-1.433 3.425 4.81 4.81 0 0 0 4.878 4.808h171.188a4.807 4.807 0 0 0 3.356-8.184 4.807 4.807 0 0 0-3.356-1.433H528.628ZM528.628 263.205a4.8 4.8 0 0 0-3.445 1.384 4.799 4.799 0 0 0-1.433 3.425 4.81 4.81 0 0 0 4.878 4.808h171.188a4.807 4.807 0 0 0 3.356-8.184 4.807 4.807 0 0 0-3.356-1.433H528.628ZM528.628 288.21a4.8 4.8 0 0 0-3.445 1.384 4.799 4.799 0 0 0-1.433 3.424 4.81 4.81 0 0 0 4.878 4.809h111.561a4.807 4.807 0 0 0 3.356-8.184 4.807 4.807 0 0 0-3.356-1.433"
			/>
			<path
				className={css.illustrationForegroundBorder}
				d="M740.37 71.773H39.906a2.786 2.786 0 0 1 0-5.57H740.37a2.786 2.786 0 0 1 0 5.57Z"
			/>
			<path
				className={css.illustrationPseudoPressable}
				d="M53.509 51.978c9.016 0 16.325-7.471 16.325-16.688 0-9.216-7.31-16.688-16.325-16.688-9.017 0-16.325 7.471-16.325 16.688 0 9.217 7.309 16.688 16.325 16.688Z"
			/>
			<path
				className={css.illustrationForegroundRectangle}
				d="M251.197 495.943H45.392a8.663 8.663 0 0 1-8.656-8.656v-67.32a8.665 8.665 0 0 1 8.656-8.656h205.81a8.663 8.663 0 0 1 8.656 8.656v67.321a8.664 8.664 0 0 1-8.661 8.655Z"
			/>
			<path
				className={css.illustrationPseudoPressable}
				d="M109.901 51.978c9.016 0 16.325-7.471 16.325-16.688 0-9.216-7.309-16.688-16.325-16.688-9.016 0-16.325 7.471-16.325 16.688 0 9.217 7.309 16.688 16.325 16.688Z"
			/>
			<path
				className={css.illustrationAccentPseudoPressable}
				d="M166.295 51.978c9.016 0 16.325-7.471 16.325-16.688 0-9.216-7.309-16.688-16.325-16.688-9.016 0-16.325 7.471-16.325 16.688 0 9.217 7.309 16.688 16.325 16.688Z"
			/>
			<path
				className={css.illustrationPseudoPressable}
				d="M726.77 51.978c9.016 0 16.325-7.471 16.325-16.688 0-9.216-7.309-16.688-16.325-16.688-9.016 0-16.325 7.471-16.325 16.688 0 9.217 7.309 16.688 16.325 16.688Z"
			/>
		</svg>
	);
}
