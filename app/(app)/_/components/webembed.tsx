import type { ComponentProps, JSX } from "react";
import { Suspense } from "react";
import { WebEmbedLoaded } from "./webembed/loaded";
import { WebEmbedLoading } from "./webembed/loading";

export function WebEmbed({
	href,
	title,
	className,
	...props
}: Omit<ComponentProps<"a">, "href"> & {
	href: string;
}): JSX.Element {
	return (
		<Suspense fallback={<WebEmbedLoading className={className} {...props} />}>
			<WebEmbedLoaded
				href={href}
				title={title}
				className={className}
				{...props}
			/>
		</Suspense>
	);
}
